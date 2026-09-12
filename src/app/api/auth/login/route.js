import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { signToken } from "@/lib/auth";
import { logActivity } from "@/lib/server/activityLogger";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      await logActivity({
        req: request,
        eventType: "USER_LOGIN_FAILED",
        description: `Failed login attempt for nonexistent user email (${email})`,
        status: "failed",
        resourceType: "auth",
        userEmail: email,
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logActivity({
        req: request,
        user,
        eventType: "USER_LOGIN_FAILED",
        description: `Failed login attempt for user ${user.email} (incorrect password)`,
        status: "failed",
        resourceType: "auth",
      });
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Block unverified users from logging in, dispatch fresh OTP if needed, and prompt verification redirect
    if (user.isVerified === false) {
      // Check if existing OTP is expired or missing
      const isOtpExpired = !user.otp || !user.otpExpires || new Date(user.otpExpires) < new Date();
      if (isOtpExpired) {
        try {
          const { sendOtpEmail } = await import("@/lib/emailSender");
          const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
          const freshExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
          
          await sendOtpEmail(user.email, freshOtp);
          user.otp = freshOtp;
          user.otpExpires = freshExpires;
          await user.save();
        } catch (mailErr) {
          console.error("Failed to auto-resend OTP during unverified login:", mailErr);
        }
      }

      await logActivity({
        req: request,
        user,
        eventType: "USER_LOGIN_FAILED",
        description: `Login blocked for unverified user account (${user.email}) - redirected to OTP verification`,
        status: "warning",
        resourceType: "auth",
      });

      return NextResponse.json(
        {
          error: "Account verification pending. Please complete OTP verification.",
          requiresVerification: true,
          email: user.email,
        },
        { status: 403 }
      );
    }

    // Generate token
    const token = signToken(user);

    await logActivity({
      req: request,
      user,
      eventType: "USER_LOGIN_SUCCESS",
      description: `User ${user.email} logged in successfully`,
      status: "success",
      resourceType: "auth",
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Failed to login. " + error.message },
      { status: 500 }
    );
  }
}

