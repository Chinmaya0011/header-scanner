// app/api/scan/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/scan/:id
 * Retrieve a specific scan by ID
 */
export async function GET(request, { params }) {
  const startTime = Date.now();
  
  try {
    // Get the ID from params - handle both sync and async
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    console.log("Fetching scan with ID:", id);
    
    // Validate ID exists
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Scan ID is required.",
          code: "MISSING_ID"
        },
        { status: 400 }
      );
    }
    
    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid ID format:", id);
      return NextResponse.json(
        {
          success: false,
          error: "Invalid scan ID format. ID must be a 24-character hex string.",
          code: "INVALID_ID_FORMAT",
          receivedId: id
        },
        { status: 400 }
      );
    }

    await connectDB();

    const scan = await Scan.findById(id).lean();

    if (!scan) {
      console.log("Scan not found for ID:", id);
      return NextResponse.json(
        {
          success: false,
          error: `Scan not found with ID: ${id}`,
          code: "SCAN_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    // Check authorization: Admin or Scan Owner
    const user = await getUserFromRequest(request);
    const isAuthorized = user && (
      user.role === "admin" || 
      (scan.owner && scan.owner.toString() === user._id.toString())
    );

    const finalScan = isAuthorized 
      ? scan 
      : {
          ...scan,
          domain: scan.maskedDomain,
          url: scan.url ? scan.url.replace(scan.domain, scan.maskedDomain) : scan.maskedDomain,
        };

    const responseTime = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        data: finalScan,
        responseTimeMs: responseTime
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600"
        }
      }
    );

  } catch (error) {
    console.error(`Error fetching scan:`, error);
    
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve scan. Please try again.",
        code: "RETRIEVAL_FAILED",
        message: error.message
      },
      { status: 500 }
    );
  }
}

// DELETE /api/scan/:id
export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Scan ID is required." }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();
    const deletedScan = await Scan.findByIdAndDelete(id);

    if (!deletedScan) {
      return NextResponse.json({ success: false, error: "Scan not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Scan deleted successfully." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH /api/scan/:id
// Toggle public sharing status of a scan
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Scan ID is required." }, { status: 400 });
    }

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Login required." }, { status: 401 });
    }

    await connectDB();
    const scan = await Scan.findById(id);
    if (!scan) {
      return NextResponse.json({ success: false, error: "Scan not found." }, { status: 404 });
    }

    // Only owner or admin can share it
    if (user.role !== "admin" && (!scan.owner || scan.owner.toString() !== user._id.toString())) {
      return NextResponse.json({ success: false, error: "Forbidden." }, { status: 403 });
    }

    const { isPublic } = await request.json();

    scan.isPublic = !!isPublic;
    if (scan.isPublic && !scan.shareToken) {
      // Generate a unique token
      scan.shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    await scan.save();

    return NextResponse.json({
      success: true,
      isPublic: scan.isPublic,
      shareToken: scan.shareToken,
      shareUrl: `/shared/scan/${scan.shareToken}`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}