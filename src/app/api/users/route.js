import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getUserFromRequest } from "@/lib/auth";

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
