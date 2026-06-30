import Notification from "@/lib/models/Notification";
import connectDB from "@/lib/mongodb";
import { sendNotificationToUser, sendNotificationToRole } from "@/server/socketServer";

/**
 * Creates, saves, and broadcasts a real-time notification
 * @param {object} params
 * @param {string} params.recipient - Target User ID (optional, null means role-based / global)
 * @param {string} params.recipientRole - Target User Role: 'user' or 'admin' (optional)
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification descriptive message
 * @param {string} params.type - Severity type: 'info', 'success', 'warning', 'danger', 'security'
 */
export async function createNotification({ recipient = null, recipientRole = null, title, message, type = "info" }) {
  try {
    await connectDB();
    
    // 1. Persist notification to database
    const notification = await Notification.create({
      recipient,
      recipientRole,
      title,
      message,
      type
    });

    // 2. Dispatch real-time WebSocket signals to active listeners
    if (global.wss) {
      if (recipient) {
        sendNotificationToUser(recipient.toString(), notification);
      } else if (recipientRole) {
        sendNotificationToRole(recipientRole, notification);
      }
    }

    return notification;
  } catch (err) {
    console.error("[NotificationService] Failed to create or broadcast notification:", err.message);
    return null;
  }
}
