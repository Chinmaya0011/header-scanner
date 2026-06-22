"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/common/Loading";
import { ArrowLeft, GitCompare, ChevronRight, AlertTriangle } from "lucide-react";

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id1 = searchParams.get("id1");
  const id2 = searchParams.get("id2");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [diff, setDiff] = useState(null);

  useEffect(() => {
    async function fetchDiff() {
      if (!id1 || !id2) {
        setError("Invalid query parameters. Please select two scans from the dashboard console.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/compare?id1=${id1}&id2=${id2}`);
        const data = await res.json();
        if (data.success) {
          setDiff(data.diff);
        } else {
          setError(data.error || "Failed to compare scans.");
        }
      } catch (err) {
        setError("Failed to connect to backend server.");
      } finally {
        setLoading(false);
      }
    }
    fetchDiff();
  }, [id1, id2]);

  if (loading) {
    return <Loading message="Computing posture differences..." />;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4 font-sans">
        <AlertTriangle className="h-10 w-10 text-danger mx-auto" />
        <p className="text-xs font-mono text-danger bg-danger/5 border border-danger/25 p-4 rounded-lg">{error}</p>
        <Button onClick={() => router.push("/scanner")} variant="primary" size="sm" icon={ArrowLeft}>
          Back to Scanner
        </Button>
      </div>
    );
  }

  const { meta, score, grade, headers, ssl, dns, cookies, vulnerabilities } = diff;

  return (
    <div className="space-y-8 animate-fadeInUp font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.05] pb-4">
        <div className="flex items-center gap-3">
          <Button onClick={() => router.back()} variant="outline" size="sm" icon={ArrowLeft} />
          <div>
            <h1 className="text-lg font-bold uppercase tracking-wider text-text flex items-center gap-2">
              <GitCompare className="text-accent h-5 w-5" />
              <span>Audit Session Comparison</span>
            </h1>
            <p className="text-[10px] text-text-dim mt-0.5">
              Differential analysis for <span className="font-mono text-accent">{meta.domain1}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Score Diff Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="text-center p-6 border border-white/[0.04] bg-surface/50">
          <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Previous Scan Score</p>
          <p className="text-4xl font-extrabold font-mono text-text mt-2">{score.val1}</p>
          <Badge variant="outline" className="mt-2 text-[10px]">{grade.val1} Grade</Badge>
          <p className="text-[8px] text-text-muted mt-2 uppercase font-semibold">{new Date(meta.date1).toLocaleString()}</p>
        </Card>

        <Card className="text-center p-6 border border-white/[0.04] bg-surface/50">
          <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Comparison Score Delta</p>
          <p className={`text-4xl font-extrabold font-mono mt-2 ${score.change >= 0 ? "text-success" : "text-danger"}`}>
            {score.change >= 0 ? `+${score.change}` : score.change}
          </p>
          <Badge variant={score.change >= 0 ? "success" : "danger"} className="mt-2 text-[10px] uppercase font-bold">
            {score.change >= 0 ? "Improved" : "Degraded"}
          </Badge>
          <p className="text-[8px] text-text-muted mt-2 uppercase font-semibold">Variance indicators</p>
        </Card>

        <Card className="text-center p-6 border border-white/[0.04] bg-surface/50">
          <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Current Scan Score</p>
          <p className="text-4xl font-extrabold font-mono text-text mt-2">{score.val2}</p>
          <Badge variant="accent" className="mt-2 text-[10px]">{grade.val2} Grade</Badge>
          <p className="text-[8px] text-text-muted mt-2 uppercase font-semibold">{new Date(meta.date2).toLocaleString()}</p>
        </Card>
      </div>

      {/* Vulnerabilities Diff */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-4 border-b border-white/[0.05] pb-2">Vulnerability Posture Variance</h3>
        {vulnerabilities.length === 0 ? (
          <p className="text-xs text-text-dim italic text-center py-4">No changes in detected server vulnerabilities.</p>
        ) : (
          <div className="space-y-2 text-xs font-mono">
            {vulnerabilities.map((v, idx) => (
              <div key={idx} className="flex justify-between items-center bg-bg/40 p-2.5 rounded border border-white/[0.03]">
                <span>{v.name}</span>
                <Badge variant={v.status === "resolved" ? "success" : "danger"}>
                  {v.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Headers Changes Table */}
      <Card className="p-5">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-4 border-b border-white/[0.05] pb-2">HTTP Header Directive Differences</h3>
        {headers.length === 0 ? (
          <p className="text-xs text-text-dim italic text-center py-4">No directive modifications detected.</p>
        ) : (
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05] text-text-muted text-[10px] font-bold uppercase">
                  <th className="py-2">Directive</th>
                  <th className="py-2">Previous value</th>
                  <th className="py-2">Current value</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {headers.map((h, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01]">
                    <td className="py-2.5 font-bold text-text">{h.name}</td>
                    <td className="py-2.5 text-text-dim max-w-xs truncate" title={h.val1}>{h.val1}</td>
                    <td className="py-2.5 text-text-dim max-w-xs truncate" title={h.val2}>{h.val2}</td>
                    <td className="py-2.5">
                      <Badge variant={h.status === "added" ? "success" : h.status === "removed" ? "danger" : "warning"}>
                        {h.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* SSL Certificate Changes */}
      {ssl && ssl.changed && ssl.changes && ssl.changes.length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-4 border-b border-white/[0.05] pb-2">SSL/TLS Config Modifications</h3>
          <div className="space-y-2 text-xs font-mono">
            {ssl.changes.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center bg-bg/40 p-2.5 rounded border border-white/[0.03]">
                <span>{c.parameter}</span>
                <span className="text-text-dim">{c.val1} <ChevronRight className="inline-block h-3 w-3 text-text-muted" /> {c.val2}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* DNS Record Changes */}
      {dns && dns.changed && dns.changes && dns.changes.length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-4 border-b border-white/[0.05] pb-2">DNS security differences</h3>
          <div className="space-y-2 text-xs font-mono">
            {dns.changes.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center bg-bg/40 p-2.5 rounded border border-white/[0.03]">
                <span>{c.record}</span>
                <span className="text-text-dim truncate max-w-xs" title={`${c.val1} -> ${c.val2}`}>
                  {c.val1} <ChevronRight className="inline-block h-3 w-3 text-text-muted" /> {c.val2}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Cookies Changes */}
      {cookies && cookies.length > 0 && (
        <Card className="p-5">
          <h3 className="text-xs font-bold text-text uppercase tracking-wider mb-4 border-b border-white/[0.05] pb-2">Session Cookies variance</h3>
          <div className="space-y-2 text-xs font-mono">
            {cookies.map((c, idx) => (
              <div key={idx} className="flex justify-between items-center bg-bg/40 p-2.5 rounded border border-white/[0.03]">
                <span>Cookie: <strong>{c.name}</strong></span>
                <span className="text-text-dim">
                  {c.status === "added" ? <Badge variant="success">ADDED</Badge> : c.status === "removed" ? <Badge variant="danger">REMOVED</Badge> : <Badge variant="warning">{c.details}</Badge>}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col">
      <Navbar />
      <main className="flex-grow max-w-4xl w-full mx-auto px-4 sm:px-6 py-12">
        <Suspense fallback={<Loading message="Syncing differential scan buffers..." />}>
          <CompareContent />
        </Suspense>
      </main>
    </div>
  );
}
