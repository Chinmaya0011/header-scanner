"use client";
import { useState } from "react";
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
    if (percentage >= 80) return { text: "Strong", color: "text-success", icon: MdSecurity };
    if (percentage >= 60) return { text: "Moderate", color: "text-warning", icon: MdSecurity };
    if (percentage >= 40) return { text: "Weak", color: "text-orange-500", icon: MdWarning };
    return { text: "Critical", color: "text-danger", icon: MdCancel };
  };

  const posture = getSecurityPosture();

  return (
    <div className="space-y-6 fade-in-up">
      {/* Overview Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-lg">
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
                <h2 className="font-mono text-xl font-bold text-text">{domain}</h2>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-dim hover:text-accent transition-colors"
                  aria-label="Open website in new tab"
                >
                  <MdOpenInNew className="text-sm" />
                </a>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${posture.color}/10`}>
                  <posture.icon className={`text-xs ${posture.color}`} />
                  <span className={`text-xs font-medium ${posture.color}`}>
                    {posture.text} Security
                  </span>
                </div>
              </div>
              <p className="text-text-dim text-sm mt-1">
                Security header analysis report
              </p>
            </div>

            {/* Stats Row with Explanations */}
            <div className="flex flex-wrap gap-3">
              <StatPill
                icon={MdCheckCircle}
                value={summary.present}
                label="Configured"
                color="text-success"
                bg="bg-success/10"
                tooltip="Headers that are properly configured and providing security benefits"
              />
              <StatPill
                icon={MdWarning}
                value={summary.weak}
                label="Weak"
                color="text-warning"
                bg="bg-warning/10"
                tooltip="Headers that are present but have security weaknesses or misconfigurations"
              />
              <StatPill
                icon={MdCancel}
                value={summary.missing}
                label="Missing"
                color="text-danger"
                bg="bg-danger/10"
                tooltip="Essential security headers that are not implemented"
              />
              <StatPill
                icon={MdTrendingUp}
                value={`${Math.round((summary.present / headers.length) * 100)}%`}
                label="Coverage"
                color="text-accent"
                bg="bg-accent/10"
                tooltip="Percentage of security headers implemented"
              />
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap gap-4 text-xs text-text-dim font-mono">
              {statusCode && (
                <div className="flex items-center gap-1.5 group relative">
                  <MdHttp />
                  <span>HTTP {statusCode}</span>
                  <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 px-2 py-1 bg-bg border border-border rounded text-xs whitespace-nowrap z-10">
                    HTTP response status code
                  </div>
                </div>
              )}
              {scanDuration && (
                <div className="flex items-center gap-1.5 group relative">
                  <MdAccessTime />
                  <span>{scanDuration}ms</span>
                  <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 px-2 py-1 bg-bg border border-border rounded text-xs whitespace-nowrap z-10">
                    Time taken to complete the scan
                  </div>
                </div>
              )}
              
              {/* Info Button for detailed explanation */}
              <button
                onClick={() => setShowSummaryPopup(true)}
                className="flex items-center gap-1.5 text-accent hover:text-accent-light transition-colors ml-auto"
              >
                <MdInfoOutline />
                <span>How to improve?</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Headers Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-dim uppercase tracking-widest">
            Header Analysis
          </h3>
          <div className="text-xs text-text-dim">
            {headers.filter(h => h.status === 'present').length} of {headers.length} headers configured
          </div>
        </div>
        <div className="space-y-2">
          {headers.map((header, i) => (
            <HeaderCard key={header.name} header={header} index={i} />
          ))}
        </div>
      </div>

      {/* Summary Popup - Improvement Guide */}
      {showSummaryPopup && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={() => setShowSummaryPopup(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 animate-slideUp">
            <div className="bg-surface rounded-xl border border-border shadow-2xl">
              <div className="p-6">
                <h3 className="text-lg font-bold text-text mb-4">
                  How to Improve Your Score
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-text-dim">
                      Based on your scan results, here's what you can do:
                    </p>
                    
                    {summary.missing > 0 && (
                      <div className="bg-danger/10 rounded-lg p-3">
                        <p className="text-sm font-semibold text-danger mb-1">
                          Missing Headers ({summary.missing})
                        </p>
                        <p className="text-xs text-text-dim">
                          Add missing security headers first. They provide the biggest security boost.
                        </p>
                      </div>
                    )}
                    
                    {summary.weak > 0 && (
                      <div className="bg-warning/10 rounded-lg p-3">
                        <p className="text-sm font-semibold text-warning mb-1">
                          Weak Configurations ({summary.weak})
                        </p>
                        <p className="text-xs text-text-dim">
                          Review and strengthen weak header configurations.
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-accent/10 rounded-lg p-3">
                      <p className="text-sm font-semibold text-accent mb-1">
                        Priority Order
                      </p>
                      <ol className="text-xs text-text-dim space-y-1 list-decimal list-inside">
                        <li>Fix critical severity headers first</li>
                        <li>Add missing high priority headers</li>
                        <li>Strengthen weak configurations</li>
                        <li>Review medium severity headers</li>
                      </ol>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowSummaryPopup(false)}
                  className="w-full mt-6 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors"
                >
                  Close
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
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${bg} cursor-help`}>
        <Icon className={`text-base ${color}`} />
        <span className={`font-mono font-bold text-sm ${color}`}>{value}</span>
        <span className="text-text-dim text-xs">{label}</span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}