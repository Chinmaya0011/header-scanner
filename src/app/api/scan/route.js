import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";
import { checkRateLimitDB } from "@/lib/rateLimit";
import {
  analyzeHeaders,
  maskDomain,
  normalizeUrl,
  extractDomain,
  generateRecommendations,
  runSecurityAudit,
} from "@/lib/analyzer";

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
  try {
    const bodyCopy = await request.clone().json();
    rawUrl = bodyCopy.url;
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

  const limit = user.dailyLimit !== undefined ? user.dailyLimit : 20;

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

    // Security: Block private IPs and localhost
    if (isPrivateIP(domain)) {
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

    const scanDuration = Date.now() - startTime;

    // Analyze headers with enhanced analyzer
    const analysis = analyzeHeaders(headersObj);
    const recommendations = generateRecommendations(analysis);
    const securityAudit = runSecurityAudit(headersObj, url, statusCode);
    
    const maskedDomain = maskDomain(domain);

    // Save to database
    await connectDB();

    const scan = await Scan.create({
      url,
      domain,
      maskedDomain,
      score: analysis.score,
      grade: analysis.grade,
      headers: analysis.headers,
      vulnerabilities: securityAudit.vulnerabilities,
      checks: securityAudit.checks,
      statusCode,
      scanDuration,
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
    console.log(`[${requestId}] Scan completed for ${domain} | Score: ${analysis.score} | Grade: ${analysis.grade} | Duration: ${scanDuration}ms`);

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
      score: analysis.score,
      grade: analysis.grade,
      headers: analysis.headers,
      vulnerabilities: securityAudit.vulnerabilities,
      statusCode,
      scanDuration,
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
      }
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