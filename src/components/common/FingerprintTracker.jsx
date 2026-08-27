"use client";

import { useEffect, useRef } from "react";
import { useVisitorData } from "@fingerprint/react";

/**
 * FingerprintTracker — Client component that initializes visitor identification at startup
 * and logs visitor_id and event_id to browser console.
 */
export default function FingerprintTracker() {
  const { data, error, isLoading } = useVisitorData({ immediate: true });
  const loggedRef = useRef(false);

  useEffect(() => {
    if (data && !loggedRef.current) {
      loggedRef.current = true;
      const visitorId = data.visitorId || data.visitor_id;
      const eventId = data.requestId || data.event_id;
      
      console.log("[Fingerprint Device Intelligence] Visitor Identification Result:", {
        visitor_id: visitorId,
        event_id: eventId,
        confidence: data.confidence,
        raw: data,
      });

      // Simple direct console log matching step 2 requirements:
      console.log("Fingerprint visitor_id:", visitorId, "event_id:", eventId);

      if (typeof window !== "undefined") {
        window.__fingerprintResult = {
          visitor_id: visitorId,
          event_id: eventId,
          confidence: data.confidence?.score,
          data,
        };
        // Dispatch custom event for real-time reactive UI updates
        window.dispatchEvent(new CustomEvent("fingerprint:identified", { detail: window.__fingerprintResult }));
      }
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      console.warn("[Fingerprint Device Intelligence] Visitor Identification Error:", error);
    }
  }, [error]);

  return null;
}
