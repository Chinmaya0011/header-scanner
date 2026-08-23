/**
 * API6, API7 & API10 OWASP Security Checks
 */

const SSRF_PARAM_PATTERNS = ["url", "callback", "webhook", "redirect", "imageurl", "avatarurl", "target", "destination", "endpoint"];
const BUSINESS_FLOW_PATTERNS = [/login/i, /checkout/i, /payment/i, /password-?reset/i, /transfer/i, /withdraw/i];

export async function checkBusinessFlowsAndSsrf(endpoint, authHeaders = {}) {
  const findings = [];

  // API6: Sensitive Business Flow Identification (Informational Insight)
  const isBusinessFlow = BUSINESS_FLOW_PATTERNS.some(pattern => pattern.test(endpoint.path));
  if (isBusinessFlow) {
    findings.push({
      findingId: `BUSINESS-FLOW-${endpoint.method}-${endpoint.path}`,
      category: "API6:2023 - Unrestricted Access to Sensitive Business Flows",
      title: "Sensitive Business Flow Endpoint Classified",
      severity: "info",
      confidence: "high",
      endpoint: endpoint.path,
      method: endpoint.method,
      parameter: null,
      description: `The endpoint '${endpoint.path}' handles critical business transactions (authentication/payment/user state change).`,
      impact: "Risk of automated bot attacks, scalping, credential stuffing, or business logic abuse if anti-automation controls are absent.",
      remediation: "Enforce CAPTCHA, bot detection, device fingerprinting, and strict velocity rate limits on critical flows.",
      evidence: {
        request: { method: endpoint.method, url: endpoint.url, headers: {}, body: null },
        response: { status: 200, headers: {}, body: "Sensitive business flow route classified." }
      }
    });
  }

  // API7: SSRF Parameter Probing
  for (const param of (endpoint.parameters || [])) {
    if (SSRF_PARAM_PATTERNS.includes(param.name.toLowerCase())) {
      // Test loopback SSRF protection safely
      try {
        const testUrl = new URL(endpoint.url);
        testUrl.searchParams.set(param.name, "http://127.0.0.1:80/");
        
        const ssrfRes = await fetch(testUrl.toString(), {
          method: endpoint.method,
          headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...authHeaders },
          signal: AbortSignal.timeout(3000)
        });

        // If server accepts loopback URL with 200 OK without blocking 127.0.0.1
        if (ssrfRes.status === 200) {
          findings.push({
            findingId: `SSRF-PARAM-${param.name}-${endpoint.path}`,
            category: "API7:2023 - Server Side Request Forgery",
            title: `Potential SSRF URL Parameter Discovered: '${param.name}'`,
            severity: "medium",
            confidence: "medium",
            endpoint: endpoint.path,
            method: endpoint.method,
            parameter: param.name,
            description: `The endpoint parameter '${param.name}' accepts external URL parameters without blocking localhost (127.0.0.1) loopback destinations.`,
            impact: "Internal network probing, cloud metadata theft (169.254.169.254), or internal port scanning.",
            remediation: "Validate outbound URL destinations against a strict allowlist and block requests to RFC 1918 private IP ranges.",
            evidence: {
              request: { method: endpoint.method, url: testUrl.toString(), headers: {}, body: null },
              response: { status: ssrfRes.status, headers: Object.fromEntries(ssrfRes.headers.entries()), body: "Loopback test completed." }
            }
          });
        }
      } catch {
        // Ignore network timeout
      }
    }
  }

  return findings;
}

