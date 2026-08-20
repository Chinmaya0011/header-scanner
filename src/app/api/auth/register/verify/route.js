import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";
import { logActivity } from "@/lib/server/activityLogger";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: "User registration session not found." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "User account is already verified. Please login." },
        { status: 400 }
      );
    }

    // Check OTP matching & expiry
    if (user.otp !== otp.trim()) {
      await logActivity({
        req: request,
        user,
        eventType: "USER_REGISTER_VERIFY_FAILED",
        description: `Invalid OTP code provided for account verification (${user.email})`,
        status: "failed",
        resourceType: "auth",
      });
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 }
      );
    }

    if (user.otpExpires && new Date(user.otpExpires) < new Date()) {
      await logActivity({
        req: request,
        user,
        eventType: "USER_REGISTER_VERIFY_FAILED",
        description: `Expired OTP code provided for account verification (${user.email})`,
        status: "failed",
        resourceType: "auth",
      });
      return NextResponse.json(
        { error: "Verification code expired. Please register again." },
        { status: 400 }
      );
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    await logActivity({
      req: request,
      user,
      eventType: "USER_REGISTER_VERIFIED",
      description: `Account verified and user registration completed (${user.email})`,
      status: "success",
      resourceType: "auth",
      resourceId: user._id.toString(),
    });

    // Trigger admin notification on new registration
    try {
      const { createNotification } = await import("@/lib/notificationService");
      await createNotification({
        recipientRole: "admin",
        title: "New User Registered",
        message: `User ${user.email} has completed verification and registered as ${user.role}.`,
        type: "success"
      });
    } catch (notifErr) {
      console.error("Failed to trigger registration notification:", notifErr);
    }

    // Log the verified user in
    const token = signToken(user);

    const response = NextResponse.json({
      success: true,
      message: "Account verified successfully.",
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP. " + error.message },
      { status: 500 }
    );
  }
}

