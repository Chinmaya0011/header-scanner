import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import SiteStats from "@/lib/models/SiteStats";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    // Fetch siteStats for totalVisits
    const siteStats = await SiteStats.findOne({ _key: "global" }).lean();
    const totalVisits = siteStats?.totalVisits || 0;

    // Count of successful scans in Scan collection
    const databaseScansCount = await Scan.countDocuments({ isSuccess: true });

    // Count of public scans in Scan collection to avoid double counting
    const databasePublicScansCount = await Scan.countDocuments({ owner: null, isSuccess: true });

    // Historical public scans count from SiteStats
    const historicalPublicScans = siteStats?.totalPublicScans || 0;

    // Total scans: database count + historical public scans - public scans already in database
    const totalScans = databaseScansCount + Math.max(0, historicalPublicScans - databasePublicScansCount);

    // Unique domains scanned
    const uniqueDomainsList = await Scan.distinct("domain");
    const uniqueDomains = uniqueDomainsList.length;

    return NextResponse.json({
      success: true,
      stats: {
        totalVisits,
        totalScans,
        uniqueDomains,
      },
    });
  } catch (error) {
    console.error("Public stats endpoint error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
