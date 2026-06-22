import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Monitor from "@/lib/models/Monitor";
import { getUserFromRequest } from "@/lib/auth";
import { normalizeUrl, extractDomain } from "@/lib/analyzer";

/**
 * GET /api/monitors
 * Retrieve all monitors configured by the logged-in operator
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const monitors = await Monitor.find({ user: user._id }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      monitors: JSON.parse(JSON.stringify(monitors))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/monitors
 * Create a new website monitor schedule
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { url: rawUrl, frequency, alertEmail } = await request.json();

    if (!rawUrl || !alertEmail) {
      return NextResponse.json({ success: false, error: "URL and Alert Email are required." }, { status: 400 });
    }

    const url = normalizeUrl(rawUrl);
    const domain = extractDomain(url);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(alertEmail)) {
      return NextResponse.json({ success: false, error: "Invalid alert email format." }, { status: 400 });
    }

    await connectDB();
    
    // Check if duplicate monitor already exists
    const duplicate = await Monitor.findOne({ user: user._id, url });
    if (duplicate) {
      return NextResponse.json({ success: false, error: "A monitor for this URL is already configured." }, { status: 400 });
    }

    const monitor = await Monitor.create({
      url,
      domain,
      frequency: frequency === "weekly" ? "weekly" : "daily",
      alertEmail: alertEmail.toLowerCase().trim(),
      user: user._id,
    });

    return NextResponse.json({ success: true, monitor });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/monitors
 * Remove a monitor schedule
 */
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { monitorId } = await request.json();
    if (!monitorId) {
      return NextResponse.json({ success: false, error: "Monitor ID is required." }, { status: 400 });
    }

    await connectDB();
    const monitor = await Monitor.findOneAndDelete({ _id: monitorId, user: user._id });

    if (!monitor) {
      return NextResponse.json({ success: false, error: "Monitor not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Monitor successfully deleted." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
