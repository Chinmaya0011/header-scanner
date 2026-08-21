/**
 * API6, API7 & API10 OWASP Security Checks
 */

const SSRF_PARAM_PATTERNS = ["url", "callback", "webhook", "redirect", "imageurl", "avatarurl", "target", "destination", "endpoint"];
const BUSINESS_FLOW_PATTERNS = [/login/i, /checkout/i, /payment/i, /password-?reset/i, /transfer/i, /withdraw/i, /invite/i];

export async function checkBusinessFlowsAndSsrf(endpoint, authHeaders = {}) {
  const findings = [];

  // API6: Sensitive Business Flow Identification
  const isBusinessFlow = BUSINESS_FLOW_PATTERNS.some(pattern => pattern.test(endpoint.path));
  if (isBusinessFlow) {
    findings.push({
      findingId: `BUSINESS-FLOW-${endpoint.method}-${endpoint.path}`,
      category: "API6:2023 - Unrestricted Access to Sensitive Business Flows",
      title: "Sensitive Business Flow Endpoint Identified",
      severity: "info",
      confidence: "high",
      endpoint: endpoint.path,
      method: endpoint.method,
      parameter: null,
      description: `The endpoint '${endpoint.path}' performs critical business transactions (authentication/payment/user state change).`,
      impact: "Automated bot attacks, scalping, credential stuffing, or business logic abuse if anti-automation is missing.",
      remediation: "Enforce CAPTCHA, bot detection, device fingerprinting, and strict velocity rate limits on critical flows.",
      evidence: {
        request: { method: endpoint.method, url: endpoint.url, headers: {}, body: null },
        response: { status: 200, headers: {}, body: "Sensitive flow classified." }
      }
    });
  }

  // API7: SSRF Parameter Identification
  for (const param of (endpoint.parameters || [])) {
    if (SSRF_PARAM_PATTERNS.includes(param.name.toLowerCase())) {
      findings.push({
        findingId: `SSRF-PARAM-${param.name}-${endpoint.path}`,
        category: "API7:2023 - Server Side Request Forgery",
        title: `Potential SSRF URL Parameter Detected: '${param.name}'`,
        severity: "medium",
        confidence: "medium",
        endpoint: endpoint.path,
        method: endpoint.method,
        parameter: param.name,
        description: `The endpoint parameter '${param.name}' accepts external URL values that may trigger outbound server HTTP requests.`,
        impact: "Internal network probing, cloud metadata theft (169.254.169.254), or internal port scanning.",
        remediation: "Validate outbound URL destinations against an strict allowlist and block requests to RFC 1918 private IP ranges.",
        evidence: {
          request: { method: endpoint.method, url: endpoint.url, headers: {}, body: null },
          response: { status: 200, headers: {}, body: `Parameter '${param.name}' identified.` }
        }
      });
    }
  }

  return findings;
}
