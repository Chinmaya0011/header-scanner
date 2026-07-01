import { NextResponse } from "next/server";
import https from "https";
import http from "http";
import dns from "dns";
import {
  analyzeHeaders,
  normalizeUrl,
  extractDomain,
  maskDomain,
  generateRecommendations,
  runSecurityAudit,
} from "@/lib/analyzer";

// EASM scanner imports
import { scanSSL } from "@/lib/scanners/sslScanner";
import { scanDNS } from "@/lib/scanners/dnsScanner";
import { scanInfraAndTech } from "@/lib/scanners/infraTechScanner";
import { scanPaths, checkExposedServices, checkSubdomains, discoverPublicPages } from "@/lib/scanners/networkScanner";
import { scanWhois } from "@/lib/scanners/whoisScanner";
import { generateAIAdvice } from "@/lib/aiAssistant";

// In-memory rate limit store: { ip -> { count, resetAt } }
const ipStore = new Map();
const PUBLIC_RATE_LIMIT = { MAX: 10, WINDOW_MS: 60 * 1000 }; // 10 scans per minute for robust guest testing

function checkPublicRateLimit(ip) {
  const now = Date.now();
  const record = ipStore.get(ip);
  if (!record || now > record.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + PUBLIC_RATE_LIMIT.WINDOW_MS });
    return { allowed: true, remaining: PUBLIC_RATE_LIMIT.MAX - 1 };
  }
  if (record.count >= PUBLIC_RATE_LIMIT.MAX) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }
  record.count += 1;
  return { allowed: true, remaining: PUBLIC_RATE_LIMIT.MAX - record.count };
}

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

async function fetchHeadersPublic(url) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "HeaderGuard-PublicScanner/1.0",
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(tid);
    const headersObj = {};
    res.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });

    const securityHeaders = ["content-security-policy", "strict-transport-security", "x-frame-options"];
    const hasSecurityHeaders = securityHeaders.some((h) => headersObj[h]);
    if (!hasSecurityHeaders && res.status !== 405) {
      const ctrl2 = new AbortController();
      const tid2 = setTimeout(() => ctrl2.abort(), 10000);
      const res2 = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ctrl2.signal,
        headers: { "User-Agent": "HeaderGuard-PublicScanner/1.0" },
      });
      clearTimeout(tid2);
      res2.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });
      return { headersObj, statusCode: res2.status };
    }
    return { headersObj, statusCode: res.status };
  } catch (err) {
    clearTimeout(tid);
    console.warn("fetchHeadersPublic primary fetch failed, trying robust HTTPS fallback:", err.message);
    return new Promise((resolve, reject) => {
      try {
        const parsed = new URL(url);
        const transport = parsed.protocol === "https:" ? https : http;
        const options = {
          method: "GET",
          timeout: 8000,
          rejectUnauthorized: false,
          headers: {
            "User-Agent": "HeaderGuard-PublicScanner/1.0",
            Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8"
          }
        };
        const req = transport.request(url, options, (res) => {
          const headersObj = {};
          Object.keys(res.headers).forEach(k => {
            headersObj[k.toLowerCase()] = res.headers[k];
          });
          resolve({ headersObj, statusCode: res.statusCode });
        });
        req.on("error", (e) => reject(e));
        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Timeout"));
        });
        req.end();
      } catch (e) {
        reject(e);
      }
    });
  }
}

// ========== HELPER FUNCTIONS FROM MAIN SCAN API ==========

