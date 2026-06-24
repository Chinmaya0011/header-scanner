import mongoose from "mongoose";

const SiteStatsSchema = new mongoose.Schema(
  {
    // Singleton identifier
    _key: { type: String, default: "global", unique: true },

    // Total page-view hits tracked via /api/track-visit
    totalVisits: { type: Number, default: 0 },

    // Total public (unauthenticated) scans run via /api/public-scan
    totalPublicScans: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.SiteStats ||
  mongoose.model("SiteStats", SiteStatsSchema);
