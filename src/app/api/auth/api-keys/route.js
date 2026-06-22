import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/auth/api-keys
 * List metadata for all active API keys of the logged-in user
 */
export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    await connectDB();
    const dbUser = await User.findById(user._id).select("apiKeys").lean();

    const keys = (dbUser.apiKeys || []).map(k => ({
      id: k._id.toString(),
      name: k.name,
      createdAt: k.createdAt,
      lastUsed: k.lastUsed,
    }));

    return NextResponse.json({ success: true, keys });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/auth/api-keys
 * Generate a new API key and append its hash to the user session
 */
export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { name } = await request.json();
    const keyName = name?.trim() || "Default API Key";

    // Generate secure 32-character key starting with 'hg_'
    const rawKey = "hg_" + crypto.randomBytes(16).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    await connectDB();
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (!dbUser.apiKeys) {
      dbUser.apiKeys = [];
    }

    dbUser.apiKeys.push({
      keyHash,
      name: keyName,
      createdAt: new Date(),
    });

    await dbUser.save();
    const addedKey = dbUser.apiKeys[dbUser.apiKeys.length - 1];

    return NextResponse.json({
      success: true,
      key: {
        id: addedKey._id.toString(),
        name: addedKey.name,
        createdAt: addedKey.createdAt,
        rawKey, // Returned only ONCE for security copy-pasting
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/api-keys
 * Revoke an active API key
 */
export async function DELETE(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { keyId } = await request.json();
    if (!keyId) {
      return NextResponse.json({ success: false, error: "Key ID is required." }, { status: 400 });
    }

    await connectDB();
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    dbUser.apiKeys = dbUser.apiKeys.filter(k => k._id.toString() !== keyId);
    await dbUser.save();

    return NextResponse.json({ success: true, message: "API key successfully revoked." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
