"use client";

import Link from "next/link";
import { ArrowRight, Clock, ShieldAlert } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

function gradeStyle(grade) {
  if (grade.startsWith("A")) return "success";
  if (grade.startsWith("B")) return "accent";
  if (grade.startsWith("C")) return "warning";
  return "danger";
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
      <div className="rounded-xl border border-border bg-surface/50 p-12 text-center select-none font-sans">
        <ShieldAlert className="h-12 w-12 text-text-muted mx-auto mb-3" />
        <p className="text-text font-bold text-sm">No Security Audits Recorded</p>
        <p className="text-text-dim text-xs mt-1 max-w-sm mx-auto leading-relaxed">
          Begin auditing target endpoints by submitting your first request on the{" "}
          <Link href="/" className="text-accent hover:text-accent-light font-bold">
            Scanner console
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden font-sans">
      {/* Desktop view */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/80 text-text-muted bg-panel/30">
              <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-wider">
                Target Endpoint
              </th>
              <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-wider">
                Security Score
              </th>
              <th className="text-center px-4 py-4 text-[10px] font-bold uppercase tracking-wider">
                Grade
              </th>
              <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider">
                Scan Date
              </th>
              <th className="px-5 py-4 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-xs">
            {scans.map((scan) => (
              <tr
                key={scan._id}
                className="hover:bg-panel/20 transition-colors duration-150"
              >
                <td className="px-5 py-4 font-mono font-semibold text-text">
                  {scan.domain || scan.maskedDomain}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="font-mono font-bold text-text text-sm">
                    {scan.score}
                    <span className="text-text-muted font-normal text-xs">/100</span>
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <Badge variant={gradeStyle(scan.grade)}>
                    {scan.grade}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-text-dim">
                  <span className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Clock className="h-3.5 w-3.5 text-accent/70" />
                    {formatDate(scan.createdAt)}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/scan/${scan._id}`} passHref>
                    <Button variant="secondary" size="sm" icon={ArrowRight}>
                      View Report
                    </Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view */}
      <div className="sm:hidden divide-y divide-border/40">
        {scans.map((scan) => (
          <Link
            key={scan._id}
            href={`/scan/${scan._id}`}
            className="flex items-center justify-between p-4.5 hover:bg-panel/20 transition-colors block"
          >
            <div className="space-y-1.5 min-w-0 mr-3">
              <p className="font-mono font-semibold text-sm text-text truncate">
                {scan.domain || scan.maskedDomain}
              </p>
              <p className="text-[10px] text-text-dim flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-accent/70" />
                {formatDate(scan.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3.5 flex-shrink-0">
              <Badge variant={gradeStyle(scan.grade)}>
                {scan.grade}
              </Badge>
              <ArrowRight className="text-text-muted h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
