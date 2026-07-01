"use client";

import { useState } from "react";
import Link from "next/link";
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
  if (s === "critical") return "text-danger";
  if (s === "high") return "text-warning";
  if (s === "medium") return "text-warning";
  if (s === "low") return "text-accent-light";
  return "text-text-muted";
};

const statusIcon = (status) => {
  if (status === "present") return <CheckCircle className="w-4 h-4 text-success shrink-0" />;
  if (status === "weak") return <AlertTriangle className="w-4 h-4 text-warning shrink-0" />;
  if (status === "missing") return <XCircle className="w-4 h-4 text-danger shrink-0" />;
  return <Info className="w-4 h-4 text-text-dim shrink-0" />;
};

const gradeColors = {
  "A+": "text-success border-success/20 bg-success/10",
  "A":  "text-success border-success/20 bg-success/10",
  "B":  "text-accent border-accent/20 bg-accent/10",
  "C":  "text-warning border-warning/20 bg-warning/10",
  "D":  "text-warning border-warning/20 bg-warning/10",
  "F":  "text-danger border-danger/20 bg-danger/10",
};

// ── Score ring component ──────────────────────────────────────────────────────
function ScoreRing({ score, grade }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const colorClass =
    score >= 80 ? "var(--success)" :
    score >= 60 ? "var(--accent)" :
    score >= 40 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="relative flex items-center justify-center w-28 h-28 select-none">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
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
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono mt-0.5 ${gradeColors[grade] || gradeColors["F"]}`}>
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
      setUrl("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col relative overflow-hidden">
      {/* Background blurs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-accent/5 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-success/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 relative z-10 animate-fadeInUp">

        {/* Hero */}
        <div className="text-center mb-10 select-none">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 text-xs font-semibold text-accent mb-5">
            <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
            Free Instant Scan — No Account Required
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 uppercase">
            Check Your Website&apos;s
            <span className="text-accent"> Security Headers</span>
          </h1>
          <p className="text-xs text-text-dim max-w-lg mx-auto leading-relaxed uppercase tracking-wider">
            Instantly analyze HTTP security headers for any public URL.
            No login, no domain verification — just paste a URL and scan.
          </p>
        </div>

        {/* Scan Form */}
        <form onSubmit={handleScan} className="max-w-3xl mx-auto w-full relative mb-8">
          <div className="relative flex flex-col sm:flex-row gap-3 p-2 bg-surface/50 border border-border rounded-2xl backdrop-blur-md shadow-2xl focus-within:border-accent/40 focus-within:shadow-[0_0_30px_rgba(99,102,241,0.1)] transition-all duration-300">
            <div className="flex flex-1 items-center min-w-0">
              <div className="pl-3 text-accent/70 shrink-0">
                <Globe className="h-5 w-5 text-accent animate-pulse" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="example.com or https://example.com"
                disabled={loading}
                className="w-full bg-transparent px-3 py-3 text-text placeholder:text-text-muted/60 font-mono text-xs sm:text-sm focus:outline-none"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-xl transition-all duration-300 hover:shadow-glow shrink-0 font-sans"
            >
              {loading ? (
                <span className="flex items-center gap-2 font-mono">
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
          </div>

          {/* Quick suggested domains for faster testing */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[10px] uppercase font-bold text-text-dim/80 select-none">
            <span className="text-text-muted">Suggested:</span>
            {["github.com", "cloudflare.com", "google.com"].map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => setUrl(domain)}
                className="px-2.5 py-1 bg-surface/40 hover:bg-accent/10 border border-white/[0.04] hover:border-accent/30 rounded-lg text-text-dim hover:text-accent transition-all duration-200"
              >
                {domain}
              </button>
            ))}
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-danger/10 border border-danger/25 rounded-xl p-4 text-xs font-mono text-danger mb-6 flex items-start gap-2 animate-fadeInUp">
            <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-danger" />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-5 animate-fadeInUp">

            {/* Score card */}
            <div className="bg-surface/60 border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-6 backdrop-blur-sm shadow-lg">
              <ScoreRing score={result.score} grade={result.grade} />
              <div className="flex-1 text-center sm:text-left w-full min-w-0">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1 font-bold">Scanned URL</p>
                <p className="font-mono text-sm text-accent-light mb-3 break-all font-semibold select-all">{result.url}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start text-[10px] font-bold uppercase">
                  <span className="bg-panel/40 border border-border/80 rounded-lg px-2.5 py-1.5 font-mono text-text/90">
                    HTTP <span className="text-accent">{result.statusCode}</span>
                  </span>
                  <span className="bg-panel/40 border border-border/80 rounded-lg px-2.5 py-1.5 font-mono text-success">
                    {result.summary.present} present
                  </span>
                  <span className="bg-panel/40 border border-border/80 rounded-lg px-2.5 py-1.5 font-mono text-danger">
                    {result.summary.missing} missing
                  </span>
                  <span className="bg-panel/40 border border-border/80 rounded-lg px-2.5 py-1.5 font-mono text-warning">
                    {result.summary.weak} weak
                  </span>
                  <span className="bg-panel/40 border border-border/80 rounded-lg px-2.5 py-1.5 font-mono text-text-muted">
                    {result.scanDuration}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Header results table */}
            <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden shadow-lg">
              <div className="px-5 py-3.5 border-b border-border/80 flex items-center justify-between bg-panel/20 select-none">
                <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-accent animate-pulse" />
                  Security Header Analysis
                </h2>
                <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">{result.headers.length} headers checked</span>
              </div>
              <div className="divide-y divide-border/40">
                {result.headers.map((h, i) => (
                  <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/[0.01] transition duration-200">
                    <div className="mt-0.5 shrink-0">{statusIcon(h.status)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-semibold text-text truncate">{h.name}</p>
                      <p className="text-[11px] text-text-dim mt-0.5 leading-relaxed line-clamp-2">{h.description}</p>
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
              <div className="bg-surface/50 border border-border rounded-2xl overflow-hidden shadow-lg">
                <div className="px-5 py-3.5 border-b border-border/80 bg-panel/20 select-none">
                  <h2 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning animate-pulse" />
                    Top Recommendations
                  </h2>
                </div>
                <div className="divide-y divide-border/40">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="px-5 py-4 hover:bg-white/[0.01] transition duration-200">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/5 ${severityColor(r.severity)}`}>{r.severity}</span>
                        <span className="text-xs font-mono font-semibold text-text">{r.header}</span>
                      </div>
                      <p className="text-xs text-text-dim leading-relaxed">{r.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upsell CTA */}
            <div className="bg-gradient-to-br from-accent/10 to-accent-light/5 border border-accent/20 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-accent">
                  <Star className="w-4 h-4 fill-accent" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">Unlock Full Report</span>
                </div>
                <h3 className="text-sm font-bold text-text uppercase tracking-wide">
                  Get SSL, DNS, Tech Stack, Cookies & Compliance
                </h3>
                <p className="text-xs text-text-dim mb-5 max-w-sm mx-auto leading-relaxed">
                  Sign up free to run complete EASM scans with AI-powered remediation, compliance audits, and historical tracking.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-300 hover:shadow-glow"
                  >
                    <Lock className="w-4 h-4" />
                    Create Free Account
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-300"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Features preview — shown when no result yet */}
        {!result && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 select-none">
            {[
              { icon: Shield, label: "Security Headers", desc: "CSP, HSTS, X-Frame-Options, and more" },
              { icon: Zap, label: "Instant Analysis", desc: "Results in under 10 seconds" },
              { icon: Lock, label: "No Login Needed", desc: "Run a basic scan without registering" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-surface/50 border border-border/80 rounded-xl p-4 text-center hover:border-border transition-all duration-300 hover:scale-[1.02] shadow-sm">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 text-accent border border-accent/15">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <p className="text-xs font-bold text-text uppercase tracking-wide mb-1">{label}</p>
                <p className="text-[11px] text-text-dim leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
