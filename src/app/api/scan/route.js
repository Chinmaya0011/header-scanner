import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";
import { checkRateLimitDB } from "@/lib/rateLimit";
import https from "https";
import http from "http";
import {
  analyzeHeaders,
  maskDomain,
  normalizeUrl,
  extractDomain,
  generateRecommendations,
  runSecurityAudit,
} from "@/lib/analyzer";

// EASM scanner imports
import { scanSSL } from "@/lib/scanners/sslScanner";
import { scanDNS } from "@/lib/scanners/dnsScanner";
import { scanInfraAndTech } from "@/lib/scanners/infraTechScanner";
import { scanPaths, checkExposedServices, checkSubdomains } from "@/lib/scanners/networkScanner";
import { generateAIAdvice } from "@/lib/aiAssistant";

// Configuration constants
const SCAN_CONFIG = {
  TIMEOUT_MS: 10000,
  USER_AGENT: "HeaderGuard-Scanner/2.0 (+https://github.com/headerguard)",
  MAX_REDIRECTS: 5,
  MIN_SECURITY_HEADERS: [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options"
  ],
};

const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 10, // 10 requests per minute
};

/**
 * Validate private IP addresses
 */
function isPrivateIP(domain) {
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
  
  return privatePatterns.some(pattern => pattern.test(domain));
}

/**
 * Fetch headers with fallback strategy
 */
async function fetchHeaders(url, domain, customUserAgent) {
  let headersObj = {};
  let statusCode = null;
  let methodUsed = "HEAD";
  const userAgentToUse = customUserAgent || SCAN_CONFIG.USER_AGENT;
  
  try {
    // First attempt: HEAD request
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(SCAN_CONFIG.TIMEOUT_MS),
      headers: {
        "User-Agent": userAgentToUse,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    statusCode = headRes.status;
    headRes.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });
    methodUsed = "HEAD";

    // Check if we got security headers
    const hasSecurityHeaders = SCAN_CONFIG.MIN_SECURITY_HEADERS.some(header => 
      headersObj[header]
    );

    // Fallback to GET if security headers are missing
    if (!hasSecurityHeaders && statusCode !== 405) {
      console.log(`HEAD request didn't return security headers for ${domain}, falling back to GET`);
      
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(SCAN_CONFIG.TIMEOUT_MS),
        headers: {
          "User-Agent": userAgentToUse,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });
      
      statusCode = getRes.status;
      getRes.headers.forEach((value, key) => {
        headersObj[key.toLowerCase()] = value;
      });
      methodUsed = "GET";
    }
  } catch (error) {
    throw new Error(`Failed to fetch headers: ${error.message}`);
  }
  
  return { headersObj, statusCode, methodUsed };
}

async function logFailedScan(user, url, domain, reason, statusCode) {
  if (user) {
    try {
      await connectDB();
      await Scan.create({
        url: url || "unknown",
        domain: domain || "unknown",
        maskedDomain: domain ? maskDomain(domain) : "unknown",
        score: 0,
        grade: "F",
        statusCode: statusCode || 400,
        owner: user._id,
        source: user.authMethod === "api-key" ? "api" : "web",
        apiKeyId: user.authMethod === "api-key" ? user.apiKeyId : null,
        isSuccess: false,
        failReason: reason,
      });
    } catch (err) {
      console.error("Failed to log scan failure:", err);
    }
  }
}

/**
 * POST /api/scan
 * Scan a website for security headers
 */
