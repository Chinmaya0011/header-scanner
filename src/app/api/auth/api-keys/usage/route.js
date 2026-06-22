import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import RateLimit from "@/lib/models/RateLimit";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const userIdStr = user._id.toString();
    const now = new Date();
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Current Minute Rate Limit Usage
    let rateLimitUsage = 0;
    const rateLimitDoc = await RateLimit.findOne({ ip: userIdStr, key: "scan" }).lean();
    if (rateLimitDoc && rateLimitDoc.timestamps) {
      const windowStart = new Date(Date.now() - 60 * 1000);
      rateLimitUsage = rateLimitDoc.timestamps.filter(t => new Date(t) > windowStart).length;
    }

    // 2. Count API scans (source: "api")
    const totalApiScans = await Scan.countDocuments({ owner: user._id, source: "api" });
    const scans24h = await Scan.countDocuments({ owner: user._id, source: "api", createdAt: { $gte: past24h } });
    const scans30d = await Scan.countDocuments({ owner: user._id, source: "api", createdAt: { $gte: past30d } });

    // 3. Breakdown by API key (grouped in memory or using aggregate)
    // Map active API keys to names for clean presentation
    const keyMap = {};
    (user.apiKeys || []).forEach(k => {
      keyMap[k._id.toString()] = k.name;
    });

    const keyUsage = await Scan.aggregate([
      { $match: { owner: user._id, source: "api", apiKeyId: { $ne: null } } },
      { $group: { _id: "$apiKeyId", count: { $sum: 1 } } }
    ]);

    const keyBreakdown = (user.apiKeys || []).map(k => {
      const usage = keyUsage.find(ku => ku._id === k._id.toString());
      return {
        id: k._id.toString(),
        name: k.name,
        isActive: k.isActive !== false,
        count: usage ? usage.count : 0
      };
    });

    // 4. Retrieve recent API scans
    const recentScans = await Scan.find({ owner: user._id, source: "api" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("url domain score grade statusCode scanDuration createdAt apiKeyId")
      .lean();

    const formattedRecentScans = recentScans.map(s => ({
      id: s._id.toString(),
      url: s.url,
      domain: s.domain,
      score: s.score,
      grade: s.grade,
      statusCode: s.statusCode,
      scanDuration: s.scanDuration,
      createdAt: s.createdAt,
      keyName: keyMap[s.apiKeyId] || "Unknown/Revoked Key"
    }));

    // 5. Aggregate user's requests history for charts (Last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setUTCHours(0, 0, 0, 0);
      
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const success = await Scan.countDocuments({
        owner: user._id,
        source: "api",
        isSuccess: true,
        createdAt: { $gte: d, $lt: nextDay }
      });

      const failed = await Scan.countDocuments({
        owner: user._id,
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
      data: {
        rateLimit: {
          currentUsage: rateLimitUsage,
          maxLimit: 10,
          windowMs: 60000
        },
        dailyQuota: {
          usage: user.dailyUsage || 0,
          limit: user.dailyLimit !== undefined ? user.dailyLimit : 20,
          apiAccessEnabled: user.apiAccessEnabled !== false
        },
        metrics: {
          total: totalApiScans,
          last24h: scans24h,
          last30d: scans30d
        },
        keyBreakdown,
        recentScans: formattedRecentScans,
        chartData
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
