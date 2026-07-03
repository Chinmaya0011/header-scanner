// app/api/scan/domain/[domain]/route.js
// Looks up the most recent scan for a given domain name
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/scan/domain/:domain
 * Retrieve the most recent successful scan for a domain name slug.
 * Used by the /scan/[slug] page when slug is a domain (e.g. github.com).
 */
export async function GET(request, { params }) {
  const startTime = Date.now();

  try {
    const resolvedParams = await params;
    const rawDomain = resolvedParams?.domain;

    if (!rawDomain) {
      return NextResponse.json(
        { success: false, error: "Domain is required.", code: "MISSING_DOMAIN" },
        { status: 400 }
      );
    }

    // URL-decode in case the domain was percent-encoded
    const domain = decodeURIComponent(rawDomain).toLowerCase().trim();

    await connectDB();

    const user = await getUserFromRequest(request);

    // Build query: prefer scans owned by the logged-in user, fall back to any scan for that domain
    let scan = null;

    if (user) {
      // Try owner's most recent successful scan first
      scan = await Scan.findOne({
        domain,
        owner: user._id,
        isSuccess: true,
      })
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!scan) {
      // Fall back to the most recent scan for this domain (any owner)
      scan = await Scan.findOne({ domain, isSuccess: true })
        .sort({ createdAt: -1 })
        .lean();
    }

    if (!scan) {
      return NextResponse.json(
        {
          success: false,
          error: `No scan found for domain: ${domain}`,
          code: "SCAN_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Role-based privacy masking
    const isAuthorized =
      user &&
      (user.role === "admin" ||
        (scan.owner && scan.owner.toString() === user._id.toString()));

    const finalScan = isAuthorized
      ? scan
      : {
          ...scan,
          domain: scan.maskedDomain,
          url: scan.url
            ? scan.url.replace(scan.domain, scan.maskedDomain)
            : scan.maskedDomain,
        };

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: finalScan,
        responseTimeMs: responseTime,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching scan by domain:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve scan. Please try again.",
        code: "RETRIEVAL_FAILED",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
