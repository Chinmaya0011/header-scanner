"use client";

import React, { useState } from "react";
import {
  X,
  FileCode,
  AlertOctagon,
  ExternalLink,
  CheckCircle2,
  HelpCircle,
  Code2,
  BookOpen,
  Wrench,
  Tag,
  ShieldAlert,
  Copy,
  Check,
} from "lucide-react";
import { SeverityBadge, ImpactBadge, ConfidenceBadge } from "./SeverityBadge";

export default function FindingDetailsModal({ finding, onClose, onStatusChange }) {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState(finding?.status || "Open");

  if (!finding) return null;

  const extra = finding.extra || {};
  const metadata = extra.metadata || {};
  const ruleId = finding.check_id || "Unknown Rule";
  const ruleShortName = ruleId.split(".").pop();
  const filePath = finding.path || "Unknown path";
  const startLine = finding.start?.line || 1;
  const startCol = finding.start?.col || 1;
  const endLine = finding.end?.line || startLine;
  const endCol = finding.end?.col || startCol;

  const handleCopyPath = () => {
    navigator.clipboard.writeText(`${filePath}:${startLine}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusUpdate = (newStatus) => {
    setStatus(newStatus);
    if (onStatusChange) {
      onStatusChange(finding, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Top Header */}
        <div className="sticky top-0 bg-slate-900/95 border-b border-slate-800 p-5 flex items-start justify-between gap-4 z-10 backdrop-blur-md">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 mt-1">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <SeverityBadge severity={extra.severity} size="md" />
                {metadata.impact && <ImpactBadge impact={metadata.impact} />}
                {metadata.confidence && <ConfidenceBadge confidence={metadata.confidence} />}
              </div>
              <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-snug">
                {ruleShortName}
              </h2>
              <div className="text-xs font-mono text-slate-400 mt-1 break-all select-all">
                {ruleId}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Target File & Location Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCode size={18} className="text-indigo-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Target File & Line Range
                </div>
                <div className="text-xs font-mono text-slate-200 truncate" title={filePath}>
                  {filePath}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-indigo-300 rounded font-mono text-xs font-semibold">
                L{startLine}:{startCol} - L{endLine}:{endCol}
              </span>
              <button
                onClick={handleCopyPath}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-xs transition-colors flex items-center gap-1"
                title="Copy file path & line number"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          {/* Vulnerability Description */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-5 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookOpen size={15} className="text-amber-400" />
              Vulnerability Description
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
              {extra.message || "No description provided for this rule."}
            </p>
          </div>

          {/* Source Code Snippet Preview */}
          {extra.lines && extra.lines !== "requires login" && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Code2 size={15} className="text-indigo-400" />
                Source Code Snippet
              </h3>
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono text-xs">
                <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 text-slate-400 text-[11px] flex justify-between">
                  <span>{filePath}</span>
                  <span>Line {startLine}</span>
                </div>
                <div className="p-4 overflow-x-auto text-emerald-300 bg-slate-950">
                  <pre className="whitespace-pre">{extra.lines}</pre>
                </div>
              </div>
            </div>
          )}

          {/* Why this is Dangerous & Remediation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                <AlertOctagon size={15} />
                Why This Is Dangerous
              </h4>
              <p className="text-xs text-red-200/90 leading-relaxed">
                {metadata.impact === "HIGH"
                  ? "Exploiting this issue could allow attackers to execute untrusted code, bypass security controls, or gain unauthorized access to sensitive application secrets and data."
                  : metadata.impact === "MEDIUM"
                  ? "This security finding presents a medium-risk misconfiguration or vulnerability that could lead to unexpected behavior or partial component exposure."
                  : "This issue represents a security best practice violation or code quality risk that should be cleaned up during maintenance cycles."}
              </p>
            </div>

            <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Wrench size={15} />
                Recommended Remediation
              </h4>
              <p className="text-xs text-emerald-200/90 leading-relaxed">
                Review the flagged code at line {startLine}. Ensure input parameters are sanitized, immutable tags are pinned to explicit commit SHAs, or safe API abstractions are utilized per rule guidelines.
              </p>
            </div>
          </div>

          {/* Tags & Security Metadata */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Tag size={15} className="text-purple-400" />
              Security Taxonomy & Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {metadata.cwe && metadata.cwe.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">CWE Identifiers:</span>
                  <div className="flex flex-wrap gap-1">
                    {metadata.cwe.map((cwe, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-red-500/10 text-red-300 border border-red-500/20 rounded font-mono text-[11px]"
                      >
                        {cwe}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {metadata.owasp && metadata.owasp.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">OWASP Categories:</span>
                  <div className="flex flex-wrap gap-1">
                    {metadata.owasp.map((o, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded font-mono text-[11px]"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {metadata.technology && metadata.technology.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Target Technology:</span>
                  <div className="flex flex-wrap gap-1">
                    {metadata.technology.map((tech, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded font-mono text-[11px]"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {metadata.vulnerability_class && metadata.vulnerability_class.length > 0 && (
                <div>
                  <span className="text-slate-400 font-medium block mb-1">Vulnerability Class:</span>
                  <div className="flex flex-wrap gap-1">
                    {metadata.vulnerability_class.map((vc, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-teal-500/10 text-teal-300 border border-teal-500/20 rounded font-mono text-[11px]"
                      >
                        {vc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reference URLs */}
            {metadata.references && metadata.references.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 font-medium block mb-2 text-xs">
                  Official Documentation & References:
                </span>
                <ul className="space-y-1.5">
                  {metadata.references.map((url, i) => (
                    <li key={i}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1.5 font-mono text-xs break-all"
                      >
                        <ExternalLink size={13} className="flex-shrink-0" />
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Status Action Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Finding Status:</span>
            <select
              value={status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="False Positive">False Positive</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
