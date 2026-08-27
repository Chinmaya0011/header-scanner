"use client";

import React from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  ShieldCheck,
  FileCode2,
  Tag,
  AlertCircle,
} from "lucide-react";

export default function ScanSummaryCards({ summary, activeSeverityFilter, onSelectSeverityFilter }) {
  const {
    total = 0,
    critical = 0,
    warning = 0,
    info = 0,
    filesCount = 0,
    vulnClassesCount = 0,
    errorsCount = 0,
  } = summary || {};

  const cards = [
    {
      id: "ALL",
      title: "Total Findings",
      value: total,
      subtext: "Aggregated issues across scan",
      icon: ShieldCheck,
      borderColor: "border-slate-700/60 hover:border-indigo-500/50",
      bgColor: "bg-slate-900/80",
      textColor: "text-slate-100",
      iconBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    },
    {
      id: "ERROR",
      title: "Critical / Error",
      value: critical,
      subtext: "Requires immediate attention",
      icon: AlertOctagon,
      borderColor: "border-red-900/40 hover:border-red-500/60",
      bgColor: activeSeverityFilter === "ERROR" ? "bg-red-950/40 border-red-500" : "bg-slate-900/80",
      textColor: "text-red-400",
      iconBg: "bg-red-500/10 text-red-400 border-red-500/30",
    },
    {
      id: "WARNING",
      title: "Warning",
      value: warning,
      subtext: "Potential security vulnerabilities",
      icon: AlertTriangle,
      borderColor: "border-amber-900/40 hover:border-amber-500/60",
      bgColor: activeSeverityFilter === "WARNING" ? "bg-amber-950/40 border-amber-500" : "bg-slate-900/80",
      textColor: "text-amber-400",
      iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "INFO",
      title: "Informational",
      value: info,
      subtext: "Security best practices",
      icon: Info,
      borderColor: "border-blue-900/40 hover:border-blue-500/60",
      bgColor: activeSeverityFilter === "INFO" ? "bg-blue-950/40 border-blue-500" : "bg-slate-900/80",
      textColor: "text-blue-400",
      iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "FILES",
      title: "Files Affected",
      value: filesCount,
      subtext: "Unique source code files",
      icon: FileCode2,
      borderColor: "border-purple-900/40 hover:border-purple-500/60",
      bgColor: "bg-slate-900/80",
      textColor: "text-purple-300",
      iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    {
      id: "VULN_CLASSES",
      title: "Vulnerability Types",
      value: vulnClassesCount,
      subtext: "CWE & rule categories",
      icon: Tag,
      borderColor: "border-teal-900/40 hover:border-teal-500/60",
      bgColor: "bg-slate-900/80",
      textColor: "text-teal-300",
      iconBg: "bg-teal-500/10 text-teal-400 border-teal-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isFilterable = ["ALL", "ERROR", "WARNING", "INFO"].includes(card.id);

        return (
          <div
            key={card.id}
            onClick={() => isFilterable && onSelectSeverityFilter(card.id)}
            className={`p-4 rounded-xl border ${card.borderColor} ${card.bgColor} shadow-lg transition-all duration-200 ${
              isFilterable ? "cursor-pointer transform hover:-translate-y-0.5" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.iconBg}`}>
                <IconComponent size={18} />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-extrabold tracking-tight ${card.textColor}`}>
                {card.value}
              </span>
              {isFilterable && activeSeverityFilter === card.id && (
                <span className="text-[10px] font-bold text-indigo-400 uppercase bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/30">
                  Active
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 mt-1 truncate">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
