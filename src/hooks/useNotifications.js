import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/common/Toast";

/**
 * Custom React hook to manage WebSocket connection and client-side notifications
 * @param {object} user - Logged in User object
 */
export function useNotifications(user) {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);

  // 1. Fetch Notification History
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("[useNotifications] Fetch history failed:", err.message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 2. Mark Single Notification as Read
  const markAsRead = useCallback(async (id) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("[useNotifications] Mark read error:", err.message);
    }
  }, []);

  // 3. Mark All Notifications as Read
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", all: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read.");
      }
    } catch (err) {
      console.error("[useNotifications] Mark all read error:", err.message);
    }
  }, [toast]);

  // 4. Delete Single Notification
  const deleteNotification = useCallback(async (id) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications((prev) => {
          const target = prev.find((n) => n._id === id);
          if (target && !target.isRead) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n._id !== id);
        });
      }
    } catch (err) {
      console.error("[useNotifications] Delete error:", err.message);
    }
  }, []);

  // 5. Delete All Notifications
  const deleteAllNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", all: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications([]);
        setUnreadCount(0);
        toast.success("All notifications cleared.");
      }
    } catch (err) {
      console.error("[useNotifications] Clear all error:", err.message);
    }
  }, [toast]);

  // 6. Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (!user) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    // Standalone server port 3001
    const wsUrl = `${protocol}//${host}:3001`;

    console.log(`[WebSocket] Establishing link: ${wsUrl}`);
    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => {
      console.log("[WebSocket] Connection link online.");
      reconnectAttempts.current = 0;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "notification") {
          const newNotif = message.payload;

          // Append to state dynamically
          setNotifications((prev) => [
            {
              _id: newNotif._id,
              title: newNotif.title,
              message: newNotif.message,
              type: newNotif.type,
              isRead: false,
              createdAt: newNotif.createdAt,
            },
            ...prev,
          ]);
          setUnreadCount((c) => c + 1);

          // Trigger dynamic UI toast
          const m = `${newNotif.title}: ${newNotif.message}`;
          if (newNotif.type === "success") toast.success(m);
          else if (newNotif.type === "danger") toast.error(m);
          else if (newNotif.type === "warning") toast.warning(m);
          else toast.info(m);

          // Apply micro-animation shake style to Navbar Bell icon
          const bell = document.getElementById("notif-bell-icon");
          if (bell) {
            bell.classList.add("animate-shake");
            setTimeout(() => bell.classList.remove("animate-shake"), 600);
          }
        }
      } catch (err) {
        console.error("[WebSocket] Parser error on packet:", err.message);
      }
    };

    ws.onclose = (event) => {
      console.log(`[WebSocket] Connection closed (Code: ${event.code}).`);
      // Standard client logout (1000/1001) does not reconnect
      if (event.code !== 1000 && event.code !== 1001 && user) {
        attemptReconnect();
      }
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Error occurred:", err);
    };
  }, [user, toast]);

  // 7. Handle reconnection with exponential backoff
  const attemptReconnect = useCallback(() => {
    if (!user) return;
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
    reconnectAttempts.current += 1;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectTimeoutRef.current = setTimeout(() => {
      connectWebSocket();
    }, delay);
  }, [user, connectWebSocket]);

  // Initialize lifecycle
  useEffect(() => {
    if (user) {
      fetchNotifications();
      connectWebSocket();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      if (socketRef.current) {
        socketRef.current.close(1000, "Logout");
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close(1000, "Cleanup");
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, fetchNotifications, connectWebSocket]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch: fetchNotifications,
  };
}
