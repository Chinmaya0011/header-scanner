import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";

/**
 * GET /api/scan/shared/[token]
 * Retrieve a scan by its shareToken for public display
 */
export async function GET(request, { params }) {
  try {
    // Wait for params to resolve if it is an async promise in Next.js 15+
    const resolvedParams = await params;
    const token = resolvedParams?.token;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Share token is required." },
        { status: 400 }
      );
    }

    await connectDB();
    const scan = await Scan.findOne({ shareToken: token, isPublic: true }).lean();

    if (!scan) {
      return NextResponse.json(
        { success: false, error: "Public scan report not found or is no longer public." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: scan });
  } catch (error) {
    console.error("Error retrieving public scan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve public scan." },
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
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
