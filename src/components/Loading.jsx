"use client";

import React from "react";

export default function Loading({ message = "Processing action..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3 font-mono bg-bg text-text">
      <div className="relative h-10 w-10 flex items-center justify-center">
        {/* Outer spinner ring */}
        <div className="absolute inset-0 rounded-full border-2 animate-spin border-border border-t-accent" />

        {/* Inner spinner ring - reverse direction */}
        <div className="h-5 w-5 rounded-full border animate-[spin_1.2s_linear_infinite_reverse] border-border border-b-accent" />

        {/* Center dot */}
        <div className="h-2 w-2 rounded-full animate-pulse bg-accent" />
      </div>
      <p className="text-[10px] uppercase tracking-widest animate-pulse font-bold text-text">
        {message}
      </p>
    </div>
  );
}