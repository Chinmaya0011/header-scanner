import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { sendOtpEmail } from "@/lib/emailSender";
import { logActivity } from "@/lib/server/activityLogger";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required to resend verification code." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    await connectDB();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "This account is already verified. Please login." },
        { status: 400 }
      );
    }

    // Generate new 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Send email first
    try {
      await sendOtpEmail(cleanEmail, otp);
    } catch (mailError) {
      console.error("Failed to send verification OTP email:", mailError);
      return NextResponse.json(
        { error: "Failed to send verification email: " + mailError.message },
        { status: 500 }
      );
    }

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    await logActivity({
      req: request,
      user,
      eventType: "USER_OTP_RESENT",
      description: `Verification OTP resent for user account (${user.email})`,
      status: "info",
      resourceType: "auth",
      resourceId: user._id.toString(),
    });

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "Failed to resend verification code: " + error.message },
      { status: 500 }
    );
  }
}
