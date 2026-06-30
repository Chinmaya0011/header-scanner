import { WebSocketServer, WebSocket } from "ws";
import jwt from "jsonwebtoken";

let wss = null;

// Keep track of connected clients: userId -> Set of WebSockets
const userSockets = new Map();

// Keep track of connected client roles: role -> Set of WebSockets
const roleSockets = {
  user: new Set(),
  admin: new Set(),
};

/**
 * Initialize the WebSocket Server on port 3001
 */
export function initSocketServer() {
  if (wss) return;

  const port = process.env.WS_PORT || 3001;
  
  try {
    wss = new WebSocketServer({ port });
    global.wss = wss;

    console.log(`[WebSocket] Server successfully initialized on ws://localhost:${port}`);

    wss.on("connection", (ws, req) => {
      // Extract authentication token from request cookies
      const token = getCookieToken(req);
      if (!token) {
        ws.close(4001, "Unauthorized: No token provided");
        return;
      }

      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
      } catch (err) {
        ws.close(4002, "Unauthorized: Invalid token");
        return;
      }

      const userId = decoded.userId || decoded.id;
      const role = decoded.role || "user";

      if (!userId) {
        ws.close(4003, "Unauthorized: Invalid payload");
        return;
      }

      ws.userId = userId;
      ws.role = role;
      ws.isAlive = true;

      // Register socket to mappings
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(ws);

      if (role === "admin") {
        roleSockets.admin.add(ws);
      } else {
        roleSockets.user.add(ws);
      }

      console.log(`[WebSocket] Client connected: User ${userId} (${role})`);

      // Setup heartbeat ping-pong listeners
      ws.on("pong", () => {
        ws.isAlive = true;
      });

      ws.on("close", () => {
        cleanupSocket(ws);
        console.log(`[WebSocket] Client disconnected: User ${userId}`);
      });

      ws.on("error", (err) => {
        console.error(`[WebSocket] Socket error for user ${userId}:`, err.message);
        cleanupSocket(ws);
      });

      // Send greeting packet
      ws.send(
        JSON.stringify({
          type: "connection_established",
          payload: { userId, role },
        })
      );
    });

    // Heartbeat monitoring interval (30 seconds)
    const interval = setInterval(() => {
      wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          cleanupSocket(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    wss.on("close", () => {
      clearInterval(interval);
    });

  } catch (error) {
    console.error("[WebSocket] Failed to start server:", error.message);
  }
}

/**
 * Remove socket from connection registries
 */
function cleanupSocket(ws) {
  const { userId, role } = ws;
  if (userId && userSockets.has(userId)) {
    userSockets.get(userId).delete(ws);
    if (userSockets.get(userId).size === 0) {
      userSockets.delete(userId);
    }
  }
  if (role === "admin") {
    roleSockets.admin.delete(ws);
  } else if (role === "user") {
    roleSockets.user.delete(ws);
  }
}

/**
 * Parse cookie values out of standard request headers
 */
function getCookieToken(req) {
  const cookieHeader = req.headers.cookie || "";
  const cookies = {};
  cookieHeader.split(";").forEach((cookieStr) => {
    const parts = cookieStr.split("=");
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      cookies[name] = val;
    }
  });
  return cookies.token;
}

/**
 * Send real-time packet to a specific user ID
 */
export function sendNotificationToUser(userId, notification) {
  if (!userId) return;
  const sockets = userSockets.get(userId.toString());
  if (sockets && sockets.size > 0) {
    const payload = JSON.stringify({ type: "notification", payload: notification });
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}

/**
 * Send real-time packet to all users with a specific role
 */
export function sendNotificationToRole(role, notification) {
  if (!role || !roleSockets[role]) return;
  const sockets = roleSockets[role];
  if (sockets && sockets.size > 0) {
    const payload = JSON.stringify({ type: "notification", payload: notification });
    sockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }
}
