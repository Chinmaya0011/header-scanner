/**
 * API3:2023 - Broken Object Property Level Authorization Checker
 * Analyzes API responses for excessive data exposure (password, secrets, internal notes, isAdmin, etc.)
 */

const SENSITIVE_PROPERTY_PATTERNS = [
  { name: "password", regex: /"password"\s*:\s*"[^"]+"/i, severity: "critical" },
  { name: "passwordHash", regex: /"password_?hash"\s*:\s*"[^"]+"/i, severity: "critical" },
  { name: "secret", regex: /"secret"\s*:\s*"[^"]+"/i, severity: "high" },
  { name: "apiKey", regex: /"(api_?key|private_?key)"\s*:\s*"[^"]+"/i, severity: "high" },
  { name: "token", regex: /"(access_?token|refresh_?token)"\s*:\s*"[^"]+"/i, severity: "high" },
  { name: "internalNotes", regex: /"internal_?notes?"\s*:\s*"[^"]+"/i, severity: "medium" },
  { name: "isAdmin", regex: /"(is_?admin|is_?superuser|role)"\s*:\s*(true|"admin")/i, severity: "medium" },
];

export async function checkPropertyAuthorization(endpoint, authHeaders = {}) {
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

    if (!res.ok) return findings;

    const bodyText = await res.text();

    for (const pattern of SENSITIVE_PROPERTY_PATTERNS) {
      if (pattern.regex.test(bodyText)) {
        const safeReqHeaders = { ...authHeaders };
        if (safeReqHeaders.Authorization) safeReqHeaders.Authorization = "Bearer ********";

        findings.push({
          findingId: `PROP-EXPOSURE-${pattern.name}-${endpoint.path}`,
          category: "API3:2023 - Broken Object Property Level Authorization",
          title: `Excessive Data Exposure: '${pattern.name}' Property Returned`,
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
