"use client";

import React from "react";

export default function Badge({
  children,
  variant = "info",
  className = "",
  ...props
}) {
  const baseStyle = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border font-sans";

  const variants = {
    success: "border-success/30 bg-success/5 text-success",
    warning: "border-warning/30 bg-warning/5 text-warning",
    danger: "border-danger/30 bg-danger/5 text-danger",
    accent: "border-accent/30 bg-accent/5 text-accent",
    info: "border-border bg-surface text-text-dim",
  };

  return (
    <span
      className={`${baseStyle} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
