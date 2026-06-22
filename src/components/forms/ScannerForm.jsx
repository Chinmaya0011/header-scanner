"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Shield, Mail } from "lucide-react";
import ScanResults from "@/components/ui/ScanResults";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setEmailSuccess(false);
    setEmailError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Scan failed. Please verify the URL and try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network connectivity error. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Input form */}
      <form onSubmit={handleScan} className="relative">
        <div className="flex flex-col sm:flex-row gap-0 rounded-xl overflow-hidden border border-border bg-surface focus-within:border-accent/50 transition-all focus-within:shadow-glow">
          <div className="flex flex-1 items-center">
            <div className="pl-4 text-accent/70 flex items-center">
              <Search className="h-4.5 w-4.5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="Enter host domain or target URL (e.g. example.com)"
              className="w-full bg-transparent px-3.5 py-4 text-text placeholder:text-text-muted font-mono text-sm focus:outline-none"
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              aria-label="Target domain or URL to scan"
            />
          </div>
          
          <Button
            type="submit"
            disabled={loading || !url.trim()}
            variant="primary"
            className="rounded-none py-4 px-8 border-0"
            loading={loading}
            icon={Shield}
          >
            Audit Endpoint
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4.5 py-3.5 text-danger text-xs font-mono">
          ⚠️ {error}
        </div>
      )}

      {/* Loading state visual scan line animation overlay */}
      {loading && (
        <Card className="flex flex-col items-center gap-5 p-8 border border-border shadow-glow relative overflow-hidden bg-surface/50">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/20">
            <div className="h-full w-1/3 bg-accent scan-line" />
          </div>
          
          <div className="relative w-14 h-14 mt-2 flex items-center justify-center">
            {/* Outer spinner ring */}
            <div className="absolute inset-0 rounded-full border-2 border-border border-t-accent animate-spin" />

            {/* Inner spinner ring - reverse direction */}
            <div className="absolute w-8 h-8 rounded-full border border-border border-b-accent animate-[spin_1.2s_linear_infinite_reverse]" />

            {/* Center pulsing shield */}
            <Shield className="absolute text-accent h-4.5 w-4.5 animate-pulse" />
          </div>
          
          <div className="text-center space-y-1">
            <p className="text-text font-bold text-xs uppercase tracking-wider">Auditing Endpoint Security Headers...</p>
            <p className="text-text-dim text-[10px] uppercase">Retrieving response properties and security metadata</p>
          </div>
        </Card>
      )}

      {/* Results panel container */}
      {result && !loading && (
        <div className="space-y-4 animate-fadeInUp">
          <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-border bg-panel/20">
            <div>
              <h2 className="text-xs font-bold text-text-dim uppercase tracking-wider">Session Audit Overview</h2>
              <p className="text-[10px] text-text-muted mt-0.5">Metrics parsed from secure database records.</p>
            </div>
            
            <div>
              {currentUser ? (
                <Button
                  onClick={handleSendEmail}
                  disabled={emailLoading}
                  variant="secondary"
                  size="sm"
                  icon={Mail}
                  title={`Email report to ${currentUser.email}`}
                >
                  {emailLoading ? "Sending..." : "Email Report"}
                </Button>
              ) : (
                <Link href="/login" passHref>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Mail}
                    title="Log in to email this report"
                  >
                    Log in to Email
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {emailSuccess && (
            <div className="p-3.5 bg-success/5 border border-success/20 text-success text-xs rounded-lg font-sans flex items-center justify-between animate-fadeInUp">
              <span className="font-semibold">✔ Security audit report successfully dispatched to {currentUser?.email}! Check your inbox.</span>
              <button onClick={() => setEmailSuccess(false)} className="hover:text-text font-bold ml-2">×</button>
            </div>
          )}

          {emailError && (
            <div className="p-3.5 bg-danger/5 border border-danger/20 text-danger text-xs rounded-lg font-sans flex items-center justify-between animate-fadeInUp">
              <span className="font-semibold">⚠️ Failed to dispatch email report: {emailError}</span>
              <button onClick={() => setEmailError(false)} className="hover:text-text font-bold ml-2">×</button>
            </div>
          )}

          <ScanResults result={result} />
        </div>
      )}
    </div>
  );
}
