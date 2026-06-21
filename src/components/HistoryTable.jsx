"use client";

import Link from "next/link";
import { ArrowRight, Clock, ShieldAlert } from "lucide-react";

function gradeStyle(grade) {
  if (grade.startsWith("A")) return "text-success border-success/30 bg-success/10";
  if (grade === "B") return "text-accent border-accent/30 bg-accent/10";
  if (grade === "C") return "text-warning border-warning/30 bg-warning/10";
  return "text-danger border-danger/30 bg-danger/10";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryTable({ scans }) {
  if (!scans || scans.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-12 text-center select-none font-mono">
        <ShieldAlert className="h-12 w-12 text-muted mx-auto mb-3" />
        <p className="text-text font-semibold text-sm">No Scans Executed</p>
        <p className="text-text-dim text-xs mt-1">
          Perform your first security check from the{" "}
          <Link href="/" className="text-accent hover:underline font-bold">
            Scanner
          </Link>{" "}
          console.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden font-mono">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-border text-text-dim">
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-widest">
                Target Domain
              </th>
              <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest">
                Security Score
              </th>
              <th className="text-center px-4 py-4 text-xs font-bold uppercase tracking-widest">
                Letter Grade
              </th>
              <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest">
                Scan Date
              </th>
              <th className="px-4 py-4 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {scans.map((scan) => (
              <tr
                key={scan._id}
                className="hover:bg-panel/40 transition-colors duration-150"
              >
                <td className="px-5 py-4">
                  <span className="font-semibold text-text">{scan.domain || scan.maskedDomain}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="font-bold text-text">
                    {scan.score}
                    <span className="text-text-dim font-normal">/100</span>
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-bold tracking-wider ${gradeStyle(scan.grade)}`}
                  >
                    {scan.grade}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-1.5 text-text-dim text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-accent/70" />
                    {formatDate(scan.createdAt)}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <Link
                    href={`/scan/${scan._id}`}
                    className="inline-flex items-center gap-1 bg-accent/10 border border-accent/30 text-accent font-bold px-3 py-1 rounded-md text-[10px] uppercase tracking-wider hover:bg-accent/20 transition-all duration-150"
                  >
                    Report <ArrowRight className="h-3 w-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border/30">
        {scans.map((scan) => (
          <Link
            key={scan._id}
            href={`/scan/${scan._id}`}
            className="flex items-center justify-between p-4 hover:bg-panel/40 transition-colors"
          >
            <div className="space-y-1">
              <p className="font-semibold text-sm text-text truncate max-w-[180px]">
                {scan.domain || scan.maskedDomain}
              </p>
              <p className="text-[11px] text-text-dim flex items-center gap-1">
                <Clock className="h-3 w-3 text-accent/70" />
                {formatDate(scan.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-bold text-[10px] px-2 py-0.5 rounded border ${gradeStyle(scan.grade)}`}
              >
                {scan.grade}
              </span>
              <ArrowRight className="text-text-dim h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
