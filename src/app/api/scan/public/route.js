import { NextResponse } from "next/server";
import { analyzeHeaders, normalizeUrl, extractDomain, maskDomain, generateRecommendations, runSecurityAudit } from "@/lib/analyzer";
import { scanSSL } from "@/lib/scanners/sslScanner";
import { scanDNS } from "@/lib/scanners/dnsScanner";

// In-memory rate limit store: { ip -> { count, resetAt } }
const ipStore = new Map();
const PUBLIC_RATE_LIMIT = { MAX: 3, WINDOW_MS: 60 * 60 * 1000 }; // 3 per hour

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
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 40) return "D";
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
    throw err;
  }
}

/**
 * POST /api/scan/public
 * Public scan endpoint — no authentication required.
 * Returns limited result: headers, SSL, DNS, score, checks.
 * Not persisted to database. Rate-limited to 3 scans/hour per IP.
 */
export async function POST(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

  const rl = checkPublicRateLimit(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. You can run ${PUBLIC_RATE_LIMIT.MAX} public scans per hour. Try again in ${Math.ceil(rl.retryAfter / 60)} minutes.`,
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

  const privatePatterns = [/^localhost$/i, /^127\./, /^192\.168\./, /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./];
  if (privatePatterns.some((p) => p.test(domain))) {
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

    const [sslResult, dnsResult] = await Promise.allSettled([
      scanSSL(url),
      scanDNS(url),
    ]);

    const ssl = sslResult.status === "fulfilled" ? sslResult.value : null;
    const dns = dnsResult.status === "fulfilled" ? dnsResult.value : null;

    const analysis = analyzeHeaders(headersObj);
    const recommendations = generateRecommendations(analysis);
    const securityAudit = runSecurityAudit(headersObj, url, statusCode);

    const score = analysis.score ?? 0;
    const grade = scoreToGrade(score);

    return NextResponse.json({
      success: true,
      isPublicScan: true,
      url,
      domain,
      maskedDomain: maskDomain(domain),
      score,
      grade,
      statusCode,
      scanDuration: Date.now() - startTime,
      headers: analysis.headers,
      summary: analysis.summary,
      recommendations: recommendations.slice(0, 8),
      checks: securityAudit.checks,
      vulnerabilities: securityAudit.vulnerabilities,
      compliance: securityAudit.compliance,
      ssl,
      dns,
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
    rateLimit: `${PUBLIC_RATE_LIMIT.MAX} scans per hour per IP`,
    body: { url: "https://example.com" },
    returns: ["score", "grade", "headers", "ssl", "dns", "checks", "vulnerabilities", "compliance"],
    note: "Results are not saved to database. Sign up for full EASM scanning.",
  });
}
