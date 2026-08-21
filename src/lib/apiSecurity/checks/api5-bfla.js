/**
 * API5:2023 - Broken Function Level Authorization (BFLA) Checker
 * Tests whether privileged administrative endpoints (/admin, /manage, /delete, /settings) are accessible to low-privilege identities
 */

const PRIVILEGED_PATH_PATTERNS = [
  /\/admin\//i,
  /\/manage\//i,
  /\/delete\//i,
  /\/permissions\//i,
  /\/settings\//i,
  /\/internal\//i,
  /\/users\/[^\/]+\/role/i
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
        ...primaryHeaders, // Low-privilege token
      },
      signal: AbortSignal.timeout(4000)
    });

    // Expected: 403 Forbidden or 401 Unauthorized. If 200 OK, BFLA is present!
    if (res.status === 200) {
      const bodyText = await res.text();
      const safeReqHeaders = { ...primaryHeaders };
      if (safeReqHeaders.Authorization) safeReqHeaders.Authorization = "Bearer ********";

      findings.push({
        findingId: `BFLA-ACCESS-${endpoint.method}-${endpoint.path}`,
        category: "API5:2023 - Broken Function Level Authorization",
        title: "Privileged Administrative Endpoint Accessible to Low-Privilege User",
        severity: "high",
        confidence: "high",
        endpoint: endpoint.path,
        method: endpoint.method,
        parameter: null,
        description: `The privileged administrative endpoint '${endpoint.path}' responded with 200 OK when requested by a standard low-privilege identity.`,
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
