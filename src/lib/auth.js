import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import crypto from "crypto";
import connectDB from "./mongodb";
import User from "./models/User";

const JWT_SECRET = process.env.JWT_SECRET || "headerguard-secret-key-17-secure-jwt-matrix";

export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function getUserFromRequest(request) {
  try {
    // 1. Check API Key header first (for developer tools & pipelines)
    if (request && request.headers) {
      const apiKey = request.headers.get("x-api-key");
      if (apiKey) {
        const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");
        await connectDB();
        const user = await User.findOne({ "apiKeys.keyHash": keyHash }).select("-password");
        if (user) {
          const matchedKey = user.apiKeys.find(k => k.keyHash === keyHash);
          if (matchedKey) {
            if (matchedKey.isActive === false || matchedKey.status !== "active") {
              console.log(`API key "${matchedKey.name}" is inactive or not active (status: ${matchedKey.status}).`);
              return null;
            }

            // Update key usage timestamp asynchronously
            User.updateOne(
              { _id: user._id, "apiKeys.keyHash": keyHash },
              { $set: { "apiKeys.$.lastUsed": new Date() } }
            ).catch(err => console.error("Failed to update API key lastUsed date:", err));
            
            return {
              ...user.toObject(),
              _id: user._id.toString(),
              authMethod: "api-key",
              apiKeyId: matchedKey._id.toString(),
              webhookUrl: matchedKey.webhookUrl || "",
              allowedDomains: matchedKey.allowedDomains || "",
              customUserAgent: matchedKey.customUserAgent || "",
            };
          }
        }
      }
    }

    let token = null;

    // Check cookies from request if available
    if (request && request.cookies && typeof request.cookies.get === "function") {
      token = request.cookies.get("token")?.value;
    }

    // Fallback to headers
    if (!token && request && request.headers) {
      const authHeader = request.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      // Fallback to next/headers cookies()
      try {
        const cookieStore = await cookies();
        token = cookieStore.get("token")?.value;
      } catch {
        // cookies() can throw if called outside request context
      }
    }

    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) return null;

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password").lean();
    return user ? { ...user, _id: user._id.toString() } : null;
  } catch (error) {
    console.error("Auth verification error:", error);
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) return null;

    await connectDB();
    const user = await User.findById(decoded.userId).select("-password").lean();
    return user ? { ...user, _id: user._id.toString() } : null;
  } catch (error) {
    return null;
  }
}
