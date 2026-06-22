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

    const keys = (dbUser.apiKeys || [])
      .filter(k => k.status !== "deleted")
      .map(k => ({
        id: k._id.toString(),
        name: k.name,
        createdAt: k.createdAt,
        lastUsed: k.lastUsed,
        isActive: k.isActive !== false,
        webhookUrl: k.webhookUrl || "",
        allowedDomains: k.allowedDomains || "",
        customUserAgent: k.customUserAgent || "",
        status: k.status || "active",
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

    const { name, regenerateKeyId } = await request.json();
    
    // Generate secure 32-character key starting with 'hg_'
    const rawKey = "hg_" + crypto.randomBytes(16).toString("hex");
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    await connectDB();
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    if (regenerateKeyId) {
      const keyIndex = dbUser.apiKeys.findIndex(k => k._id.toString() === regenerateKeyId);
      if (keyIndex === -1) {
        return NextResponse.json({ success: false, error: "API key to regenerate not found." }, { status: 404 });
      }

      dbUser.apiKeys[keyIndex].keyHash = keyHash;
      dbUser.apiKeys[keyIndex].status = "active";
      dbUser.apiKeys[keyIndex].isActive = true;
      dbUser.apiKeys[keyIndex].lastUsed = null;
      dbUser.apiKeys[keyIndex].createdAt = new Date();

      await dbUser.save();
      const updatedKey = dbUser.apiKeys[keyIndex];

      return NextResponse.json({
        success: true,
        message: "API key successfully regenerated.",
        key: {
          id: updatedKey._id.toString(),
          name: updatedKey.name,
          createdAt: updatedKey.createdAt,
          rawKey, // Returned only ONCE for security copy-pasting
          isActive: updatedKey.isActive,
          webhookUrl: updatedKey.webhookUrl,
          allowedDomains: updatedKey.allowedDomains,
          customUserAgent: updatedKey.customUserAgent,
        }
      });
    }

    const keyName = name?.trim() || "Default API Key";

    if (!dbUser.apiKeys) {
      dbUser.apiKeys = [];
    }

    dbUser.apiKeys.push({
      keyHash,
      name: keyName,
      createdAt: new Date(),
      isActive: true,
      webhookUrl: "",
      allowedDomains: "",
      customUserAgent: "",
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
        isActive: addedKey.isActive,
        webhookUrl: addedKey.webhookUrl,
        allowedDomains: addedKey.allowedDomains,
        customUserAgent: addedKey.customUserAgent,
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/auth/api-keys
 * Update API key configurations (name, isActive, webhookUrl, allowedDomains, customUserAgent)
 */
export async function PUT(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
    }

    const { keyId, name, isActive, webhookUrl, allowedDomains, customUserAgent, status } = await request.json();
    if (!keyId) {
      return NextResponse.json({ success: false, error: "Key ID is required." }, { status: 400 });
    }

    await connectDB();
    const dbUser = await User.findById(user._id);
    if (!dbUser) {
      return NextResponse.json({ success: false, error: "User not found." }, { status: 404 });
    }

    const keyIndex = dbUser.apiKeys.findIndex(k => k._id.toString() === keyId);
    if (keyIndex === -1) {
      return NextResponse.json({ success: false, error: "API key not found." }, { status: 404 });
    }

    if (name !== undefined) dbUser.apiKeys[keyIndex].name = name.trim();
    if (isActive !== undefined) dbUser.apiKeys[keyIndex].isActive = !!isActive;
    if (webhookUrl !== undefined) dbUser.apiKeys[keyIndex].webhookUrl = webhookUrl.trim();
    if (allowedDomains !== undefined) dbUser.apiKeys[keyIndex].allowedDomains = allowedDomains.trim();
    if (customUserAgent !== undefined) dbUser.apiKeys[keyIndex].customUserAgent = customUserAgent.trim();
    if (status !== undefined) dbUser.apiKeys[keyIndex].status = status.trim();

    await dbUser.save();
    const updatedKey = dbUser.apiKeys[keyIndex];

    return NextResponse.json({
      success: true,
      message: "API key settings updated.",
      key: {
        id: updatedKey._id.toString(),
        name: updatedKey.name,
        createdAt: updatedKey.createdAt,
        lastUsed: updatedKey.lastUsed,
        isActive: updatedKey.isActive,
        webhookUrl: updatedKey.webhookUrl,
        allowedDomains: updatedKey.allowedDomains,
        customUserAgent: updatedKey.customUserAgent,
        status: updatedKey.status || "active",
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/api-keys
 * Revoke/delete an API key
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

    const keyIndex = dbUser.apiKeys.findIndex(k => k._id.toString() === keyId);
    if (keyIndex === -1) {
      return NextResponse.json({ success: false, error: "API key not found." }, { status: 404 });
    }

    // Set key status as deleted
    dbUser.apiKeys[keyIndex].status = "deleted";
    dbUser.apiKeys[keyIndex].isActive = false;
    await dbUser.save();

    return NextResponse.json({ success: true, message: "API key successfully deleted." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
