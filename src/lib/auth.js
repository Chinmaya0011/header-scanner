import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
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
