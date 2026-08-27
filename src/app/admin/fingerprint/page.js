"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useVisitorData } from "@fingerprint/react";
import {
  Fingerprint,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Cpu,
  Activity,
  AlertTriangle,
  Globe,
  Radio,
  Sliders,
  Server
} from "lucide-react";

export default function AdminFingerprintPage() {
  const { data, error, isLoading, getData } = useVisitorData({ immediate: true });
  const [refreshing, setRefreshing] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [adBlockerStatus, setAdBlockerStatus] = useState("checking");
  const [customProxySubdomain, setCustomProxySubdomain] = useState("metrics.headerguards.online");

  const publicKey = "1JQORojs6DaX5hEWd0an";
  const region = "ap";

  useEffect(() => {
    if (data) {
      setAdBlockerStatus("unblocked");
    } else if (error) {
      setAdBlockerStatus("blocked_or_error");
    }
  }, [data, error]);

  const handleReIdentify = async () => {
    setRefreshing(true);
    try {
      const result = await getData({ ignoreCache: true });
      console.log("[Fingerprint Admin Monitor] Manual re-identification result:", result);
    } catch (err) {
      console.error("[Fingerprint Admin Monitor] Error re-identifying visitor:", err);
    } finally {
      setRefreshing(false);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const visitorId = data?.visitorId || data?.visitor_id || "—";
  const requestId = data?.requestId || data?.event_id || "—";
  const confidenceScore = data?.confidence?.score
    ? `${(data.confidence.score * 100).toFixed(0)}%`
    : "—";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Navigation Breadcrumb */}
      <div className="max-w-7xl mx-auto mb-6">
        <nav className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-3">
          <Link href="/dashboard" className="hover:text-indigo-400 transition-colors">
            Admin Console
          </Link>
          <ChevronRight size={14} className="text-slate-600" />
          <span className="text-slate-200">Fingerprint Device Intelligence</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-3">
              <Fingerprint className="text-emerald-400" size={32} />
              Fingerprint Device Intelligence
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Visitor Identification Telemetry & Ad-Blocker Protection Monitoring
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleReIdentify}
              disabled={refreshing || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-lg shadow-emerald-950/50"
            >
              <RefreshCw size={14} className={refreshing || isLoading ? "animate-spin" : ""} />
              {refreshing || isLoading ? "Identifying..." : "Identify Visitor Now"}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Status Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* SDK Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SDK Status</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-400">@fingerprint/react</span>
              <span className="text-xs text-slate-400">v4 JS Agent</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Initialized at Application Startup</p>
          </div>

          {/* Region */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Region</span>
              <Globe size={16} className="text-indigo-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-300 uppercase">{region}</span>
              <span className="text-xs text-slate-400">(Asia-Pacific)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Workspace region locked to ap</p>
          </div>

          {/* Confidence Score */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence Score</span>
              <Activity size={16} className="text-emerald-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100">{confidenceScore}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Identification accuracy level</p>
          </div>

          {/* Ad-Blocker Protection Status */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ad-Blocker Status</span>
              {adBlockerStatus === "unblocked" ? (
                <ShieldCheck size={18} className="text-emerald-400" />
              ) : adBlockerStatus === "blocked_or_error" ? (
                <ShieldAlert size={18} className="text-amber-400" />
              ) : (
                <RefreshCw size={16} className="text-slate-400 animate-spin" />
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-lg font-bold ${
                adBlockerStatus === "unblocked"
                  ? "text-emerald-400"
                  : adBlockerStatus === "blocked_or_error"
                  ? "text-amber-400"
                  : "text-slate-400"
              }`}>
                {adBlockerStatus === "unblocked"
                  ? "Active / Receiving"
                  : adBlockerStatus === "blocked_or_error"
                  ? "Check Ad-Blocker"
                  : "Testing..."}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {adBlockerStatus === "unblocked"
                ? "Direct identification active"
                : "Disable ad-blocker for local testing"}
            </p>
          </div>
        </div>

        {/* Current Identified Visitor Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <Cpu className="text-indigo-400" size={24} />
              <div>
                <h2 className="text-base font-bold text-slate-100">Live Device Identification Session</h2>
                <p className="text-xs text-slate-400">Current visitor telemetry payload generated by client agent</p>
              </div>
            </div>
            {isLoading && (
              <span className="flex items-center gap-2 text-xs text-indigo-400">
                <RefreshCw size={14} className="animate-spin" /> Fetching device signals...
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Visitor Identifier (visitor_id)
                </label>
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-sm text-emerald-300">
                  <span>{visitorId}</span>
                  {visitorId !== "—" && (
                    <button
                      onClick={() => copyToClipboard(visitorId, "visitorId")}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedKey === "visitorId" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Identification Event Identifier (event_id / requestId)
                </label>
                <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-sm text-indigo-300">
                  <span>{requestId}</span>
                  {requestId !== "—" && (
                    <button
                      onClick={() => copyToClipboard(requestId, "requestId")}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedKey === "requestId" ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Public API Key</span>
                  <span className="font-mono text-xs text-slate-200 truncate block mt-0.5">{publicKey}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Configured Region</span>
                  <span className="font-mono text-xs text-indigo-300 font-bold block mt-0.5">{region}</span>
                </div>
              </div>
            </div>

            {/* Raw JSON Data Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto max-h-64 scrollbar-thin">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
                <span>Raw Signal Payload</span>
                <span className="text-[10px] text-emerald-400">{data ? "Ready" : "Waiting for client scan..."}</span>
              </div>
              {data ? (
                <pre className="text-slate-300 leading-relaxed">{JSON.stringify(data, null, 2)}</pre>
              ) : error ? (
                <div className="text-amber-400 space-y-2">
                  <p>⚠️ Failed to fetch Fingerprint signals.</p>
                  <p className="text-[11px] text-slate-400">{error.message || String(error)}</p>
                </div>
              ) : (
                <p className="text-slate-500 italic">Initializing client identification agent...</p>
              )}
            </div>
          </div>
        </div>

        {/* Ad-Blocker Protection & Proxy Integration Strategy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Shield className="text-emerald-400" size={24} />
              <div>
                <h2 className="text-base font-bold text-slate-100">Ad-Blocker Protection & Proxy Integration</h2>
                <p className="text-xs text-slate-400">
                  Protect Fingerprint requests from ad blockers, Brave browser, and DNS filters in production
                </p>
              </div>
            </div>
            <a
              href="https://docs.fingerprint.com/docs/protecting-the-javascript-agent-from-adblockers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Official Documentation <ExternalLink size={14} />
            </a>
          </div>

          {/* Local testing guidance banner */}
          <div className="bg-amber-950/30 border border-amber-900/50 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h3 className="font-bold text-amber-200">Local Testing Note (Development Environment)</h3>
              <p className="text-amber-300/80 leading-relaxed">
                Ad blockers such as uBlock Origin, AdGuard, or Brave Shield may block direct calls to <code className="text-amber-200">fpjscdn.net</code> or <code className="text-amber-200">api.fpjs.io</code>. 
                Please disable your ad blocker on <code className="text-amber-200">localhost</code> to test initial identification and verify the console log output.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Custom Subdomain Strategy */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Server size={18} />
                <span>1. Custom Subdomain Setup (Recommended)</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Route identification traffic through your own subdomain (e.g., <code className="text-emerald-400 font-mono">metrics.headerguards.online</code>).
                This ensures requests take place in a 1st-party context, preventing browser ad-blockers from filtering Fingerprint CDN/API requests.
              </p>
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-slate-300 block uppercase">Steps to Enable:</span>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1.5 pl-1">
                  <li>Register custom subdomain in Fingerprint Dashboard.</li>
                  <li>Add CNAME record pointing <code className="text-indigo-300 font-mono">metrics.yourdomain.com</code> to Fingerprint.</li>
                  <li>Pass custom endpoint configuration to <code className="text-indigo-300 font-mono">FingerprintProvider</code>.</li>
                </ol>
              </div>
            </div>

            {/* Cloud Proxy Integration / Next.js Rewrites */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Sliders size={18} />
                <span>2. Next.js Cloud Rewrite Proxy</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can proxy requests through Next.js route rewrites in <code className="text-indigo-300 font-mono">next.config.js</code> to keep all traffic first-party:
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
                <pre>{`// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/fpjs/:path*',
        destination: 'https://fpjscdn.net/:path*',
      },
    ];
  },
};`}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
