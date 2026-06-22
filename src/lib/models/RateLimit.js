import mongoose from "mongoose";

const RateLimitSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, index: true },
    key: { type: String, required: true },
    timestamps: [Date],
    // TTL index: MongoDB will automatically remove documents when local time reaches expireAt
    expireAt: { type: Date, required: true, index: { expires: 0 } }
  }
);

// Compound index for quick lookup
RateLimitSchema.index({ ip: 1, key: 1 }, { unique: true });

export default mongoose.models.RateLimit || mongoose.model("RateLimit", RateLimitSchema);
