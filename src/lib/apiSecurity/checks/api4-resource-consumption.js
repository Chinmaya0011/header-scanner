/**
 * API4:2023 - Unrestricted Resource Consumption Checker
 * Checks rate limiting signals, RateLimit headers, 429 status, and safe burst response behaviors
 */

export async function checkResourceConsumption(endpoint, authHeaders = {}) {
  const findings = [];

  // Skip resource consumption check on static/public spec endpoints
  if (endpoint.path.includes("openapi.json") || endpoint.path.includes("swagger")) {
    return findings;
  }

  try {
    const targetUrl = endpoint.url.replace("{id}", "1");
    
    // Probe 1: Send request and inspect RateLimit response headers
    const res = await fetch(targetUrl, {
      method: endpoint.method,
      headers: {
        "User-Agent": "HeaderGuard-ApiScanner/2.0",
        ...authHeaders
      },
      signal: AbortSignal.timeout(4000)
    });

    const headersObj = Object.fromEntries(res.headers.entries());
    const hasRateLimitHeader = !!(
      headersObj["x-ratelimit-limit"] ||
      headersObj["ratelimit-limit"] ||
      headersObj["retry-after"]
    );

    // If rate limit headers are present, endpoint implements standard throttling
    if (hasRateLimitHeader || res.status === 429) {
      return findings;
    }

    // Probe 2: Safe mini-burst test (5 requests) to detect active throttling or 429 status
    let rateLimitTriggered = false;
    const burstPromises = Array.from({ length: 4 }).map(() =>
      fetch(targetUrl, {
        method: endpoint.method,
        headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...authHeaders },
        signal: AbortSignal.timeout(3000)
      }).catch(() => null)
    );

    const burstResponses = await Promise.all(burstPromises);
    if (burstResponses.some(r => r && (r.status === 429 || r.headers.get("retry-after")))) {
      rateLimitTriggered = true;
    }

    // Only report low/info advisory if rate limiting headers and active throttling are completely absent on write/sensitive methods
    if (!hasRateLimitHeader && !rateLimitTriggered && res.status === 200 && ["POST", "PUT", "DELETE"].includes(endpoint.method)) {
      findings.push({
        findingId: `RESOURCE-UNLIMITED-${endpoint.method}-${endpoint.path}`,
        category: "API4:2023 - Unrestricted Resource Consumption",
        title: "No Rate Limiting or Throttling Headers Detected",
        severity: "low",
        confidence: "medium",
        endpoint: endpoint.path,
        method: endpoint.method,
        parameter: null,
        description: `The API endpoint '${endpoint.path}' (${endpoint.method}) does not return standard RateLimit or Retry-After HTTP headers during burst probes.`,
        impact: "Vulnerability to Denial of Service (DoS), brute force, or uncontrolled resource consumption under heavy traffic.",
        remediation: "Implement request throttling, rate limiting middleware, and standard RateLimit headers (RFC 6585/7231).",
        evidence: {
          request: {
            method: endpoint.method,
            url: endpoint.url,
            headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0" },
            body: null,
          },
          response: {
            status: res.status,
            headers: headersObj,
            body: "RateLimit headers missing; burst probes completed without 429 status.",
          }
        }
      });
    }

  } catch {
    // Ignore timeout
  }

  return findings;
}

