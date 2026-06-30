import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null means role-based / global
    },
    recipientRole: {
      type: String,
      enum: ["user", "admin", null],
      default: null, // if null and recipient is null, it's global
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "danger", "security"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false, // For individual notifications
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // For role-based/global notifications
      }
    ],
    isDeleted: {
      type: Boolean,
      default: false, // For individual notifications
    },
    deletedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // For role-based/global notifications
      }
    ],
  },
  { timestamps: true }
);

// Prevent Next.js HMR compilation redundancy
if (process.env.NODE_ENV === "development" && mongoose.models.Notification) {
  delete mongoose.models.Notification;
}

export default mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);
