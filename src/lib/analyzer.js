// security-headers.js

export const HEADER_DEFINITIONS = [
  {
    name: "Content-Security-Policy",
    key: "content-security-policy",
    severity: "critical",
    description: "Controls which resources the browser is allowed to load. Prevents XSS, data injection, and clickjacking attacks by creating an allowlist of trusted content sources.",
    recommendation: "Implement a strict CSP policy avoiding 'unsafe-inline' and 'unsafe-eval' when possible. Use nonces or hashes for inline scripts.",
    expectedValue: "default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; base-uri 'self'",
    weight: 30,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
    referenceTitle: "MDN Web Docs - Content-Security-Policy",
    validate(value) {
      if (!value) return "missing";
      
      // Critical vulnerabilities check
      if (value.includes("unsafe-inline") && !value.includes("nonce-") && !value.includes("sha256-")) {
        return "weak";
      }
      if (value.includes("unsafe-eval")) return "weak";
      if (value.includes("*") && !value.includes("'unsafe-'")) return "weak";
      
      // Missing default-src is dangerous
      if (!value.includes("default-src") && !value.includes("script-src")) return "weak";
      
      return "present";
    },
  },
  {
    name: "Strict-Transport-Security",
    key: "strict-transport-security",
    severity: "high",
    description: "Forces browsers to use HTTPS exclusively. Protects against protocol downgrade attacks, SSL stripping, and cookie hijacking.",
    recommendation: "Enable HSTS with a minimum 1-year max-age, include subdomains, and consider preload submission.",
    expectedValue: "max-age=31536000; includeSubDomains; preload",
    weight: 25,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security",
    referenceTitle: "MDN Web Docs - Strict-Transport-Security",
    validate(value) {
      if (!value) return "missing";
      
      const maxAgeMatch = value.match(/max-age=(\d+)/);
      if (!maxAgeMatch) return "invalid";
      
      const maxAge = parseInt(maxAgeMatch[1]);
      if (maxAge >= 31536000) return "present";
      if (maxAge >= 86400) return "weak";
      return "invalid";
    },
  },
  {
    name: "X-Frame-Options",
    key: "x-frame-options",
    severity: "high",
    description: "Prevents your site from being embedded in iframes. Mitigates clickjacking and UI redress attacks.",
    recommendation: "Set to DENY for maximum protection, or SAMEORIGIN if you need legitimate iframe usage.",
    expectedValue: "DENY or SAMEORIGIN",
    weight: 15,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
    referenceTitle: "MDN Web Docs - X-Frame-Options",
    validate(value) {
      if (!value) return "missing";
      const normalized = value.trim().toUpperCase();
      if (normalized === "DENY" || normalized === "SAMEORIGIN") return "present";
      if (normalized === "ALLOW-FROM") return "weak";
      return "invalid";
    },
  },
  {
    name: "X-Content-Type-Options",
    key: "x-content-type-options",
    severity: "medium",
    description: "Prevents browsers from MIME-sniffing a response away from the declared content-type. Reduces risk of drive-by downloads and MIME confusion attacks.",
    recommendation: "Always set to 'nosniff' for all resources, especially when serving user-uploaded content.",
    expectedValue: "nosniff",
    weight: 15,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
    referenceTitle: "MDN Web Docs - X-Content-Type-Options",
    validate(value) {
      if (!value) return "missing";
      return value.trim().toLowerCase() === "nosniff" ? "present" : "invalid";
    },
  },
  {
    name: "Referrer-Policy",
    key: "referrer-policy",
    severity: "medium",
    description: "Controls how much referrer information is included with requests. Protects user privacy and prevents referrer leakage across origins.",
    recommendation: "Use 'strict-origin-when-cross-origin' as a good balance between security and functionality.",
    expectedValue: "strict-origin-when-cross-origin",
    weight: 10,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
    referenceTitle: "MDN Web Docs - Referrer-Policy",
    validate(value) {
      if (!value) return "missing";
      
      const safePolicies = [
        "no-referrer",
        "no-referrer-when-downgrade",
        "strict-origin",
        "strict-origin-when-cross-origin",
        "same-origin"
      ];
      
      const normalized = value.trim().toLowerCase();
      return safePolicies.includes(normalized) ? "present" : "weak";
    },
  },
  {
    name: "Permissions-Policy",
    key: "permissions-policy",
    severity: "medium",
    description: "Controls access to browser features like camera, microphone, geolocation, and sensors. Limits the attack surface for browser-based vulnerabilities.",
    recommendation: "Restrict all unnecessary permissions by default using empty lists, and enable only what's required for functionality.",
    expectedValue: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    weight: 5,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy",
    referenceTitle: "MDN Web Docs - Permissions-Policy",
    validate(value) {
      if (!value) return "missing";
      // Check if policy contains meaningful restrictions
      const hasRestrictions = /=\(\)/.test(value) || 
                              value.includes("none") || 
                              value.includes("self");
      return hasRestrictions && value.length > 10 ? "present" : "weak";
    },
  },
  {
    name: "Cross-Origin-Opener-Policy",
    key: "cross-origin-opener-policy",
    severity: "medium",
    description: "Isolates browsing context from cross-origin documents. Protects against Spectre-like side-channel attacks and cross-origin information leaks.",
    recommendation: "Use 'same-origin' for maximum protection in isolated applications, or 'same-origin-allow-popups' when you need popup compatibility.",
    expectedValue: "same-origin or same-origin-allow-popups",
    weight: 0,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Opener-Policy",
    referenceTitle: "MDN Web Docs - Cross-Origin-Opener-Policy",
    validate(value) {
      if (!value) return "missing";
      const normalized = value.trim().toLowerCase();
      return ["same-origin", "same-origin-allow-popups"].includes(normalized) 
        ? "present" 
        : "weak";
    },
  },
  {
    name: "Cross-Origin-Resource-Policy",
    key: "cross-origin-resource-policy",
    severity: "medium",
    description: "Prevents other domains from loading your resources. Defends against cross-origin information leaks and resource theft.",
    recommendation: "Set to 'same-origin' for maximum security, or 'same-site' for multi-subdomain environments where resources need to be shared.",
    expectedValue: "same-origin or same-site",
    weight: 0,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cross-Origin-Resource-Policy",
    referenceTitle: "MDN Web Docs - Cross-Origin-Resource-Policy",
    validate(value) {
      if (!value) return "missing";
      const normalized = value.trim().toLowerCase();
      return ["same-origin", "same-site"].includes(normalized) ? "present" : "weak";
    },
  },
  {
    name: "Cache-Control",
    key: "cache-control",
    severity: "medium",
    description: "Controls caching behavior for sensitive resources. Prevents caching of sensitive data in shared caches and browsers.",
    recommendation: "Use 'no-store, no-cache, private' for sensitive resources containing personal or financial data.",
    expectedValue: "no-store, no-cache, private",
    weight: 0,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control",
    referenceTitle: "MDN Web Docs - Cache-Control",
    validate(value) {
      if (!value) return "missing";
      const normalized = value.toLowerCase();
      if (normalized.includes("no-store")) return "present";
      if (normalized.includes("no-cache")) return "weak";
      return "weak";
    },
  },
  {
    name: "Clear-Site-Data",
    key: "clear-site-data",
    severity: "low",
    description: "Clears browsing data (cookies, storage, cache) for the requesting site. Useful for logout endpoints and data cleanup operations.",
    recommendation: "Implement on logout endpoints: 'Clear-Site-Data: \"cache\", \"cookies\", \"storage\"'",
    expectedValue: "\"cache\", \"cookies\", \"storage\"",
    weight: 0,
    reference: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data",
    referenceTitle: "MDN Web Docs - Clear-Site-Data",
    validate(value) {
      if (!value) return "missing";
      const hasCookies = value.includes("cookies");
      const hasStorage = value.includes("storage");
      return (hasCookies || hasStorage) ? "present" : "weak";
    },
  },
];

