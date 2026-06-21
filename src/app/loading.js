"use client";

import React from "react";

export default function Loading({ message = "Establishing Link" }) {
  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-6 font-mono select-none relative overflow-hidden"
      style={{
        backgroundColor: "var(--bg)",
        color: "var(--text)"
      }}
    >
      {/* Background gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, var(--surface) 0%, var(--bg) 100%)`,
          opacity: 0.4
        }}
      />

      {/* Scanning line */}
      <div
        className="absolute top-0 left-0 w-full h-[2px] animate-[scanLine_2s_ease-in-out_infinite]"
        style={{
          background: "var(--accent)",
          opacity: 0.2,
          boxShadow: `0 0 10px var(--accent)`
        }}
      />

      <div
        className="z-10 flex flex-col items-center text-center space-y-6 max-w-md w-full p-8 rounded-xl backdrop-blur-sm"
        style={{
          border: `1px solid var(--border)`,
          backgroundColor: "var(--surface)",
          opacity: 0.9,
          boxShadow: `0 0 30px var(--accent)`,
          boxShadow: "0 0 30px rgba(0, 255, 65, 0.15)"
        }}
      >
        {/* Terminal Header */}
        <div
          className="w-full flex items-center justify-between border-b pb-3 text-[10px] uppercase tracking-wider"
          style={{
            borderColor: "var(--border)",
            color: "var(--text)",
            opacity: 0.6
          }}
        >
          <span>SYSTEM LOADING...</span>
          <span className="animate-pulse" style={{ color: "var(--success)" }}>● STABLE</span>
        </div>

        {/* Loader Graphics */}
        <div className="relative h-16 w-16 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-4 animate-spin"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--accent)"
            }}
          />
          <div
            className="h-8 w-8 rounded-full border animate-[spin_1.5s_linear_infinite_reverse]"
            style={{
              borderColor: "var(--border)",
              borderBottomColor: "var(--accent)"
            }}
          />
        </div>

        {/* Status text */}
        <div className="space-y-2">
          <p
            className="text-sm font-bold tracking-widest uppercase animate-pulse"
            style={{ color: "var(--accent)" }}
          >
            {message}
          </p>
          <p
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "var(--text)", opacity: 0.6 }}
          >
            Resolving secure headers & authentication
          </p>
        </div>

        {/* Cyber terminal commands decoration */}
        <div
          className="w-full text-left p-3 rounded-lg text-[9px] leading-relaxed font-semibold"
          style={{
            backgroundColor: "var(--bg)",
            border: `1px solid var(--border)`,
            color: "var(--text)",
            opacity: 0.5
          }}
        >
          <div className="flex gap-1.5">
            <span style={{ color: "var(--accent)" }}>&gt;</span>
            AUTH_RESOLVE_SECURE_TOKEN
          </div>
          <div className="flex gap-1.5">
            <span style={{ color: "var(--accent)" }}>&gt;</span>
            CONNECTING_DB_CLUSTER_NODES
          </div>
          <div className="flex gap-1.5">
            <span style={{ color: "var(--accent)" }}>&gt;</span>
            STATUS: <span style={{ color: "var(--success)" }}>ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
}