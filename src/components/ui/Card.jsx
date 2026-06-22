"use client";

import React from "react";

export default function Card({
  children,
  className = "",
  hoverable = false,
  glow = false,
  ...props
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface p-5 sm:p-6 transition-all duration-300 ${
        hoverable ? "hover:border-border-hover hover:shadow-lg hover:-translate-y-0.5" : ""
      } ${glow ? "shadow-glow" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
