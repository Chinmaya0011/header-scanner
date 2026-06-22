import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import Monitor from "@/lib/models/Monitor";
import { getUserFromRequest } from "@/lib/auth";

/**
 * DELETE /api/users/[id]
 * Delete a specific user and all their associated data (Admin only)
 */
export async function DELETE(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { success: false, error: "Invalid user ID format." },
        { status: 400 }
      );
    }

    if (currentUser._id.toString() === id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own admin account." },
        { status: 400 }
      );
    }

    await connectDB();
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    // Delete scans owned by this user
    await Scan.deleteMany({ owner: id });

    // Delete monitors owned by this user
    await Monitor.deleteMany({ user: id });

    // Delete the user
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `User account (${userToDelete.email}) and associated data successfully deleted.`,
    });
  } catch (error) {
    console.error("Delete user API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/users/[id]
 * Update a specific user's configurations (Admin only)
 */
export async function PUT(request, { params }) {
  try {
    const currentUser = await getUserFromRequest(request);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { dailyLimit, apiAccessEnabled, revokeKeyId } = body;

    await connectDB();
    const userToEdit = await User.findById(id);
    if (!userToEdit) {
      return NextResponse.json(
        { success: false, error: "User not found." },
        { status: 404 }
      );
    }

    if (dailyLimit !== undefined) {
      userToEdit.dailyLimit = Number(dailyLimit);
    }
    if (apiAccessEnabled !== undefined) {
      userToEdit.apiAccessEnabled = !!apiAccessEnabled;
    }
    if (revokeKeyId) {
      const keyIndex = userToEdit.apiKeys.findIndex(k => k._id.toString() === revokeKeyId);
      if (keyIndex !== -1) {
        // Mark status as revoked / soft deleted
        userToEdit.apiKeys[keyIndex].status = "revoked";
        userToEdit.apiKeys[keyIndex].isActive = false;
      }
    }

    await userToEdit.save();

    return NextResponse.json({
      success: true,
      message: "User configurations updated successfully.",
      user: {
        _id: userToEdit._id.toString(),
        email: userToEdit.email,
        role: userToEdit.role,
        dailyLimit: userToEdit.dailyLimit,
        apiAccessEnabled: userToEdit.apiAccessEnabled,
        apiKeys: userToEdit.apiKeys
      }
    });
  } catch (error) {
    console.error("Update user configurations error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update configurations: " + error.message },
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
        "Access-Control-Allow-Methods": "DELETE, PUT, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}