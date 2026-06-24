import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SiteStats from "@/lib/models/SiteStats";
import {
  analyzeHeaders,
  normalizeUrl,
  extractDomain,
  generateRecommendations,
} from "@/lib/analyzer";

// Basic IP rate limiting in memory (resets on server restart)
// For production you'd use Redis; this is lightweight and sufficient for demo
const ipRequestMap = new Map();
const PUBLIC_RATE_LIMIT = 5;        // max 5 scans
const PUBLIC_RATE_WINDOW = 60_000;  // per 1 minute

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipRequestMap.get(ip);

  if (!entry || now - entry.windowStart > PUBLIC_RATE_WINDOW) {
    ipRequestMap.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (entry.count >= PUBLIC_RATE_LIMIT) {
    return true;
  }

  entry.count += 1;
  return false;
}

const SCAN_TIMEOUT_MS = 10_000;
const USER_AGENT = "HeaderGuard-PublicScanner/1.0";

/**
 * Fetch HTTP response headers for a URL (HEAD → GET fallback).
 */
async function fetchHeaders(url) {
  let headersObj = {};
  let statusCode = null;

  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(SCAN_TIMEOUT_MS),
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
    });
    statusCode = headRes.status;
    headRes.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });

    // Fallback to GET if HEAD gives no useful headers
    const hasMinHeaders = ["content-security-policy", "strict-transport-security", "x-frame-options"]
      .some(h => headersObj[h]);

    if (!hasMinHeaders && statusCode !== 405) {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(SCAN_TIMEOUT_MS),
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*" },
      });
      statusCode = getRes.status;
      getRes.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });
    }
  } catch (err) {
    throw new Error(err.message || "Connection failed");
  }

  return { headersObj, statusCode };
}

/**
 * Convert numeric score to letter grade.
 */
function scoreToGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

/**
 * POST /api/public-scan
 * No authentication, no domain verification required.
 * Returns basic header scan results only.
 */
export async function POST(request) {
  // Resolve client IP
  const forwarded = request.headers.get("x-forwarded-for");
  const clientIp = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  // IP-based rate limit
  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. You can run up to 5 public scans per minute. Sign up for unlimited scans.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  // Parse body
  let rawUrl = "";
  try {
    const body = await request.json();
    rawUrl = body.url || "";
  } catch {
    return NextResponse.json({ error: "Invalid request body.", code: "BAD_REQUEST" }, { status: 400 });
  }

  if (!rawUrl || typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return NextResponse.json({ error: "URL is required.", code: "MISSING_URL" }, { status: 400 });
  }

  // Normalize + validate URL
  let url;
  let domain;
  try {
    url = normalizeUrl(rawUrl.trim());
    const parsed = new URL(url);
    domain = extractDomain(url);
    // Block private IPs
    if (/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(parsed.hostname)) {
      return NextResponse.json({ error: "Scanning private/local addresses is not allowed.", code: "PRIVATE_IP_BLOCKED" }, { status: 400 });
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid URL format. Please enter a valid domain (e.g., example.com).", code: "INVALID_URL" },
      { status: 400 }
    );
  }

  const startTime = Date.now();

  // Fetch headers
  let headersObj, statusCode;
  try {
    ({ headersObj, statusCode } = await fetchHeaders(url));
  } catch (err) {
    return NextResponse.json(
      { error: `Unable to reach ${domain}. Please check the URL and try again.`, code: "CONNECTION_FAILED" },
      { status: 502 }
    );
  }

  // Run basic header analysis (no EASM, no AI, no compliance)
  const analysis = analyzeHeaders(headersObj);
  const allRecommendations = generateRecommendations(analysis);

  // Calculate a headers-only score
  const headers = analysis.headers || [];
  const totalSecurity = headers.length;
  const present = headers.filter(h => h.status === "present").length;
  const weak    = headers.filter(h => h.status === "weak").length;
  const missing = headers.filter(h => h.status === "missing").length;
  const invalid = headers.filter(h => h.status === "invalid").length;

  // Weighted score: present=100, weak=50, missing/invalid=0
  const rawScore = totalSecurity > 0
    ? Math.round(((present * 100) + (weak * 50)) / totalSecurity)
    : 0;

  const score = rawScore;
  const grade = scoreToGrade(score);
  const scanDuration = Date.now() - startTime;

  // Increment public scan counter asynchronously (fire-and-forget)
  connectDB()
    .then(() =>
      SiteStats.findOneAndUpdate(
        { _key: "global" },
        { $inc: { totalPublicScans: 1 } },
        { upsert: true }
      )
    )
    .catch(err => console.error("SiteStats update error:", err));

  return NextResponse.json({
    success: true,
    isPublicScan: true,
    url,
    domain,
    score,
    grade,
    statusCode,
    scanDuration,
    summary: {
      present,
      missing,
      weak,
      invalid,
      total: totalSecurity,
    },
    // Simplified per-header info (name, status, severity only — no full values)
    headers: headers.map(h => ({
      name: h.name,
      status: h.status,
      severity: h.severity,
      description: h.description,
    })),
    // Top 3 recommendations only
    recommendations: allRecommendations.slice(0, 3).map(r => ({
      header: r.name,
      severity: r.severity,
      recommendation: r.recommendation,
    })),
  });
}
