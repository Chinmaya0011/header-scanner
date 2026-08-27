"use client";

import React from "react";
import { AlertTriangle, AlertOctagon, Info, ShieldAlert, ShieldCheck } from "lucide-react";

export function SeverityBadge({ severity, size = "md", className = "" }) {
  const normSev = (severity || "").toUpperCase();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold rounded-md gap-1",
    md: "px-2.5 py-1 text-xs font-semibold rounded-lg gap-1.5",
    lg: "px-3 py-1.5 text-sm font-semibold rounded-lg gap-2",
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  switch (normSev) {
    case "ERROR":
    case "CRITICAL":
    case "HIGH":
      return (
        <span
          className={`inline-flex items-center bg-red-500/10 text-red-400 border border-red-500/30 ${sizeClasses[size]} ${className}`}
        >
          <AlertOctagon size={iconSizes[size]} className="text-red-400" />
          {normSev === "ERROR" ? "CRITICAL / ERROR" : normSev}
        </span>
      );

    case "WARNING":
    case "MEDIUM":
      return (
        <span
          className={`inline-flex items-center bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses[size]} ${className}`}
        >
          <AlertTriangle size={iconSizes[size]} className="text-amber-400" />
          {normSev === "WARNING" ? "WARNING" : normSev}
        </span>
      );

    case "INFO":
    case "LOW":
      return (
        <span
          className={`inline-flex items-center bg-blue-500/10 text-blue-400 border border-blue-500/30 ${sizeClasses[size]} ${className}`}
        >
          <Info size={iconSizes[size]} className="text-blue-400" />
          {normSev}
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center bg-slate-500/10 text-slate-400 border border-slate-500/30 ${sizeClasses[size]} ${className}`}
        >
          <ShieldCheck size={iconSizes[size]} className="text-slate-400" />
          {normSev || "UNKNOWN"}
        </span>
      );
  }
}

export function ImpactBadge({ impact }) {
  const normImpact = (impact || "").toUpperCase();
  const colorMap = {
    HIGH: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    MEDIUM: "bg-orange-500/10 text-orange-300 border-orange-500/30",
    LOW: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
  };

  const style = colorMap[normImpact] || "bg-slate-500/10 text-slate-400 border-slate-500/30";

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${style}`}>
      Impact: {normImpact || "N/A"}
    </span>
  );
}

export function ConfidenceBadge({ confidence }) {
  const normConf = (confidence || "").toUpperCase();
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border bg-purple-500/10 text-purple-300 border-purple-500/30">
      Confidence: {normConf || "N/A"}
    </span>
  );
}
