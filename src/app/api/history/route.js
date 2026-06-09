import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";

export async function GET() {
  try {
    await connectDB();
    const scans = await Scan.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .select("maskedDomain domain score grade summary statusCode scanDuration createdAt")
      .lean();

    return NextResponse.json(
      scans.map((s) => ({ ...s, _id: s._id.toString() }))
    );
  } catch (err) {
    console.error("History error:", err);
    return NextResponse.json({ error: "Failed to load history." }, { status: 500 });
  }
}
