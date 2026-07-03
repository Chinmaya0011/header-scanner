"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, Eye, Activity, Globe } from "lucide-react";

export default function Footer() {
  const [stats, setStats] = useState({
    totalVisits: null,
    totalScans: null,
    uniqueDomains: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch public footer stats:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    // Poll stats occasionally (every 30 seconds) to keep them live
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "—";
    return num.toLocaleString();
  };

  return (
    <footer className="mt-auto border-t border-white/[0.04] bg-surface/30 backdrop-blur-md py-8 text-xs text-text-dim select-none font-sans transition-all duration-300">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-6">
        
        {/* Statistics Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-white/[0.04]">
          
          {/* Page Visits Stat */}
          <div className="flex items-center gap-3.5 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] rounded-xl p-3.5 transition-all duration-300 group">
            <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
              <Eye className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Visitors</p>
              {loading ? (
                <div className="h-4 w-12 bg-white/[0.05] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-sm font-bold font-mono text-indigo-300 mt-0.5">
                  {formatNumber(stats.totalVisits)}
                </p>
              )}
            </div>
          </div>

          {/* Total Scans Stat */}
          <div className="flex items-center gap-3.5 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] rounded-xl p-3.5 transition-all duration-300 group">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Scans</p>
              {loading ? (
                <div className="h-4 w-12 bg-white/[0.05] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-sm font-bold font-mono text-emerald-300 mt-0.5">
                  {formatNumber(stats.totalScans)}
                </p>
              )}
            </div>
          </div>

          {/* Unique Domains Stat */}
          <div className="flex items-center gap-3.5 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.03] rounded-xl p-3.5 transition-all duration-300 group">
            <div className="p-2 rounded bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Unique Domains</p>
              {loading ? (
                <div className="h-4 w-12 bg-white/[0.05] rounded animate-pulse mt-1" />
              ) : (
                <p className="text-sm font-bold font-mono text-amber-300 mt-0.5">
                  {formatNumber(stats.uniqueDomains)}
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Branding & Links row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent animate-pulse" />
            <span className="font-bold text-text uppercase tracking-wide">HeaderGuard Console</span>
          </div>
          
          <div className="flex gap-4 text-[10px] uppercase font-bold text-text-muted">
            <Link href="/scanner" className="hover:text-text transition-colors duration-200">Scanner</Link>
            <span>·</span>
            <Link href="/developers" className="hover:text-text transition-colors duration-200">Developer API</Link>
          </div>

          <p className="text-[10px] text-text-muted">
            &copy; {new Date().getFullYear()} HeaderGuard. Secure Transit Policy.
          </p>
        </div>
      </div>
    </footer>
  );
}
