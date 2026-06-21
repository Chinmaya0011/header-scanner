// app/api/users/[id]/route.js
import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";

export async function DELETE(request, { params }) {
  try {
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "User ID is required." },
        { status: 400 }
      );
    }

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: "Invalid User ID format." },
        { status: 400 }
      );
    }

    const currentUser = await getUserFromRequest(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Prevent admin from deleting themselves
    if (currentUser._id.toString() === id.toString()) {
      return NextResponse.json(
        { success: false, error: "Operation denied. You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if target user exists
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // Delete all security scan reports owned by this user
    await Scan.deleteMany({ owner: id });

    // Delete the user account
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "User account and all associated security scan reports have been deleted.",
    });
  } catch (error) {
    console.error("User delete API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user: " + error.message },
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
