"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Loading from "@/components/common/Loading";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  ArrowLeft,
  GitCompare,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Globe,
} from "lucide-react";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id1 = searchParams.get("id1");
  const id2 = searchParams.get("id2");

  const [scan1, setScan1] = useState(null);
  const [scan2, setScan2] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id1 || !id2) {
      setError("Please select exactly two scans to compare.");
      setLoading(false);
      return;
    }

    async function fetchScans() {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`/api/scan/${id1}`),
          fetch(`/api/scan/${id2}`),
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        if (!res1.ok || !data1.success) throw new Error(data1.error || "Failed to load first scan.");
        if (!res2.ok || !data2.success) throw new Error(data2.error || "Failed to load second scan.");

        setScan1(data1.data);
        setScan2(data2.data);
      } catch (err) {
        console.error("Comparison load error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchScans();
  }, [id1, id2]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
                <main className="flex-1 flex items-center justify-center">
          <Loading message="Correlating security profiles..." />
        </main>
      </div>
    );
  }

  if (error || !scan1 || !scan2) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
                <main className="max-w-md w-full mx-auto px-4 py-20">
          <Card className="border border-danger/30 bg-danger/5 text-center p-6 space-y-4">
            <AlertTriangle className="h-10 w-10 text-danger mx-auto animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Comparison Failed</h2>
            <p className="text-xs text-text-dim leading-relaxed">{error || "Could not retrieve audit records."}</p>
            <Link href="/dashboard" passHref>
              <Button variant="outline" size="sm" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  const scoreDiff = scan2.score - scan1.score;

  // Build a unified dictionary of headers for the diff table
  const allHeaderKeys = Array.from(
    new Set([
      ...scan1.headers.map((h) => h.name),
      ...scan2.headers.map((h) => h.name),
    ])
  ).sort();

  const getHeaderDiffStatus = (h1, h2) => {
    if (!h1 && h2) return { text: "Added", color: "text-success bg-success/10 border-success/20" };
    if (h1 && !h2) return { text: "Removed", color: "text-danger bg-danger/10 border-danger/20" };
    if (!h1 || !h2) return { text: "Unchanged", color: "text-text-dim bg-panel/30 border-border/40" };

    if (h1.status === h2.status) {
      return { text: "Unchanged", color: "text-text-dim bg-panel/20 border-border/20" };
    }
    if (h1.status === "present" && h2.status !== "present") {
      return { text: "Degraded", color: "text-warning bg-warning/10 border-warning/20" };
    }
    if (h1.status !== "present" && h2.status === "present") {
      return { text: "Improved", color: "text-success bg-success/10 border-success/20" };
    }
    if (h1.status === "missing" && h2.status === "weak") {
      return { text: "Improved", color: "text-success bg-success/10 border-success/20" };
    }
    if (h1.status === "weak" && h2.status === "missing") {
      return { text: "Degraded", color: "text-warning bg-warning/10 border-warning/20" };
    }
    return { text: "Changed", color: "text-accent bg-accent/10 border-accent/20" };
  };

  const getStatusIcon = (status) => {
    if (status === "present") return <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />;
    if (status === "weak") return <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />;
    return <XCircle className="h-4 w-4 text-danger flex-shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-text-dim hover:text-text transition-colors text-xs font-medium group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Console</span>
        </Link>

        {/* Title */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-accent animate-pulse" />
            <h1 className="text-xl font-bold tracking-wide">Audit Diff Console</h1>
          </div>
          <div className="text-[10px] text-text-muted font-bold uppercase tracking-wider bg-panel/30 border border-border/80 px-3 py-1 rounded-full">
            Posture Regression Analysis
          </div>
        </div>

        {/* Side-by-Side Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {/* Scan 1 */}
          <Card className="border border-border bg-surface/50 p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-border/50 pb-3">
              <div>
                <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold mb-0.5">Initial Baseline</p>
                <h2 className="text-sm font-mono font-bold text-text truncate max-w-[220px]">{scan1.domain}</h2>
              </div>
              <Badge variant={scan1.score >= 80 ? "success" : scan1.score >= 60 ? "accent" : "danger"}>
                Grade {scan1.grade}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center bg-bg/40 border border-border/60 rounded-xl p-3.5">
              <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Audit Score</span>
              <span className="text-xl font-mono font-bold text-text">{scan1.score}/100</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] py-1 bg-panel/10 rounded-lg border border-border/20">
              <div>
                <p className="text-success font-mono font-bold text-sm">{scan1.summary?.present || 0}</p>
                <p className="text-text-muted font-semibold uppercase tracking-wider text-[8px] mt-0.5">Present</p>
              </div>
              <div>
                <p className="text-warning font-mono font-bold text-sm">{scan1.summary?.weak || 0}</p>
                <p className="text-text-muted font-semibold uppercase tracking-wider text-[8px] mt-0.5">Weak</p>
              </div>
              <div>
                <p className="text-danger font-mono font-bold text-sm">{scan1.summary?.missing || 0}</p>
                <p className="text-text-muted font-semibold uppercase tracking-wider text-[8px] mt-0.5">Missing</p>
              </div>
            </div>
          </Card>

          {/* Scan 2 */}
          <Card className="border border-border bg-surface/50 p-5 space-y-4">
            <div className="flex justify-between items-start border-b border-border/50 pb-3">
              <div>
                <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold mb-0.5">Target Comparison</p>
                <h2 className="text-sm font-mono font-bold text-text truncate max-w-[220px]">{scan2.domain}</h2>
              </div>
              <Badge variant={scan2.score >= 80 ? "success" : scan2.score >= 60 ? "accent" : "danger"}>
                Grade {scan2.grade}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center bg-bg/40 border border-border/60 rounded-xl p-3.5">
              <span className="text-[10px] text-text-dim uppercase tracking-wider font-bold">Audit Score</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-text">{scan2.score}/100</span>
                {scoreDiff !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    scoreDiff > 0 ? "text-success bg-success/10" : "text-danger bg-danger/10"
                  }`}>
                    {scoreDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[10px] py-1 bg-panel/10 rounded-lg border border-border/20">
              <div>
                <p className="text-success font-mono font-bold text-sm">{scan2.summary?.present || 0}</p>
                <p className="text-text-muted font-semibold uppercase tracking-wider text-[8px] mt-0.5">Present</p>
              </div>
              <div>
                <p className="text-warning font-mono font-bold text-sm">{scan2.summary?.weak || 0}</p>
                <p className="text-text-muted font-semibold uppercase tracking-wider text-[8px] mt-0.5">Weak</p>
              </div>
              <div>
                <p className="text-danger font-mono font-bold text-sm">{scan2.summary?.missing || 0}</p>
                <p className="text-text-muted font-semibold uppercase tracking-wider text-[8px] mt-0.5">Missing</p>
              </div>
            </div>
          </Card>

          {/* Center connector visual badge */}
          <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-panel border border-border rounded-full p-2.5 shadow-lg z-10 text-accent pointer-events-none">
            <GitCompare className="h-4.5 w-4.5" />
          </div>
        </div>

        {/* Detailed Header Diff Table */}
        <section className="space-y-3">
          <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold">
            Headers Audit Comparison Checklist
          </p>

          <div className="border border-border bg-surface/40 rounded-xl overflow-hidden divide-y divide-border/60">
            {/* Header row */}
            <div className="grid grid-cols-[1.5fr_1fr_1fr_80px] px-5 py-3 text-[9px] text-text-muted font-bold uppercase tracking-wider bg-panel/20">
              <div>Security Header Name</div>
              <div className="text-center">Baseline Configuration</div>
              <div className="text-center">Target Configuration</div>
              <div className="text-right">Audit Diff</div>
            </div>

            {/* List */}
            {allHeaderKeys.map((name) => {
              const h1 = scan1.headers.find((h) => h.name === name);
              const h2 = scan2.headers.find((h) => h.name === name);
              const diff = getHeaderDiffStatus(h1, h2);

              return (
                <div key={name} className="grid grid-cols-[1.5fr_1fr_1fr_80px] items-center px-5 py-3.5 hover:bg-panel/10 transition-colors">
                  <div className="font-mono font-semibold text-text text-xs truncate pr-2">
                    {name}
                  </div>
                  
                  <div className="flex justify-center items-center gap-1.5 text-xs text-text-dim text-center">
                    {h1 ? (
                      <>
                        {getStatusIcon(h1.status)}
                        <span className="font-semibold capitalize text-[10px]">{h1.status}</span>
                      </>
                    ) : (
                      <span className="text-text-muted text-[10px] italic">Not Evaluated</span>
                    )}
                  </div>

                  <div className="flex justify-center items-center gap-1.5 text-xs text-text-dim text-center">
                    {h2 ? (
                      <>
                        {getStatusIcon(h2.status)}
                        <span className="font-semibold capitalize text-[10px]">{h2.status}</span>
                      </>
                    ) : (
                      <span className="text-text-muted text-[10px] italic">Not Evaluated</span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className={`inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-md ${diff.color}`}>
                      {diff.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
                <main className="flex-1 flex items-center justify-center">
          <Loading message="Resolving secure connection..." />
        </main>
      </div>
    }>
      <CompareContent />
    </Suspense>
  );
}
