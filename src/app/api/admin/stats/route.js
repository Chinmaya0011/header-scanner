import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import SiteStats from "@/lib/models/SiteStats";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden. Admin access required." }, { status: 403 });
    }

    await connectDB();

    // 1. Core Counts
    const totalUsers = await User.countDocuments({});
    
    // Total API requests (from api source)
    const totalApiRequests = await Scan.countDocuments({ source: "api" });

    // Total scans across all sources (web + api)
    const totalAllScans = await Scan.countDocuments({ isSuccess: true });
    
    // Success vs Failed API requests
    const successfulApiCalls = await Scan.countDocuments({ source: "api", isSuccess: true });
    const failedApiCalls = await Scan.countDocuments({ source: "api", isSuccess: false });

    // Blocked users
    const blockedUsersCount = await User.countDocuments({ apiAccessEnabled: false });

    // Site-wide visit & public scan stats (singleton SiteStats document)
    const siteStats = await SiteStats.findOne({ _key: "global" }).lean();
    const totalVisits = siteStats?.totalVisits || 0;
    const totalPublicScans = siteStats?.totalPublicScans || 0;

    // 2. Daily Scan Requests count (Created today)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const dailyApiRequests = await Scan.countDocuments({ 
      source: "api", 
      createdAt: { $gte: startOfToday } 
    });

    // 3. API Keys Status Aggregations
    const allUsersKeys = await User.find({}).select("apiKeys").lean();
    let activeKeysCount = 0;
    let revokedKeysCount = 0;
    let deletedKeysCount = 0;

    allUsersKeys.forEach(u => {
      (u.apiKeys || []).forEach(k => {
        if (k.status === "active" || (!k.status && k.isActive !== false)) activeKeysCount++;
        else if (k.status === "revoked") revokedKeysCount++;
        else if (k.status === "deleted") deletedKeysCount++;
      });
    });

    // 4. Users near limit (usage >= 85% of limit)
    // We fetch users where dailyLimit > 0 and calculate ratio
    const usersList = await User.find({}).select("email dailyLimit dailyUsage apiAccessEnabled").lean();
    const usersNearLimit = usersList
      .filter(u => u.dailyLimit > 0 && (u.dailyUsage / u.dailyLimit) >= 0.85)
      .map(u => ({
        id: u._id.toString(),
        email: u.email,
        dailyUsage: u.dailyUsage,
        dailyLimit: u.dailyLimit,
        apiAccessEnabled: u.apiAccessEnabled
      }));

    // 5. Aggregate requests history for charts (Last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const success = await Scan.countDocuments({
        source: "api",
        isSuccess: true,
        createdAt: { $gte: d, $lt: nextDay }
      });

      const failed = await Scan.countDocuments({
        source: "api",
        isSuccess: false,
        createdAt: { $gte: d, $lt: nextDay }
      });

      chartData.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        success,
        failed,
        total: success + failed
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalApiRequests,
        totalAllScans,
        totalPublicScans,
        totalVisits,
        dailyApiRequests,
        successfulApiCalls,
        failedApiCalls,
        blockedUsers: blockedUsersCount,
        activeKeys: activeKeysCount,
        revokedKeys: revokedKeysCount,
        deletedKeys: deletedKeysCount,
        usersNearLimit,
        chartData
      }
    });

  } catch (error) {
    console.error("Admin stats aggregation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
