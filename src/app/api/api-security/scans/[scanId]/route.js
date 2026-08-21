import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ApiScan from "@/lib/models/ApiScan";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/api-security/scans/[scanId]
 * Retrieve detailed API Security Scan report
 */
export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const { scanId } = await params;
    if (!scanId || !scanId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json({ success: false, error: "Invalid scan ID format." }, { status: 400 });
    }

    await connectDB();
    const scan = await ApiScan.findById(scanId).populate("owner", "email role").lean();

    if (!scan) {
      return NextResponse.json({ success: false, error: "API Security Scan record not found." }, { status: 404 });
    }

    // Access control check: user must own scan or be admin
    const isOwner = String(scan.owner._id || scan.owner) === String(user._id);
    const isAdmin = user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden. Access denied to this scan report." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      scan: {
        ...scan,
        _id: scan._id.toString(),
      }
    });

  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
