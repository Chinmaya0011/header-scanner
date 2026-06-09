// security-headers.js

export const HEADER_DEFINITIONS = [
  {
    name: "Content-Security-Policy",
    key: "content-security-policy",
    severity: "critical",
    description: "Controls which resources the browser is allowed to load. Prevents XSS, data injection, and clickjacking attacks by creating an allowlist of trusted content sources.",
    recommendation: "Implement a strict CSP policy avoiding 'unsafe-inline' and 'unsafe-eval' when possible. Use nonces or hashes for inline scripts.",
    expectedValue: "default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; base-uri 'self'",
    weight: 25,
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
    weight: 20,
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
    weight: 10,
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
    weight: 10,
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
    weight: 5,
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
    weight: 10,
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
    weight: 10,
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
    weight: 10,
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
    weight: 5,
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
    weight: 5,
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
 * Analyzes security headers and returns a comprehensive report
 * @param {Object} headersObj - Object containing header key-value pairs
 * @returns {Object} Analysis report with score, grade, and detailed results
 */
export function analyzeHeaders(headersObj) {
  const results = [];
  let rawScore = 0;
  const totalWeight = HEADER_DEFINITIONS.reduce((s, h) => s + h.weight, 0);
  const timestamp = new Date().toISOString();

  for (const def of HEADER_DEFINITIONS) {
    const value = headersObj[def.key] || null;
    const status = def.validate(value);

    let earned = 0;
    if (status === "present") earned = def.weight;
    else if (status === "weak") earned = Math.round(def.weight * 0.3);
    else if (status === "invalid") earned = 0;

    rawScore += earned;

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

  const score = Math.min(100, Math.max(0, Math.round((rawScore / totalWeight) * 100)));
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
      totalPossibleScore: totalWeight,
      rawScore: Math.round(rawScore),
      maxAchievableScore: totalWeight,
    }
  };
}

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

// Example usage and test function
export function runSecurityAudit(headers) {
  const analysis = analyzeHeaders(headers);
  const recommendations = generateRecommendations(analysis);
  
  return {
    ...analysis,
    recommendations,
    compliance: {
      owasp: analysis.score >= 70 ? "Pass" : "Needs Improvement",
      securityScore: analysis.grade,
      actionItems: recommendations.length,
    }
  };
}