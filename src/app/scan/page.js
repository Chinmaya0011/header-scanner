"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  Shield,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Lock,
  ArrowRight,
  Zap,
  Globe,
  Star,
} from "lucide-react";

// ── Severity helpers ──────────────────────────────────────────────────────────
const severityColor = (s) => {
  if (s === "critical") return "text-red-400";
  if (s === "high") return "text-orange-400";
  if (s === "medium") return "text-yellow-400";
  if (s === "low") return "text-blue-400";
  return "text-zinc-400";
};

const statusIcon = (status) => {
  if (status === "present") return <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />;
  if (status === "weak") return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
  if (status === "missing") return <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
  return <Info className="w-4 h-4 text-zinc-400 shrink-0" />;
};

const gradeColors = {
  "A+": "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  "A":  "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  "B":  "text-indigo-400  border-indigo-500/30  bg-indigo-500/10",
  "C":  "text-amber-400   border-amber-500/30   bg-amber-500/10",
  "D":  "text-orange-400  border-orange-500/30  bg-orange-500/10",
  "F":  "text-red-400     border-red-500/30     bg-red-500/10",
};

// ── Score ring component ──────────────────────────────────────────────────────
function ScoreRing({ score, grade }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const colorClass =
    score >= 80 ? "#10b981" :
    score >= 60 ? "#6366f1" :
    score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle
          cx="56" cy="56" r={r}
          fill="none"
          stroke={colorClass}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold font-mono" style={{ color: colorClass }}>{score}</span>
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded border font-mono mt-0.5 ${gradeColors[grade] || gradeColors["F"]}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PublicScanPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/public-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Connection error. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] text-[#f3f4f6] font-sans flex flex-col relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-emerald-500/4 rounded-full blur-[100px] pointer-events-none -z-10" />

      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 text-xs font-medium text-indigo-400 mb-5">
            <Zap className="w-3.5 h-3.5" />
            Free Instant Scan — No Account Required
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Check Your Website&apos;s
            <span className="text-indigo-400"> Security Headers</span>
          </h1>
          <p className="text-sm text-[#9ca3af] max-w-lg mx-auto leading-relaxed">
            Instantly analyze HTTP security headers for any public URL.
            No login, no domain verification — just paste a URL and scan.
          </p>
        </div>

        {/* Scan Form */}
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com or https://example.com"
              disabled={loading}
              className="w-full bg-[#0b0f19] border border-white/[0.07] rounded-xl pl-10 pr-4 py-3 text-sm text-[#f3f4f6] placeholder:text-[#6b7280] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all duration-200 whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Scanning…
              </span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Scan Now
              </>
            )}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4 text-sm text-red-400 mb-6 flex items-start gap-2">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Score card */}
            <div className="bg-[#0b0f19] border border-white/[0.06] rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing score={result.score} grade={result.grade} />
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs text-[#9ca3af] uppercase tracking-wider mb-1">Scanned URL</p>
                <p className="font-mono text-sm text-indigo-300 mb-3 break-all">{result.url}</p>
                <div className="flex flex-wrap gap-3 justify-center sm:justify-start text-xs">
                  <span className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 font-mono">
                    HTTP <span className="text-indigo-300">{result.statusCode}</span>
                  </span>
                  <span className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 font-mono">
                    <span className="text-emerald-400">{result.summary.present}</span> present
                  </span>
                  <span className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 font-mono">
                    <span className="text-red-400">{result.summary.missing}</span> missing
                  </span>
                  <span className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 font-mono">
                    <span className="text-amber-400">{result.summary.weak}</span> weak
                  </span>
                  <span className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-1.5 font-mono text-[#6b7280]">
                    {result.scanDuration}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Header results table */}
            <div className="bg-[#0b0f19] border border-white/[0.06] rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-white/[0.05] flex items-center justify-between">
                <h2 className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  Security Header Analysis
                </h2>
                <span className="text-[10px] text-[#6b7280] uppercase">{result.headers.length} headers checked</span>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {result.headers.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.015] transition">
                    {statusIcon(h.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold text-[#f3f4f6] truncate">{h.name}</p>
                      <p className="text-[11px] text-[#9ca3af] mt-0.5 leading-relaxed line-clamp-2">{h.description}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase shrink-0 mt-0.5 ${severityColor(h.severity)}`}>
                      {h.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-[#0b0f19] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-5 py-3.5 border-b border-white/[0.05]">
                  <h2 className="text-xs font-bold text-[#f3f4f6] uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Top Recommendations
                  </h2>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold uppercase ${severityColor(r.severity)}`}>{r.severity}</span>
                        <span className="text-xs font-mono font-semibold text-[#f3f4f6]">{r.header}</span>
                      </div>
                      <p className="text-[12px] text-[#9ca3af] leading-relaxed">{r.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upsell CTA */}
            <div className="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6 text-center">
              <div className="inline-flex items-center gap-1.5 text-indigo-400 mb-3">
                <Star className="w-4 h-4 fill-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider">Unlock Full Report</span>
              </div>
              <h3 className="text-base font-bold text-[#f3f4f6] mb-2">
                Get SSL, DNS, Tech Stack, Cookies & Compliance
              </h3>
              <p className="text-xs text-[#9ca3af] mb-5 max-w-sm mx-auto leading-relaxed">
                Sign up free to run complete EASM scans with AI-powered remediation, compliance audits, and historical tracking.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-all"
                >
                  <Lock className="w-4 h-4" />
                  Create Free Account
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-[#f3f4f6] text-sm font-medium px-6 py-2.5 rounded-xl transition-all"
                >
                  Sign In
                </Link>
              </div>
            </div>

          </div>
        )}

        {/* Features preview — shown when no result yet */}
        {!result && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Shield, label: "Security Headers", desc: "CSP, HSTS, X-Frame-Options, and more" },
              { icon: Zap, label: "Instant Analysis", desc: "Results in under 10 seconds" },
              { icon: Lock, label: "No Login Needed", desc: "Run a basic scan without registering" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-[#0b0f19] border border-white/[0.05] rounded-xl p-4 text-center">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-4 h-4 text-indigo-400" />
                </div>
                <p className="text-xs font-semibold text-[#f3f4f6] mb-1">{label}</p>
                <p className="text-[11px] text-[#9ca3af] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
