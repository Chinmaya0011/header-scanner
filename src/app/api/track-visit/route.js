import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SiteStats from "@/lib/models/SiteStats";

/**
 * POST /api/track-visit
 * Increments the global page-view counter.
 * No authentication required.
 */
export async function POST() {
  try {
    await connectDB();
    await SiteStats.findOneAndUpdate(
      { _key: "global" },
      { $inc: { totalVisits: 1 } },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    // Silently fail — visit tracking should never break the app
    console.error("Visit tracking error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
