"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, ChevronRight, RefreshCw, AlertCircle } from "lucide-react";
import SecurityScanDashboard from "@/components/admin/security-scan/SecurityScanDashboard";
import Loading from "@/components/common/Loading";

export default function AdminSecurityScanPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCustomReport, setIsCustomReport] = useState(false);
  const [fileName, setFileName] = useState("semgrep-report.json");

  // Fetch initial scan report from API endpoint
  const fetchDefaultReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/security-scan");
      const json = await res.json();

      if (json.success && json.data) {
        setReportData(json.data);
        setIsCustomReport(false);
        setFileName("semgrep-report.json");
      } else {
        setError(json.error || "Failed to load security scan report");
      }
    } catch (err) {
      console.error("Error loading scan report:", err);
      setError("Network or server error while loading report");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDefaultReport();
  }, [fetchDefaultReport]);

  // Handle custom JSON file drag & drop or selection
  const handleFileUpload = (file) => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawContent = (e.target?.result || "").replace(/^\uFEFF/, "").trim();
        const parsed = JSON.parse(rawContent);
        if (!parsed.results || !Array.isArray(parsed.results)) {
          throw new Error("Invalid Semgrep JSON format: 'results' array missing.");
        }
        setReportData(parsed);
        setIsCustomReport(true);
        setFileName(file.name);
      } catch (err) {
        setError(`Failed to parse uploaded file: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleResetDefault = () => {
    fetchDefaultReport();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-3">
          <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
            Admin Dashboard
          </Link>
          <ChevronRight size={14} className="text-slate-600" />
          <span className="text-slate-200">Security Scan Results</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <Shield className="text-indigo-500" size={32} />
              SAST Security Scan Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Static Code Security Analysis & Vulnerability Reporting Dashboard
            </p>
          </div>

          <button
            onClick={fetchDefaultReport}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg border border-slate-800 transition-colors self-start sm:self-auto"
            title="Reload security scan data from server"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-24 text-center">
            <Loading message="Parsing Semgrep Security Scan JSON Data..." />
          </div>
        ) : error ? (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-8 text-center space-y-4 max-w-xl mx-auto">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-red-200">Failed to Load Scan Results</h3>
            <p className="text-xs text-red-300/80 leading-relaxed">{error}</p>
            <button
              onClick={fetchDefaultReport}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Retry Loading
            </button>
          </div>
        ) : (
          <SecurityScanDashboard
            reportData={reportData}
            isCustomReport={isCustomReport}
            onFileUpload={handleFileUpload}
            onResetDefault={handleResetDefault}
            fileName={fileName}
          />
        )}
      </div>
    </div>
  );
}
