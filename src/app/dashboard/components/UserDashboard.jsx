"use client";

import Link from "next/link";
import {
  Shield,
  History,
  Search,
  BarChart3,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";

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
  const gradeDistribution = stats?.gradeDistribution || {};
  const globalGradeDistribution = stats?.global?.gradeDistribution || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-wide text-text">
              User Console
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-success/30 bg-success/5 text-success font-medium">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-text-dim mt-1">
            {user?.email}
          </p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium hover:border-accent hover:text-accent transition-colors self-start sm:self-center"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Total Scans
          </p>
          <p className="text-2xl font-bold text-accent mt-1">{totalScans}</p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Avg Score
          </p>
          <p className="text-2xl font-bold text-success mt-1">
            {stats?.averageScore || 0}
            <span className="text-xs text-text-dim font-normal">/100</span>
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Scanned Hosts
          </p>
          <p className="text-2xl font-bold text-warning mt-1">
            {stats?.uniqueDomains || 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Coverage
          </p>
          <p className="text-2xl font-bold text-accent mt-1">OWASP</p>
        </div>
      </div>

      {/* Main Content - Fixed height scrollable */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scan History */}
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Audit Logs
                </h2>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-dim" />
                <input
                  type="text"
                  value={searchDomain}
                  onChange={(e) => {
                    setSearchDomain(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter by host..."
                  className="w-full pl-8 pr-3 py-1.5 bg-bg border border-border rounded-lg text-xs focus:outline-none focus:border-accent transition-colors"
                />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden mt-3 -mx-1 px-1">
              {scans.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-dim text-sm">
                  No audit logs found.
                </div>
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-surface z-10">
                        <tr className="border-b border-border text-text-dim text-[10px] font-medium uppercase tracking-wider">
                          <th className="py-2 text-left">Host</th>
                          <th className="py-2 text-center">Score</th>
                          <th className="py-2 text-center">Grade</th>
                          <th className="py-2 text-left">Date</th>
                          <th className="py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {scans.map((scan) => (
                          <tr key={scan._id} className="hover:bg-bg/50 transition-colors">
                            <td className="py-3 font-medium text-text truncate max-w-[120px]">
                              {scan.domain || scan.maskedDomain}
                            </td>
                            <td className="py-3 text-center text-text">
                              {scan.score}/100
                            </td>
                            <td className="py-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${gradeStyle(scan.grade)}`}>
                                {scan.grade}
                              </span>
                            </td>
                            <td className="py-3 text-text-dim text-xs">
                              {formatDate(scan.createdAt)}
                            </td>
                            <td className="py-3 text-right">
                              <Link
                                href={`/scan/${scan._id}`}
                                className="inline-block px-2.5 py-1 bg-accent/5 border border-accent/30 text-accent rounded text-[10px] font-medium hover:bg-accent/10 transition-colors"
                              >
                                View
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
                      <div key={scan._id} className="bg-bg/30 border border-border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-text text-sm">
                              {scan.domain || scan.maskedDomain}
                            </p>
                            <p className="text-xs text-text-dim mt-0.5">
                              {formatDate(scan.createdAt)}
                            </p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${gradeStyle(scan.grade)}`}>
                            {scan.grade}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                          <span className="text-sm font-medium text-text">
                            {scan.score}/100
                          </span>
                          <Link
                            href={`/scan/${scan._id}`}
                            className="px-2.5 py-1 bg-accent/5 border border-accent/30 text-accent rounded text-[10px] font-medium hover:bg-accent/10 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Pagination - Fixed at bottom */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border flex-shrink-0">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1 border border-border rounded-lg text-xs font-medium disabled:opacity-40 hover:border-accent transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs text-text-dim">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1 border border-border rounded-lg text-xs font-medium disabled:opacity-40 hover:border-accent transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Right - Fixed height scrollable */}
        <div className="space-y-6">
          {/* My Grade Distribution */}
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col h-[240px]">
            <div className="flex items-center gap-2 pb-3 border-b border-border flex-shrink-0">
              <BarChart3 className="text-accent h-4 w-4" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                My Grades
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden mt-3 -mx-1 px-1">
              <div className="space-y-3">
                {["A+", "A", "B", "C", "D", "F"].map((grade) => {
                  const count = gradeDistribution[grade] || 0;
                  const pct = totalScans > 0 ? (count / totalScans) * 100 : 0;
                  return (
                    <div key={grade} className="text-xs">
                      <div className="flex justify-between font-medium">
                        <span className="text-text-dim">{grade}</span>
                        <span className="text-text">
                          {count} ({Math.round(pct)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden mt-1">
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
          </div>

          {/* Global Metrics */}
          {stats?.global && (
            <div className="bg-surface border border-border rounded-xl p-5 flex flex-col h-[240px]">
              <div className="flex items-center gap-2 pb-3 border-b border-border flex-shrink-0">
                <Shield className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Global Metrics
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden mt-3 -mx-1 px-1">
                <div className="space-y-3">
                  {["A+", "A", "B", "C", "D", "F"].map((grade) => {
                    const count = globalGradeDistribution[grade] || 0;
                    const totalGlobal = stats?.global?.totalScans || 1;
                    const pct = (count / totalGlobal) * 100;
                    return (
                      <div key={grade} className="text-xs">
                        <div className="flex justify-between font-medium">
                          <span className="text-text-dim">{grade}</span>
                          <span className="text-text">
                            {count} ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden mt-1">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}