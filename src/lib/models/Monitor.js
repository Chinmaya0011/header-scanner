import mongoose from "mongoose";

const MonitorSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    domain: { type: String, required: true },
    frequency: { type: String, enum: ["daily", "weekly"], default: "daily" },
    active: { type: Boolean, default: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    alertEmail: { type: String, required: true },
    lastRun: { type: Date },
    lastScore: { type: Number },
    lastGrade: { type: String }
  },
  { timestamps: true }
);

// Prevent duplicate monitors for the same URL by the same user
MonitorSchema.index({ user: 1, url: 1 }, { unique: true });

export default mongoose.models.Monitor || mongoose.model("Monitor", MonitorSchema);
