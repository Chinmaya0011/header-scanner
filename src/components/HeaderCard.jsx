"use client";
import { useState, useMemo } from "react";
import {
  MdCheckCircle,
  MdWarning,
  MdCancel,
  MdExpandMore,
  MdExpandLess,
  MdInfoOutline,
  MdLink,
  MdCode,
  MdPriorityHigh,
  MdContentCopy,
  MdCheck,
} from "react-icons/md";

// Configuration constants
const STATUS_CONFIG = {
  present: {
    icon: MdCheckCircle,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20",
    hoverBg: "hover:bg-success/5",
    label: "Configured",
    dot: "bg-success",
    description: "This security header is properly configured.",
  },
  weak: {
    icon: MdWarning,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    hoverBg: "hover:bg-warning/5",
    label: "Weak Configuration",
    dot: "bg-warning",
    description: "This header is present but has security weaknesses.",
  },
  missing: {
    icon: MdCancel,
    color: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/20",
    hoverBg: "hover:bg-danger/5",
    label: "Missing",
    dot: "bg-danger",
    description: "This security header is not implemented.",
  },
  invalid: {
    icon: MdPriorityHigh,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    hoverBg: "hover:bg-orange-500/5",
    label: "Invalid Format",
    dot: "bg-orange-500",
    description: "This header is present but has an invalid format.",
  },
};

const SEVERITY_BADGE = {
  critical: "bg-red-500/20 text-red-400 border border-red-500/30",
  high: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  low: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  info: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
};

// Helper function to truncate long values
const truncateValue = (value, maxLength = 100) => {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  return value.substring(0, maxLength) + "...";
};

// Helper to format header value for display
const formatHeaderValue = (value) => {
  if (!value) return "Not set";
  return value;
};

export default function HeaderCard({ header, index, showReferences = true }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Memoize status configuration
  const cfg = useMemo(() => STATUS_CONFIG[header.status] || STATUS_CONFIG.missing, [header.status]);
  const Icon = cfg.icon;

  // Handle copy to clipboard
  const handleCopyValue = async (e) => {
    e.stopPropagation(); // Prevent triggering parent's onClick
    if (header.value) {
      await navigator.clipboard.writeText(header.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get severity label
  const severityLabel = header.severity.charAt(0).toUpperCase() + header.severity.slice(1);

  return (
    <div
      className={`group fade-in-up stagger-${Math.min(index + 1, 5)} rounded-lg border ${cfg.border} bg-panel transition-all duration-300 hover:shadow-lg overflow-hidden`}
      style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
      role="article"
      aria-label={`Security header: ${header.name} - ${cfg.label}`}
    >
      {/* Main clickable header area - not a button anymore */}
      <div
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-start gap-3 p-4 cursor-pointer transition-colors duration-200 ${cfg.hoverBg}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        aria-expanded={expanded}
        aria-controls={`header-details-${index}`}
      >
        {/* Status Icon */}
        <div className={`flex-shrink-0 rounded-full p-1.5 ${cfg.bg} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className={`text-xl ${cfg.color}`} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-semibold text-text truncate">
              {header.name}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium uppercase tracking-wide ${SEVERITY_BADGE[header.severity]}`}
            >
              {severityLabel}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color} backdrop-blur-sm`}
            >
              {cfg.label}
            </span>
          </div>
          
          {header.value && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-text-dim truncate" title={header.value}>
                  <span className="opacity-50">Value:</span> {truncateValue(header.value, 80)}
                </p>
              </div>
              {/* Copy button - now properly separated */}
              <button
                onClick={handleCopyValue}
                className="flex-shrink-0 text-text-dim hover:text-accent transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Copy header value"
                title="Copy to clipboard"
                type="button"
              >
                {copied ? <MdCheck className="text-sm text-success" /> : <MdContentCopy className="text-sm" />}
              </button>
            </div>
          )}
          
          {!header.value && (
            <p className="text-xs text-text-dim mt-1 italic">
              Not implemented
            </p>
          )}
        </div>

        {/* Expand Indicator */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full ${cfg.dot} opacity-75`} />
          {expanded ? (
            <MdExpandLess className="text-text-dim text-xl transition-transform duration-200" />
          ) : (
            <MdExpandMore className="text-text-dim text-xl transition-transform duration-200" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div
          id={`header-details-${index}`}
          className={`border-t ${cfg.border} px-4 pb-4 pt-3 space-y-3 animate-slideDown`}
        >
          {/* Description */}
          <div className="flex gap-2">
            <MdInfoOutline className="text-text-dim flex-shrink-0 mt-0.5 text-lg" />
            <div className="flex-1">
              <p className="text-sm text-text-dim leading-relaxed">
                {header.description}
              </p>
              <p className="text-xs text-text-dim/60 mt-1">
                {cfg.description}
              </p>
            </div>
          </div>

          {/* Current Value with full display */}
          {header.value && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-text uppercase tracking-wide">
                  Current Value
                </p>
                <button
                  onClick={handleCopyValue}
                  className="text-xs text-accent hover:text-accent-light transition-colors"
                  type="button"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <code className="block w-full bg-bg rounded-lg px-3 py-2 font-mono text-xs text-accent break-all border border-gray-700/50">
                {formatHeaderValue(header.value)}
              </code>
            </div>
          )}

          {/* Expected Format */}
          {header.expectedFormat && header.status !== "present" && (
            <div className="space-y-1">
              <p className="text-xs font-semibold text-text uppercase tracking-wide">
                Expected Format
              </p>
              <code className="block w-full bg-success/5 rounded-lg px-3 py-2 font-mono text-xs text-success break-all border border-success/20">
                {header.expectedFormat}
              </code>
            </div>
          )}

          {/* Recommendation */}
          {header.recommendation && (
            <div className={`rounded-lg p-3 ${cfg.bg} border ${cfg.border}`}>
              <p className="text-xs font-semibold text-text mb-2 uppercase tracking-wide flex items-center gap-1">
                <MdPriorityHigh className="text-sm" />
                Recommendation
              </p>
              <p className="text-sm text-text-dim leading-relaxed">
                {header.recommendation}
              </p>
            </div>
          )}

          {/* Reference Link */}
          {showReferences && header.reference && (
            <div className="flex items-center justify-between pt-1">
              <a
                href={header.reference}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors group/reference"
              >
                <MdLink className="text-sm transition-transform duration-200 group-hover/reference:-translate-y-0.5" />
                <span>{header.referenceTitle || "Documentation"}</span>
                <span className="text-xs opacity-60">↗</span>
              </a>
              
              {/* Additional Info Badge */}
              {header.status !== "present" && (
                <span className="text-xs text-text-dim">
                  Priority: {header.severity === "critical" ? "High" : header.severity === "high" ? "Medium-High" : "Medium"}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}