import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import Monitor from "@/lib/models/Monitor";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/users
 * Retrieve list of all users (Admin only)
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    
    // Authorization check
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();
    const users = await User.find({}).select("-password").sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      users: users.map(u => ({ ...u, _id: u._id.toString() })),
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users
 * Delete all users except the current admin (Admin only)
 */
export async function DELETE(request) {
  try {
    const currentUser = await getUserFromRequest(request);
    
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    await connectDB();

    // Get all users except the current admin
    const usersToDelete = await User.find({
      _id: { $ne: currentUser._id }
    });

    if (usersToDelete.length === 0) {
      return NextResponse.json(
        { success: false, error: "No other users to delete." },
        { status: 400 }
      );
    }

    // Get all user IDs to delete
    const userIds = usersToDelete.map(user => user._id);

    // Delete all scans owned by these users
    await Scan.deleteMany({ owner: { $in: userIds } });

    // Delete all monitors owned by these users
    await Monitor.deleteMany({ user: { $in: userIds } });

    // Delete all users except the current admin
    await User.deleteMany({ _id: { $ne: currentUser._id } });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${usersToDelete.length} user(s) and all their associated scans and monitors.`,
    });
  } catch (error) {
    console.error("Delete all users API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete users: " + error.message },
      { status: 500 }
    );
  }
}