async function parsePrivacyDetails(url) {
  const privacy = {
    privacyPolicyUrl: "",
    privacyPolicyPresent: false,
    cookieBannerPresent: false,
    thirdPartyScripts: [],
    trackingPixels: [],
    analyticsTools: [],
    externalDomains: []
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "HeaderGuard-PrivacyScanner/2.0" },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const html = await res.text();
      const lowerHtml = html.toLowerCase();
      
      const privacyUrlMatch = html.match(/href=["']([^"']*(privacy|legal|gdpr|policy)[^"']*)["']/i);
      if (privacyUrlMatch) {
        let pUrl = privacyUrlMatch[1];
        if (pUrl.startsWith("/")) {
          try {
            const parsed = new URL(url);
            pUrl = `${parsed.origin}${pUrl}`;
          } catch (e) {}
        }
        privacy.privacyPolicyUrl = pUrl;
        privacy.privacyPolicyPresent = true;
      } else {
        if (lowerHtml.includes("privacy policy") || lowerHtml.includes("privacy statement") || lowerHtml.includes("privacy notice")) {
          privacy.privacyPolicyPresent = true;
          privacy.privacyPolicyUrl = `${url}/privacy`;
        }
      }

      const cookieKeywords = ["cookie-banner", "cookieconsent", "cookie-consent", "cookie-popup", "cookie_consent", "cookiebot", "onetrust", "cookie-notice", "cookie-overlay"];
      const hasCookieIdOrClass = cookieKeywords.some(keyword => 
        lowerHtml.includes(`id="${keyword}`) || 
        lowerHtml.includes(`class="${keyword}`) ||
        lowerHtml.includes(`id='${keyword}`) ||
        lowerHtml.includes(`class='${keyword}`)
      );
      const hasConsentText = lowerHtml.includes("we use cookies") || 
                             lowerHtml.includes("use of cookies") || 
                             lowerHtml.includes("accept cookies") ||
                             lowerHtml.includes("cookie settings") ||
                             lowerHtml.includes("cookie policy");
      privacy.cookieBannerPresent = hasCookieIdOrClass || hasConsentText;

      const scriptDomains = [];
      const pixelDomains = [];
      const analytics = [];
      const externalDomainsSet = new Set();
      
      const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/gi;
      let match;
      let mainDomain = "";
      try {
        const parsedUrl = new URL(url);
        mainDomain = parsedUrl.hostname.replace("www.", "");
      } catch (e) {}

      while ((match = scriptRegex.exec(html)) !== null) {
        const src = match[1];
        try {
          if (src.startsWith("//") || src.startsWith("http")) {
            const tempUrl = new URL(src.startsWith("//") ? `https:${src}` : src);
            const scriptDomain = tempUrl.hostname.replace("www.", "");
            if (mainDomain && scriptDomain !== mainDomain && !scriptDomain.endsWith("." + mainDomain)) {
              externalDomainsSet.add(tempUrl.hostname);
              scriptDomains.push(src);
              
              if (src.includes("googletagmanager.com") || src.includes("google-analytics.com")) {
                analytics.push("Google Analytics");
              }
              if (src.includes("facebook.net")) {
                analytics.push("Facebook SDK");
                pixelDomains.push("Facebook Pixel");
              }
              if (src.includes("hotjar.com")) {
                analytics.push("Hotjar");
              }
              if (src.includes("mixpanel.com")) {
                analytics.push("Mixpanel");
              }
              if (src.includes("hubspot")) {
                analytics.push("HubSpot");
              }
              if (src.includes("tiktok.com")) {
                pixelDomains.push("TikTok Pixel");
              }
            }
          }
        } catch (e) {}
      }

      const imgRegex = /<img\s+[^>]*src=["']([^"']+)["']/gi;
      while ((match = imgRegex.exec(html)) !== null) {
        const src = match[1];
        try {
          if (src.includes("facebook.com/tr") || src.includes("ads-twitter.com") || src.includes("doubleclick.net") || src.includes("googleadservices.com")) {
            const parsedSrc = new URL(src.startsWith("//") ? `https:${src}` : src);
            pixelDomains.push("Tracking Pixel (" + parsedSrc.hostname + ")");
            externalDomainsSet.add(parsedSrc.hostname);
          }
        } catch (e) {}
      }

      privacy.thirdPartyScripts = [...new Set(scriptDomains)].slice(0, 10);
      privacy.trackingPixels = [...new Set(pixelDomains)];
      privacy.analyticsTools = [...new Set(analytics)];
      privacy.externalDomains = [...externalDomainsSet].slice(0, 10);
    }
  } catch (err) {
    console.error("Privacy scanner helper error:", err.message);
  }

  return privacy;
}

function getHttpVersionAndCompression(url) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === "https:" ? https : http;
      const req = lib.request(url, { method: "HEAD", timeout: 2500 }, (res) => {
        resolve({
          version: `HTTP/${res.httpVersion}`,
          compression: res.headers["content-encoding"] || "None",
          keepAlive: res.headers["connection"]?.toLowerCase() === "keep-alive"
        });
        res.resume();
      });
      req.on("error", () => {
        resolve({ version: "Unable to Verify", compression: "Unable to Verify", keepAlive: false });
      });
      req.end();
    } catch {
      resolve({ version: "Unable to Verify", compression: "Unable to Verify", keepAlive: false });
    }
  });
}

