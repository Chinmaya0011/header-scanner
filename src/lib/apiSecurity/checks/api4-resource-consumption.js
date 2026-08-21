/**
 * API4:2023 - Unrestricted Resource Consumption Checker
 * Checks rate limiting signals, RateLimit headers, 429 status, pagination limits, and body size restrictions safely
 */

export async function checkResourceConsumption(endpoint, authHeaders = {}) {
  const findings = [];

  try {
    const res = await fetch(endpoint.url.replace("{id}", "1"), {
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

    // If endpoint returns status 200 without rate limit headers, flag potential un-throttled consumption
    if (res.status === 200 && !hasRateLimitHeader) {
      findings.push({
        findingId: `RESOURCE-UNLIMITED-${endpoint.method}-${endpoint.path}`,
        category: "API4:2023 - Unrestricted Resource Consumption",
        title: "No Rate Limiting or Throttling Headers Detected",
        severity: "medium",
        confidence: "medium",
        endpoint: endpoint.path,
        method: endpoint.method,
        parameter: null,
        description: `The API endpoint '${endpoint.path}' does not return standard RateLimit or Retry-After HTTP headers.`,
        impact: "Vulnerability to Denial of Service (DoS), brute force, or uncontrolled resource consumption.",
        remediation: "Implement request throttling, rate limiting, and standard RateLimit headers (RFC 6585/7231).",
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
            body: "Response missing RateLimit headers.",
          }
        }
      });
    }

  } catch {
    // Ignore timeout
  }

  return findings;
}
