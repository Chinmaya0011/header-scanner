import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Notification from "@/lib/models/Notification";
import { getUserFromRequest } from "@/lib/auth";

/**
 * GET /api/notifications
 * Lists active notification alerts matching the client's session ID and role parameters
 */
export async function GET(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await connectDB();
    const userId = user._id;
    const userRole = user.role || "user";

    // Query filters:
    // 1. recipient matches userId OR recipientRole matches userRole
    // 2. isDeleted is false (individual) and deletedBy does not contain userId (global/role-based)
    const query = {
      $and: [
        {
          $or: [
            { recipient: userId },
            { recipientRole: userRole }
          ]
        },
        { isDeleted: false },
        { deletedBy: { $ne: userId } }
      ]
    };

    // Load last 50 notifications sorted by creation date
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    // Count unread notifications
    // A notification is unread if:
    // - For individual: isRead === false
    // - For role-based/global: readBy does not contain userId
    const unreadCount = await Notification.countDocuments({
      $and: [
        query,
        {
          $or: [
            { $and: [{ recipient: userId }, { isRead: false }] },
            { $and: [{ recipient: null }, { readBy: { $ne: userId } }] }
          ]
        }
      ]
    });

    // Simplify isRead flag representation for UI client mapping
    const formatted = notifications.map((n) => {
      const isRead = n.recipient
        ? n.isRead
        : n.readBy.some((id) => id.toString() === userId.toString());
        
      return {
        _id: n._id.toString(),
        title: n.title,
        message: n.message,
        type: n.type,
        isRead,
        createdAt: n.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted, unreadCount });
  } catch (err) {
    console.error("[Notifications API] GET error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/notifications
 * Mutates read status or clears notifications (individual or global)
 */
export async function POST(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await connectDB();
    const body = await request.json();
    const { action, id, all } = body;
    const userId = user._id;
    const userRole = user.role || "user";

    // 1. MARK READ
    if (action === "mark_read") {
      if (all) {
        const baseQuery = {
          $and: [
            {
              $or: [
                { recipient: userId },
                { recipientRole: userRole }
              ]
            },
            { isDeleted: false },
            { deletedBy: { $ne: userId } }
          ]
        };

        // Mark individual notifications as read
        await Notification.updateMany(
          { ...baseQuery, recipient: userId, isRead: false },
          { $set: { isRead: true } }
        );

        // Mark role-based notifications as read by adding userId to readBy
        await Notification.updateMany(
          { ...baseQuery, recipient: null, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        return NextResponse.json({ success: true, message: "All notifications marked as read." });
      }

      if (!id) {
        return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
      }

      const notification = await Notification.findById(id);
      if (!notification) {
        return NextResponse.json({ error: "Notification not found." }, { status: 404 });
      }

      if (notification.recipient && notification.recipient.toString() === userId.toString()) {
        notification.isRead = true;
        await notification.save();
      } else if (notification.recipientRole === userRole) {
        if (!notification.readBy.some((uid) => uid.toString() === userId.toString())) {
          notification.readBy.push(userId);
          await notification.save();
        }
      } else {
        return NextResponse.json({ error: "Unauthorized operation." }, { status: 403 });
      }

      return NextResponse.json({ success: true, message: "Notification marked as read." });
    }

    // 2. DELETE
    if (action === "delete") {
      if (all) {
        const baseQuery = {
          $and: [
            {
              $or: [
                { recipient: userId },
                { recipientRole: userRole }
              ]
            },
            { isDeleted: false },
            { deletedBy: { $ne: userId } }
          ]
        };

        // Delete individual notifications
        await Notification.updateMany(
          { ...baseQuery, recipient: userId },
          { $set: { isDeleted: true } }
        );

        // Hide role-based notifications by adding userId to deletedBy
        await Notification.updateMany(
          { ...baseQuery, recipient: null },
          { $addToSet: { deletedBy: userId } }
        );

        return NextResponse.json({ success: true, message: "All notifications deleted." });
      }

      if (!id) {
        return NextResponse.json({ error: "Notification ID is required." }, { status: 400 });
      }

      const notification = await Notification.findById(id);
      if (!notification) {
        return NextResponse.json({ error: "Notification not found." }, { status: 404 });
      }

      if (notification.recipient && notification.recipient.toString() === userId.toString()) {
        notification.isDeleted = true;
        await notification.save();
      } else if (notification.recipientRole === userRole) {
        if (!notification.deletedBy.some((uid) => uid.toString() === userId.toString())) {
          notification.deletedBy.push(userId);
          await notification.save();
        }
      } else {
        return NextResponse.json({ error: "Unauthorized operation." }, { status: 403 });
      }

      return NextResponse.json({ success: true, message: "Notification deleted." });
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (err) {
    console.error("[Notifications API] POST error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
