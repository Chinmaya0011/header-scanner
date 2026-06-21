import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendOtpEmail } from "@/lib/emailSender";

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

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      // If user exists and is already verified, throw error
      if (existingUser.isVerified) {
        return NextResponse.json(
          { error: "User with this email already exists." },
          { status: 400 }
        );
      }
      
      // If they registered but aren't verified, remove their old pending session
      await User.findByIdAndDelete(existingUser._id);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-promote admin configured in environment
    const adminEmail = process.env.ADMIN_EMAIL || "imchinu17@gmail.com";
    const role = email.toLowerCase().trim() === adminEmail.toLowerCase() ? "admin" : "user";

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Send OTP email first to prevent saving un-sendable emails
    try {
      await sendOtpEmail(email.toLowerCase().trim(), otp);
    } catch (mailError) {
      console.error("Failed to send verification OTP email:", mailError);
      return NextResponse.json(
        { error: "Failed to dispatch verification email: " + mailError.message },
        { status: 500 }
      );
    }

    // Create pending user account
    await User.create({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      isVerified: false,
      otp,
      otpExpires,
    });

    return NextResponse.json({
      success: true,
      email: email.toLowerCase().trim(),
      step: "verify_otp",
      message: "Verification code sent to email. Please verify your identity.",
    });

  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Failed to register user. " + error.message },
      { status: 500 }
    );
  }
}
