"use client";
import Link from "next/link";
import { MdInfoOutline } from "react-icons/md";

// Grade color mapping
function gradeColor(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "#00e676";
  if (grade === "B+" || grade === "B" || grade === "B-") return "#00d4ff";
  if (grade === "C+" || grade === "C" || grade === "C-") return "#ffb74d";
  if (grade === "D+" || grade === "D" || grade === "D-") return "#ff9800";
  return "#ff5252";
}
//update
function gradeClass(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "text-[#00e676]";
  if (grade === "B+" || grade === "B" || grade === "B-") return "text-[#00d4ff]";
  if (grade === "C+" || grade === "C" || grade === "C-") return "text-[#ffb74d]";
  if (grade === "D+" || grade === "D" || grade === "D-") return "text-[#ff9800]";
  return "text-[#ff5252]";
}

export default function ScoreGauge({ score, grade, scanId, domain }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = gradeColor(grade);
  const gradeClassName = gradeClass(grade);

  const getScoreMessage = () => {
    if (score >= 85) return "Excellent! Your security headers are well configured.";
    if (score >= 70) return "Good! Just a few improvements needed.";
    if (score >= 55) return "Fair! Several critical headers missing.";
    if (score >= 40) return "Poor! Immediate action required.";
    return "Critical! Your site is at severe risk.";
  };

  // Build the URL with query parameters
  const explanationUrl = `/score-explanation?score=${score}&grade=${grade}${
    scanId ? `&scanId=${scanId}` : ""
  }${domain ? `&domain=${encodeURIComponent(domain)}` : ""}`;

  return (
    <div className="flex flex-col items-center gap-3 relative">
      {/* Gauge Container */}
      <div className="relative flex items-center justify-center group">
        <svg width="140" height="140" className="-rotate-90">
          {/* Background Circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#1e2d45"
            strokeWidth="10"
          />
          {/* Score Circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * radius}
            strokeDashoffset={offset}
            style={{ 
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute flex flex-col items-center">
          <span
            className={`font-mono font-bold text-4xl ${gradeClassName}`}
            style={{ color }}
          >
            {grade}
          </span>
          <span className="text-text-dim text-xs mt-0.5 font-mono">
            {score}/100
          </span>
        </div>

     
      </div>

      {/* Score Message with Link */}
      <div className="text-center">
       
        <Link
          href={explanationUrl}
          className="text-xs text-accent hover:text-accent-light transition-colors inline-flex items-center gap-1"
        >
          Learn how it's calculated →
        </Link>
      </div>
    </div>
  );
}