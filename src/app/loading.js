"use client";

import React from "react";

export default function Loading({ message = "Establishing Link" }) {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 font-mono select-none relative overflow-hidden bg-bg text-text">
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-br from-surface/40 to-bg"
      />

      {/* Scanning line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] animate-[scanLine_2s_ease-in-out_infinite]"
        style={{
          background: "var(--accent)",
          opacity: 0.2,
          boxShadow: "0 0 10px var(--accent)"
        }}
      />

      <div className="z-10 flex flex-col items-center text-center space-y-6 max-w-md w-full p-8 rounded-xl backdrop-blur-sm border border-border bg-surface/90 shadow-[0_0_30px_var(--accent-glow, rgba(0,212,255,0.15))]">
        {/* Terminal Header */}
        <div className="w-full flex items-center justify-between border-b border-border pb-3 text-[10px] uppercase tracking-wider text-text/60">
          <span>SYSTEM LOADING...</span>
          <span className="animate-pulse text-accent">● STABLE</span>
        </div>

        {/* Loader Graphics */}
        <div className="relative h-16 w-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 animate-spin border-border border-t-accent" />
          <div className="h-8 w-8 rounded-full border animate-[spin_1.5s_linear_infinite_reverse] border-border border-b-accent" />
        </div>

        {/* Status text */}
        <div className="space-y-2">
          <p className="text-sm font-bold tracking-widest uppercase animate-pulse text-accent">
            {message}
          </p>
          <p className="text-[10px] uppercase tracking-widest text-text/60">
            Resolving secure headers & authentication
          </p>
        </div>

        {/* Cyber terminal commands decoration */}
        <div className="w-full text-left p-3 rounded-lg text-[9px] leading-relaxed font-semibold bg-bg border border-border text-text/50">
          <div className="flex gap-1.5">
            <span className="text-accent">&gt;</span>
            AUTH_RESOLVE_SECURE_TOKEN
          </div>
          <div className="flex gap-1.5">
            <span className="text-accent">&gt;</span>
            CONNECTING_DB_CLUSTER_NODES
          </div>
          <div className="flex gap-1.5">
            <span className="text-accent">&gt;</span>
            STATUS: <span className="text-accent">ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}