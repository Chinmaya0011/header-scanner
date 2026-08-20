import connectDB from "../mongodb";
import ActivityLog from "../models/ActivityLog";

/**
 * Extract client IP address from Next.js request headers
 */
export function getClientIp(request) {
  if (!request) return "127.0.0.1";
  
  try {
    if (request.headers && typeof request.headers.get === "function") {
      const xForwardedFor = request.headers.get("x-forwarded-for");
      if (xForwardedFor) {
        return xForwardedFor.split(",")[0].trim();
      }
      const xRealIp = request.headers.get("x-real-ip");
      if (xRealIp) return xRealIp.trim();
      const cfConnectingIp = request.headers.get("cf-connecting-ip");
      if (cfConnectingIp) return cfConnectingIp.trim();
    }
  } catch (err) {
    // ignore
  }

  return "127.0.0.1";
}

/**
 * Extract User Agent string from Next.js request headers
 */
export function getClientUserAgent(request) {
  if (!request) return "";
  try {
    if (request.headers && typeof request.headers.get === "function") {
      return request.headers.get("user-agent") || "";
    }
  } catch (err) {
    // ignore
  }
  return "";
}

/**
 * Helper to asynchronously log activity without blocking the main workflow
 */
export async function logActivity({
  req = null,
  user = null,
  eventType,
  description,
  status = "info",
  resourceId = null,
  resourceType = "general",
  isPublic = false,
  metadata = {},
  userEmail = null,
  userId = null,
  userRole = null,
}) {
  try {
    await connectDB();

    const resolvedUserId = user ? (user._id || user.id) : userId;
    const resolvedEmail = user ? user.email : (userEmail || "Anonymous / Guest");
    const resolvedRole = user ? user.role : (userRole || "guest");

    const ipAddress = getClientIp(req);
    const userAgent = getClientUserAgent(req);

    await ActivityLog.create({
      eventType,
      userId: resolvedUserId || null,
      userEmail: resolvedEmail,
      userRole: resolvedRole,
      description,
      status,
      ipAddress,
      userAgent,
      resourceId: resourceId ? String(resourceId) : null,
      resourceType,
      isPublic: !!isPublic,
      metadata: metadata || {},
    });
  } catch (err) {
    // Fail silently in production so core user features are never interrupted
    console.error("Activity logging failed:", err.message);
  }
}
