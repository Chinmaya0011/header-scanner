import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";

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

    // Delete all users except the current admin
    await User.deleteMany({ _id: { $ne: currentUser._id } });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${usersToDelete.length} user(s) and all their associated scans.`,
    });
  } catch (error) {
    console.error("Delete all users API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete users: " + error.message },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}