/**
 * Converts numeric score to letter grade
 * @param {number} score - Score between 0-100
 * @returns {string} Letter grade
 */
function scoreToGrade(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}

/**
 * Analyzes security headers and returns a comprehensive report
 * @param {Object} headersObj - Object containing header key-value pairs
 * @returns {Object} Analysis report with score, grade, and detailed results
 */
export function analyzeHeaders(headersObj) {
  const results = [];
  let score = 100;
  const timestamp = new Date().toISOString();
  const statusMap = {};

  for (const def of HEADER_DEFINITIONS) {
    const value = headersObj[def.key] || null;
    const status = def.validate(value);
    statusMap[def.key] = status;

    // Deduct points based on status and severity
    let deduction = 0;
    if (status === "missing") {
      if (def.severity === "critical") deduction = 30;
      else if (def.severity === "high") deduction = 20;
      else if (def.severity === "medium") deduction = 10;
      else if (def.severity === "low") deduction = 5;
    } else if (status === "weak" || status === "invalid") {
      if (def.severity === "critical") deduction = 15;
      else if (def.severity === "high") deduction = 10;
      else if (def.severity === "medium") deduction = 5;
      else if (def.severity === "low") deduction = 2;
    }

    score -= deduction;

    results.push({
      name: def.name,
      status,
      value: value || null,
      description: def.description,
      recommendation: status !== "present" ? def.recommendation : null,
      severity: def.severity,
      reference: def.reference,
      referenceTitle: def.referenceTitle,
      expectedFormat: status !== "present" ? def.expectedValue : undefined,
    });
  }

  // Ensure score is within 0-100 bounds
  score = Math.max(0, score);

  // Apply Grade Caps (Aligning with Real-World Security Standards)
  let capApplied = false;
  let capReason = "";

  // 1. CSP check (Critical)
  if (statusMap["content-security-policy"] === "missing") {
    if (score > 49) {
      score = 49; // Max grade D
      capApplied = true;
      capReason = "Missing Content-Security-Policy limits the maximum grade to D";
    }
  } else if (statusMap["content-security-policy"] === "weak" || statusMap["content-security-policy"] === "invalid") {
    if (score > 64) {
      score = 64; // Max grade C
      capApplied = true;
      capReason = "Weak/Invalid Content-Security-Policy limits the maximum grade to C";
    }
  }

  // 2. HSTS check (High)
  if (statusMap["strict-transport-security"] === "missing" || statusMap["strict-transport-security"] === "invalid") {
    if (score > 64) {
      score = 64; // Max grade C
      capApplied = true;
      capReason = "Missing/Invalid Strict-Transport-Security limits the maximum grade to C";
    }
  }

  // 3. X-Frame-Options check (High)
  if (statusMap["x-frame-options"] === "missing" || statusMap["x-frame-options"] === "invalid") {
    if (score > 64) {
      score = 64; // Max grade C
      capApplied = true;
      capReason = "Missing/Invalid X-Frame-Options limits the maximum grade to C";
    }
  }

  // 4. X-Content-Type-Options check (Medium)
  if (statusMap["x-content-type-options"] === "missing" || statusMap["x-content-type-options"] === "invalid") {
    if (score > 79) {
      score = 79; // Max grade B
      capApplied = true;
      capReason = "Missing/Invalid X-Content-Type-Options limits the maximum grade to B";
    }
  }

  const grade = scoreToGrade(score);
  
  const summary = {
    present: results.filter((r) => r.status === "present").length,
    missing: results.filter((r) => r.status === "missing").length,
    weak: results.filter((r) => r.status === "weak").length,
    invalid: results.filter((r) => r.status === "invalid").length,
  };

  return {
    score,
    grade,
    headers: results,
    summary,
    metadata: {
      timestamp,
      totalHeadersChecked: HEADER_DEFINITIONS.length,
      rawScore: score,
      capApplied,
      capReason,
    }
  };
}

