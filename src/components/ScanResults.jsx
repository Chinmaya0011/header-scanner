"use client";

import { useState } from "react";
import Link from "next/link";
import ScoreGauge from "./ScoreGauge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Globe,
  ExternalLink,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ScanResults({ result }) {
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [expandedHeaders, setExpandedHeaders] = useState([]);

  const { url, domain, score, grade, headers, statusCode, scanDuration, summary } = result;

  const getSecurityPosture = () => {
    if (!headers || headers.length === 0)
      return { text: "Unknown", color: "text-text-dim bg-surface" };
    const percentage = ((summary?.present || 0) / headers.length) * 100;
    if (percentage >= 80) return { text: "Strong", color: "text-success bg-success/10" };
    if (percentage >= 60) return { text: "Moderate", color: "text-accent bg-accent/10" };
    if (percentage >= 40) return { text: "Weak", color: "text-warning bg-warning/10" };
    return { text: "Critical", color: "text-danger bg-danger/10" };
  };

  const posture = getSecurityPosture();

  const getCompliance = () => {
    const isHeaderValid = (headerName) => {
      const key = headerName.toLowerCase();
      const h = headers?.find((h) => (h.name || "").toLowerCase() === key);
      return h && h.status === "present";
    };

    return {
      GDPR: {
        compliant:
          isHeaderValid("Strict-Transport-Security") &&
          isHeaderValid("Content-Security-Policy") &&
          isHeaderValid("Referrer-Policy"),
        recommendation: "HSTS, CSP, Referrer-Policy",
      },
      "PCI-DSS": {
        compliant:
          isHeaderValid("Strict-Transport-Security") &&
          isHeaderValid("X-Frame-Options") &&
          isHeaderValid("X-Content-Type-Options"),
        recommendation: "HSTS, X-Frame-Options, X-Content-Type-Options",
      },
      OWASP: {
        compliant:
          isHeaderValid("Content-Security-Policy") &&
          isHeaderValid("X-Frame-Options") &&
          isHeaderValid("X-Content-Type-Options") &&
          isHeaderValid("Strict-Transport-Security"),
        recommendation: "CSP, X-Frame-Options, X-Content-Type-Options, HSTS",
      },
      NIST: {
        compliant:
          isHeaderValid("Strict-Transport-Security") &&
          isHeaderValid("Content-Security-Policy") &&
          isHeaderValid("X-Frame-Options"),
        recommendation: "HSTS, CSP, X-Frame-Options",
      },
    };
  };

  const compliance = getCompliance();

  const toggleHeader = (index) => {
    setExpandedHeaders((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const getSeverityColor = (severity) => {
    if (severity === "critical" || severity === "high") return "bg-danger";
    if (severity === "medium") return "bg-warning";
    return "bg-success";
  };

  const getStatusBadge = (status) => {
    if (status === "present") return { text: "Present", color: "text-success bg-success/10" };
    if (status === "weak") return { text: "Weak", color: "text-warning bg-warning/10" };
    return { text: "Missing", color: "text-danger bg-danger/10" };
  };

  const coveragePct =
    headers && headers.length > 0
      ? Math.round(((summary?.present || 0) / headers.length) * 100)
      : 0;

  return (
    <div className="space-y-8 font-mono max-w-4xl mx-auto">
      {/* Overview Card */}
      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-8 items-start">
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <ScoreGauge score={score} grade={grade} />
          </div>

          <div className="flex-1 w-full space-y-5">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-lg font-semibold text-text hover:text-accent transition-colors group"
                >
                  {domain}
                  <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-md ${posture.color}`}
                >
                  {posture.text}
                </span>
              </div>
              <p className="text-text-dim text-xs mt-1.5">
                HTTP security header analysis
              </p>
            </div>

            {/* Stats grid — clean, dashboard style */}
            <div className="grid grid-cols-4 divide-x divide-border/60 border-y border-border/60 py-4">
              <Stat label="Configured" value={summary?.present || 0} color="text-success" />
              <Stat label="Weak" value={summary?.weak || 0} color="text-warning" />
              <Stat label="Missing" value={summary?.missing || 0} color="text-danger" />
              <Stat label="Coverage" value={`${coveragePct}%`} color="text-accent" />
            </div>

            <div className="flex items-center justify-between text-xs text-text-dim">
              <div className="flex items-center gap-4">
                {statusCode && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5" /> HTTP {statusCode}
                  </span>
                )}
                {scanDuration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> {scanDuration}ms
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSummaryPopup(true)}
                className="flex items-center gap-1.5 text-accent font-medium hover:underline"
              >
                <Info className="h-3.5 w-3.5" />
                Improvement guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance */}
      {/* <section>
        <SectionHeader icon={ShieldCheck} title="Compliance" subtitle="Common security frameworks" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(compliance).map(([key, val]) => (
            <div
              key={key}
              className="border border-border rounded-lg p-4 bg-surface flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-text">{key}</span>
                  <span
                    className={`h-2 w-2 rounded-full ${
                      val.compliant ? "bg-success" : "bg-danger"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-text-dim leading-relaxed">
                  {val.recommendation}
                </p>
              </div>
              <p
                className={`text-[10px] font-medium mt-3 ${
                  val.compliant ? "text-success" : "text-danger"
                }`}
              >
                {val.compliant ? "Compliant" : "Non-compliant"}
              </p>
            </div>
          ))}
        </div>
      </section> */}

      {/* Headers */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader
            icon={CheckCircle2}
            title="Header Analysis"
            subtitle={`${headers?.length || 0} headers evaluated`}
          />
          <span className="text-xs font-medium text-text-dim">
            {headers?.filter((h) => h.status === "present").length || 0} / {headers?.length || 0} configured
          </span>
        </div>

        <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
          {headers?.map((header, index) => {
            const isExpanded = expandedHeaders.includes(index);
            const statusBadge = getStatusBadge(header.status);

            return (
              <div key={header.name} className="bg-surface">
                <div
                  className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-panel/40 transition-colors"
                  onClick={() => toggleHeader(index)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full flex-shrink-0 ${getSeverityColor(
                        header.severity
                      )}`}
                    />
                    <span className="text-sm font-medium text-text truncate">
                      {header.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${statusBadge.color}`}
                    >
                      {statusBadge.text}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-text-dim" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-text-dim" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 space-y-2 bg-panel/20">
                    {header.description && (
                      <p className="text-[11px] text-text-dim leading-relaxed">
                        {header.description}
                      </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {header.value && (
                        <div className="bg-bg/60 rounded-md p-2.5 border border-border/50">
                          <p className="text-[9px] text-text-dim uppercase tracking-wide mb-0.5">
                            Current value
                          </p>
                          <p className="text-xs text-text break-all">{header.value}</p>
                        </div>
                      )}
                      {header.recommendation && header.status !== "present" && (
                        <div className="bg-accent/5 rounded-md p-2.5 border border-accent/20">
                          <p className="text-[9px] text-accent uppercase tracking-wide mb-0.5">
                            Recommendation
                          </p>
                          <p className="text-xs text-text">{header.recommendation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Improvement Guide Modal */}
      {showSummaryPopup && (
        <>
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setShowSummaryPopup(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50 p-4">
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Improvement Guide
                </h3>
                <button
                  onClick={() => setShowSummaryPopup(false)}
                  className="text-text-dim hover:text-text"
                >
                  <XCircle className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="p-5 space-y-3">
                {(summary?.missing || 0) > 0 && (
                  <div className="border border-danger/30 rounded-lg p-3.5">
                    <p className="text-xs font-semibold text-danger flex items-center gap-1.5 mb-1">
                      <XCircle className="h-3.5 w-3.5" /> Missing ({summary.missing})
                    </p>
                    <p className="text-[11px] text-text-dim leading-relaxed">
                      Add missing headers first for baseline protection.
                    </p>
                  </div>
                )}

                {(summary?.weak || 0) > 0 && (
                  <div className="border border-warning/30 rounded-lg p-3.5">
                    <p className="text-xs font-semibold text-warning flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Weak ({summary.weak})
                    </p>
                    <p className="text-[11px] text-text-dim leading-relaxed">
                      Strengthen present but loosely configured headers.
                    </p>
                  </div>
                )}

                <div className="border border-border rounded-lg p-3.5">
                  <p className="text-xs font-semibold text-text mb-2">Priority order</p>
                  <ol className="text-[11px] text-text-dim space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Fix critical severity headers</li>
                    <li>Add missing high-priority headers</li>
                    <li>Fine-tune weak configurations</li>
                    <li>Review optional headers</li>
                  </ol>
                </div>
              </div>

              <button
                onClick={() => setShowSummaryPopup(false)}
                className="w-full py-2.5 text-xs font-semibold text-accent border-t border-border/60 hover:bg-accent/5 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="text-center px-2">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-text-dim uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-accent" />
      <div>
        <h3 className="text-xs font-semibold text-text uppercase tracking-wide">{title}</h3>
        {subtitle && <p className="text-[10px] text-text-dim">{subtitle}</p>}
      </div>
    </div>
  );
}