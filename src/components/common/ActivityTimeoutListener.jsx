"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";

// Cookie helper functions
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const setCookie = (name, value, maxAgeSeconds) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Strict; Secure=${process.env.NODE_ENV === "production" ? "true" : "false"}`;
};

export default function ActivityTimeoutListener() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  
  const [isSessionActive, setIsSessionActive] = useState(false);
  const lastActivity = useRef(Date.now());
  const lastCookieWrite = useRef(0);
  const intervalRef = useRef(null);
  const hasShownTimeoutToast = useRef(false);

  // Inactivity limit (10 minutes)
  const INACTIVITY_LIMIT = 10 * 60 * 1000;

  // Check URL params for timeout messages and verify session status
  useEffect(() => {
    // Check search params directly via window.location to avoid Suspense layout wraps
    if (typeof window !== "undefined" && window.location.search && !hasShownTimeoutToast.current) {
      const params = new URLSearchParams(window.location.search);
      const timeoutType = params.get("timeout");
      
      if (timeoutType === "inactivity" || timeoutType === "demo") {
        hasShownTimeoutToast.current = true;
        
        if (timeoutType === "inactivity") {
          toast.warning("You have been automatically logged out due to 10 minutes of inactivity.");
        } else if (timeoutType === "demo") {
          toast.warning("Demo session ended due to 10 minutes of inactivity.");
        }
        
        // Clean URL params synchronously without triggering router reload loops
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, "", cleanUrl);
      }
    }

    async function checkSession() {
      // Treat /demo/* routes as active simulated sessions
      if (pathname && pathname.startsWith("/demo")) {
        setIsSessionActive(true);
        lastActivity.current = Date.now();
        return;
      }

      // Avoid session checks on login/register/home pages
      if (pathname === "/login" || pathname === "/register" || pathname === "/home" || pathname === "/") {
        setIsSessionActive(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          setIsSessionActive(false);
          return;
        }
        const data = await res.json();
        if (data && data.loggedIn) {
          setIsSessionActive(true);
          lastActivity.current = Date.now();
          // Initialize lastActivityTime cookie if not set
          if (!getCookie("lastActivityTime")) {
            setCookie("lastActivityTime", Date.now().toString(), 7 * 24 * 60 * 60);
          }
        } else {
          setIsSessionActive(false);
        }
      } catch (err) {
        console.error("Inactivity listener session check failed:", err);
        setIsSessionActive(false);
      }
    }

    checkSession();
  }, [pathname, router, toast]);

  // Set up activity event listeners and checking interval
  useEffect(() => {
    if (!isSessionActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastActivity.current = Date.now();

    const handleUserActivity = () => {
      const now = Date.now();
      lastActivity.current = now;

      // Throttle cookie writes to once every 10 seconds to optimize performance
      if (pathname && !pathname.startsWith("/demo") && now - lastCookieWrite.current > 10000) {
        setCookie("lastActivityTime", now.toString(), 7 * 24 * 60 * 60);
        lastCookieWrite.current = now;
      }
    };

    // Register interaction listeners
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("mousedown", handleUserActivity);
    window.addEventListener("touchstart", handleUserActivity);

    // Run checker every 5 seconds
    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      let elapsed = now - lastActivity.current;

      // Sync with lastActivityTime cookie for real sessions
      if (pathname && !pathname.startsWith("/demo")) {
        const cookieTime = getCookie("lastActivityTime");
        if (cookieTime) {
          const parsedCookieTime = parseInt(cookieTime);
          const cookieElapsed = now - parsedCookieTime;
          // Use whichever elapsed time is smaller (local or cookie) for precision
          elapsed = Math.min(elapsed, cookieElapsed);
        }
      }
      
      if (elapsed >= INACTIVITY_LIMIT) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        
        // Log out user
        if (pathname && pathname.startsWith("/demo")) {
          router.push("/login?timeout=demo");
          router.refresh();
        } else {
          try {
            const logoutRes = await fetch("/api/auth/logout", { method: "POST" });
            if (logoutRes.ok) {
              router.push("/login?timeout=inactivity");
              router.refresh();
            }
          } catch (err) {
            console.error("Auto logout post failure:", err);
            router.push("/login?timeout=inactivity");
            router.refresh();
          }
        }
      }
    }, 5000);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("mousedown", handleUserActivity);
      window.removeEventListener("touchstart", handleUserActivity);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSessionActive, pathname, router]);

  return null;
}