function parseCookies(setCookieHeader, domain) {
  if (!setCookieHeader) return [];
  const cookiesList = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];
  
  return cookiesList.map(cookieStr => {
    const parts = cookieStr.split(";").map(p => p.trim());
    const firstPart = parts[0] || "";
    const eqIdx = firstPart.indexOf("=");
    const name = eqIdx !== -1 ? firstPart.substring(0, eqIdx) : firstPart;
    const value = eqIdx !== -1 ? firstPart.substring(eqIdx + 1) : "";
    
    const secure = parts.some(p => p.toLowerCase() === "secure");
    const httpOnly = parts.some(p => p.toLowerCase() === "httponly");
    
    let sameSite = "Lax";
    const sameSitePart = parts.find(p => p.toLowerCase().startsWith("samesite="));
    if (sameSitePart) {
      sameSite = sameSitePart.split("=")[1] || "Lax";
    }
    
    let maxAge = null;
    const maxAgePart = parts.find(p => p.toLowerCase().startsWith("max-age="));
    if (maxAgePart) {
      maxAge = parseInt(maxAgePart.split("=")[1]) || null;
    }
    
    let expires = "";
    const expiresPart = parts.find(p => p.toLowerCase().startsWith("expires="));
    if (expiresPart) {
      expires = expiresPart.split("=")[1] || "";
    }

    const hostPrefix = name.startsWith("__Host-");
    const securePrefix = name.startsWith("__Secure-");
    
    let risk = "None";
    if (!httpOnly && (name.toLowerCase().includes("sess") || name.toLowerCase().includes("token") || name.toLowerCase().includes("auth") || name.toLowerCase().includes("id"))) {
      risk = "High risk of session hijacking via XSS (missing HttpOnly flag)";
    } else if (!secure) {
      risk = "Cookie transmitted over unencrypted transit channels (missing Secure flag)";
    }

    return {
      name,
      value: value.length > 20 ? value.substring(0, 20) + "..." : value,
      domain: domain,
      path: "/",
      secure,
      httpOnly,
      sameSite,
      maxAge,
      expires,
      hostPrefix,
      securePrefix,
      risk
    };
  });
}

function parseCSP(cspValue) {
  const directives = {};
  if (!cspValue) return { unsafeInline: false, unsafeEval: false, strictDynamic: false, nonceUsage: false, hashUsage: false, reportUri: "", reportTo: "", directives };
  
  const parts = cspValue.split(";").map(p => p.trim()).filter(Boolean);
  parts.forEach(part => {
    const spaceIdx = part.indexOf(" ");
    const name = spaceIdx !== -1 ? part.substring(0, spaceIdx) : part;
    const values = spaceIdx !== -1 ? part.substring(spaceIdx + 1).split(" ").map(v => v.trim()).filter(Boolean) : [];
    directives[name] = values;
  });

  const scriptSrc = directives["script-src"] || directives["default-src"] || [];
  const unsafeInline = scriptSrc.includes("'unsafe-inline'");
  const unsafeEval = scriptSrc.includes("'unsafe-eval'");
  const strictDynamic = scriptSrc.includes("'strict-dynamic'");
  const nonceUsage = scriptSrc.some(s => s.startsWith("'nonce-"));
  const hashUsage = scriptSrc.some(s => s.startsWith("'sha256-") || s.startsWith("'sha384-") || s.startsWith("'sha512-"));
  
  const reportUri = directives["report-uri"] ? directives["report-uri"].join(" ") : "";
  const reportTo = directives["report-to"] ? directives["report-to"].join(" ") : "";
  
  return {
    unsafeInline,
    unsafeEval,
    strictDynamic,
    nonceUsage,
    hashUsage,
    reportUri,
    reportTo,
    directives
  };
}

