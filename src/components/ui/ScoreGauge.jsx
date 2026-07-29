"use client";

import Link from "next/link";
import { Info, ShieldCheck, ShieldAlert, AlertTriangle } from "lucide-react";

function getGradeStyle(grade) {
  if (grade?.startsWith("A")) {
    return {
      stroke: "var(--success)",
      textClass: "text-success grade-a",
      badgeBg: "bg-success/10 border-success/30 text-success",
      label: "Optimal Security",
      icon: ShieldCheck
    };
  }
  if (grade?.startsWith("B")) {
    return {
      stroke: "var(--accent)",
      textClass: "text-accent grade-b",
      badgeBg: "bg-accent/10 border-accent/30 text-accent",
      label: "Strong Safeguards",
      icon: ShieldCheck
    };
  }
  if (grade?.startsWith("C") || grade?.startsWith("D")) {
    return {
      stroke: "var(--warning)",
      textClass: "text-warning grade-c",
      badgeBg: "bg-warning/10 border-warning/30 text-warning",
      label: "Needs Improvement",
      icon: AlertTriangle
    };
  }
  return {
    stroke: "var(--danger)",
    textClass: "text-danger grade-f",
    badgeBg: "bg-danger/10 border-danger/30 text-danger",
    label: "Critical Risk",
    icon: ShieldAlert
  };
}

export default function ScoreGauge({ score = 0, grade = "F", scanId, domain, size = 160 }) {
  const radius = (size - 24) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (Math.min(100, Math.max(0, score)) / 100) * circ;
  const style = getGradeStyle(grade);
  const PostureIcon = style.icon;

  const explanationUrl = `/score-explanation?score=${score}&grade=${grade}${
    scanId ? `&scanId=${scanId}` : ""
  }${domain ? `&domain=${encodeURIComponent(domain)}` : ""}`;

  return (
    <div className="flex flex-col items-center justify-center p-2 relative font-sans">
      {/* Gauge Container */}
      <div className="relative flex items-center justify-center group" style={{ width: size, height: size }}>
        {/* Glow Ring Behind Arc */}
        <div 
          className="absolute inset-2 rounded-full blur-xl opacity-20 transition-all duration-500 group-hover:opacity-35"
          style={{ backgroundColor: style.stroke }}
        />

        <svg width={size} height={size} className="-rotate-90 relative z-10">
          {/* Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="10"
            className="opacity-60"
          />
          {/* Animated Arc Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={style.stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          />
        </svg>

        {/* Center Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <span className={`font-mono font-black text-4xl sm:text-5xl tracking-tight ${style.textClass}`}>
            {grade}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <span className="font-mono font-bold text-sm text-text-dim">
              {score}
            </span>
            <span className="font-mono text-xs text-text-muted">/100</span>
          </div>
        </div>
      </div>

      {/* Posture Badge & Guide Link */}
      <div className="mt-3 text-center flex flex-col items-center gap-1.5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-mono font-bold uppercase tracking-wider ${style.badgeBg}`}>
          <PostureIcon className="w-3.5 h-3.5" />
          {style.label}
        </span>

        <Link
          href={explanationUrl}
          className="text-[11px] text-text-dim hover:text-accent font-medium transition-colors inline-flex items-center gap-1 mt-1"
        >
          <Info className="h-3 w-3 text-accent" />
          <span>Audit Scoring Methodology &rarr;</span>
        </Link>
      </div>
    </div>
  );
}
