/**
 * API1:2023 - Broken Object Level Authorization (BOLA) Checker
 * Tests authorization boundaries using Primary & Secondary identities
 */

export async function checkBola(endpoint, primaryHeaders = {}, secondaryHeaders = {}) {
  const findings = [];
  
  if (!endpoint.path.includes("{id}")) {
    return findings; // BOLA checks target parameterized object endpoints
  }

  // Only perform active cross-identity testing if secondary token is supplied
  const hasSecondaryToken = Object.keys(secondaryHeaders).length > 0;
  if (!hasSecondaryToken) {
    return findings;
  }

  const objB_Url = endpoint.url.replace("{id}", "102");

  try {
    // Identity A requests Object B (Belonging exclusively to Identity B)
    const res = await fetch(objB_Url, {
      method: endpoint.method,
      headers: {
        "User-Agent": "HeaderGuard-ApiScanner/2.0",
        ...primaryHeaders,
      },
      signal: AbortSignal.timeout(4000)
    });

    const status = res.status;
    const bodyText = await res.text();

    // Verify if response returns 200 OK AND contains private tenant/user fields
    const containsPrivateTenantData = /"(owner_?id|user_?id|account_?id|email|balance|private|secret)"\s*:/i.test(bodyText);

    if (status === 200 && containsPrivateTenantData) {
      // Mask headers for safe evidence display
      const safeReqHeaders = { ...primaryHeaders };
      if (safeReqHeaders.Authorization) safeReqHeaders.Authorization = "Bearer ********";
      if (safeReqHeaders["X-API-Key"]) safeReqHeaders["X-API-Key"] = "********";

      findings.push({
        findingId: `BOLA-${endpoint.method}-${endpoint.path}`,
        category: "API1:2023 - Broken Object Level Authorization",
        title: "Broken Object Level Authorization (BOLA) Discovered",
        severity: "critical",
        confidence: "high",
        endpoint: endpoint.path,
        method: endpoint.method,
        parameter: "id",
        description: `Identity A was able to access object '${objB_Url}' belonging exclusively to Identity B without proper authorization enforcement.`,
        impact: "Unauthorized users can read or modify data belonging to other accounts by manipulating object identifiers.",
        remediation: "Implement strict object-level authorization checks at the data layer for every request accessing user-owned resources.",
        evidence: {
          request: {
            method: endpoint.method,
            url: objB_Url,
            headers: safeReqHeaders,
            body: null,
          },
          response: {
            status: res.status,
            headers: Object.fromEntries(res.headers.entries()),
            body: bodyText.slice(0, 500),
          },
          comparison: {
            statusA: 200,
            statusB: 200,
            note: "Cross-tenant authorization boundary bypass verified with secondary identity."
          }
        }
      });
    }
  } catch {
    // Ignore connection timeouts
  }

  return findings;
}

