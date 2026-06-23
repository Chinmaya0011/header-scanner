import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import AssetVerification from "@/lib/models/AssetVerification";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const { action, domain } = body;

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Valid domain is required." }, { status: 400 });
    }

    const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    // 1. INITIATE VERIFICATION
    if (action === "initiate") {
      // Find or create verification token
      let verification = await AssetVerification.findOne({ domain: cleanDomain, owner: user._id });
      
      if (!verification) {
        // Generate random 32 character hex token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        verification = await AssetVerification.create({
          domain: cleanDomain,
          owner: user._id,
          verificationToken: `headerguard-site-verification=${token}`,
          verified: false
        });
      }

      return NextResponse.json({
        success: true,
        domain: cleanDomain,
        token: verification.verificationToken,
        verified: verification.verified,
        verifiedAt: verification.verifiedAt,
        fileLocation: `http://${cleanDomain}/headerguard-verification.txt`,
      });
    }

    // 2. CONFIRM VERIFICATION
    if (action === "confirm") {
      const verification = await AssetVerification.findOne({ domain: cleanDomain, owner: user._id });
      
      if (!verification) {
        return NextResponse.json({ error: "Verification not initiated for this domain." }, { status: 404 });
      }

      if (verification.verified) {
        return NextResponse.json({ success: true, verified: true, message: "Domain is already verified." });
      }

      const expectedToken = verification.verificationToken;
      let filePassed = false;

      // Check Verification File Upload
      try {
        const checkUrl = async (url) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          try {
            const res = await fetch(url, {
              method: "GET",
              headers: { "User-Agent": "HeaderGuard-Verification/1.0" },
              signal: controller.signal,
              redirect: "follow"
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const content = await res.text();
              const rawToken = expectedToken.includes("=") ? expectedToken.split("=")[1] : expectedToken;
              return content.includes(expectedToken) || content.includes(rawToken);
            }
          } catch (e) {
            clearTimeout(timeoutId);
            console.log(`Fetch failed for ${url}:`, e.message);
          }
          return false;
        };

        // Try HTTP first, fallback to HTTPS
        filePassed = await checkUrl(`http://${cleanDomain}/headerguard-verification.txt`);
        if (!filePassed) {
          filePassed = await checkUrl(`https://${cleanDomain}/headerguard-verification.txt`);
        }
      } catch (err) {
        console.log(`File verification failed for ${cleanDomain}:`, err.message);
      }

      if (filePassed) {
        verification.verified = true;
        verification.verifiedAt = new Date();
        verification.verificationMethod = "file";
        await verification.save();

        return NextResponse.json({
          success: true,
          verified: true,
          method: "file",
          message: `Domain ${cleanDomain} successfully verified via FILE verification.`
        });
      } else {
        return NextResponse.json({
          success: false,
          verified: false,
          error: "Verification failed. Could not locate the verification file or verify its content on the target server. Make sure the file is hosted at http://" + cleanDomain + "/headerguard-verification.txt and contains the verification token exactly."
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: "Invalid action specified." }, { status: 400 });
  } catch (err) {
    console.error("Verification endpoint error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");

  if (!domain) {
    return NextResponse.json({ error: "Domain query parameter is required." }, { status: 400 });
  }

  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

  try {
    await connectDB();
    const verification = await AssetVerification.findOne({ domain: cleanDomain, owner: user._id });

    return NextResponse.json({
      success: true,
      verified: verification ? verification.verified : false,
      verification: verification || null
    });
  } catch (err) {
    console.error("Verification status GET error:", err);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
}
