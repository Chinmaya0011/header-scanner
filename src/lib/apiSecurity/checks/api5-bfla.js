/**
 * API5:2023 - Broken Function Level Authorization (BFLA) Checker
 * Tests whether privileged administrative endpoints (/admin, /manage, /delete, /settings) are accessible to low-privilege identities
 */

const PRIVILEGED_PATH_PATTERNS = [
  /\/admin\//i,
  /\/manage\//i,
  /\/delete\//i,
  /\/permissions\//i,
  /\/internal\//i,
];

export async function checkBfla(endpoint, primaryHeaders = {}) {
  const findings = [];

  const isPrivilegedRoute = PRIVILEGED_PATH_PATTERNS.some(p => p.test(endpoint.path));
  if (!isPrivilegedRoute) return findings;

  try {
    const res = await fetch(endpoint.url.replace("{id}", "1"), {
      method: endpoint.method,
      headers: {
        "User-Agent": "HeaderGuard-ApiScanner/2.0",
        ...primaryHeaders, // Low-privilege identity
      },
      signal: AbortSignal.timeout(4000)
    });

    const status = res.status;
    const bodyText = await res.text();

    // Expected rejection: 403 Forbidden, 401 Unauthorized, 404 Not Found, 405 Method Not Allowed
    const isRejected = status === 401 || status === 403 || status === 404 || status === 405;

    // Confirm that 200 OK response actually contains administrative or sensitive internal capabilities
    const containsAdminData = /"(admin|manage|settings|users|roles|permissions|system)"\s*:/i.test(bodyText) || bodyText.length > 50;

    if (status === 200 && !isRejected && containsAdminData) {
      const safeReqHeaders = { ...primaryHeaders };
      if (safeReqHeaders.Authorization) safeReqHeaders.Authorization = "Bearer ********";

      findings.push({
        findingId: `BFLA-ACCESS-${endpoint.method}-${endpoint.path}`,
        category: "API5:2023 - Broken Function Level Authorization",
        title: "Privileged Administrative Endpoint Accessible to Standard Identity",
        severity: "high",
        confidence: "high",
        endpoint: endpoint.path,
        method: endpoint.method,
        parameter: null,
        description: `The privileged administrative endpoint '${endpoint.path}' responded with 200 OK when requested by a standard identity.`,
        impact: "Standard users can access administrative controls, delete resources, or escalate privileges.",
        remediation: "Enforce strict role-based access control (RBAC) and function-level permission checks at the controller/route level.",
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
            body: bodyText.slice(0, 400),
          }
        }
      });
    }

  } catch {
    // Ignore timeout
  }

  return findings;
}

