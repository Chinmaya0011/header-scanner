"use client";

import { useState } from "react";
import Link from "next/link";
import ScoreGauge from "./ScoreGauge";
import HeaderCard from "./HeaderCard";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Globe,
  ExternalLink,
  Info,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export default function ScanResults({ result }) {
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const { url, domain, score, grade, headers, statusCode, scanDuration, summary, compliance } = result;

  // Calculate overall security posture
  const getSecurityPosture = () => {
    const percentage = (summary.present / headers.length) * 100;
    if (percentage >= 80) return { text: "Strong", color: "text-success border-success/30 bg-success/10" };
    if (percentage >= 60) return { text: "Moderate", color: "text-accent border-accent/30 bg-accent/10" };
    if (percentage >= 40) return { text: "Weak", color: "text-warning border-warning/30 bg-warning/10" };
    return { text: "Critical", color: "text-danger border-danger/30 bg-danger/10" };
  };

  const posture = getSecurityPosture();

  // Calculate compliance if missing (for legacy scans)
  const isHeaderValid = (headerName) => {
    const key = headerName.toLowerCase();
    const headerResult = headers?.find(h => (h.name || h.header || "").toLowerCase() === key);
    return headerResult && (headerResult.status === "present" || headerResult.currentStatus === "present");
  };

  const getCompliance = () => {
    if (compliance && (compliance.GDPR || compliance.GDDR)) {
      return compliance;
    }
    
    const gdprCompliant = isHeaderValid("Strict-Transport-Security") && 
                          isHeaderValid("Content-Security-Policy") && 
                          isHeaderValid("Referrer-Policy");

    const pciCompliant = isHeaderValid("Strict-Transport-Security") && 
                         (isHeaderValid("X-Frame-Options") || isHeaderValid("Content-Security-Policy")) &&
                         isHeaderValid("X-Content-Type-Options");

    const owaspCompliant = isHeaderValid("Content-Security-Policy") && 
                           isHeaderValid("X-Frame-Options") && 
                           isHeaderValid("X-Content-Type-Options") &&
                           isHeaderValid("Strict-Transport-Security");

    const nistCompliant = isHeaderValid("Strict-Transport-Security") && 
                          isHeaderValid("Content-Security-Policy") && 
                          isHeaderValid("X-Frame-Options");

    return {
      GDPR: {
        compliant: gdprCompliant,
        recommendation: gdprCompliant ? "Compliant" : "Implement HSTS, CSP, and Referrer-Policy."
      },
      PCI_DSS: {
        compliant: pciCompliant,
        recommendation: pciCompliant ? "Compliant" : "Implement HSTS, X-Frame-Options, and X-Content-Type-Options."
      },
      OWASP: {
        compliant: owaspCompliant,
        recommendation: owaspCompliant ? "Compliant" : "Implement CSP, X-Frame-Options, X-Content-Type-Options, and HSTS."
      },
      NIST: {
        compliant: nistCompliant,
        recommendation: nistCompliant ? "Compliant" : "Implement HSTS, CSP, and X-Frame-Options."
      }
    };
  };

  const finalCompliance = getCompliance();

  return (
    <div className="space-y-6 animate-fadeInUp font-mono">
      {/* Overview Card */}
      <div className="rounded-2xl border border-border bg-surface shadow-glow hover:shadow-glow-success/10 transition-all duration-300 relative overflow-hidden">
        {/* Glowing Top line indicator */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/20" />
        
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
            {/* Score Gauge */}
            <div className="flex-shrink-0 mx-auto lg:mx-0">
              <ScoreGauge score={score} grade={grade} />
            </div>

            {/* Details */}
            <div className="flex-1 space-y-4 w-full">
              {/* Domain and URL */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 group">
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xl font-bold text-text hover:text-accent transition-colors group"
                    >
                      {domain}
                      <ExternalLink className="text-sm opacity-0 group-hover:opacity-100 text-accent h-4 w-4 transition-opacity" />
                    </Link>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${posture.color}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{posture.text} Protection</span>
                  </div>
                </div>
                <p className="text-text-dim text-xs mt-2">
                  Comprehensive HTTP security response headers analysis report
                </p>
              </div>

              {/* Stats Row with Explanations */}
              <div className="flex flex-wrap gap-2.5">
                <StatPill
                  icon={CheckCircle2}
                  value={summary.present}
                  label="Configured"
                  color="text-success"
                  bg="bg-success/5 border border-success/20"
                  tooltip="Headers that are properly configured and providing security benefits"
                />
                <StatPill
                  icon={AlertTriangle}
                  value={summary.weak}
                  label="Weak"
                  color="text-warning"
                  bg="bg-warning/5 border border-warning/20"
                  tooltip="Headers that are present but have security weaknesses or misconfigurations"
                />
                <StatPill
                  icon={XCircle}
                  value={summary.missing}
                  label="Missing"
                  color="text-danger"
                  bg="bg-danger/5 border border-danger/25"
                  tooltip="Essential security headers that are not implemented"
                />
                <StatPill
                  icon={TrendingUp}
                  value={`${Math.round((summary.present / headers.length) * 100)}%`}
                  label="Coverage"
                  color="text-accent"
                  bg="bg-accent/5 border border-accent/20"
                  tooltip="Percentage of security headers successfully implemented"
                />
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-text-dim border-t border-border/40">
                {statusCode && (
                  <div className="flex items-center gap-1.5 group relative cursor-help">
                    <Globe className="h-4 w-4 text-accent" />
                    <span className="font-medium text-text">HTTP {statusCode}</span>
                    <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-panel border border-border text-text text-[10px] rounded-lg shadow-lg whitespace-nowrap z-10">
                      HTTP response status code
                    </div>
                  </div>
                )}
                {scanDuration && (
                  <div className="flex items-center gap-1.5 group relative cursor-help">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="font-medium text-text">{scanDuration}ms</span>
                    <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 px-2.5 py-1.5 bg-panel border border-border text-text text-[10px] rounded-lg shadow-lg whitespace-nowrap z-10">
                      Server response headers fetch duration
                    </div>
                  </div>
                )}
                
                {/* Info Button for detailed explanation */}
                <button
                  onClick={() => setShowSummaryPopup(true)}
                  className="flex items-center gap-1.5 ml-auto px-3.5 py-1.5 text-accent bg-accent/5 border border-accent/20 hover:bg-accent/15 hover:border-accent rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>Recommendations Guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory Compliance Cards */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-glow relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/20" />
        <div className="flex items-center gap-2 mb-4 border-b border-border/30 pb-3">
          <ShieldCheck className="text-accent h-4 w-4 animate-pulse" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-text">Regulatory Compliance Status</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(finalCompliance).filter(([key]) => ["GDPR", "PCI_DSS", "OWASP", "NIST"].includes(key)).map(([key, val]) => {
            const name = key.replace("_", "-");
            const isCompliant = val?.compliant;
            return (
              <div key={key} className="bg-panel/30 border border-border/50 p-4 rounded-xl flex flex-col justify-between hover:border-accent/40 transition-colors">
                <div>
                  <span className="text-[10px] font-bold text-text-dim block uppercase tracking-widest">{name}</span>
                  <p className="text-[10px] text-text-dim mt-2 leading-relaxed">{val?.recommendation || "Evaluation completed."}</p>
                </div>
                <div className="mt-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-[9px] font-bold tracking-wider ${
                    isCompliant 
                      ? "text-success border-success/30 bg-success/10" 
                      : "text-danger border-danger/30 bg-danger/10"
                  }`}>
                    {isCompliant ? "COMPLIANT" : "NON-COMPLIANT"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Headers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/30 pb-2">
          <div>
            <h3 className="text-xs font-bold text-text-dim uppercase tracking-widest">
              Security Header Analysis
            </h3>
            <p className="text-[10px] text-text-dim mt-1">
              Detailed configuration evaluation of each HTTP response header
            </p>
          </div>
          <div className="text-xs font-bold text-accent bg-panel border border-border px-3 py-1 rounded-lg">
            {headers.filter(h => h.status === 'present').length} / {headers.length} CONFIGURED
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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 animate-fadeIn"
            onClick={() => setShowSummaryPopup(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4">
            <div className="bg-surface border border-border rounded-xl shadow-glow overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-accent" />
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3">
                  <h3 className="text-sm font-bold text-text uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="text-accent h-4 w-4" /> Improvement Guide
                  </h3>
                  <button
                    onClick={() => setShowSummaryPopup(false)}
                    className="text-text-dim hover:text-text transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <p className="text-xs text-text-dim leading-relaxed">
                    Based on your scan results, here is your prioritized action plan to maximize header protection:
                  </p>
                  
                  {summary.missing > 0 && (
                    <div className="bg-danger/5 border border-danger/30 rounded-lg p-4">
                      <p className="text-xs font-bold text-danger uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <XCircle className="h-4 w-4" /> Missing Headers ({summary.missing})
                      </p>
                      <p className="text-[11px] text-text-dim leading-relaxed">
                        Add missing security headers first. They provide the most critical baseline protection against XSS, clickjacking, and mime-sniffing.
                      </p>
                    </div>
                  )}
                  
                  {summary.weak > 0 && (
                    <div className="bg-warning/5 border border-warning/30 rounded-lg p-4">
                      <p className="text-xs font-bold text-warning uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <AlertTriangle className="h-4 w-4" /> Weak Configurations ({summary.weak})
                      </p>
                      <p className="text-[11px] text-text-dim leading-relaxed">
                        Strengthen present but weakly configured rules to fully capitalize on security coverage.
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-panel border border-border/60 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider">
                      Recommended Implementation Order
                    </p>
                    <ol className="text-[11px] text-text-dim space-y-1.5 list-decimal list-inside leading-relaxed">
                      <li>Fix critical severity headers first</li>
                      <li>Inject missing high-priority security headers</li>
                      <li>Fine-tune rules for weak configurations</li>
                      <li>Review low-impact / optional configurations</li>
                    </ol>
                  </div>
                </div>
                
                <button
                  onClick={() => setShowSummaryPopup(false)}
                  className="w-full mt-6 py-2 bg-accent/10 border border-accent/40 text-accent rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-accent/25 transition-all duration-200"
                >
                  Confirm & Audit Fixes
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
      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${bg} cursor-help transition-all hover:scale-105`}>
        <Icon className={`h-4 w-4 ${color}`} />
        <span className={`font-bold text-xs ${color}`}>{value}</span>
        <span className="text-text-dim text-[10px]">{label}</span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-panel border border-border text-text text-[10px] rounded-lg shadow-xl whitespace-nowrap z-10 pointer-events-none">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 border-4 border-transparent border-t-border"></div>
        </div>
      )}
    </div>
  );
}