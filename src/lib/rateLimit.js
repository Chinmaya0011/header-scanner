import connectDB from "./mongodb";
import RateLimit from "./models/RateLimit";

/**
 * Sliding-window rate limit checker using MongoDB
 * @param {string} ip - Client IP address or User ID identifier
 * @param {string} key - Unique route or action key (e.g. 'scan', 'auth')
 * @param {number} maxRequests - Maximum requests allowed in window
 * @param {number} windowMs - Window duration in milliseconds (default 1 minute)
 * @returns {Promise<{success: boolean, remaining: number}>} Rate limit evaluation
 */
export async function checkRateLimitDB(ip, key = "scan", maxRequests = 10, windowMs = 60 * 1000) {
  try {
    await connectDB();
    const now = Date.now();
    const windowStart = new Date(now - windowMs);

    // 1. Look up the rate-limit document
    let limitDoc = await RateLimit.findOne({ ip, key });

    if (!limitDoc) {
      // Create a fresh rate limit document
      try {
        limitDoc = await RateLimit.create({
          ip,
          key,
          timestamps: [new Date(now)],
          expireAt: new Date(now + windowMs)
        });
        return { success: true, remaining: maxRequests - 1 };
      } catch (writeErr) {
        // Handle concurrent writes duplicate key error gracefully
        if (writeErr.code === 11000) {
          limitDoc = await RateLimit.findOne({ ip, key });
        } else {
          throw writeErr;
        }
      }
    }

    // 2. Filter out timestamps older than the current window
    const recentTimestamps = (limitDoc.timestamps || []).filter(t => t > windowStart);

    if (recentTimestamps.length >= maxRequests) {
      return { success: false, remaining: 0 };
    }

    // 3. Add the current timestamp and update TTL
    recentTimestamps.push(new Date(now));
    limitDoc.timestamps = recentTimestamps;
    limitDoc.expireAt = new Date(now + windowMs);
    await limitDoc.save();

    return { success: true, remaining: maxRequests - recentTimestamps.length };
  } catch (error) {
    console.error("Database rate limiting error, bypassing limits for safety:", error);
    return { success: true, remaining: 1 };
  }
}