export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { 
        error: "Authentication required. Please log in to perform scans.",
        code: "UNAUTHORIZED"
      },
      { status: 401 }
    );
  }

  // Admin access disable block
  if (user.apiAccessEnabled === false) {
    return NextResponse.json(
      {
        error: "Your API access has been disabled by an administrator.",
        code: "API_ACCESS_DISABLED"
      },
      { status: 403 }
    );
  }

  // Parse request body safely (clone request to read it)
  let rawUrl = "";
  let section = "all";
  try {
    const bodyCopy = await request.clone().json();
    rawUrl = bodyCopy.url;
    section = bodyCopy.section || "all";
  } catch (err) {
    // Handled below
  }

  // Daily Usage Reset & Limit check
  const now = new Date();
  const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date();
  const isDifferentDay = now.getUTCFullYear() !== lastReset.getUTCFullYear() ||
                         now.getUTCMonth() !== lastReset.getUTCMonth() ||
                         now.getUTCDate() !== lastReset.getUTCDate();

  let currentUsage = user.dailyUsage || 0;
  if (isDifferentDay) {
    currentUsage = 0;
  }

  const limit = user.role === "admin" 
    ? (user.dailyLimit === 20 || user.dailyLimit === undefined ? 27 : user.dailyLimit)
    : (user.dailyLimit !== undefined ? user.dailyLimit : 20);

  if (currentUsage >= limit) {
    const reqUrl = rawUrl || "unknown";
    const reqDomain = reqUrl !== "unknown" ? extractDomain(normalizeUrl(reqUrl)) : "unknown";
    await logFailedScan(user, reqUrl, reqDomain, "Daily API request limit exceeded.", 429);

    return NextResponse.json(
      {
        error: `Daily API request limit exceeded (${limit} requests allowed per day).`,
        code: "QUOTA_EXCEEDED"
      },
      { 
        status: 429,
        headers: {
          "Retry-After": "86400"
        }
      }
    );
  }

  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    // Input validation
    if (!rawUrl || typeof rawUrl !== "string") {
      return NextResponse.json(
        { 
          error: "URL is required.",
          code: "MISSING_URL"
        },
        { status: 400 }
      );
    }

    const trimmed = rawUrl.trim();
    if (trimmed.length === 0) {
      return NextResponse.json(
        { 
          error: "URL cannot be empty.",
          code: "EMPTY_URL"
        },
        { status: 400 }
      );
    }

    // Normalize URL
    const url = normalizeUrl(trimmed);
    
    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { 
          error: "Invalid URL format. Please enter a valid domain or URL (e.g., example.com or https://example.com).",
          code: "INVALID_URL"
        },
        { status: 400 }
      );
    }

    const domain = extractDomain(url);

    // Enforce Domain Ownership Verification
    const cleanDomain = domain.toLowerCase();
    const isLocalhost = cleanDomain === "localhost" || cleanDomain === "127.0.0.1" || cleanDomain.startsWith("192.168.");
    const isAdmin = user && user.role === "admin";
    const bypassVerification = process.env.BYPASS_VERIFICATION === "true";

    if (!isLocalhost && !isAdmin && !bypassVerification) {
      const AssetVerification = (await import("@/lib/models/AssetVerification")).default;
      await connectDB();
      const verification = await AssetVerification.findOne({ domain: cleanDomain, owner: user._id, verified: true });
      if (!verification) {
        return NextResponse.json(
          {
            error: `Domain "${domain}" is not verified. You must complete domain ownership verification before scanning.`,
            code: "UNVERIFIED_DOMAIN",
            domain: cleanDomain
          },
          { status: 403 }
        );
      }
    }

    // Security: Block private IPs and localhost
    if (isPrivateIP(domain) && !isLocalhost) {
      await logFailedScan(user, url, domain, "Scanning private/local addresses is not allowed.", 400);
      return NextResponse.json(
        { 
          error: "Scanning private/local addresses is not allowed for security reasons.",
          code: "PRIVATE_IP_BLOCKED",
          domain: maskDomain(domain)
        },
        { status: 400 }
      );
    }

    // Check Allowed Domains lock for Developer API keys
    if (user && user.authMethod === "api-key" && user.allowedDomains) {
      const allowed = user.allowedDomains
        .split(",")
        .map(d => d.trim().toLowerCase())
        .filter(Boolean);
        
      if (allowed.length > 0) {
        const isAllowed = allowed.some(allowedDomain => 
          domain === allowedDomain || domain.endsWith("." + allowedDomain)
        );
        if (!isAllowed) {
          await logFailedScan(user, url, domain, `Domain lock constraint violation. Allowed: ${user.allowedDomains}`, 403);
          return NextResponse.json(
            {
              error: `Scanned domain "${domain}" is not authorized by this API key. Allowed domains: ${user.allowedDomains}`,
              code: "DOMAIN_RESTRICTED"
            },
            { status: 403 }
          );
        }
      }
    }

    // Database-backed sliding window rate limiting
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    
    const rateLimitKey = user ? user._id.toString() : clientIp;
    const rateLimitStatus = await checkRateLimitDB(rateLimitKey, "scan", RATE_LIMIT.MAX_REQUESTS, RATE_LIMIT.WINDOW_MS);
    
    if (!rateLimitStatus.success) {
      await logFailedScan(user, url, domain, "Sliding-window IP rate limit exceeded.", 429);
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before scanning again.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: RATE_LIMIT.WINDOW_MS / 1000
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(RATE_LIMIT.WINDOW_MS / 1000),
          }
        }
      );
    }

    console.log(`[${requestId}] Starting scan for: ${domain}`);

    // Fetch previous scan to use as fallback if running selective scan
    let prevScan = null;
    if (section && section !== "all") {
      await connectDB();
      prevScan = await Scan.findOne({ domain: cleanDomain, owner: user._id, isSuccess: true }).sort({ createdAt: -1 });
    }

    // Fetch headers
    let headersObj, statusCode, methodUsed;
    try {
      const customUA = user?.authMethod === "api-key" ? user.customUserAgent : null;
      const result = await fetchHeaders(url, domain, customUA);
      headersObj = result.headersObj;
      statusCode = result.statusCode;
      methodUsed = result.methodUsed;
    } catch (fetchError) {
      if (fetchError.message.includes("Timeout")) {
        await logFailedScan(user, url, domain, "Request timed out.", 504);
        return NextResponse.json(
          { 
            error: "Request timed out. The server may be slow or unreachable.",
            code: "TIMEOUT",
            domain: maskDomain(domain)
          },
          { status: 504 }
        );
      }
      
      await logFailedScan(user, url, domain, `Connection failed: ${fetchError.message}`, 502);
      return NextResponse.json(
        {
          error: `Unable to reach ${maskDomain(domain)}. Please verify the URL and try again.`,
          code: "CONNECTION_FAILED",
          details: process.env.NODE_ENV === "development" ? fetchError.message : undefined,
        },
        { status: 502 }
      );
    }

    const maskedDomain = maskDomain(domain);

    // EASM Scanning calls concurrently or selectively
    let ssl = prevScan ? prevScan.ssl : null;
    let dns = prevScan ? prevScan.dns : null;
    let infraTech = prevScan ? { infra: prevScan.infrastructure, techStack: prevScan.techStack } : null;
    let paths = prevScan ? { 
      seo: prevScan.seo, 
      robotsTxt: prevScan.robotsTxt, 
      sitemapXml: prevScan.sitemapXml, 
      securityTxt: prevScan.securityTxt,
      sensitiveFiles: prevScan.sensitiveFiles,
      loginSurfaces: prevScan.loginSurfaces
    } : null;
    let exposedServices = prevScan ? prevScan.exposedServices : [];
    let subdomains = prevScan ? prevScan.subdomains : [];

    const perfStart = Date.now();
    try {
      if (section === "all" || !prevScan) {
        // Run all checks in parallel
        dns = await scanDNS(url);
        const [sslResult, infraTechResult, pathResult, servicesResult, subdomainsResult] = await Promise.all([
          scanSSL(url),
          scanInfraAndTech(url, dns, headersObj),
          scanPaths(url),
          checkExposedServices(url),
          checkSubdomains(url)
        ]);

        ssl = sslResult;
        infraTech = infraTechResult;
        paths = pathResult;
        exposedServices = servicesResult;
        subdomains = subdomainsResult;
      } else {
        // Selective scan runs
        if (section === "dns") {
          dns = await scanDNS(url);
        } else if (section === "ssl") {
          ssl = await scanSSL(url);
        } else if (section === "seo") {
          paths = await scanPaths(url);
        } else if (section === "ports") {
          exposedServices = await checkExposedServices(url);
        } else if (section === "subdomains") {
          subdomains = await checkSubdomains(url);
        }
        
        // Always run infraTech if it wasn't cloned or if we scanned DNS
        if (!infraTech || section === "dns") {
          infraTech = await scanInfraAndTech(url, dns, headersObj);
        }
      }
    } catch (err) {
      console.error("EASM scan failed, building synthetic fallbacks:", err);
    }

    const performanceMs = Date.now() - perfStart;

    // Detect HTTP protocol version and compression parameters dynamically
    const httpInfo = await getHttpVersionAndCompression(url);
    const privacyDetails = await parsePrivacyDetails(url);

    // Cookie and CSP parsers
    const cookiesParsed = parseCookies(headersObj["set-cookie"], domain);
    const cspParsed = parseCSP(headersObj["content-security-policy"]);

    // Calculate category scores
    const categoryScores = calculateCategoryScores({
      headersObj,
      ssl,
      dns,
      cookiesParsed,
      paths,
      exposedServices,
      performanceMs
    });

    // Dynamic Weighted Overall Score normalization
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

    // Analyze headers with enhanced analyzer
    const analysis = analyzeHeaders(headersObj);
    const recommendations = generateRecommendations(analysis);
    const securityAudit = runSecurityAudit(headersObj, url, statusCode);

    // Populate extra EASM check validations into securityAudit checks
    const easmChecks = compileEasmChecks({
      ssl,
      dns,
      cookiesParsed,
      paths,
      exposedServices
    });
    
    const combinedChecks = [...securityAudit.checks, ...easmChecks];

    // AI Remediation advices
    const aiAdviceScanData = {
      checks: combinedChecks,
      headers: analysis.headers,
      ssl,
      dns,
      cookies: cookiesParsed,
      sensitiveFiles: paths ? paths.sensitiveFiles : []
    };
    const aiAdvice = generateAIAdvice(aiAdviceScanData);

    // Save to database
    await connectDB();

    const scan = await Scan.create({
      url,
      domain,
      maskedDomain,
      score: finalScore,
      grade: grade,
      headers: analysis.headers,
      vulnerabilities: securityAudit.vulnerabilities,
      checks: combinedChecks,
      statusCode,
      scanDuration: Date.now() - startTime,
      summary: analysis.summary,
      owner: user._id,
      source: user?.authMethod === "api-key" ? "api" : "web",
      apiKeyId: user?.authMethod === "api-key" ? user.apiKeyId : null,
      isSuccess: true,
      metadata: {
        ...analysis.metadata,
        methodUsed,
        requestId,
        userAgent: (user?.authMethod === "api-key" && user.customUserAgent) ? user.customUserAgent : SCAN_CONFIG.USER_AGENT,
        timestamp: new Date().toISOString(),
      },
      recommendations: recommendations.map(rec => ({
        header: rec.name,
        severity: rec.severity,
        recommendation: rec.recommendation,
        expectedFormat: rec.expectedFormat,
        reference: rec.reference,
      })),
      compliance: securityAudit.compliance,

      // EASM Extensions
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
      exposedServices,
      loginSurfaces: paths ? paths.loginSurfaces : [],
      benchmarks: null,
      categoryScores
    });

    // Increment daily usage in database for user
    const User = (await import("@/lib/models/User")).default; // dynamically import to avoid circular dependencies
    await User.updateOne(
      { _id: user._id },
      { 
        $set: { 
          dailyUsage: isDifferentDay ? 1 : currentUsage + 1,
          lastUsageReset: isDifferentDay ? now : lastReset
        } 
      }
    );

    // Log successful scan
    console.log(`[${requestId}] Scan completed for ${domain} | Score: ${finalScore} | Grade: ${grade} | Duration: ${Date.now() - startTime}ms`);

    // Trigger Webhook asynchronously if configured
    if (user?.authMethod === "api-key" && user.webhookUrl) {
      const webhookPayload = {
        event: "scan.completed",
        timestamp: new Date().toISOString(),
        scanId: scan._id.toString(),
        url: scan.url,
        domain: scan.domain,
        score: scan.score,
        grade: scan.grade,
        summary: scan.summary,
        vulnerabilitiesCount: scan.vulnerabilities?.length || 0,
        compliance: scan.compliance,
        shareUrl: `${request.nextUrl.origin}/share/${scan._id.toString()}`
      };
      
      console.log(`Firing webhook to: ${user.webhookUrl}`);
      fetch(user.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "HeaderGuard-Webhook/2.0"
        },
        body: JSON.stringify(webhookPayload)
      })
      .then(res => {
        console.log(`Webhook responded with status: ${res.status}`);
      })
      .catch(err => {
        console.error(`Webhook delivery failed:`, err.message);
      });
    }

    // Return response
    return NextResponse.json({
      success: true,
      scanId: scan._id.toString(),
      url,
      domain,
      maskedDomain,
      score: finalScore,
      grade: grade,
      headers: analysis.headers,
      vulnerabilities: securityAudit.vulnerabilities,
      statusCode,
      scanDuration: Date.now() - startTime,
      summary: analysis.summary,
      recommendations: recommendations.slice(0, 5), // Top 5 priorities
      compliance: securityAudit.compliance,
      metadata: {
        timestamp: scan.createdAt,
        methodUsed,
        totalHeadersChecked: analysis.metadata.totalHeadersChecked,
      },
      shareUrl: `/share/${scan._id.toString()}`,
      links: {
        self: `/api/scan/${scan._id.toString()}`,
        share: `/share/${scan._id.toString()}`
      },
      
      // EASM extra return fields for real-time frontend
      ssl,
      dns,
      infrastructure: infraTech ? infraTech.infra : null,
      techStack: infraTech ? infraTech.techStack : [],
      cookies: cookiesParsed,
      deepCsp: cspParsed,
      httpProtocol: scan.httpProtocol,
      performance: scan.performance,
      robotsTxt: scan.robotsTxt,
      sitemapXml: scan.sitemapXml,
      sensitiveFiles: scan.sensitiveFiles,
      securityTxt: scan.securityTxt,
      emailSecurity: scan.emailSecurity,
      privacy: scan.privacy,
      subdomains,
      exposedServices,
      loginSurfaces: scan.loginSurfaces,
      benchmarks: scan.benchmarks,
      categoryScores,
      aiAdvice
    });
    
  } catch (error) {
    console.error(`[${requestId}] Scan error:`, error);
    
    // Differentiate between database and other errors
    if (error.name === "MongoError" || error.name === "MongooseError") {
      return NextResponse.json(
        { 
          error: "Database error. Please try again later.",
          code: "DATABASE_ERROR"
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "An unexpected error occurred. Please try again.",
        code: "INTERNAL_ERROR",
        reference: requestId,
      },
      { status: 500 }
    );
  }
}

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
      
      // 1. Privacy policy detection
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

      // 2. Cookie consent banner detection
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

      // 3. Third-party scripts, tracking pixels, analytics
      const scriptDomains = [];
      const pixelDomains = [];
      const analytics = [];
      const externalDomainsSet = new Set();
      
      // Extract script src attributes
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

      // Check img elements for tracking pixels
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