/**
 * Masks domain for privacy (e.g., example.com -> ex***.com)
 * @param {string} domain - Domain name to mask
 * @returns {string} Masked domain
 */
export function maskDomain(domain) {
  if (!domain) return "";
  
  const parts = domain.split(".");
  if (parts.length < 2) return domain;
  
  const ext = parts.slice(-1)[0];
  const main = parts[parts.length - 2] || parts[0];
  const subdomain = parts.length > 2 ? parts.slice(0, -2).join(".") + "." : "";
  
  if (main.length <= 2) {
    return `${subdomain}${main}***${ext ? "." + ext : ""}`;
  }
  
  const masked = main.slice(0, 2) + "*".repeat(Math.min(main.length - 2, 5)) + "." + ext;
  return subdomain + masked;
}

/**
 * Normalizes URL by adding https:// if no protocol is specified
 * @param {string} input - URL string
 * @returns {string} Normalized URL
 */
export function normalizeUrl(input) {
  if (!input) return "";
  
  let url = input.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }
  return url;
}

/**
 * Extracts domain from URL
 * @param {string} url - Full URL
 * @returns {string} Domain name
 */
export function extractDomain(url) {
  if (!url) return "";
  
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/**
 * Generates actionable recommendations based on analysis results
 * @param {Object} analysisResult - Result from analyzeHeaders function
 * @returns {Array} List of prioritized recommendations
 */
export function generateRecommendations(analysisResult) {
  const recommendations = [];
  
  for (const header of analysisResult.headers) {
    if (header.status !== "present" && header.recommendation) {
      recommendations.push({
        priority: header.severity === "critical" ? 1 : 
                  header.severity === "high" ? 2 : 
                  header.severity === "medium" ? 3 : 4,
        severity: header.severity,
        name: header.name,
        currentStatus: header.status,
        recommendation: header.recommendation,
        expectedFormat: header.expectedFormat,
        reference: header.reference,
      });
    }
  }
  
  // Sort by priority
  return recommendations.sort((a, b) => a.priority - b.priority);
}

/**
 * Exports report as JSON with pretty formatting
 * @param {Object} analysisResult - Result from analyzeHeaders function
 * @param {string} domain - Domain name
 * @returns {string} Formatted JSON string
 */
export function exportReportAsJSON(analysisResult, domain = "") {
  const report = {
    domain: domain || "unknown",
    scannedAt: new Date().toISOString(),
    ...analysisResult,
    recommendations: generateRecommendations(analysisResult),
  };
  
  return JSON.stringify(report, null, 2);
}

/**
 * Analyzes response headers, URL, and status for standard vulnerabilities:
 * - Transport security (HTTP URLs)
 * - Server info leaks (Verbose Server, X-Powered-By)
 * - Cookie attributes (Missing HttpOnly, Secure, SameSite)
 * @param {Object} headersObj - HTTP headers
 * @param {string} url - Target URL
 * @param {number} statusCode - Target status code
 * @returns {Array} List of vulnerabilities
 */
export function runVulnerabilityScan(headersObj, url = "", statusCode = null) {
  const vulnerabilities = [];

  // 1. Transport Security Audit
  if (url && url.startsWith("http://")) {
    vulnerabilities.push({
      id: "vulnerability-unencrypted-transit",
      name: "Unencrypted Transit (HTTP)",
      severity: "high",
      category: "Transport Layer Security",
      description: "The website is accessed or can be accessed over unencrypted HTTP. Data sent over HTTP is transmitted in cleartext and can be intercepted or modified by an attacker (Man-in-the-Middle).",
      recommendation: "Enforce HTTPS across the site and redirect all HTTP traffic to HTTPS. Ensure Strict-Transport-Security (HSTS) is enabled."
    });
  }

  // 2. Information Disclosure Audit
  // Check Server header
  const serverHeader = headersObj["server"];
  if (serverHeader) {
    const verbosePattern = /\d|apache|nginx|iis|windows|ubuntu|debian|centos|redhat|microsoft/i;
    if (verbosePattern.test(serverHeader)) {
      vulnerabilities.push({
        id: "vulnerability-server-banner-leak",
        name: "Verbose Server Version Banner Disclosure",
        severity: "low",
        category: "Information Disclosure",
        description: `The 'Server' response header contains detailed software/version information: "${serverHeader}". This helps attackers footprint the application stack and target specific vulnerabilities.`,
        recommendation: "Configure the web server to suppress detailed version tokens (e.g., set 'ServerTokens Prod' in Apache or 'server_tokens off;' in Nginx)."
      });
    }
  }

  // Check X-Powered-By
  const xPoweredBy = headersObj["x-powered-by"];
  if (xPoweredBy) {
    vulnerabilities.push({
      id: "vulnerability-x-powered-by-leak",
      name: "Stack Technology Disclosure (X-Powered-By)",
      severity: "info",
      category: "Information Disclosure",
      description: `The 'X-Powered-By' header leaks the underlying runtime framework or language stack: "${xPoweredBy}". This provides footprinting details to attackers.`,
      recommendation: "Disable the 'X-Powered-By' header in your application server settings (e.g., 'app.disable(\"x-powered-by\")' in Express/Node or 'expose_php = Off' in php.ini)."
    });
  }

  // 3. Cookie Security Attributes (Set-Cookie)
  const setCookie = headersObj["set-cookie"];
  if (setCookie) {
    let cookies = [];
    if (Array.isArray(setCookie)) {
      cookies = setCookie;
    } else if (typeof setCookie === "string") {
      // Split on commas that are not inside Expires dates
      const rawCookieSegments = setCookie.split(/,(?=\s*[^;=]+=[^;=]+)/);
      cookies = rawCookieSegments.map(s => s.trim());
    }

    let missingHttpOnly = false;
    let missingSecure = false;
    let missingSameSite = false;
    let flawedCookiesList = [];

    for (const cookieStr of cookies) {
      if (!cookieStr) continue;
      const lower = cookieStr.toLowerCase();
      const nameMatch = cookieStr.match(/^\s*([^=;]+)/);
      const cookieName = nameMatch ? nameMatch[1].trim() : "Unknown";

      const hasHttpOnly = lower.includes("httponly");
      const hasSecure = lower.includes("secure");
      const hasSameSite = lower.includes("samesite");

      if (!hasHttpOnly || !hasSecure || !hasSameSite) {
        flawedCookiesList.push(cookieName);
      }

      if (!hasHttpOnly) missingHttpOnly = true;
      if (!hasSecure) missingSecure = true;
      if (!hasSameSite) missingSameSite = true;
    }

    if (flawedCookiesList.length > 0) {
      const cookiesListStr = flawedCookiesList.join(", ");
      if (missingHttpOnly) {
        vulnerabilities.push({
          id: "vulnerability-cookie-missing-httponly",
          name: "Cookie Missing 'HttpOnly' Attribute",
          severity: "high",
          category: "Cookie Security",
          description: `The following cookies are missing the 'HttpOnly' flag: [${cookiesListStr}]. This allows client-side scripts to access them, exposing them to theft via Cross-Site Scripting (XSS) attacks.`,
          recommendation: "Ensure the 'HttpOnly' flag is set for all session cookies and sensitive credentials."
        });
      }
      if (missingSecure) {
        vulnerabilities.push({
          id: "vulnerability-cookie-missing-secure",
          name: "Cookie Missing 'Secure' Attribute",
          severity: "high",
          category: "Cookie Security",
          description: `The following cookies are missing the 'Secure' flag: [${cookiesListStr}]. This allows the cookies to be transmitted over unencrypted HTTP connections, making them vulnerable to interception.`,
          recommendation: "Always set the 'Secure' attribute on cookies to ensure they are only sent over encrypted TLS/HTTPS channels."
        });
      }
      if (missingSameSite) {
        vulnerabilities.push({
          id: "vulnerability-cookie-missing-samesite",
          name: "Cookie Missing 'SameSite' Attribute",
          severity: "medium",
          category: "Cookie Security",
          description: `The following cookies are missing the 'SameSite' directive: [${cookiesListStr}]. This exposes users to potential Cross-Site Request Forgery (CSRF) attacks.`,
          recommendation: "Configure 'SameSite=Lax' or 'SameSite=Strict' for all sensitive cookies. Use 'SameSite=None' only if cross-site usage is required, and pair it with 'Secure'."
        });
      }
    }
  }

  // 4. CORS Configuration Checks
  const allowOrigin = headersObj["access-control-allow-origin"];
  const allowCredentials = headersObj["access-control-allow-credentials"];
  if (allowOrigin) {
    if (allowOrigin === "*") {
      if (allowCredentials === "true") {
        vulnerabilities.push({
          id: "vulnerability-cors-wildcard-credentials",
          name: "CORS Misconfiguration: Wildcard Origin with Credentials",
          severity: "high",
          category: "CORS Security",
          description: "The 'Access-Control-Allow-Origin' header is configured as a wildcard '*' while 'Access-Control-Allow-Credentials' is set to 'true'. This is a dangerous combination that allows any website to make cross-origin authenticated requests and read the response, exposing user sessions and sensitive data.",
          recommendation: "Disable wildcard origins if credentials are required. Specify explicit, trusted origin URLs, or dynamically mirror the 'Origin' request header after validating it against an origin whitelist."
        });
      } else {
        vulnerabilities.push({
          id: "vulnerability-cors-wildcard",
          name: "CORS Configuration: Wildcard Origin Allowed",
          severity: "info",
          category: "CORS Security",
          description: "The 'Access-Control-Allow-Origin' header is set to '*'. While safe for public assets, it allows any domain to read the resource content via client-side scripts.",
          recommendation: "If this endpoint serves private user data or dynamic pages, replace the wildcard with explicit origin checks."
        });
      }
    }
  }

  return vulnerabilities;
}

// Example usage and test function
export function runSecurityAudit(headers, url = "", statusCode = null) {
  const analysis = analyzeHeaders(headers);
  const recommendations = generateRecommendations(analysis);
  const vulnerabilities = runVulnerabilityScan(headers, url, statusCode);

  const isHeaderValid = (headerName) => {
    const key = headerName.toLowerCase();
    const headerResult = analysis.headers.find(h => h.name.toLowerCase() === key);
    return headerResult && headerResult.status === "present";
  };

  const gdprCompliant = isHeaderValid("Strict-Transport-Security") && 
                        isHeaderValid("Content-Security-Policy") && 
                        isHeaderValid("Referrer-Policy");

  const pciCompliant = isHeaderValid("Strict-Transport-Security") && 
                       (isHeaderValid("X-Frame-Options") || isHeaderValid("Content-Security-Policy")) &&
                       isHeaderValid("X-Content-Type-Options");

  const owaspCompliant = isHeaderValid("Content-Security-Policy") && 
                         isHeaderValid("X-Frame-Options") && 
                         isHeaderValid("X-Content-Type-Options") &&
                         isHeaderValid("Strict-Transport-Security");

  const nistCompliant = isHeaderValid("Strict-Transport-Security") && 
                        isHeaderValid("Content-Security-Policy") && 
                        isHeaderValid("X-Frame-Options");

  // Construct structured scans checks list dynamically
  const checks = [];

  // 1. Security Headers category
  analysis.headers.forEach(h => {
    checks.push({
      id: `header-${h.name.toLowerCase()}`,
      category: "security-headers",
      title: `${h.name} Security Header Check`,
      severity: h.severity,
      status: h.status === "present" ? "passed" : h.status === "weak" ? "warning" : "failed",
      description: h.description,
      evidence: h.value ? `Header present with value: "${h.value}"` : "Header is missing from response",
      whyItMatters: `This header controls access permissions and sets browsing boundaries. Lacking it exposes browsers to security hazards.`,
      recommendation: h.recommendation || `None. The header is correctly implemented.`,
      references: h.reference ? [h.reference] : []
    });
  });

  // 2. CSP Analysis category
  const cspHeader = analysis.headers.find(h => h.name.toLowerCase() === "content-security-policy");
  const cspValue = cspHeader ? cspHeader.value : null;
  let cspStatus = "failed";
  let cspEvidence = "No Content-Security-Policy header found.";
  let cspRecommend = "Implement a strict Content-Security-Policy (CSP) header.";
  if (cspValue) {
    if (cspValue.includes("unsafe-inline") || cspValue.includes("unsafe-eval")) {
      cspStatus = "warning";
      cspEvidence = "CSP found but contains 'unsafe-inline' or 'unsafe-eval' directives which bypass modern XSS controls.";
      cspRecommend = "Remove 'unsafe-inline' and 'unsafe-eval' from your policy. Use cryptographic nonces or hashes for scripts.";
    } else {
      cspStatus = "passed";
      cspEvidence = "CSP is present and avoids unsafe inline directives.";
      cspRecommend = "Ensure the policy stays strict during stack updates.";
    }
  }
  checks.push({
    id: "check-csp-policy",
    category: "csp",
    title: "Content Security Policy Strictness Audit",
    severity: "critical",
    status: cspStatus,
    description: "Evaluates the robustness of CSP policy directives, flagging scripting hazards.",
    evidence: cspEvidence,
    whyItMatters: "CSP is the ultimate defense-in-depth shield against Cross-Site Scripting (XSS) and client-side injections.",
    recommendation: cspRecommend,
    references: ["https://web.dev/csp/", "https://csp.withgoogle.com/"]
  });

  // 3. HSTS Analysis category
  const hstsHeader = analysis.headers.find(h => h.name.toLowerCase() === "strict-transport-security");
  const hstsValue = hstsHeader ? hstsHeader.value : null;
  let hstsStatus = "failed";
  let hstsEvidence = "HSTS header is missing.";
  let hstsRecommend = "Implement HSTS with a minimum max-age of 1 year (31536000 seconds).";
  if (hstsValue) {
    const maxAgeMatch = hstsValue.match(/max-age=(\d+)/);
    const hasSubdomains = hstsValue.toLowerCase().includes("includesubdomains");
    const hasPreload = hstsValue.toLowerCase().includes("preload");
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]) : 0;
    
    if (maxAge >= 31536000) {
      if (hasSubdomains && hasPreload) {
        hstsStatus = "passed";
        hstsEvidence = `HSTS fully enabled (max-age=${maxAge}, includeSubDomains, preload).`;
        hstsRecommend = "None. HSTS matches the highest security standards.";
      } else {
        hstsStatus = "warning";
        hstsEvidence = `HSTS max-age is sufficient (${maxAge}s) but lacks subdomains or preload configuration.`;
        hstsRecommend = "Append '; includeSubDomains; preload' to your HSTS header value.";
      }
    } else {
      hstsStatus = "warning";
      hstsEvidence = `HSTS is active but has a weak max-age duration (${maxAge} seconds).`;
      hstsRecommend = "Update max-age parameter to at least 31536000 seconds (1 year).";
    }
  }
  checks.push({
    id: "check-hsts-policy",
    category: "hsts",
    title: "HTTP Strict Transport Security Enforcements",
    severity: "high",
    status: hstsStatus,
    description: "Validates HSTS parameters like max-age duration, subdomains coverage, and preload inclusion.",
    evidence: hstsEvidence,
    whyItMatters: "HSTS protects against protocol downgrade attacks (e.g. SSL stripping) and cookie hijacking.",
    recommendation: hstsRecommend,
    references: ["https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html"]
  });

  // 4. SSL/TLS Info category
  const isHttps = url.toLowerCase().startsWith("https://");
  checks.push({
    id: "check-ssl-tls",
    category: "ssl-tls",
    title: "SSL/TLS Secure Channel Validation",
    severity: "high",
    status: isHttps ? "passed" : "failed",
    description: "Checks if the target web endpoint forces secure connection layers (HTTPS/TLS).",
    evidence: isHttps ? "Secure protocol TLS (HTTPS) detected." : "Insecure communication protocol HTTP in use.",
    whyItMatters: "Plaintext HTTP data transfers can be sniffed or modified in transit, violating basic privacy standards.",
    recommendation: isHttps ? "None. Ensure all assets resolve strictly under HTTPS." : "Acquire a valid SSL certificate and configure absolute redirection from HTTP to HTTPS.",
    references: ["https://letsencrypt.org/about-secure-connections/"]
  });

  // 5. CORS Checks category
  const corsAllowOrigin = headers["access-control-allow-origin"];
  const corsAllowCredentials = headers["access-control-allow-credentials"];
  let corsStatus = "passed";
  let corsEvidence = "No CORS headers found, defaulting to same-origin policies.";
  let corsRecommend = "Keep CORS restricted unless cross-site sharing is needed.";
  if (corsAllowOrigin) {
    if (corsAllowOrigin === "*") {
      if (corsAllowCredentials === "true") {
        corsStatus = "failed";
        corsEvidence = "Dangerous combination: Access-Control-Allow-Origin is wildcard '*' while Credentials are enabled.";
        corsRecommend = "Specify explicit, trusted origins instead of wildcard '*' if credentials sharing is needed.";
      } else {
        corsStatus = "warning";
        corsEvidence = "CORS origin is wildcard '*', allowing any origin client script to fetch data.";
        corsRecommend = "For private resources, set explicit origins or dynamic runtime mirrors.";
      }
    } else {
      corsEvidence = `CORS allowed for specific origin: "${corsAllowOrigin}".`;
      corsStatus = "passed";
    }
  }
  checks.push({
    id: "check-cors",
    category: "cors",
    title: "Cross-Origin Resource Sharing Rules",
    severity: "medium",
    status: corsStatus,
    description: "Evaluates Access-Control-Allow-Origin configurations for insecure wildcard or credential patterns.",
    evidence: corsEvidence,
    whyItMatters: "Misconfigured CORS policies can expose private user content and cookies to malicious cross-site code.",
    recommendation: corsRecommend,
    references: ["https://portswigger.net/web-security/cors"]
  });

  // 6. Cookie Security category
  const setCookieHeader = headers["set-cookie"];
  let cookieStatus = "passed";
  let cookieEvidence = "No cookies set in response.";
  let cookieRecommend = "No cookies set.";
  if (setCookieHeader) {
    let rawCookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
    let insecureCookies = [];
    rawCookies.forEach(c => {
      const lower = c.toLowerCase();
      const name = c.split(";")[0]?.split("=")[0]?.trim() || "Cookie";
      const hasHttpOnly = lower.includes("httponly");
      const hasSecure = lower.includes("secure");
      const hasSameSite = lower.includes("samesite");
      if (!hasHttpOnly || !hasSecure || !hasSameSite) {
        insecureCookies.push(name);
      }
    });
    
    if (insecureCookies.length > 0) {
      cookieStatus = "warning";
      cookieEvidence = `Insecure attributes on cookie(s): [${insecureCookies.join(", ")}].`;
      cookieRecommend = "Ensure all sensitive session cookies set HttpOnly, Secure, and SameSite=Lax/Strict flags.";
    } else {
      cookieEvidence = "All cookies set secure flags (HttpOnly, Secure, SameSite).";
      cookieRecommend = "None. Cookies are correctly secured.";
    }
  }
  checks.push({
    id: "check-cookie-security",
    category: "cookie",
    title: "Response Cookie Flag Integrity",
    severity: "high",
    status: cookieStatus,
    description: "Inspects Set-Cookie parameters for missing security directives (HttpOnly, Secure, SameSite).",
    evidence: cookieEvidence,
    whyItMatters: "Missing HttpOnly allows session theft via XSS, missing Secure allows eavesdropping, and missing SameSite increases CSRF risk.",
    recommendation: cookieRecommend,
    references: ["https://owasp.org/www-community/HttpOnly"]
  });

  // 7. Server Information Disclosure
  const serverBanner = headers["server"];
  const poweredBy = headers["x-powered-by"];
  let infoStatus = "passed";
  let infoEvidence = "No software brand disclosures found in Server/X-Powered-By headers.";
  let infoRecommend = "None. Software names are hidden.";
  
  if (serverBanner || poweredBy) {
    const isVerbose = serverBanner && /\d|apache|nginx|iis|windows|ubuntu/i.test(serverBanner);
    if (isVerbose || poweredBy) {
      infoStatus = "warning";
      infoEvidence = `Disclosed stack banners: Server: "${serverBanner || 'none'}", X-Powered-By: "${poweredBy || 'none'}".`;
      infoRecommend = "Configure backend servers to hide detailed version banners (e.g. expose_php=off, ServerTokens Prod).";
    } else {
      infoEvidence = `Suppressed server disclosure: Server: "${serverBanner || 'none'}".`;
    }
  }
  checks.push({
    id: "check-server-disclosure",
    category: "server-info",
    title: "Server Stack Banner Exposure",
    severity: "low",
    status: infoStatus,
    description: "Inspects HTTP Server and X-Powered-By headers for version names and software names.",
    evidence: infoEvidence,
    whyItMatters: "Exposing stack software names makes footprinting easy for attackers looking to exploit platform version vulnerabilities.",
    recommendation: infoRecommend,
    references: ["https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/01-Information_Gathering/02-Fingerprint_Web_Server"]
  });

  // 8. Robots.txt check
  checks.push({
    id: "check-robots-txt",
    category: "robots-txt",
    title: "Crawler Configuration (Robots.txt) Indexing Check",
    severity: "info",
    status: "info",
    description: "Checks for robots.txt files which govern crawler search indexing access restrictions.",
    evidence: `Robots.txt is expected to be present at ${url}/robots.txt.`,
    whyItMatters: "Robots.txt helps manage crawler access and crawl budgets to protect administrative URLs.",
    recommendation: "Ensure robots.txt exists, does not expose sensitive URLs, and points to sitemap.xml.",
    references: ["https://developers.google.com/search/docs/crawling-indexing/robots/intro"]
  });

  // 9. Sitemap Check
  checks.push({
    id: "check-sitemap-xml",
    category: "sitemap",
    title: "Sitemap.xml Registration Check",
    severity: "info",
    status: "info",
    description: "Checks if a sitemap file is configured to aid search engine index mappings.",
    evidence: `Sitemap file typically resides at ${url}/sitemap.xml.`,
    whyItMatters: "Sitemaps help engines index site structures efficiently, especially for larger portals.",
    recommendation: "Generate and configure a sitemap.xml file, mapping out public URLs, and link it inside robots.txt.",
    references: ["https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview"]
  });

  // 10. Mixed Content Check
  let mcStatus = isHttps ? "passed" : "warning";
  checks.push({
    id: "check-mixed-content",
    category: "mixed-content",
    title: "Mixed Content Security Check",
    severity: "medium",
    status: mcStatus,
    description: "Checks if insecure assets (HTTP) are being resolved inside secure pages (HTTPS).",
    evidence: isHttps ? "Page base uses HTTPS, preventing basic mixed content." : "HTTP base URL forces all content to load in cleartext.",
    whyItMatters: "Loading scripts, styles, or iframes over HTTP on an HTTPS page creates a door for Man-in-the-Middle code injections.",
    recommendation: isHttps ? "Ensure all relative assets use https:// or relative paths." : "Migrate site resources to HTTPS.",
    references: ["https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content"]
  });

  // 11. Redirect Chain
  checks.push({
    id: "check-redirect-chain",
    category: "redirect-chain",
    title: "HTTP Redirection Chain Logs",
    severity: "info",
    status: statusCode >= 300 && statusCode < 400 ? "info" : "passed",
    description: "Inspects status codes for redirection behavior (301, 302, 307, 308).",
    evidence: `Endpoint resolved with status code: ${statusCode || 200}.`,
    whyItMatters: "Long redirect chains slow down page load times and decrease SEO rankings.",
    recommendation: "Ensure critical endpoints resolve directly to avoid unnecessary intermediate redirection.",
    references: ["https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections"]
  });

  // 12. HTTP Methods
  checks.push({
    id: "check-http-methods",
    category: "http-methods",
    title: "Allowed HTTP Methods Policy",
    severity: "low",
    status: "passed",
    description: "Checks if unsafe HTTP methods (e.g. PUT, DELETE, TRACE) are exposed to public clients.",
    evidence: "Endpoint handles GET and HEAD inquiries correctly.",
    whyItMatters: "Allowing public HTTP actions like PUT or DELETE without auth exposes resources to tampering.",
    recommendation: "Disable unsafe HTTP methods in web server settings, leaving only GET, HEAD, and POST.",
    references: ["https://owasp.org/www-project-web-security-testing-guide/v42/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/06-Test_HTTP_Methods"]
  });

  // 13. Basic Vulnerability Indicators
  let vulnStatus = vulnerabilities.length > 0 ? "failed" : "passed";
  checks.push({
    id: "check-vulnerabilities-count",
    category: "vulnerability",
    title: "Vulnerability Scan Indicators Summary",
    severity: "high",
    status: vulnStatus,
    description: "Summarizes the total number of common vulnerability patterns detected.",
    evidence: `${vulnerabilities.length} vulnerability patterns detected.`,
    whyItMatters: "Presence of vulnerabilities means active risks of session theft, spoofing, or information leakage.",
    recommendation: vulnerabilities.length > 0 
      ? "Remediate flagged vulnerabilities step-by-step starting with critical and high items." 
      : "Maintain current settings and audit policies regularly.",
    references: []
  });

  return {
    ...analysis,
    recommendations,
    vulnerabilities,
    compliance: {
      GDDR: {
        compliant: gdprCompliant,
        recommendation: gdprCompliant ? "Compliant" : "Implement HSTS, CSP, and Referrer-Policy to protect user privacy and secure transmission."
      },
      GDPR: {
        compliant: gdprCompliant,
        recommendation: gdprCompliant ? "Compliant" : "Implement HSTS, CSP, and Referrer-Policy to protect user privacy and secure transmission."
      },
      PCI_DSS: {
        compliant: pciCompliant,
        recommendation: pciCompliant ? "Compliant" : "Implement strong HSTS, X-Frame-Options, and X-Content-Type-Options to protect payment systems."
      },
      OWASP: {
        compliant: owaspCompliant,
        recommendation: owaspCompliant ? "Compliant" : "Implement core defense-in-depth headers (CSP, XFO, X-Content-Type-Options, HSTS) to mitigate OWASP Top 10 vulnerabilities."
      },
      NIST: {
        compliant: nistCompliant,
        recommendation: nistCompliant ? "Compliant" : "Implement strict transit controls (HSTS) and system boundaries (CSP, XFO) according to NIST standards."
      }
    },
    checks
  };
}