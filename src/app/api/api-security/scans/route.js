import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ApiScan from "@/lib/models/ApiScan";
import { getUserFromRequest } from "@/lib/auth";
import { maskDomain, extractDomain } from "@/lib/analyzer";
import { runApiScanJob } from "@/lib/apiSecurity/runner";
import { logActivity } from "@/lib/server/activityLogger";

/**
 * GET /api/api-security/scans
 * Retrieve user's API Security scans with pagination
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));
    const skip = (page - 1) * limit;

    await connectDB();
    const query = user.role === "admin" ? {} : { owner: user._id };

    const [scans, totalScans] = await Promise.all([
      ApiScan.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner", "email role")
        .lean(),
      ApiScan.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalScans / limit) || 1;

    return NextResponse.json({
      success: true,
      scans,
      pagination: {
        totalScans,
        totalPages,
        currentPage: page,
        pageLimit: limit,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/api-security/scans
 * Initiate a new API Security Scan
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const {
      targetUrl,
      authType = "bearer",
      primaryToken,
      secondaryToken,
      apiKeyHeader = "X-API-Key",
      apiKeyValue,
      scanMode = "safe_active",
      isConfirmed = false
    } = body;

    if (!targetUrl || typeof targetUrl !== "string") {
      return NextResponse.json({ success: false, error: "Target URL is required." }, { status: 400 });
    }

    // Require authorization confirmation checkbox
    if (!isConfirmed) {
      return NextResponse.json({
        success: false,
        error: "Authorization confirmation required. You must confirm that you have explicit permission to test this target."
      }, { status: 400 });
    }

    // Target URL validation & domain extraction
    let cleanUrl = targetUrl.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let domain = "unknown";
    try {
      domain = new URL(cleanUrl).hostname;
    } catch {
      return NextResponse.json({ success: false, error: "Invalid target URL format." }, { status: 400 });
    }

    const masked = maskDomain(domain);
    await connectDB();

    // Create ApiScan record in database
    const scan = await ApiScan.create({
      targetUrl: cleanUrl,
      domain,
      maskedDomain: masked,
      authType,
      scanMode,
      hasSecondaryAuth: !!secondaryToken,
      apiKeyHeader,
      owner: user._id,
      status: "queued",
      statusMessage: "API Security Scan job queued...",
    });

    // Asynchronously kick off background runner (does not block HTTP response)
    runApiScanJob(scan._id.toString(), {
      primaryToken,
      secondaryToken,
      apiKeyHeader,
      apiKeyValue,
    });

    await logActivity({
      req: request,
      user,
      eventType: "API_SECURITY_SCAN_STARTED",
      description: `Started API security scan for target domain '${masked}' (Mode: ${scanMode}).`,
      status: "info",
      resourceType: "api_scan",
      resourceId: scan._id.toString(),
    });

    return NextResponse.json({
      success: true,
      scanId: scan._id.toString(),
      message: "API Security Scan job successfully queued.",
    });

  } catch (err) {
    console.error("Initiate API scan error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