// ========== LOCAL HELPER PARSERS & SCORERS FOR EASM ==========

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
  // 1. Headers score
  const analysis = analyzeHeaders(headersObj);
  const headers = analysis.score;

  // 2. SSL score
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

  // 3. DNS score
  let dnsScore = null;
  if (dns && (dns.a?.length > 0 || dns.aaaa?.length > 0 || dns.mx?.length > 0 || dns.txt?.length > 0)) {
    dnsScore = 100;
    if (dns.spf && !dns.spf.valid) dnsScore -= 30;
    if (dns.dmarc && !dns.dmarc.valid) dnsScore -= 45;
    if (!dns.dnssec) dnsScore -= 15;
    if (dns.mx && dns.mx.length === 0) dnsScore -= 10;
    dnsScore = Math.max(0, dnsScore);
  }

  // 4. Cookies score
  let cookiesScore = null;
  if (cookiesParsed && cookiesParsed.length > 0) {
    cookiesScore = 100;
    const insecure = cookiesParsed.filter(c => !c.secure);
    const nonHttpOnly = cookiesParsed.filter(c => !c.httpOnly);
    if (insecure.length > 0) cookiesScore -= 30;
    if (nonHttpOnly.length > 0) cookiesScore -= 50;
    cookiesScore = Math.max(0, cookiesScore);
  }

  // 5. Compliance score
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

  // 6. Performance score
  let perfScore = 100;
  if (performanceMs > 2000) perfScore -= 40;
  else if (performanceMs > 1000) perfScore -= 20;
  else if (performanceMs > 500) perfScore -= 10;
  perfScore = Math.max(0, perfScore);

  // 7. Exposure score
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

  // SSL Checks
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

  // DNS Checks
  if (dns) {
    checks.push({
      id: "check-dns-spf",
      category: "dns",
      title: "SPF (Sender Policy Framework) Record Verification",
      severity: "medium",
      status: dns.spf.valid ? "passed" : "failed",
      description: "Verifies SPF records in DNS TXT blocks to list valid email server IPs.",
      evidence: dns.spf.valid ? `SPF record present: "${dns.spf.value}"` : "No valid SPF TXT record resolved.",
      whyItMatters: "Missing SPF records enable domain spoofing and phishing campaigns.",
      recommendation: dns.spf.valid ? "Keep SPF configuration updated." : "Publish an SPF record detailing your authorized sending mail servers.",
      references: ["https://dmarc.org/"]
    });

    checks.push({
      id: "check-dns-dmarc",
      category: "dns",
      title: "DMARC (Domain-based Message Authentication) Alignment",
      severity: "high",
      status: dns.dmarc.valid ? "passed" : "failed",
      description: "Verifies DMARC DNS policies setting rules on how spoofed emails are processed.",
      evidence: dns.dmarc.valid ? `DMARC record present: "${dns.dmarc.value}"` : "No DMARC record found under _dmarc subdomain.",
      whyItMatters: "DMARC instructs mail servers to quarantine or reject spoofed mail, preventing brand abuse.",
      recommendation: dns.dmarc.valid ? "None." : "Configure DMARC policy with quarantine or reject directives.",
      references: ["https://dmarc.org/"]
    });
  }

  // Exposed services
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

// OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}