function calculateCategoryScores({ headersObj, ssl, dns, cookiesParsed, paths, exposedServices, performanceMs }) {
  const analysis = analyzeHeaders(headersObj);
  const headers = analysis.score;

  let sslScore = null;
  if (ssl && ssl.expirationDate !== null) {
    sslScore = 100;
    if (!ssl.valid) sslScore = 0;
    else {
      if (ssl.daysRemaining < 30) sslScore -= 20;
      if (ssl.daysRemaining < 7) sslScore -= 30;
      if (ssl.keyLength < 2048) sslScore -= 15;
      if (ssl.tlsVersion === "TLSv1.0" || ssl.tlsVersion === "TLSv1.1") sslScore -= 30;
    }
    sslScore = Math.max(0, sslScore);
  }

  let dnsScore = null;
  if (dns && (dns.a?.length > 0 || dns.aaaa?.length > 0 || dns.mx?.length > 0 || dns.txt?.length > 0)) {
    dnsScore = 100;
    if (dns.spf && !dns.spf.valid) dnsScore -= 30;
    if (dns.dmarc && !dns.dmarc.valid) dnsScore -= 45;
    if (!dns.dnssec) dnsScore -= 15;
    if (dns.mx && dns.mx.length === 0) dnsScore -= 10;
    dnsScore = Math.max(0, dnsScore);
  }

  let cookiesScore = null;
  if (cookiesParsed && cookiesParsed.length > 0) {
    cookiesScore = 100;
    const insecure = cookiesParsed.filter(c => !c.secure);
    const nonHttpOnly = cookiesParsed.filter(c => !c.httpOnly);
    if (insecure.length > 0) cookiesScore -= 30;
    if (nonHttpOnly.length > 0) cookiesScore -= 50;
    cookiesScore = Math.max(0, cookiesScore);
  }

  let complianceScore = 100;
  const gdpr = (ssl && ssl.expirationDate !== null ? ssl.valid : true) && headersObj["strict-transport-security"] && headersObj["referrer-policy"];
  if (!gdpr) complianceScore -= 25;
  const pci = (ssl && ssl.expirationDate !== null ? ssl.valid : true) && headersObj["x-frame-options"] && headersObj["x-content-type-options"];
  if (!pci) complianceScore -= 25;
  const owasp = headersObj["content-security-policy"] && headersObj["x-frame-options"];
  if (!owasp) complianceScore -= 25;
  const nist = (ssl && ssl.expirationDate !== null ? ssl.valid : true) && headersObj["content-security-policy"];
  if (!nist) complianceScore -= 25;
  complianceScore = Math.max(0, complianceScore);

  let perfScore = 100;
  if (performanceMs > 2000) perfScore -= 40;
  else if (performanceMs > 1000) perfScore -= 20;
  else if (performanceMs > 500) perfScore -= 10;
  perfScore = Math.max(0, perfScore);

  let exposureScore = null;
  if (paths) {
    exposureScore = 100;
    const hasEnv = paths.sensitiveFiles?.some(f => f.path === "/.env" && f.exists);
    const hasGit = paths.sensitiveFiles?.some(f => f.path === "/.git/HEAD" && f.exists);
    if (hasEnv) exposureScore -= 50;
    if (hasGit) exposureScore -= 50;
    if (exposedServices) {
      const openPorts = exposedServices.filter(s => s.status === "open" && s.port !== 80 && s.port !== 443);
      exposureScore -= openPorts.length * 20;
    }
    exposureScore = Math.max(0, exposureScore);
  }

  return {
    headers,
    ssl: sslScore,
    dns: dnsScore,
    cookies: cookiesScore,
    compliance: complianceScore,
    performance: perfScore,
    exposure: exposureScore
  };
}

