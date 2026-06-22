"use client";

import React from "react";

export default function Loading({ message = "Processing action..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 font-sans text-text">
      <div className="relative h-12 w-12 flex items-center justify-center">
        {/* Outer spinner ring */}
        <div className="absolute inset-0 rounded-full border-2 border-border border-t-accent animate-spin" />

        {/* Inner spinner ring - reverse direction */}
        <div className="h-6 w-6 rounded-full border border-border border-b-accent animate-[spin_1.2s_linear_infinite_reverse]" />

        {/* Center pulsing core */}
        <div className="h-2.5 w-2.5 rounded-full bg-accent animate-pulse" />
      </div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-text-dim animate-pulse">
        {message}
      </p>
    </div>
  );
}
