import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/admin/collections
 * List all database collections with document count and metadata for Admin
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Admin privileges required." },
        { status: 403 }
      );
    }

    await connectDB();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { success: false, error: "Database connection unavailable." },
        { status: 500 }
      );
    }

    // List all collections in the MongoDB database
    const rawCollections = await db.listCollections().toArray();

    // Gather count and stats for each collection
    const collections = await Promise.all(
      rawCollections.map(async (col) => {
        const name = col.name;
        let count = 0;
        try {
          count = await db.collection(name).countDocuments({});
        } catch (err) {
          count = await db.collection(name).estimatedDocumentCount();
        }

        return {
          name,
          type: col.type || "collection",
          count,
        };
      })
    );

    // Sort collections alphabetically
    collections.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      collections,
      totalCollections: collections.length,
    });
  } catch (error) {
    console.error("Fetch DB collections error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load database collections: " + error.message },
      { status: 500 }
    );
  }
}
