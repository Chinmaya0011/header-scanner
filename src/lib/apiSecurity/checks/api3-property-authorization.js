/**
 * API3:2023 - Broken Object Property Level Authorization Checker
 * Analyzes API responses for excessive data exposure (password, secrets, internal notes, unmasked hashes)
 */

const SENSITIVE_PROPERTY_PATTERNS = [
  { name: "password", regex: /"password"\s*:\s*"[^"]+"/i, severity: "critical" },
  { name: "passwordHash", regex: /"password_?hash"\s*:\s*"[^"]+"/i, severity: "critical" },
  { name: "privateKey", regex: /"(private_?key|secret_?key)"\s*:\s*"[^"]+"/i, severity: "high" },
  { name: "ssn", regex: /"(ssn|social_?security)"\s*:\s*"[^"]+"/i, severity: "high" },
];

export async function checkPropertyAuthorization(endpoint, authHeaders = {}) {
  const findings = [];

  // Skip auth/login endpoints where auth tokens are expected in response
  if (/\/(auth|login|token|oauth)/i.test(endpoint.path)) {
    return findings;
  }

  try {
    const res = await fetch(endpoint.url.replace("{id}", "1"), {
      method: endpoint.method,
      headers: {
        "User-Agent": "HeaderGuard-ApiScanner/2.0",
        ...authHeaders
      },
      signal: AbortSignal.timeout(4000)
    });

    if (!res.ok) return findings;

    const bodyText = await res.text();

    for (const pattern of SENSITIVE_PROPERTY_PATTERNS) {
      if (pattern.regex.test(bodyText)) {
        const safeReqHeaders = { ...authHeaders };
        if (safeReqHeaders.Authorization) safeReqHeaders.Authorization = "Bearer ********";

        findings.push({
          findingId: `PROP-EXPOSURE-${pattern.name}-${endpoint.path}`,
          category: "API3:2023 - Broken Object Property Level Authorization",
          title: `Excessive Data Exposure: Sensitive '${pattern.name}' Property Disclosed`,
          severity: pattern.severity,
          confidence: "high",
          endpoint: endpoint.path,
          method: endpoint.method,
          parameter: pattern.name,
          description: `The API endpoint '${endpoint.path}' exposes sensitive object property '${pattern.name}' in its JSON response payload.`,
          impact: "Unauthorized property disclosure leading to account takeover or internal privilege information leakage.",
          remediation: "Filter response payloads using explicit Data Transfer Objects (DTOs) to exclude sensitive fields.",
          evidence: {
            request: {
              method: endpoint.method,
              url: endpoint.url,
              headers: safeReqHeaders,
              body: null,
            },
            response: {
              status: res.status,
              headers: Object.fromEntries(res.headers.entries()),
              body: bodyText.slice(0, 500),
            }
          }
        });
      }
    }
  } catch {
    // Ignore timeout
  }

  return findings;
}

