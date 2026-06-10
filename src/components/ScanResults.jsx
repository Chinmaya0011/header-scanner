"use client";
import { useState } from "react";
import Link from "next/link";
import ScoreGauge from "./ScoreGauge";
import HeaderCard from "./HeaderCard";
import {
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdAccessTime,
  MdHttp,
  MdOpenInNew,
  MdInfoOutline,
  MdTrendingUp,
  MdSecurity,
} from "react-icons/md";

export default function ScanResults({ result }) {
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const { url, domain, score, grade, headers, statusCode, scanDuration, summary } = result;

  // Calculate overall security posture
  const getSecurityPosture = () => {
    const percentage = (summary.present / headers.length) * 100;
    if (percentage >= 80) return { text: "Strong", color: "text-emerald-500", icon: MdSecurity };
    if (percentage >= 60) return { text: "Moderate", color: "text-amber-500", icon: MdSecurity };
    if (percentage >= 40) return { text: "Weak", color: "text-orange-500", icon: MdWarning };
    return { text: "Critical", color: "text-red-500", icon: MdCancel };
  };

  const posture = getSecurityPosture();

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Overview Card */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Score Gauge */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <ScoreGauge score={score} grade={grade} />
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4">
              {/* Domain and URL */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 group">
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-mono text-xl font-bold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
                    >
                      {domain}
                      <MdOpenInNew className="text-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${posture.color.replace('text', 'bg')}/10 backdrop-blur-sm`}>
                    <posture.icon className={`text-xs ${posture.color}`} />
                    <span className={`text-xs font-semibold ${posture.color}`}>
                      {posture.text} Security
                    </span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">
                  Comprehensive security header analysis report
                </p>
              </div>

              {/* Stats Row with Explanations */}
              <div className="flex flex-wrap gap-3">
                <StatPill
                  icon={MdCheckCircle}
                  value={summary.present}
                  label="Configured"
                  color="text-emerald-500"
                  bg="bg-emerald-500/10"
                  tooltip="Headers that are properly configured and providing security benefits"
                />
                <StatPill
                  icon={MdWarning}
                  value={summary.weak}
                  label="Weak"
                  color="text-amber-500"
                  bg="bg-amber-500/10"
                  tooltip="Headers that are present but have security weaknesses or misconfigurations"
                />
                <StatPill
                  icon={MdCancel}
                  value={summary.missing}
                  label="Missing"
                  color="text-red-500"
                  bg="bg-red-500/10"
                  tooltip="Essential security headers that are not implemented"
                />
                <StatPill
                  icon={MdTrendingUp}
                  value={`${Math.round((summary.present / headers.length) * 100)}%`}
                  label="Coverage"
                  color="text-blue-500"
                  bg="bg-blue-500/10"
                  tooltip="Percentage of security headers implemented"
                />
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gray-500 dark:text-gray-400 font-mono border-t border-gray-200 dark:border-gray-800">
                {statusCode && (
                  <div className="flex items-center gap-1.5 group relative">
                    <MdHttp className="text-base" />
                    <span className="font-medium">HTTP {statusCode}</span>
                    <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                      HTTP response status code
                    </div>
                  </div>
                )}
                {scanDuration && (
                  <div className="flex items-center gap-1.5 group relative">
                    <MdAccessTime className="text-base" />
                    <span className="font-medium">{scanDuration}ms</span>
                    <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-10">
                      Time taken to complete the scan
                    </div>
                  </div>
                )}
                
                {/* Info Button for detailed explanation */}
                <button
                  onClick={() => setShowSummaryPopup(true)}
                  className="flex items-center gap-1.5 ml-auto px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-950/30 rounded-lg transition-all hover:scale-105"
                >
                  <MdInfoOutline className="text-base" />
                  <span className="text-sm font-medium">How to improve?</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Headers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Security Header Analysis
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Detailed breakdown of each security header
            </p>
          </div>
          <div className="text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
            {headers.filter(h => h.status === 'present').length} / {headers.length} configured
          </div>
        </div>
        <div className="space-y-3">
          {headers.map((header, i) => (
            <HeaderCard key={header.name} header={header} index={i} />
          ))}
        </div>
      </div>

      {/* Summary Popup - Improvement Guide */}
      {showSummaryPopup && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={() => setShowSummaryPopup(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 animate-slideUp">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Security Improvement Guide
                  </h3>
                  <button
                    onClick={() => setShowSummaryPopup(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <MdCancel className="text-2xl" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Based on your scan results, here's your prioritized action plan:
                  </p>
                  
                  {summary.missing > 0 && (
                    <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 rounded-lg p-4">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
                        Critical: Missing Headers ({summary.missing})
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-300">
                        Add missing security headers first. They provide the biggest security boost and protect against common vulnerabilities.
                      </p>
                    </div>
                  )}
                  
                  {summary.weak > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-lg p-4">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2">
                        High Priority: Weak Configurations ({summary.weak})
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-300">
                        Review and strengthen weak header configurations to maximize security effectiveness.
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                      Recommended Priority Order
                    </p>
                    <ol className="text-xs text-blue-600 dark:text-blue-300 space-y-1.5 list-decimal list-inside">
                      <li>Fix critical severity headers first</li>
                      <li>Add missing high-priority security headers</li>
                      <li>Strengthen weak configurations</li>
                      <li>Review and optimize medium severity headers</li>
                    </ol>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowSummaryPopup(false)}
                  className="w-full mt-6 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all hover:scale-105 shadow-lg"
                >
                  Got it, let's improve
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Enhanced StatPill with tooltip
function StatPill({ icon: Icon, value, label, color, bg, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${bg} cursor-help transition-all hover:scale-105 hover:shadow-md`}>
        <Icon className={`text-base ${color}`} />
        <span className={`font-mono font-bold text-sm ${color}`}>{value}</span>
        <span className="text-gray-600 dark:text-gray-400 text-xs font-medium">{label}</span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-10 pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}