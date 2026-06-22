"use client";

import React from "react";
import { ShieldCheck, XCircle, AlertTriangle, X } from "lucide-react";

export default function ImprovementGuideModal({ isOpen, onClose, summary }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Modal Centering Wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        {/* Modal Dialog */}
        <div className="w-full max-w-md pointer-events-auto animate-fadeInUp">
          <div className="bg-surface border border-border rounded-xl shadow-glow overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60">
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-accent" />
                <span>Improvement Guide</span>
              </h3>
              <button
                onClick={onClose}
                className="text-text-dim hover:text-text p-1 rounded-lg hover:bg-panel transition-colors"
                aria-label="Close guide"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 font-sans text-xs">
              {summary?.missing > 0 && (
                <div className="border border-danger/20 bg-danger/5 rounded-lg p-3.5 flex gap-3">
                  <XCircle className="h-4.5 w-4.5 text-danger flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-danger">Missing Headers ({summary.missing})</p>
                    <p className="text-text-dim text-[11px] leading-relaxed mt-1">
                      These headers are not configured. Adding missing headers (especially CSP and HSTS) is the highest priority for baseline security.
                    </p>
                  </div>
                </div>
              )}

              {summary?.weak > 0 && (
                <div className="border border-warning/20 bg-warning/5 rounded-lg p-3.5 flex gap-3">
                  <AlertTriangle className="h-4.5 w-4.5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-warning">Weak Configurations ({summary.weak})</p>
                    <p className="text-text-dim text-[11px] leading-relaxed mt-1">
                      Present but loosely configured. Strengthen validation rules and remove permissive fallback values to earn full credit.
                    </p>
                  </div>
                </div>
              )}

              <div className="border border-border bg-panel/35 rounded-lg p-3.5">
                <p className="font-bold text-text mb-2 flex items-center gap-1.5">
                  <span>Priority Checklist</span>
                </p>
                <ol className="text-[11px] text-text-dim space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Configure <strong className="text-text">Content-Security-Policy</strong> with strict sources.</li>
                  <li>Enforce <strong className="text-text">Strict-Transport-Security</strong> on all secure pages.</li>
                  <li>Mitigate clickjacking with <strong className="text-text">X-Frame-Options</strong> (DENY/SAMEORIGIN).</li>
                  <li>Restrict features using <strong className="text-text">Permissions-Policy</strong>.</li>
                </ol>
              </div>
            </div>

            {/* Footer */}
            <button
              onClick={onClose}
              className="w-full py-3.5 text-xs font-bold text-accent border-t border-border/60 hover:bg-accent/5 transition-colors uppercase tracking-wider font-sans"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
