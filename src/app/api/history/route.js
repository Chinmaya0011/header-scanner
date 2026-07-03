import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    await connectDB();
    
    // Check if requester is admin
    const user = await getUserFromRequest(request);
    const isAdmin = user && user.role === "admin";
    const limitCount = user ? 50 : 4;

    const scans = await Scan.find({})
      .sort({ createdAt: -1 })
      .limit(limitCount)
      .select("maskedDomain domain score grade summary statusCode scanDuration createdAt owner")
      .lean();

    const mapped = scans.map((s) => {
      const isOwner = user && s.owner && s.owner.toString() === user._id.toString();
      const showRaw = isAdmin || isOwner;
      return {
        _id: s._id.toString(),
        domain: showRaw ? s.domain : s.maskedDomain,
        maskedDomain: s.maskedDomain,
        score: s.score,
        grade: s.grade,
        summary: s.summary,
        statusCode: s.statusCode,
        scanDuration: s.scanDuration,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: mapped,
    });
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json({ success: false, error: "Failed to load history." }, { status: 500 });
  }
}
