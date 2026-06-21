"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ScanResults from "@/components/ScanResults";
import { ArrowLeft, Clock, AlertTriangle, Mail } from "lucide-react";

export default function ScanDetailClient({ scan: initialScan, id }) {
  const router = useRouter();
  const [scan, setScan] = useState(initialScan);
  const [loading, setLoading] = useState(!initialScan);
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
        console.error("Auth me fetch error in details:", err);
      }
    }
    checkAuth();
  }, []);

  const handleSendEmail = async (e) => {
    e.preventDefault();

    setEmailLoading(true);
    setEmailSuccess(false);
    setEmailError(null);

    try {
      const res = await fetch(`/api/scan/${scan?._id || id}/email`, {
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

  useEffect(() => {
    if (scan) return;
    if (!id) {
      setError("No scan ID provided");
      setLoading(false);
      return;
    }

    async function fetchScan() {
      try {
        console.log("Fetching scan with ID:", id);
        const response = await fetch(`/api/scan/${id}`);
        const data = await response.json();
        
        console.log("API Response:", { status: response.status, data });
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        
        if (!data.success) {
          throw new Error(data.error || "Unknown error");
        }
        
        if (!data.data) {
          throw new Error("No scan data received");
        }
        
        setScan(data.data);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchScan();
  }, [id, scan]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-mono">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-text-dim text-xs">Loading audit metrics...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-mono">
        <Navbar />
        <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-20">
          <div className="bg-danger/5 border border-danger/25 rounded-xl p-8 text-center max-w-md mx-auto shadow-glow">
            <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-3 animate-pulse" />
            <h2 className="text-lg font-bold text-text mb-2">Audit Load Failed</h2>
            <p className="text-text-dim text-xs leading-relaxed mb-6">{error}</p>
            <div className="flex gap-3 justify-center text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-accent/10 border border-accent/40 text-accent rounded-lg hover:bg-accent/25 transition-all"
              >
                Reload
              </button>
              <Link
                href="/history"
                className="px-4 py-2 bg-panel border border-border text-text-dim rounded-lg hover:text-text hover:border-border-accent transition-all"
              >
                History
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!scan) {
    return null;
  }

  const scanDate = scan.createdAt || scan.metadata?.timestamp || new Date().toISOString();

  return (
    <div className="min-h-screen bg-bg font-mono">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/history"
              className="flex items-center gap-1.5 text-text-dim text-xs font-bold uppercase tracking-wider hover:text-text transition-colors border border-border/40 bg-panel/30 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-accent" />
              Back to History
            </Link>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5 text-text-dim text-xs">
              <Clock className="h-4 w-4 text-accent/70" />
              <span>
                Scanned{" "}
                {new Date(scanDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div>
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
          <div className="mb-6 p-3 bg-success/10 border border-success/25 text-success text-xs rounded-lg font-mono flex items-center justify-between animate-fadeIn">
            <span>✔ Security audit report successfully dispatched to {currentUser?.email}! Check your inbox.</span>
            <button onClick={() => setEmailSuccess(false)} className="hover:text-text font-bold ml-2">×</button>
          </div>
        )}

        {emailError && (
          <div className="mb-6 p-3 bg-danger/10 border border-danger/25 text-danger text-xs rounded-lg font-mono flex items-center justify-between animate-fadeIn">
            <span>⚠ Failed to send email: {emailError}</span>
            <button onClick={() => setEmailError(false)} className="hover:text-text font-bold ml-2">×</button>
          </div>
        )}

        <ScanResults result={scan} />
      </main>
    </div>
  );
}