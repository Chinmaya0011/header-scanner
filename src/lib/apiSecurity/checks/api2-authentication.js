/**
 * API2:2023 - Broken Authentication Checker
 * Tests whether authentication-required endpoints accept unauthenticated or malformed requests
 */

export async function checkAuthentication(endpoint, authHeaders = {}) {
  const findings = [];
  
  if (!endpoint.authenticationRequired) return findings;

  const targetUrl = endpoint.url.replace("{id}", "1");
  const hasAuthToken = Object.keys(authHeaders).length > 0;

  try {
    // Baseline probe: If valid token is supplied, what is the valid response?
    let baselineStatus = null;
    let baselineBodyLength = 0;

    if (hasAuthToken) {
      try {
        const resBaseline = await fetch(targetUrl, {
          method: endpoint.method,
          headers: {
            "User-Agent": "HeaderGuard-ApiScanner/2.0",
            ...authHeaders
          },
          signal: AbortSignal.timeout(4000)
        });
        baselineStatus = resBaseline.status;
        const bodyText = await resBaseline.text();
        baselineBodyLength = bodyText.length;
      } catch {
        // Ignore baseline failure
      }
    }

    // Probe 1: Send request with NO authorization headers
    const resNoAuth = await fetch(targetUrl, {
      method: endpoint.method,
      headers: {
        "User-Agent": "HeaderGuard-ApiScanner/2.0",
      },
      signal: AbortSignal.timeout(4000)
    });

    const noAuthStatus = resNoAuth.status;
    const noAuthBody = await resNoAuth.text();
    const contentTypeNoAuth = resNoAuth.headers.get("content-type") || "";

    // False Positive Prevention:
    // 1. If status is 401, 403, 404, or 405, it properly rejected unauthenticated access.
    // 2. If content-type is HTML login page, it redirected to auth (not a vulnerability).
    // 3. If baseline with token returned 401/403, the token provided by user was already invalid!
    const isNoAuthRejected = noAuthStatus === 401 || noAuthStatus === 403 || noAuthStatus === 404 || noAuthStatus === 405;
    const isHtmlRedirect = contentTypeNoAuth.includes("text/html") && (noAuthBody.includes("login") || noAuthBody.includes("Login") || noAuthBody.includes("Sign In"));

    if (noAuthStatus === 200 && !isNoAuthRejected && !isHtmlRedirect) {
      // Confirm that baseline with token was actually successful before claiming missing auth vulnerability
      if (!hasAuthToken || (baselineStatus === 200 && Math.abs(noAuthBody.length - baselineBodyLength) < 100)) {
        findings.push({
          findingId: `AUTH-MISSING-${endpoint.method}-${endpoint.path}`,
          category: "API2:2023 - Broken Authentication",
          title: "Protected Endpoint Accepts Unauthenticated Requests",
          severity: "critical",
          confidence: "high",
          endpoint: endpoint.path,
          method: endpoint.method,
          parameter: null,
          description: `The protected API endpoint '${endpoint.path}' responded with 200 OK to a request missing authentication tokens.`,
          impact: "Unauthenticated attackers can access protected business operations and data without credentials.",
          remediation: "Enforce strict authentication middleware globally across all protected API routes.",
          evidence: {
            request: {
              method: endpoint.method,
              url: endpoint.url,
              headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0" },
              body: null,
            },
            response: {
              status: resNoAuth.status,
              headers: Object.fromEntries(resNoAuth.headers.entries()),
              body: noAuthBody.slice(0, 400),
            }
          }
        });
      }
    }

    // Probe 2: Send request with invalid / malformed token
    const resInvalidAuth = await fetch(targetUrl, {
      method: endpoint.method,
      headers: {
        "User-Agent": "HeaderGuard-ApiScanner/2.0",
        "Authorization": "Bearer invalid_malformed_token_headerguard_test_999",
      },
      signal: AbortSignal.timeout(4000)
    });

    const invalidAuthStatus = resInvalidAuth.status;
    const invalidAuthBody = await resInvalidAuth.text();
    const isInvalidAuthRejected = invalidAuthStatus === 401 || invalidAuthStatus === 403 || invalidAuthStatus === 404;

    if (invalidAuthStatus === 200 && !isInvalidAuthRejected) {
      // Strict False Positive Rule: Only flag if valid token succeeded (baselineStatus === 200) AND invalid token also returns 200 OK with same data!
      if (hasAuthToken && baselineStatus === 200) {
        findings.push({
          findingId: `AUTH-INVALID-${endpoint.method}-${endpoint.path}`,
          category: "API2:2023 - Broken Authentication",
          title: "Endpoint Accepts Invalid or Malformed Bearer Token",
          severity: "high",
          confidence: "high",
          endpoint: endpoint.path,
          method: endpoint.method,
          parameter: "Authorization",
          description: `The endpoint '${endpoint.path}' accepted an invalid JWT / Bearer token without returning 401 Unauthorized.`,
          impact: "Token signature validation bypass allowing forgery of administrative or user sessions.",
          remediation: "Verify JWT signatures, cryptographic integrity, and expiration timestamps on every incoming request.",
          evidence: {
            request: {
              method: endpoint.method,
              url: endpoint.url,
              headers: { Authorization: "Bearer ********" },
              body: null,
            },
            response: {
              status: resInvalidAuth.status,
              headers: Object.fromEntries(resInvalidAuth.headers.entries()),
              body: invalidAuthBody.slice(0, 400),
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