function compileEasmChecks({ ssl, dns, cookiesParsed, paths, exposedServices }) {
  const checks = [];

  if (ssl) {
    if (ssl.expirationDate !== null) {
      checks.push({
        id: "check-ssl-valid",
        category: "ssl-tls",
        title: "SSL/TLS Certificate Validity Audit",
        severity: "high",
        status: ssl.valid ? "passed" : "failed",
        description: "Verifies if the server SSL certificate is cryptographically valid and signed by a trusted root CA.",
        evidence: ssl.valid ? `Valid certificate issued by ${ssl.issuer}` : `Invalid certificate. Root CA untrusted or expired.`,
        whyItMatters: "Invalid certificates prompt severe browser warnings and break encrypted traffic tunnels.",
        recommendation: ssl.valid ? "Maintain certificate renewals." : "Install a valid TLS certificate from a trusted authority like Let's Encrypt.",
        references: ["https://letsencrypt.org/"]
      });

      checks.push({
        id: "check-ssl-expiry",
        category: "ssl-tls",
        title: "SSL/TLS Certificate Lifespan Inspection",
        severity: "medium",
        status: ssl.daysRemaining > 30 ? "passed" : ssl.daysRemaining > 7 ? "warning" : "failed",
        description: "Audits remaining certificate lifespan before expiry locks.",
        evidence: `Certificate expires in ${ssl.daysRemaining} days (Expiration: ${ssl.expirationDate}).`,
        whyItMatters: "Expired certificates will cause browsers to reject connection requests entirely.",
        recommendation: ssl.daysRemaining > 30 ? "None." : "Renew certificate immediately.",
        references: []
      });
    } else {
      checks.push({
        id: "check-ssl-valid",
        category: "ssl-tls",
        title: "SSL/TLS Certificate Validity Audit",
        severity: "high",
        status: "failed",
        description: "Verifies if the server SSL certificate is cryptographically valid and signed by a trusted root CA.",
        evidence: `SSL audit failed: ${ssl.failReason || "No certificate resolved."}`,
        whyItMatters: "Unable to verify secure transport setup due to connection or handshake errors.",
        recommendation: "Ensure port 443 is open and configured with a valid TLS certificate.",
        references: []
      });
    }
  }

  if (dns) {
    checks.push({
      id: "check-dns-spf",
      category: "dns",
      title: "SPF (Sender Policy Framework) Record Verification",
      severity: "medium",
      status: dns.spf?.valid ? "passed" : "failed",
      description: "Verifies SPF records in DNS TXT blocks to list valid email server IPs.",
      evidence: dns.spf?.valid ? `SPF record present: "${dns.spf.value}"` : "No valid SPF TXT record resolved.",
      whyItMatters: "Missing SPF records enable domain spoofing and phishing campaigns.",
      recommendation: dns.spf?.valid ? "Keep SPF configuration updated." : "Publish an SPF record detailing your authorized sending mail servers.",
      references: ["https://dmarc.org/"]
    });

    checks.push({
      id: "check-dns-dmarc",
      category: "dns",
      title: "DMARC (Domain-based Message Authentication) Alignment",
      severity: "high",
      status: dns.dmarc?.valid ? "passed" : "failed",
      description: "Verifies DMARC DNS policies setting rules on how spoofed emails are processed.",
      evidence: dns.dmarc?.valid ? `DMARC record present: "${dns.dmarc.value}"` : "No DMARC record found under _dmarc subdomain.",
      whyItMatters: "DMARC instructs mail servers to quarantine or reject spoofed mail, preventing brand abuse.",
      recommendation: dns.dmarc?.valid ? "None." : "Configure DMARC policy with quarantine or reject directives.",
      references: ["https://dmarc.org/"]
    });
  }

  if (exposedServices && exposedServices.length > 0) {
    const openPorts = exposedServices.filter(s => s.status === "open" && s.port !== 80 && s.port !== 443);
    checks.push({
      id: "check-port-exposure",
      category: "vulnerability",
      title: "Open Administrative Port/Service Discovery",
      severity: "high",
      status: openPorts.length === 0 ? "passed" : "failed",
      description: "Scans for open administrative or transfer ports (SSH/FTP/SMTP) exposed to public networks.",
      evidence: openPorts.length === 0 ? "No open administrative services detected." : `Detected open ports: ${openPorts.map(p => `${p.service} (${p.port})`).join(", ")}`,
      whyItMatters: "Exposing SSH or FTP interfaces invites automated brute-force attacks and stack exploits.",
      recommendation: openPorts.length === 0 ? "None." : "Close exposed administrative ports or restrict access using firewalls/VPN layers.",
      references: ["https://owasp.org/"]
    });
  }

  return checks;
}

// ==========================================================

