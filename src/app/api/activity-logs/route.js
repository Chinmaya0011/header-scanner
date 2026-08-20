import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import ActivityLog from "@/lib/models/ActivityLog";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/server/activityLogger";

/**
 * GET /api/activity-logs
 * Fetch activity logs with full filtering, pagination, and strict access control
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in to view activity logs." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Extract Query Parameters
    const search = searchParams.get("search") || "";
    const eventType = searchParams.get("eventType") || "";
    const status = searchParams.get("status") || "";
    const isPublicParam = searchParams.get("isPublic") || "";
    const filterUserEmail = searchParams.get("user") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const sort = searchParams.get("sort") || "newest"; // "newest" | "oldest"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    await connectDB();

    // Construct Mongoose Query
    const query = {};

    // Strict Authorization Scoping
    if (user.role !== "admin") {
      // Regular user: STRICTLY scope to their own user ID
      query.userId = user._id;
    } else {
      // Admin: optional filter by specific user email or ID
      if (filterUserEmail.trim()) {
        query.$or = [
          { userEmail: { $regex: filterUserEmail.trim(), $options: "i" } },
          { userId: filterUserEmail.trim().match(/^[0-9a-fA-F]{24}$/) ? filterUserEmail.trim() : null }
        ];
      }
    }

    // Event type filter
    if (eventType.trim() && eventType !== "all") {
      query.eventType = eventType.trim();
    }

    // Status filter
    if (status.trim() && status !== "all") {
      query.status = status.trim();
    }

    // Public / Private visibility filter
    if (isPublicParam !== "" && isPublicParam !== "all") {
      query.isPublic = isPublicParam === "true";
    }

    // Date range filtering
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Extend to end of day if only date is passed
        const end = new Date(endDate);
        if (!endDate.includes("T")) {
          end.setHours(23, 59, 59, 999);
        }
        query.createdAt.$lte = end;
      }
    }

    // Keyword search (description, userEmail, eventType, ipAddress, resourceId)
    if (search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      const searchConditions = [
        { description: searchRegex },
        { userEmail: searchRegex },
        { eventType: searchRegex },
        { ipAddress: searchRegex },
        { resourceId: searchRegex }
      ];

      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: searchConditions }
        ];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    // Pagination calculations
    const skip = (page - 1) * limit;
    const sortOrder = sort === "oldest" ? 1 : -1;

    const [logs, totalLogs] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalLogs / limit) || 1;

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        ...log,
        _id: log._id.toString(),
        userId: log.userId ? log.userId.toString() : null,
      })),
      pagination: {
        totalLogs,
        totalPages,
        currentPage: page,
        pageLimit: limit,
      },
    });
  } catch (error) {
    console.error("Fetch activity logs API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch activity logs: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/activity-logs
 * Purge / clear activity logs (Admin only)
 */
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get("id");
    const purgeAll = searchParams.get("all") === "true";

    await connectDB();

    if (logId) {
      const deleted = await ActivityLog.findByIdAndDelete(logId);
      if (!deleted) {
        return NextResponse.json({ success: false, error: "Activity log record not found." }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: "Activity log record deleted successfully.",
      });
    }

    if (purgeAll) {
      const result = await ActivityLog.deleteMany({});

      // Record the purge event log after clearing
      await logActivity({
        req: request,
        user,
        eventType: "ACTIVITY_LOGS_PURGED",
        description: `Admin purged all ${result.deletedCount} system activity logs.`,
        status: "warning",
        resourceType: "activity_logs",
        metadata: { deletedCount: result.deletedCount },
      });

      return NextResponse.json({
        success: true,
        message: `Successfully purged all ${result.deletedCount} activity logs.`,
        deletedCount: result.deletedCount,
      });
    }

    return NextResponse.json(
      { success: false, error: "Specify log 'id' or 'all=true' parameter." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Delete activity logs API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete activity logs: " + error.message },
      { status: 500 }
    );
  }
}

