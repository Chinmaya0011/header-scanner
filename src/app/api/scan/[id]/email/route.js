import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";
import { sendAuditReportEmail } from "@/lib/emailSender";

export async function POST(request, { params }) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please log in to email reports." },
        { status: 401 }
      );
    }

    // 2. Parse request params
    const { id } = await params;
 
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: "Invalid scan ID format." },
        { status: 400 }
      );
    }

    let recipientEmail = user.email;
    try {
      const body = await request.json();
      if (body && body.recipient && typeof body.recipient === "string") {
        const trimmedEmail = body.recipient.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(trimmedEmail)) {
          recipientEmail = trimmedEmail;
        } else {
          return NextResponse.json(
            { error: "Invalid recipient email address format." },
            { status: 400 }
          );
        }
      }
    } catch (e) {
      // Body may be empty, default to user's own email
    }

    // 3. Connect to database and fetch scan
    await connectDB();
    const scan = await Scan.findById(id).lean();

    if (!scan) {
      return NextResponse.json(
        { error: "Scan report not found." },
        { status: 404 }
      );
    }

    // 4. Check Authorization for unmasked data vs masked data
    const isAuthorized = user.role === "admin" || (scan.owner && scan.owner.toString() === user._id.toString());
    const finalScan = isAuthorized 
      ? scan 
      : {
          ...scan,
          domain: scan.maskedDomain,
          url: scan.url ? scan.url.replace(scan.domain, scan.maskedDomain) : scan.maskedDomain,
        };

    console.log(`[Email Dispatch] Dispatching email report to: ${recipientEmail} for domain: ${finalScan.domain || finalScan.maskedDomain}`);

    // 5. Dispatch Email with direct HTML and Markdown body
    await sendAuditReportEmail(
      recipientEmail,
      finalScan
    );

    return NextResponse.json({
      success: true,
      message: `Audit report successfully emailed to ${recipientEmail}`,
    });
  } catch (error) {
    console.error("Email API route error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch email report: " + error.message },
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
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
