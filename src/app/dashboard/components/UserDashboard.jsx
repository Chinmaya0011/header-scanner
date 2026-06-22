"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  History,
  Search,
  BarChart3,
  RefreshCw,
  Eye,
  GitCompare,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function UserDashboard({
  user,
  scans,
  totalScans,
  stats,
  searchDomain,
  setSearchDomain,
  currentPage,
  setCurrentPage,
  totalPages,
  fetchData,
  formatDate,
  gradeStyle,
}) {
  const [selectedScanIds, setSelectedScanIds] = useState([]);
  const gradeDistribution = stats?.gradeDistribution || {};
  const globalGradeDistribution = stats?.global?.gradeDistribution || {};

  const handleSelectScan = (scanId) => {
    setSelectedScanIds((prev) => {
      if (prev.includes(scanId)) {
        return prev.filter((id) => id !== scanId);
      }
      if (prev.length >= 2) {
        return [prev[1], scanId];
      }
      return [...prev, scanId];
    });
  };

  const getBadgeVariant = (grade) => {
    if (grade?.startsWith("A")) return "success";
    if (grade?.startsWith("B")) return "accent";
    if (grade?.startsWith("C")) return "warning";
    return "danger";
  };

  return (
    <div className="space-y-6 font-sans text-text">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-wide text-text">
              Dashboard Console
            </h1>
            <Badge variant="success">
              {user?.role}
            </Badge>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Logged in as <span className="font-mono text-[11px] text-accent font-semibold">{user?.email}</span>
          </p>
        </div>
        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          icon={RefreshCw}
        >
          Refresh Console
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Total Scans
          </p>
          <p className="text-2xl font-bold font-mono text-accent mt-1">{totalScans}</p>
        </Card>

        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Avg Score
          </p>
          <p className="text-2xl font-bold font-mono text-success mt-1">
            {stats?.averageScore || 0}
            <span className="text-xs text-text-dim font-normal font-sans">/100</span>
          </p>
        </Card>

        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Unique Hosts
          </p>
          <p className="text-2xl font-bold font-mono text-warning mt-1">
            {stats?.uniqueDomains || 0}
          </p>
        </Card>

        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Framework Target
          </p>
          <p className="text-2xl font-bold font-mono text-accent mt-1">OWASP</p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trend Chart Card */}
          <Card className="flex flex-col h-[245px] p-5 border border-border">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60 flex-shrink-0">
              <BarChart3 className="text-accent h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                Security Score Progress
              </h2>
            </div>
            <div className="flex-1 mt-3 relative min-h-0">
              <HistoryChart scans={scans} />
            </div>
          </Card>

          {/* Audit Logs Card */}
          <Card className="flex flex-col h-[350px] p-5 border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60 flex-shrink-0">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <History className="text-accent h-4 w-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                    Audit Logs
                  </h2>
                </div>

                {selectedScanIds.length === 2 && (
                  <Link
                    href={`/dashboard/compare?id1=${selectedScanIds[0]}&id2=${selectedScanIds[1]}`}
                    passHref
                  >
                    <Button
                      variant="primary"
                      size="sm"
                      icon={GitCompare}
                      className="text-[9px] py-1 px-3.5 animate-fadeInUp"
                    >
                      Compare Selected
                    </Button>
                  </Link>
                )}
              </div>

              <div className="relative w-full sm:w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  value={searchDomain}
                  onChange={(e) => {
                    setSearchDomain(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search endpoint host..."
                  className="w-full pl-9 pr-3 py-1.5 bg-bg border border-border focus:border-accent rounded-lg text-xs font-mono text-text transition-all scan-input"
                />
              </div>
            </div>

            {/* Table or list container */}
            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              {scans.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-dim text-xs font-semibold">
                  No scan history logs found.
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-surface z-10">
                        <tr className="border-b border-border/80 text-text-muted text-[10px] font-bold uppercase tracking-wider">
                          <th className="py-2.5 w-8"></th>
                          <th className="py-2.5">Target Host</th>
                          <th className="py-2.5 text-center">Score</th>
                          <th className="py-2.5 text-center">Grade</th>
                          <th className="py-2.5">Date</th>
                          <th className="py-2.5 text-right" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-xs">
                        {scans.map((scan) => (
                          <tr key={scan._id} className="hover:bg-panel/20 transition-colors">
                            <td className="py-3">
                              <input
                                type="checkbox"
                                checked={selectedScanIds.includes(scan._id)}
                                onChange={() => handleSelectScan(scan._id)}
                                className="h-3.5 w-3.5 rounded border-border bg-bg text-accent focus:ring-accent focus:ring-offset-bg cursor-pointer transition-all"
                              />
                            </td>
                            <td className="py-3 font-mono font-semibold text-text truncate max-w-[150px]">
                              {scan.domain || scan.maskedDomain}
                            </td>
                            <td className="py-3 text-center font-mono font-bold text-text">
                              {scan.score}/100
                            </td>
                            <td className="py-3 text-center">
                              <Badge variant={getBadgeVariant(scan.grade)}>
                                {scan.grade}
                              </Badge>
                            </td>
                            <td className="py-3 text-text-dim font-mono text-[11px]">
                              {formatDate(scan.createdAt)}
                            </td>
                            <td className="py-3 text-right">
                              <Link href={`/scan/${scan._id}`} passHref>
                                <Button variant="secondary" size="sm" icon={Eye}>
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="md:hidden space-y-3">
                    {scans.map((scan) => (
                      <div key={scan._id} className="bg-bg/30 border border-border/70 rounded-xl p-4.5">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedScanIds.includes(scan._id)}
                              onChange={() => handleSelectScan(scan._id)}
                              className="h-3.5 w-3.5 rounded border-border bg-bg text-accent focus:ring-accent focus:ring-offset-bg cursor-pointer transition-all"
                            />
                            <div>
                              <p className="font-mono font-semibold text-text text-xs truncate max-w-[180px]">
                                {scan.domain || scan.maskedDomain}
                              </p>
                              <p className="text-[10px] text-text-dim mt-0.5 font-mono">
                                {formatDate(scan.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getBadgeVariant(scan.grade)}>
                            {scan.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                          <span className="text-xs font-mono font-bold text-text">
                            {scan.score}/100
                          </span>
                          <Link href={`/scan/${scan._id}`} passHref>
                            <Button variant="secondary" size="sm" icon={Eye}>
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/60 flex-shrink-0 font-sans">
                <Button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  variant="outline"
                  size="sm"
                >
                  Prev
                </Button>
                <span className="text-xs text-text-dim font-semibold">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* User Distribution */}
          <Card className="flex flex-col h-[245px] p-5 border border-border">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60 flex-shrink-0">
              <BarChart3 className="text-accent h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                Grade Metrics
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              <div className="space-y-3 text-xs">
                {["A+", "A", "B", "C", "D", "F"].map((grade) => {
                  const count = gradeDistribution[grade] || 0;
                  const pct = totalScans > 0 ? (count / totalScans) * 100 : 0;
                  return (
                    <div key={grade} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="text-text-dim font-mono">{grade}</span>
                        <span className="text-text">
                          {count} ({Math.round(pct)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${
                            grade.startsWith("A")
                              ? "bg-success"
                              : grade === "B"
                              ? "bg-accent"
                              : grade === "C"
                              ? "bg-warning"
                              : "bg-danger"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* Global metrics */}
          {stats?.global && (
            <Card className="flex flex-col h-[245px] p-5 border border-border">
              <div className="flex items-center gap-2 pb-3 border-b border-border/60 flex-shrink-0">
                <Shield className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Global Metrics
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
                <div className="space-y-3 text-xs">
                  {["A+", "A", "B", "C", "D", "F"].map((grade) => {
                    const count = globalGradeDistribution[grade] || 0;
                    const totalGlobal = stats?.global?.totalScans || 1;
                    const pct = (count / totalGlobal) * 100;
                    return (
                      <div key={grade} className="space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-text-dim font-mono">{grade}</span>
                          <span className="text-text">
                            {count} ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full ${
                              grade.startsWith("A")
                                ? "bg-success"
                                : grade === "B"
                                ? "bg-accent"
                                : grade === "C"
                                ? "bg-warning"
                                : "bg-danger"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function HistoryChart({ scans }) {
  if (!scans || scans.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-text-dim text-xs font-semibold">
        No scan history available for rendering trend chart.
      </div>
    );
  }

  // Take up to 8 of the latest scans, reversed to show chronological order
  const chartData = [...scans].reverse().slice(-8);
  const width = 500;
  const height = 135;
  const paddingX = 40;
  const paddingY = 20;

  const points = chartData.map((scan, i) => {
    const x = paddingX + (i * (width - 2 * paddingX)) / Math.max(1, chartData.length - 1);
    // Score is 0-100, invert y so 100 is top and 0 is bottom
    const y = height - paddingY - (scan.score / 100) * (height - 2 * paddingY);
    return { 
      x, 
      y, 
      score: scan.score, 
      domain: scan.domain || scan.maskedDomain, 
      date: new Date(scan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) 
    };
  });

  // Construct path string
  let pathD = "";
  let areaD = "";
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    points.forEach((p, i) => {
      if (i > 0) {
        pathD += ` L ${p.x} ${p.y}`;
      }
    });
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;
  }

  return (
    <div className="w-full h-full flex flex-col justify-between font-sans">
      <div className="relative flex-1 w-full min-h-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          
          {/* Y Axis Grid Lines */}
          {[0, 50, 100].map((gridVal) => {
            const y = height - paddingY - (gridVal / 100) * (height - 2 * paddingY);
            return (
              <g key={gridVal}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                  opacity="0.4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  fill="var(--text-dim)"
                  className="text-[9px] font-mono font-bold"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Area under line */}
          {points.length > 1 && (
            <path d={areaD} fill="url(#chartGradient)" />
          )}

          {/* Core Line */}
          {points.length > 1 && (
            <path
              d={pathD}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots and Labels */}
          {points.map((p, i) => (
            <g key={i} className="group/dot cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="var(--surface)"
                stroke="var(--accent)"
                strokeWidth="2"
                className="transition-all duration-200 group-hover/dot:r-5 group-hover/dot:fill-accent"
              />
              {/* Tooltip Overlay */}
              <g className="opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200 pointer-events-none">
                <rect
                  x={p.x - 55}
                  y={p.y - 38}
                  width="110"
                  height="28"
                  rx="4"
                  fill="var(--surface)"
                  stroke="var(--border)"
                  strokeWidth="1"
                  className="shadow-xl"
                />
                <text
                  x={p.x}
                  y={p.y - 27}
                  textAnchor="middle"
                  fill="var(--text)"
                  className="text-[8px] font-semibold truncate max-w-[90px]"
                >
                  {p.domain}
                </text>
                <text
                  x={p.x}
                  y={p.y - 17}
                  textAnchor="middle"
                  fill="var(--accent)"
                  className="text-[9px] font-mono font-bold"
                >
                  Score: {p.score}
                </text>
              </g>
              {/* Date Label on X Axis */}
              <text
                x={p.x}
                y={height - 4}
                textAnchor="middle"
                fill="var(--text-dim)"
                className="text-[8px] font-mono"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}