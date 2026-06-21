import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";
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

// Rate limiting configuration (optional - implement with Redis or database)
const RATE_LIMIT = {
  WINDOW_MS: 60 * 1000, // 1 minute
  MAX_REQUESTS: 10, // 10 requests per minute per IP
};

// In-memory rate limiting (for demo, use Redis in production)
const rateLimitStore = new Map();

/**
 * Rate limiting check
 */
function checkRateLimit(ip) {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT.WINDOW_MS;
  
  const requests = rateLimitStore.get(ip) || [];
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (recentRequests.length >= RATE_LIMIT.MAX_REQUESTS) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitStore.set(ip, recentRequests);
  
  // Clean up old entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean
    for (const [storedIp, timestamps] of rateLimitStore.entries()) {
      const validTimestamps = timestamps.filter(t => t > now - RATE_LIMIT.WINDOW_MS);
      if (validTimestamps.length === 0) {
        rateLimitStore.delete(storedIp);
      } else {
        rateLimitStore.set(storedIp, validTimestamps);
      }
    }
  }
  
  return true;
}

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
async function fetchHeaders(url, domain) {
  let headersObj = {};
  let statusCode = null;
  let methodUsed = "HEAD";
  
  try {
    // First attempt: HEAD request
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(SCAN_CONFIG.TIMEOUT_MS),
      headers: {
        "User-Agent": SCAN_CONFIG.USER_AGENT,
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
          "User-Agent": SCAN_CONFIG.USER_AGENT,
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
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();
  
  try {
    // Parse request body
    const { url: rawUrl } = await request.json();

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
      return NextResponse.json(
        { 
          error: "Scanning private/local addresses is not allowed for security reasons.",
          code: "PRIVATE_IP_BLOCKED",
          domain: maskDomain(domain)
        },
        { status: 400 }
      );
    }

    // Optional: Rate limiting (get client IP from headers)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor ? forwardedFor.split(",")[0] : "unknown";
    
    if (!checkRateLimit(clientIp)) {
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
      const result = await fetchHeaders(url, domain);
      headersObj = result.headersObj;
      statusCode = result.statusCode;
      methodUsed = result.methodUsed;
    } catch (fetchError) {
      if (fetchError.message.includes("Timeout")) {
        return NextResponse.json(
          { 
            error: "Request timed out. The server may be slow or unreachable.",
            code: "TIMEOUT",
            domain: maskDomain(domain)
          },
          { status: 504 }
        );
      }
      
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
    const securityAudit = runSecurityAudit(headersObj);
    
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
      statusCode,
      scanDuration,
      summary: analysis.summary,
      owner: user._id,
      metadata: {
        ...analysis.metadata,
        methodUsed,
        requestId,
        userAgent: SCAN_CONFIG.USER_AGENT,
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

    // Log successful scan
    console.log(`[${requestId}] Scan completed for ${domain} | Score: ${analysis.score} | Grade: ${analysis.grade} | Duration: ${scanDuration}ms`);

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