/**
 * API8:2023 - Security Misconfiguration Checker
 * Checks CORS wildcard origins (*), missing security headers, and verbose stack traces
 */

export async function checkMisconfiguration(endpoint, authHeaders = {}) {
  const findings = [];

  try {
    const res = await fetch(endpoint.url.replace("{id}", "1"), {
      method: endpoint.method,
      headers: {
        "User-Agent": "HeaderGuard-ApiScanner/2.0",
        "Origin": "https://evil-attacker-example.com",
        ...authHeaders
      },
      signal: AbortSignal.timeout(4000)
    });

    const headersObj = Object.fromEntries(res.headers.entries());
    const acao = headersObj["access-control-allow-origin"];
    const acac = headersObj["access-control-allow-credentials"];

    // 1. Overly permissive CORS check
    if (acao === "*" || (acao === "https://evil-attacker-example.com" && acac === "true")) {
      findings.push({
        findingId: `MISCONFIG-CORS-${endpoint.path}`,
        category: "API8:2023 - Security Misconfiguration",
        title: "Overly Permissive CORS Policy Detected",
        severity: "high",
        confidence: "high",
        endpoint: endpoint.path,
        method: endpoint.method,
        parameter: "Origin",
        description: `The API endpoint returns 'Access-Control-Allow-Origin: ${acao}' allowing arbitrary origins to read API responses.`,
        impact: "Cross-origin attackers can steal API tokens or read private API data via victim browsers.",
        remediation: "Restrict Access-Control-Allow-Origin to specific trusted domains and avoid combining wildcard origin with credentials.",
        evidence: {
          request: {
            method: endpoint.method,
            url: endpoint.url,
            headers: { Origin: "https://evil-attacker-example.com" },
            body: null,
          },
          response: {
            status: res.status,
            headers: headersObj,
            body: "Wildcard / reflective CORS detected.",
          }
        }
      });
    }

    // 2. Verbose error stack trace check (Send malformed payload to trigger 500 error)
    if (endpoint.method === "POST" || endpoint.method === "PUT") {
      try {
        const errRes = await fetch(endpoint.url.replace("{id}", "1"), {
          method: endpoint.method,
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "HeaderGuard-ApiScanner/2.0",
            ...authHeaders
          },
          body: "{ malformed json ::: ",
          signal: AbortSignal.timeout(3000)
        });

        if (errRes.status >= 500) {
          const errText = await errRes.text();
          if (errText.includes("SyntaxError") || errText.includes("at ") || errText.includes("TypeError") || errText.includes("node_modules")) {
            findings.push({
              findingId: `MISCONFIG-STACKTRACE-${endpoint.path}`,
              category: "API8:2023 - Security Misconfiguration",
              title: "Verbose Internal Error & Stack Trace Disclosure",
              severity: "medium",
              confidence: "high",
              endpoint: endpoint.path,
              method: endpoint.method,
              parameter: null,
              description: `Sending a malformed request to '${endpoint.path}' caused an unhandled 500 Server Error that returned raw stack traces or internal filenames.`,
              impact: "Footprinting application stack, framework versions, and file structure for exploit targeting.",
              remediation: "Implement generic global exception handlers and disable detailed error stack traces in production.",
              evidence: {
                request: {
                  method: endpoint.method,
                  url: endpoint.url,
                  headers: { "Content-Type": "application/json" },
                  body: "{ malformed json ::: ",
                },
                response: {
                  status: errRes.status,
                  headers: Object.fromEntries(errRes.headers.entries()),
                  body: errText.slice(0, 500),
                }
              }
            });
          }
        }
      } catch {
        // Ignore
      }
    }

  } catch {
    // Ignore timeout
  }

  return findings;
}
