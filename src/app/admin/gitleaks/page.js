"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Shield, ChevronRight, RefreshCw, AlertCircle, Key } from "lucide-react";
import GitleaksReportDashboard from "@/components/admin/gitleaks/GitleaksReportDashboard";
import Loading from "@/components/common/Loading";
import { useToast } from "@/components/common/Toast";

export default function AdminGitleaksPage() {
  const toast = useToast();
  const [reportData, setReportData] = useState(null);
  const [gitleaksFindings, setGitleaksFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial scan report from API endpoint
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/gitleaks");
      const json = await res.json();

      if (json.success) {
        setReportData(json.report);
        setGitleaksFindings(json.gitleaks || []);
      } else {
        setError(json.error || "Failed to load Gitleaks security report.");
      }
    } catch (err) {
      console.error("Error loading Gitleaks report:", err);
      setError("Network or server error loading Gitleaks report data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger on-demand fresh secret scan
  const handleRunScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/admin/gitleaks", { method: "POST" });
      const json = await res.json();

      if (json.success) {
        setReportData(json.report);
        setGitleaksFindings(json.gitleaks || []);
        toast.success(json.message || "Fresh Gitleaks scan completed.");
      } else {
        toast.error(json.error || "Failed to run fresh secret scan.");
      }
    } catch (err) {
      toast.error("Network error triggering secret scan.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-3">
          <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
            Admin Dashboard
          </Link>
          <ChevronRight size={14} className="text-slate-600" />
          <span className="text-slate-200">Gitleaks Secret Scan</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <Key className="text-indigo-500" size={32} />
              Gitleaks Secret Scan Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Automated Hardcoded Secret & Pipeline Execution Telemetry Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="py-24 text-center">
            <Loading message="Parsing Gitleaks Secret Scan JSON Data..." />
          </div>
        ) : error ? (
          <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-8 text-center space-y-4 max-w-xl mx-auto">
            <AlertCircle size={40} className="text-red-400 mx-auto" />
            <h3 className="text-lg font-bold text-red-200">No Gitleaks Report Data Found</h3>
            <p className="text-xs text-red-300/80 leading-relaxed">{error}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRunScan}
                disabled={scanning}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                {scanning ? "Scanning..." : "Run Fresh Secret Scan"}
              </button>
              <button
                onClick={fetchReport}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors"
              >
                Retry Loading
              </button>
            </div>
          </div>
        ) : (
          <GitleaksReportDashboard
            reportData={reportData}
            gitleaksFindings={gitleaksFindings}
            onRefresh={fetchReport}
            onRunScan={handleRunScan}
            loading={loading}
            scanning={scanning}
          />
        )}
      </div>
    </div>
  );
}
