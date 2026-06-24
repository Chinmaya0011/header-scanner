"use client";

import { useEffect } from "react";

/**
 * VisitTracker — fires POST /api/track-visit once on every page mount.
 * Renders nothing. Import this in layout.js to count page views globally.
 */
export default function VisitTracker() {
  useEffect(() => {
    fetch("/api/track-visit", { method: "POST" }).catch(() => {
      // Silently ignore errors — analytics should never break UX
    });
  }, []);

  return null;
}
