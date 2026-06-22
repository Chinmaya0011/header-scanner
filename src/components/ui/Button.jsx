"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  icon: Icon = null,
  ...props
}) {
  const baseStyle = "inline-flex items-center justify-center font-semibold uppercase tracking-wider transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border";
  
  const variants = {
    primary: "bg-accent text-bg hover:bg-accent-light border-transparent hover:shadow-glow focus:ring-2 focus:ring-accent-light/50 font-bold",
    secondary: "bg-accent/10 border-accent/30 text-accent hover:bg-accent/20 focus:ring-2 focus:ring-accent/30",
    outline: "bg-transparent border-border text-text-dim hover:text-text hover:bg-surface focus:ring-2 focus:ring-border",
    danger: "bg-danger/10 border-danger/30 text-danger hover:bg-danger/20 focus:ring-2 focus:ring-danger/30",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px] gap-1.5",
    md: "px-4.5 py-2.5 text-xs gap-2",
    lg: "px-6 py-3.5 text-sm gap-2.5",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : Icon ? (
        <Icon className="h-3.5 w-3.5" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
