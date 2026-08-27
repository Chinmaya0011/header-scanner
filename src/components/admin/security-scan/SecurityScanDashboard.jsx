"use client";

import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Shield,
  PieChart as PieChartIcon,
  AlertCircle,
  FileDown,
  Layers,
  Filter,
  CheckCircle2,
} from "lucide-react";
import ScanMetadata from "./ScanMetadata";
import ScanSummaryCards from "./ScanSummaryCards";
import SeverityChart from "./SeverityChart";
import FindingsChart from "./FindingsChart";
import FindingsTable from "./FindingsTable";
import FindingDetailsModal from "./FindingDetailsModal";
import ScanErrorsPanel from "./ScanErrorsPanel";

export default function SecurityScanDashboard({ reportData, isCustomReport, onFileUpload, onResetDefault, fileName }) {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'findings' | 'charts' | 'warnings' | 'export'
  const [selectedSeverityFilter, setSelectedSeverityFilter] = useState("ALL");
  const [selectedFinding, setSelectedFinding] = useState(null);

  // Raw findings list
  const results = reportData?.results || [];
  const errors = reportData?.errors || [];

  // Parse overall scan metadata metrics
  const metadata = useMemo(() => {
    const totalFindings = results.length;
    const totalErrors = errors.length;

    const version = reportData?.version || "1.174.0";
    const engine = reportData?.engine_requested ? `Semgrep ${reportData.engine_requested}` : "Semgrep OSS";

    const metrics = reportData?.metrics || {};
    const maxMemBytes = metrics.max_memory_bytes || 0;
    const maxMemory = maxMemBytes > 0 ? `${(maxMemBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` : "1.2 GB";

    const rulesMatched = metrics.prefiltering?.rules_matched_ratio || 0;
    const rulesMatchedRatio = rulesMatched > 0 ? `${(rulesMatched * 100).toFixed(1)}%` : "5.2%";

    return {
      version,
      engine,
      totalFindings,
      totalErrors,
      maxMemory,
      rulesMatchedRatio,
    };
  }, [reportData, results, errors]);

  // Aggregate findings stats for KPI summary cards
  const summaryStats = useMemo(() => {
    let critical = 0;
    let warning = 0;
    let info = 0;

    const fileSet = new Set();
    const vulnClassSet = new Set();

    results.forEach((item) => {
      const sev = (item.extra?.severity || "").toUpperCase();
      if (sev === "ERROR" || sev === "CRITICAL") critical++;
      else if (sev === "WARNING") warning++;
      else if (sev === "INFO") info++;

      if (item.path) fileSet.add(item.path);

      const vClasses = item.extra?.metadata?.vulnerability_class || ["Other"];
      vClasses.forEach((vc) => vulnClassSet.add(vc));
    });

    return {
      total: results.length,
      critical,
      warning,
      info,
      filesCount: fileSet.size,
      vulnClassesCount: vulnClassSet.size,
      errorsCount: errors.length,
    };
  }, [results, errors]);

  // Chart Data: Findings by Severity
  const severityChartData = useMemo(() => {
    const counts = { ERROR: 0, WARNING: 0, INFO: 0 };
    results.forEach((item) => {
      const sev = (item.extra?.severity || "").toUpperCase();
      if (counts[sev] !== undefined) counts[sev]++;
    });
    return [
      { name: "ERROR", value: counts.ERROR },
      { name: "WARNING", value: counts.WARNING },
      { name: "INFO", value: counts.INFO },
    ].filter((d) => d.value > 0);
  }, [results]);

  // Chart Data: Findings by Impact
  const impactChartData = useMemo(() => {
    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    results.forEach((item) => {
      const imp = (item.extra?.metadata?.impact || "").toUpperCase();
      if (counts[imp] !== undefined) counts[imp]++;
    });
    return [
      { name: "HIGH", value: counts.HIGH },
      { name: "MEDIUM", value: counts.MEDIUM },
      { name: "LOW", value: counts.LOW },
    ].filter((d) => d.value > 0);
  }, [results]);

  // Chart Data: Findings by Vulnerability Class
  const vulnClassChartData = useMemo(() => {
    const counts = {};
    results.forEach((item) => {
      const vClasses = item.extra?.metadata?.vulnerability_class || ["Other"];
      vClasses.forEach((vc) => {
        counts[vc] = (counts[vc] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [results]);

  // Chart Data: Top Affected Files
  const fileChartData = useMemo(() => {
    const counts = {};
    results.forEach((item) => {
      if (item.path) {
        counts[item.path] = (counts[item.path] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([fullName, value]) => {
        const parts = fullName.split(/[/\\]/);
        const shortName = parts.length > 2 ? `.../${parts.slice(-2).join("/")}` : fullName;
        return { fullName, shortName, value };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [results]);

  // List of unique vulnerability classes for filter dropdown
  const vulnerabilityClassesList = useMemo(() => {
    return vulnClassChartData.map((d) => d.name);
  }, [vulnClassChartData]);

  // Click handler from charts to table filter
  const handleChartFilterSelect = ({ type, value }) => {
    if (type === "severity") {
      setSelectedSeverityFilter(value.toUpperCase());
      setActiveTab("findings");
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    if (!results || results.length === 0) return;

    const headers = [
      "Rule ID",
      "Severity",
      "Impact",
      "Confidence",
      "File Path",
      "Start Line",
      "Start Col",
      "Description",
      "CWE",
      "OWASP",
    ];

    const rows = results.map((item) => [
      `"${item.check_id || ""}"`,
      `"${item.extra?.severity || ""}"`,
      `"${item.extra?.metadata?.impact || ""}"`,
      `"${item.extra?.metadata?.confidence || ""}"`,
      `"${item.path || ""}"`,
      item.start?.line || 1,
      item.start?.col || 1,
      `"${(item.extra?.message || "").replace(/"/g, '""')}"`,
      `"${(item.extra?.metadata?.cwe || []).join("; ")}"`,
      `"${(item.extra?.metadata?.owasp || []).join("; ")}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `security-scan-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `security-scan-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Scan Metadata Summary Card */}
      <ScanMetadata
        metadata={metadata}
        onFileUpload={onFileUpload}
        onResetDefault={onResetDefault}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
        isCustomReport={isCustomReport}
        fileName={fileName}
      />

      {/* Easy Tabbed Navigation Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "overview"
              ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("findings")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "findings"
              ? "bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span>Findings Directory</span>
          <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full font-bold">
            {results.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("charts")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "charts"
              ? "bg-purple-600/20 border border-purple-500/40 text-purple-300 shadow-lg shadow-purple-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <PieChartIcon className="w-4 h-4 text-purple-400" />
          <span>Visual Analytics</span>
        </button>

        {errors.length > 0 && (
          <button
            onClick={() => setActiveTab("warnings")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              activeTab === "warnings"
                ? "bg-amber-600/20 border border-amber-500/40 text-amber-300 shadow-lg shadow-amber-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Execution Warnings</span>
            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-full font-bold">
              {errors.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
            activeTab === "all"
              ? "bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>All Views Combined</span>
        </button>
      </div>

      {/* TAB 1: Executive Overview */}
      {(activeTab === "overview" || activeTab === "all") && (
        <div className="space-y-6">
          <ScanSummaryCards
            summary={summaryStats}
            activeSeverityFilter={selectedSeverityFilter}
            onSelectSeverityFilter={(sev) => {
              setSelectedSeverityFilter(sev);
              setActiveTab("findings");
            }}
          />

          <SeverityChart
            severityData={severityChartData}
            impactData={impactChartData}
            onSelectFilter={handleChartFilterSelect}
          />
        </div>
      )}

      {/* TAB 2: Findings Directory */}
      {(activeTab === "findings" || activeTab === "all") && (
        <FindingsTable
          findings={results}
          onSelectFinding={setSelectedFinding}
          selectedSeverityFilter={selectedSeverityFilter}
          onClearFilters={() => setSelectedSeverityFilter("ALL")}
          vulnerabilityClasses={vulnerabilityClassesList}
        />
      )}

      {/* TAB 3: Visual Analytics & Charts */}
      {(activeTab === "charts" || activeTab === "all") && (
        <FindingsChart
          categoryData={vulnClassChartData}
          fileData={fileChartData}
          onSelectFilter={handleChartFilterSelect}
        />
      )}

      {/* TAB 4: Execution Warnings */}
      {(activeTab === "warnings" || activeTab === "all") && errors.length > 0 && (
        <ScanErrorsPanel errors={errors} />
      )}

      {/* Finding Detail Slide-over Modal Inspector */}
      {selectedFinding && (
        <FindingDetailsModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      )}
    </div>
  );
}
