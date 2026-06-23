"use client";

import React, { useEffect, useState } from "react";
import { Shield } from "lucide-react";

export default function Loading({ message = "SYSTEM LOADING...", fullScreen = false }) {
  const [logs, setLogs] = useState([
    "INITIALIZING SYSTEM HANDSHAKE...",
    "RESOLVING ENDPOINT SCHEMA...",
  ]);

  useEffect(() => {
    if (!fullScreen) return;
    const additionalLogs = [
      "ESTABLISHING DATABASE HANDSHAKE...",
      "FETCHING SECURE PORTAL TOKENS...",
      "TUNING THREAT MATRIX DETECTION...",
      "COMPILING WEB POSTURE ANALYTICS...",
      "SYSTEM STATUS: COMPLIANT & ACTIVE.",
    ];
    let count = 0;
    const interval = setInterval(() => {
      if (count < additionalLogs.length) {
        setLogs((prev) => [...prev, additionalLogs[count]]);
        count++;
      } else {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [fullScreen]);

  if (fullScreen) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 font-mono select-none relative overflow-hidden bg-[#030712] text-text">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-surface/40 to-bg" />

        {/* Scanning laser line */}
        <div
          className="absolute top-0 left-0 w-full h-[2px] animate-[scanLine_2s_ease-in-out_infinite]"
          style={{
            background: "var(--accent)",
            opacity: 0.25,
            boxShadow: "0 0 12px var(--accent)"
          }}
        />

        <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-md w-full p-8 rounded-2xl backdrop-blur-xl border border-white/[0.05] bg-surface/90 shadow-[0_0_35px_rgba(99,102,241,0.12)] animate-fadeInUp">
          {/* Header Panel */}
          <div className="w-full flex items-center justify-between border-b border-white/[0.05] pb-3 text-[9px] uppercase tracking-widest text-text-dim font-bold">
            <span>SECURE SYSTEM MODULE</span>
            <span className="animate-pulse text-success font-black">● TELEMETRY ONLINE</span>
          </div>

          {/* Glowing Double-Ring Spinner */}
          <div className="relative h-18 w-18 flex items-center justify-center">
            {/* Pulsing ring indicator */}
            <div className="absolute inset-[-4px] rounded-full border border-accent/10 animate-ping" />
            
            {/* Outer spinning ring (clockwise) */}
            <div className="absolute inset-0 rounded-full border-2 border-white/5 border-t-accent animate-spin" />
            
            {/* Inner spinning ring (counter-clockwise) */}
            <div 
              className="absolute inset-2.5 rounded-full border border-white/5 border-b-accent-light" 
              style={{ animation: "spin 1.5s linear infinite reverse" }}
            />
            
            {/* Centered pulsing shield */}
            <Shield className="absolute text-accent h-5 w-5 animate-pulse" />
          </div>

          {/* Status logs text */}
          <div className="space-y-1.5 font-sans">
            <p className="text-xs font-black tracking-widest uppercase animate-pulse text-accent font-mono">
              {message}
            </p>
            <p className="text-[9.5px] uppercase tracking-wider text-text-dim font-semibold">
              Configuring encryption matrices & cert checks
            </p>
          </div>

          {/* High-tech simulated log console */}
          <div className="w-full text-left p-3.5 rounded-xl text-[9px] font-semibold bg-[#030712] border border-white/[0.04] text-text-muted leading-relaxed font-mono h-24 overflow-y-auto scrollbar-thin">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-2">
                <span className="text-accent">&gt;</span>
                <span className="truncate">{log}</span>
              </div>
            ))}
            <div className="text-accent animate-pulse">&gt; FETCHING CORE METRICS...</div>
          </div>
        </div>
      </div>
    );
  }

  // Standard inline loader used inside components & dashboard cards
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 text-text animate-fadeIn">
      {/* Sleek inline double ring */}
      <div className="relative h-12 w-12 flex items-center justify-center">
        <div className="absolute inset-[-2px] rounded-full border border-accent/5 animate-ping" />
        <div className="absolute inset-0 rounded-full border-2 border-white/5 border-t-accent animate-spin" />
        <div 
          className="absolute inset-1.5 rounded-full border border-white/5 border-b-accent-light" 
          style={{ animation: "spin 1.5s linear infinite reverse" }}
        />
        <Shield className="absolute text-accent h-4 w-4 animate-pulse" />
      </div>
      
      {message && (
        <p className="text-[9px] uppercase tracking-widest font-black text-text-muted text-center font-mono">
          {message}
        </p>
      )}
    </div>
  );
}
