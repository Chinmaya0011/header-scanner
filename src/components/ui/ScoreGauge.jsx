"use client";

import Link from "next/link";
import { Info, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

function getGradeStyle(grade) {
  if (grade?.startsWith("A")) {
    return {
      stroke: "var(--success)",
      textClass: "text-success",
      badgeBg: "badge-passed",
      label: "Optimal Posture",
      icon: ShieldCheck
    };
  }
  if (grade?.startsWith("B")) {
    return {
      stroke: "var(--accent)",
      textClass: "text-accent-light",
      badgeBg: "badge-low",
      label: "Low Risk",
      icon: ShieldCheck
    };
  }
  if (grade?.startsWith("C") || grade?.startsWith("D")) {
    return {
      stroke: "var(--warning)",
      textClass: "text-warning",
      badgeBg: "badge-medium",
      label: "Moderate Risk",
      icon: AlertTriangle
    };
  }
  return {
    stroke: "var(--critical)",
    textClass: "text-critical",
    badgeBg: "badge-critical",
    label: "Critical Risk",
    icon: ShieldAlert
  };
}

export default function ScoreGauge({ score = 0, grade = "F", scanId, domain, size = 150 }) {
  const radius = (size - 20) / 2;
  const circ = 2 * Math.PI * radius;
  const safeScore = Math.min(100, Math.max(0, score));
  const offset = circ - (safeScore / 100) * circ;
  const style = getGradeStyle(grade);
  const PostureIcon = style.icon;

  const explanationUrl = `/score-explanation?score=${score}&grade=${grade}${
    scanId ? `&scanId=${scanId}` : ""
  }${domain ? `&domain=${encodeURIComponent(domain)}` : ""}`;

  return (
    <div className="flex flex-col items-center justify-center font-sans">
      {/* Circle Gauge Container */}
      <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 relative z-10">
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          {/* Progress Arc Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={style.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        </svg>

        {/* Center Score & Grade */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <span className={`font-mono font-bold text-4xl tracking-tight ${style.textClass}`}>
            {grade}
          </span>
          <div className="flex items-center gap-1 mt-0.5 whitespace-nowrap">
            <span className="font-mono font-bold text-sm text-text">
              {safeScore}
            </span>
            <span className="font-mono text-xs text-text-muted">/ 100</span>
          </div>
        </div>
      </div>

      {/* Posture Status & Methodology Link */}
      <div className="mt-3 text-center flex flex-col items-center gap-1.5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-mono font-bold uppercase tracking-wider shrink-0 whitespace-nowrap ${style.badgeBg}`}>
          <PostureIcon className="w-3.5 h-3.5 shrink-0" />
          <span>{style.label}</span>
        </span>

        <Link
          href={explanationUrl}
          className="text-[11px] text-text-dim hover:text-accent font-medium transition-colors inline-flex items-center gap-1 mt-0.5 shrink-0 whitespace-nowrap"
        >
          <Info className="h-3 w-3 text-accent shrink-0" />
          <span>Scoring Methodology &rarr;</span>
        </Link>
      </div>
    </div>
  );
}
