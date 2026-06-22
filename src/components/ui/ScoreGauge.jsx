"use client";

import Link from "next/link";
import { Info } from "lucide-react";

function gradeColor(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "var(--success)";
  if (grade === "B+" || grade === "B" || grade === "B-") return "var(--accent)";
  if (grade === "C+" || grade === "C" || grade === "C-") return "var(--warning)";
  return "var(--danger)";
}

function gradeClass(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "text-success grade-a";
  if (grade === "B+" || grade === "B" || grade === "B-") return "text-accent grade-b";
  if (grade === "C+" || grade === "C" || grade === "C-") return "text-warning grade-c";
  return "text-danger grade-f";
}

export default function ScoreGauge({ score, grade, scanId, domain }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = gradeColor(grade);
  const gradeClassName = gradeClass(grade);

  const explanationUrl = `/score-explanation?score=${score}&grade=${grade}${
    scanId ? `&scanId=${scanId}` : ""
  }${domain ? `&domain=${encodeURIComponent(domain)}` : ""}`;

  return (
    <div className="flex flex-col items-center gap-3 relative font-sans">
      {/* Gauge Container */}
      <div className="relative flex items-center justify-center group">
        <svg width="140" height="140" className="-rotate-90">
          {/* Background Circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth="8"
          />
          {/* Score Circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ 
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute flex flex-col items-center">
          <span
            className={`font-mono font-bold text-4xl leading-none transition-all duration-300 ${gradeClassName}`}
          >
            {grade}
          </span>
          <span className="text-text-dim text-xs mt-1.5 font-semibold font-mono">
            {score}/100
          </span>
        </div>
      </div>

      {/* Score Message with Link */}
      <div className="text-center">
        <Link
          href={explanationUrl}
          className="text-xs text-accent hover:text-accent-light font-semibold transition-colors inline-flex items-center gap-1"
        >
          <Info className="h-3 w-3" />
          <span>Audit Scoring Guide →</span>
        </Link>
      </div>
    </div>
  );
}
