import { isLikelyPublicPath } from "../discovery/normalizer.js";

/**
 * API2:2023 - Broken Authentication Checker
 * Tests whether authentication-required endpoints accept unauthenticated or malformed requests
 */

export async function checkAuthentication(endpoint, authHeaders = {}) {
  const findings = [];
  
  // Skip if path is known to be public or marked non-auth required
  if (isLikelyPublicPath(endpoint.path) || endpoint.authenticationRequired === false) {
    return findings;
  }

  const targetUrl = endpoint.url.replace("{id}", "1");
  const hasAuthToken = Object.keys(authHeaders).length > 0;

  try {
    // 1. Probe Baseline with valid authentication token
    let baselineStatus = null;
    let baselineBodyText = "";

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
        baselineBodyText = await resBaseline.text();
      } catch {
        // Ignore baseline failure
      }
    }

    // 2. Probe 1: Send request with NO authorization headers
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

    // Proper rejection checks
    const isNoAuthRejected = noAuthStatus === 401 || noAuthStatus === 403 || noAuthStatus === 404 || noAuthStatus === 405;
    const isHtmlRedirect = contentTypeNoAuth.includes("text/html") && (noAuthBody.includes("login") || noAuthBody.includes("Login") || noAuthBody.includes("Sign In"));

    if (noAuthStatus === 200 && !isNoAuthRejected && !isHtmlRedirect) {
      // False Positive Protection:
      // Only flag if baseline with valid token was 200 OK, AND unauthenticated request returns private user payload
      const containsUserPrivateData = /"(email|user_?id|account_?id|balance|ssn|credit_card|secret)"\s*:/i.test(noAuthBody);

      if (hasAuthToken && baselineStatus === 200 && containsUserPrivateData) {
        // Safe req headers for display
        const safeReqHeaders = { ...authHeaders };
        if (safeReqHeaders.Authorization) safeReqHeaders.Authorization = "Bearer ********";

        findings.push({
          findingId: `AUTH-MISSING-${endpoint.method}-${endpoint.path}`,
          category: "API2:2023 - Broken Authentication",
          title: "Protected Endpoint Accepts Unauthenticated Requests",
          severity: "critical",
          confidence: "high",
          endpoint: endpoint.path,
          method: endpoint.method,
          parameter: null,
          description: `The protected API endpoint '${endpoint.path}' returned confidential account/user data (200 OK) when accessed without authentication tokens.`,
          impact: "Unauthenticated attackers can read or modify protected user data and execute actions without credentials.",
          remediation: "Enforce strict authentication middleware globally across all protected API routes before controller execution.",
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

    // 3. Probe 2: Send request with invalid / malformed token
    if (hasAuthToken && baselineStatus === 200) {
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
        // Confirm invalid token response also contains sensitive data identical to baseline
        const containsSensitiveData = /"(email|user_?id|account_?id|balance|ssn|credit_card|secret)"\s*:/i.test(invalidAuthBody);
        
        if (containsSensitiveData) {
          findings.push({
            findingId: `AUTH-INVALID-${endpoint.method}-${endpoint.path}`,
            category: "API2:2023 - Broken Authentication",
            title: "Endpoint Accepts Invalid or Malformed Bearer Token",
            severity: "high",
            confidence: "high",
            endpoint: endpoint.path,
            method: endpoint.method,
            parameter: "Authorization",
            description: `The endpoint '${endpoint.path}' accepted an invalid JWT / Bearer token and returned confidential data without returning 401 Unauthorized.`,
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
    }

  } catch {
    // Ignore timeout
  }

  return findings;
}

