import mongoose from "mongoose";

const ActivityLogSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userEmail: {
      type: String,
      default: "Anonymous / Guest",
      index: true,
    },
    userRole: {
      type: String,
      default: "guest",
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed", "warning", "info"],
      default: "info",
      index: true,
    },
    ipAddress: {
      type: String,
      default: "127.0.0.1",
    },
    userAgent: {
      type: String,
      default: "",
    },
    resourceId: {
      type: String,
      default: null,
      index: true,
    },
    resourceType: {
      type: String,
      default: "general", // "scan", "user", "api_key", "auth", "system"
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

// Compound index for common query combinations
ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userId: 1, createdAt: -1 });
ActivityLogSchema.index({ eventType: 1, createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model("ActivityLog", ActivityLogSchema);
