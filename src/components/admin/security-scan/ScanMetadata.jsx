"use client";

import React, { useRef } from "react";
import {
  ShieldCheck,
  FileCode,
  Cpu,
  Upload,
  RotateCcw,
  Download,
  AlertCircle,
  Clock,
  Layers,
  Terminal,
} from "lucide-react";

export default function ScanMetadata({
  metadata,
  onFileUpload,
  onResetDefault,
  onExportCSV,
  onExportJSON,
  isCustomReport,
  fileName,
}) {
  const fileInputRef = useRef(null);

  const {
    version = "1.174.0",
    engine = "Semgrep OSS",
    totalFindings = 0,
    totalErrors = 0,
    maxMemory = "1.2 GB",
    rulesMatchedRatio = "5.2%",
  } = metadata || {};

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl backdrop-blur-md mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
        {/* Title & Engine info */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Security SAST Scan Results
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                COMPLETED
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <Terminal size={14} className="text-slate-500" /> Engine:{" "}
                <strong className="text-slate-300 font-medium">{engine} v{version}</strong>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1">
                <FileCode size={14} className="text-slate-500" /> Source:{" "}
                <strong className="text-indigo-400 font-medium">{fileName || "semgrep-report.json"}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
            title="Upload custom Semgrep JSON scan report"
          >
            <Upload size={15} />
            Upload JSON Scan
          </button>

          {isCustomReport && (
            <button
              onClick={onResetDefault}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
              title="Reset to default scan report"
            >
              <RotateCcw size={14} />
              Reset Default
            </button>
          )}

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block"></div>

          <button
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            title="Export findings as CSV spreadsheet"
          >
            <Download size={14} className="text-slate-400" />
            CSV Export
          </button>

          <button
            onClick={onExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            title="Export raw or filtered JSON report"
          >
            <Download size={14} className="text-slate-400" />
            JSON Export
          </button>
        </div>
      </div>

      {/* Execution Stats Pill Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-3">
          <div className="p-2 bg-slate-800/80 rounded-md text-slate-400">
            <Layers size={16} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Total Findings
            </div>
            <div className="text-sm font-bold text-slate-100">{totalFindings} Issues</div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-3">
          <div className="p-2 bg-slate-800/80 rounded-md text-amber-400">
            <AlertCircle size={16} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Scan Warnings
            </div>
            <div className="text-sm font-bold text-amber-300">{totalErrors} Taint Warnings</div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-3">
          <div className="p-2 bg-slate-800/80 rounded-md text-cyan-400">
            <Cpu size={16} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Peak Memory
            </div>
            <div className="text-sm font-bold text-slate-100">{maxMemory}</div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/60 rounded-lg p-2.5 flex items-center gap-3">
          <div className="p-2 bg-slate-800/80 rounded-md text-indigo-400">
            <Clock size={16} />
          </div>
          <div>
            <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Rule Match Ratio
            </div>
            <div className="text-sm font-bold text-slate-100">{rulesMatchedRatio}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
