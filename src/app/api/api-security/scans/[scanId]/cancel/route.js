import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ApiScan from "@/lib/models/ApiScan";
import { getUserFromRequest } from "@/lib/auth";

/**
 * POST /api/api-security/scans/[scanId]/cancel
 * Cancel an active API security scan
 */
export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { scanId } = await params;
    await connectDB();

    const scan = await ApiScan.findById(scanId);
    if (!scan) {
      return NextResponse.json({ success: false, error: "Scan record not found." }, { status: 404 });
    }

    scan.status = "cancelled";
    scan.statusMessage = "API security scan cancelled by user.";
    await scan.save();

    return NextResponse.json({
      success: true,
      message: "API security scan cancelled successfully."
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
