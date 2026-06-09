import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import mongoose from "mongoose";

export async function GET(request, { params }) {
  const { id } = params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid scan ID." }, { status: 400 });
  }

  try {
    await connectDB();
    const scan = await Scan.findById(id).lean();

    if (!scan) {
      return NextResponse.json({ error: "Scan not found." }, { status: 404 });
    }

    return NextResponse.json({ ...scan, _id: scan._id.toString() });
  } catch (err) {
    console.error("Fetch scan error:", err);
    return NextResponse.json({ error: "Failed to fetch scan." }, { status: 500 });
  }
}
