"use client";

import React, { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Clock, AlertTriangle } from "lucide-react";

export default function ScanErrorsPanel({ errors = [] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!errors || errors.length === 0) return null;

  return (
    <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl mb-6 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between bg-amber-950/30 hover:bg-amber-950/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <AlertCircle size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-amber-200">
              Scan Execution Warnings ({errors.length})
            </div>
            <div className="text-xs text-amber-400/80">
              Taint analysis timeouts and rule warnings captured during execution
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
          <span>{isOpen ? "Hide Details" : "Show Details"}</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="p-4 border-t border-amber-900/40 space-y-3 bg-slate-950/60">
          {errors.map((err, index) => (
            <div
              key={index}
              className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs space-y-1 font-mono"
            >
              <div className="flex items-center justify-between text-amber-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {err.error_type || "Fixpoint Timeout"}
                </span>
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded text-[10px]">
                  {err.severity || "warn"}
                </span>
              </div>
              <p className="text-slate-300 whitespace-pre-wrap">{err.message}</p>
              {err.location && (
                <div className="text-slate-500 text-[11px]">
                  Location: {err.location.path} (L{err.location.start?.line}:C{err.location.start?.col})
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
