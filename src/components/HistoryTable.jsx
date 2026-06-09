"use client";
import Link from "next/link";
import { MdArrowForward, MdAccessTime, MdHttps } from "react-icons/md";

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
      <div className="rounded-xl border border-border bg-surface p-12 text-center">
        <MdHttps className="text-5xl text-muted mx-auto mb-3" />
        <p className="text-text font-semibold">No scans yet</p>
        <p className="text-text-dim text-sm mt-1">
          Run your first scan from the{" "}
          <Link href="/" className="text-accent hover:underline">
            Scanner
          </Link>{" "}
          page.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface overflow-hidden">
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs text-text-dim font-semibold uppercase tracking-widest">
                Domain
              </th>
              <th className="text-center px-4 py-3 text-xs text-text-dim font-semibold uppercase tracking-widest">
                Score
              </th>
              <th className="text-center px-4 py-3 text-xs text-text-dim font-semibold uppercase tracking-widest">
                Grade
              </th>
              <th className="text-left px-4 py-3 text-xs text-text-dim font-semibold uppercase tracking-widest">
                Scanned
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {scans.map((scan, i) => (
              <tr
                key={scan._id}
                className="border-b border-border/50 hover:bg-panel transition-colors last:border-0"
              >
                <td className="px-5 py-4">
                  <span className="font-mono text-sm text-text">{scan.maskedDomain}</span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="font-mono text-sm font-bold text-text">
                    {scan.score}
                    <span className="text-text-dim font-normal">/100</span>
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-block font-mono text-sm font-bold px-2 py-0.5 rounded border ${gradeStyle(scan.grade)}`}
                  >
                    {scan.grade}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className="flex items-center gap-1.5 text-text-dim text-xs">
                    <MdAccessTime />
                    {formatDate(scan.createdAt)}
                  </span>
                </td>
               
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden divide-y divide-border/50">
        {scans.map((scan) => (
          <Link
            key={scan._id}
            href={`/scan/${scan._id}`}
            className="flex items-center justify-between p-4 hover:bg-panel transition-colors"
          >
            <div className="space-y-1">
              <p className="font-mono text-sm text-text">{scan.maskedDomain}</p>
              <p className="text-xs text-text-dim flex items-center gap-1">
                <MdAccessTime className="text-xs" />
                {formatDate(scan.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${gradeStyle(scan.grade)}`}
              >
                {scan.grade}
              </span>
              <MdArrowForward className="text-text-dim" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
