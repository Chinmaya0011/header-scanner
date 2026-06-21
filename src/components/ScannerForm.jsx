"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Shield, Mail } from "lucide-react";
import ScanResults from "./ScanResults";

export default function ScannerForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Email report states
  const [currentUser, setCurrentUser] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState(null);

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Auth me fetch error in scanner form:", err);
      }
    }
    checkAuth();
  }, []);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!result?.scanId) return;

    setEmailLoading(true);
    setEmailSuccess(false);
    setEmailError(null);

    try {
      const res = await fetch(`/api/scan/${result.scanId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email report.");
      }

      setEmailSuccess(true);
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  async function handleScan(e) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setEmailSuccess(false);
    setEmailError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 font-mono">
      {/* Input form */}
      <form onSubmit={handleScan} className="relative">
        <div className="flex flex-col sm:flex-row gap-0 rounded-xl overflow-hidden border border-border bg-surface focus-within:border-accent/50 transition-all focus-within:shadow-glow">
          <div className="flex flex-1 items-center">
            <div className="pl-4 text-text-dim flex items-center">
              <Search className="h-4 w-4 text-accent/70" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="Enter domain or URL — e.g. example.com"
              className="scan-input w-full bg-transparent px-3 py-4 text-text placeholder:text-muted font-mono text-sm focus:outline-none"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-accent/15 border-t sm:border-t-0 sm:border-l border-border text-accent font-bold text-xs uppercase tracking-widest hover:bg-accent/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
          >
            {loading ? (
              <>
                <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-accent/35 border-t-accent animate-spin" />
                Auditing…
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Audit
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <div className="fade-in-up rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-danger text-xs font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="fade-in-up rounded-xl border border-border bg-surface p-8 flex flex-col items-center gap-4 shadow-glow">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
            <Shield className="absolute inset-0 m-auto text-accent h-6 w-6 animate-pulse" />
          </div>
          <div className="text-center">
            <p className="text-text font-mono text-xs font-bold uppercase tracking-wider">Analyzing security headers…</p>
            <p className="text-text-dim text-[10px] uppercase mt-1">Fetching cryptographic response properties</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="space-y-4 animate-fadeInUp">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border bg-panel/30 rounded-xl">
            <div>
              <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">Audit Metrics</h2>
              <p className="text-[10px] text-text-dim mt-0.5">Security evaluation completed successfully.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {currentUser ? (
                <button
                  onClick={handleSendEmail}
                  disabled={emailLoading}
                  className="flex items-center gap-1.5 bg-accent/10 border border-accent/40 text-accent font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider hover:bg-accent/25 transition-colors disabled:opacity-50"
                  title={`Email report to ${currentUser.email}`}
                >
                  <Mail className="h-3.5 w-3.5" />
                  {emailLoading ? "Sending..." : "Email Report"}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 bg-panel border border-border text-text-dim font-bold px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider hover:text-text transition-colors"
                  title="Log in to email this report"
                >
                  <Mail className="h-3.5 w-3.5 text-text-dim/70" />
                  Log in to Email
                </Link>
              )}
            </div>
          </div>

          {emailSuccess && (
            <div className="p-3 bg-success/10 border border-success/25 text-success text-xs rounded-lg font-mono flex items-center justify-between animate-fadeIn">
              <span>✔ Security audit report successfully dispatched to {currentUser?.email}! Check your inbox.</span>
              <button onClick={() => setEmailSuccess(false)} className="hover:text-text font-bold ml-2">×</button>
            </div>
          )}

          {emailError && (
            <div className="p-3 bg-danger/10 border border-danger/25 text-danger text-xs rounded-lg font-mono flex items-center justify-between animate-fadeIn">
              <span>⚠ Failed to send email: {emailError}</span>
              <button onClick={() => setEmailError(false)} className="hover:text-text font-bold ml-2">×</button>
            </div>
          )}

          <ScanResults result={result} />
        </div>
      )}
    </div>
  );
}