export async function POST(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const rl = checkPublicRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. You can run up to ${PUBLIC_RATE_LIMIT.MAX} public scans per minute. Try again in ${Math.ceil(rl.retryAfter)} seconds.`,
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let rawUrl = "";
  try {
    const body = await request.json();
    rawUrl = body.url;
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return NextResponse.json({ error: "URL is required.", code: "MISSING_URL" }, { status: 400 });
  }

  let url, domain;
  try {
    url = normalizeUrl(rawUrl.trim());
    domain = extractDomain(url);
    new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL format.", code: "INVALID_URL" }, { status: 400 });
  }

  const privatePatterns = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+$/,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ];

  let isPrivate = privatePatterns.some((p) => p.test(domain));
  if (!isPrivate) {
    try {
      const lookupResult = await dns.promises.lookup(domain, { all: true });
      isPrivate = lookupResult.some(addr => 
        privatePatterns.some(pattern => pattern.test(addr.address))
      );
    } catch {
      // Ignore resolution errors; handled later in fetch headers
    }
  }

  if (isPrivate) {
    return NextResponse.json({ error: "Scanning private or local addresses is not allowed.", code: "PRIVATE_IP_BLOCKED" }, { status: 400 });
  }

  const startTime = Date.now();

  try {
    let headersObj = {}, statusCode = null;
    try {
      const result = await fetchHeadersPublic(url);
      headersObj = result.headersObj;
      statusCode = result.statusCode;
    } catch {
      return NextResponse.json(
        { error: `Unable to reach ${maskDomain(domain)}. Verify the URL is reachable.`, code: "CONNECTION_FAILED" },
        { status: 502 }
      );
    }

    // Run EASM checks concurrently
    let ssl = null;
    let dns = null;
    let infraTech = null;
    let paths = null;
    let exposedServices = [];
    let subdomains = [];
    let publicPages = [];
    let whois = null;

    const perfStart = Date.now();
    try {
      dns = await scanDNS(url);
      const [sslResult, infraTechResult, pathResult, servicesResult, subdomainsResult, publicPagesResult, whoisResult] = await Promise.all([
        scanSSL(url),
        scanInfraAndTech(url, dns, headersObj),
        scanPaths(url),
        checkExposedServices(url),
        checkSubdomains(url),
        discoverPublicPages(url),
        scanWhois(url)
      ]);

      ssl = sslResult;
      infraTech = infraTechResult;
      paths = pathResult;
      exposedServices = servicesResult;
      subdomains = subdomainsResult;
      publicPages = publicPagesResult;
      whois = whoisResult;
    } catch (err) {
      console.error("[Public scan EASM subprocess failed]", err);
    }

    const performanceMs = Date.now() - perfStart;

    const httpInfo = await getHttpVersionAndCompression(url);
    const privacyDetails = await parsePrivacyDetails(url);
    const cookiesParsed = parseCookies(headersObj["set-cookie"], domain);
    const cspParsed = parseCSP(headersObj["content-security-policy"]);

    const categoryScores = calculateCategoryScores({
      headersObj,
      ssl,
      dns,
      cookiesParsed,
      paths,
      exposedServices,
      performanceMs
    });

    let totalWeight = 0;
    let weightedSum = 0;
    
    if (categoryScores.headers !== null) {
      weightedSum += categoryScores.headers * 25;
      totalWeight += 25;
    }
    if (categoryScores.ssl !== null) {
      weightedSum += categoryScores.ssl * 20;
      totalWeight += 20;
    }
    if (categoryScores.dns !== null) {
      weightedSum += categoryScores.dns * 15;
      totalWeight += 15;
    }
    if (categoryScores.cookies !== null) {
      weightedSum += categoryScores.cookies * 15;
      totalWeight += 15;
    }
    if (categoryScores.compliance !== null) {
      weightedSum += categoryScores.compliance * 10;
      totalWeight += 10;
    }
    if (categoryScores.performance !== null) {
      weightedSum += categoryScores.performance * 5;
      totalWeight += 5;
    }
    if (categoryScores.exposure !== null) {
      weightedSum += categoryScores.exposure * 10;
      totalWeight += 10;
    }
    
    const finalScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
    const grade = scoreToGrade(finalScore);

    const analysis = analyzeHeaders(headersObj);
    const recommendations = generateRecommendations(analysis);
    const securityAudit = runSecurityAudit(headersObj, url, statusCode);

    const easmChecks = compileEasmChecks({
      ssl,
      dns,
      cookiesParsed,
      paths,
      exposedServices
    });
    
    const combinedChecks = [...securityAudit.checks, ...easmChecks];

    const aiAdviceScanData = {
      checks: combinedChecks,
      headers: analysis.headers,
      ssl,
      dns,
      cookies: cookiesParsed,
      sensitiveFiles: paths ? paths.sensitiveFiles : []
    };
    const aiAdvice = generateAIAdvice(aiAdviceScanData);

    // Trigger admin alert when a guest executes a public scan
    try {
      const { createNotification } = await import("@/lib/notificationService");
      await createNotification({
        recipientRole: "admin",
        title: "Guest Public Scan",
        message: `A public scan was executed on ${domain}. Score: ${finalScore} (${grade}).`,
        type: "info"
      });
    } catch (notifErr) {
      console.error("Failed to trigger public scan admin notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      isPublicScan: true,
      url,
      domain,
      maskedDomain: maskDomain(domain),
      score: finalScore,
      grade,
      statusCode,
      isFirewallProtected: statusCode === 403 || statusCode === 401,
      scanDuration: Date.now() - startTime,
      headers: analysis.headers,
      vulnerabilities: securityAudit.vulnerabilities,
      checks: combinedChecks,
      summary: analysis.summary,
      recommendations: recommendations.slice(0, 8),
      compliance: securityAudit.compliance,
      ssl,
      dns,
      infrastructure: infraTech ? infraTech.infra : null,
      techStack: infraTech ? infraTech.techStack : [],
      cookies: cookiesParsed,
      deepCsp: cspParsed,
      httpProtocol: {
        version: httpInfo.version,
        http2: httpInfo.version.includes("2") || httpInfo.version.includes("3"),
        http3: httpInfo.version.includes("3"),
        quic: false,
        compression: httpInfo.compression,
        keepAlive: httpInfo.keepAlive,
        redirectChain: [url]
      },
      performance: {
        dnsLookup: dns?.resolveTime || null,
        tlsHandshake: ssl?.handshakeMs || null,
        ttfb: null,
        responseTime: performanceMs,
        redirectTime: null,
        totalTime: performanceMs
      },
      robotsTxt: paths ? paths.robotsTxt : null,
      sitemapXml: paths ? paths.sitemapXml : null,
      sensitiveFiles: paths ? paths.sensitiveFiles : [],
      securityTxt: paths ? paths.securityTxt : null,
      seo: (paths && paths.seo) ? paths.seo : {
        canonicalUrl: "",
        metaRobots: "",
        isIndexable: true,
        title: "",
        description: "",
        h1Count: 0,
        h2Count: 0,
        imageCount: 0,
        imageAltCount: 0,
        openGraph: { title: "", description: "", image: "", type: "", url: "" },
        twitterCard: { card: "", title: "", description: "", image: "", site: "" }
      },
      emailSecurity: {
        score: dns ? (
          (dns.spf?.valid ? 20 : 0) +
          (dns.dmarc?.valid ? 20 : 0) +
          (dns.dkim?.found ? 20 : 0) +
          (dns.mtaSts?.valid ? 20 : 0) +
          (dns.tlsRpt?.valid ? 20 : 0)
        ) : 0,
        spfPresent: dns ? !!dns.spf?.valid : false,
        dmarcPresent: dns ? !!dns.dmarc?.valid : false,
        dkimPresent: dns ? !!dns.dkim?.found : false,
        bimiPresent: dns ? !!dns.bimi?.valid : false,
        mtaStsPresent: dns ? !!dns.mtaSts?.valid : false,
        tlsRptPresent: dns ? !!dns.tlsRpt?.valid : false
      },
      privacy: privacyDetails,
      subdomains,
      publicPages,
      exposedServices,
      loginSurfaces: paths ? paths.loginSurfaces : [],
      benchmarks: null,
      whois,
      categoryScores,
      aiAdvice,
      metadata: {
        timestamp: new Date().toISOString(),
        scansRemainingThisHour: rl.remaining,
      },
    });
  } catch (error) {
    console.error("[Public Scan Error]", error);
    return NextResponse.json({ error: "An unexpected error occurred during the scan.", code: "SCAN_ERROR" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "POST /api/scan/public",
    description: "Public security header scan — no authentication required.",
    rateLimit: `${PUBLIC_RATE_LIMIT.MAX} scans per minute per IP`,
    body: { url: "https://example.com" },
    returns: ["score", "grade", "headers", "ssl", "dns", "checks", "vulnerabilities", "compliance", "privacy", "subdomains", "publicPages", "exposedServices", "loginSurfaces", "benchmarks"],
    note: "Results are not saved to database. Sign up for full EASM scanning.",
  });
}
