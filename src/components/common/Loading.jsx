"use client";

import React from "react";

export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3 font-sans text-text">
      {/* Simple, sleek rotating spinner ring */}
      <div className="h-6 w-6 rounded-full border-[1.5px] border-white/5 border-t-accent animate-spin" />
      <p className="text-[10px] uppercase tracking-wider font-bold text-text-dim">
        {message}
      </p>
    </div>
  );
}
