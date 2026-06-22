import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import Scan from "@/lib/models/Scan";
import Monitor from "@/lib/models/Monitor";
import RateLimit from "@/lib/models/RateLimit";
import { getUserFromRequest } from "@/lib/auth";

/**
 * POST /api/auth/delete-account
 * Permanent self account deletion for the currently authenticated user
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    const { confirmation } = await request.json();
    if (confirmation !== "DELETE") {
      return NextResponse.json(
        { success: false, error: "Confirmation text must exactly match 'DELETE'." },
        { status: 400 }
      );
    }

    await connectDB();

    // 1. Delete all user-associated security logs (Scan history)
    await Scan.deleteMany({ owner: user._id });

    // 2. Delete all user-associated continuous monitors
    await Monitor.deleteMany({ user: user._id });

    // 3. Delete rate limiting database entries
    await RateLimit.deleteMany({ ip: user._id.toString() });

    // 4. Delete user document from database
    await User.findByIdAndDelete(user._id);

    // 5. Revoke browser session cookie
    const cookieStore = await cookies();
    cookieStore.delete("token");

    return NextResponse.json({
      success: true,
      message: "Your profile, API keys, monitors, and scan history logs have been permanently erased from our system.",
    });

  } catch (error) {
    console.error("Account self-deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to erase account: " + error.message },
      { status: 500 }
    );
  }
}
