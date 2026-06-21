"use client";

import Link from "next/link";
import {
  Shield,
  History,
  Users,
  Trash2,
  Search,
  BarChart3,
  Clock,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";

export default function AdminDashboard({
  user,
  scans,
  totalScans,
  stats,
  usersList,
  searchDomain,
  setSearchDomain,
  currentPage,
  setCurrentPage,
  totalPages,
  handleDeleteScan,
  handleClearAllHistory,
  handleDeleteUser,
  handleDeleteAllUsers,
  fetchData,
  formatDate,
  gradeStyle,
}) {
  const [deletingUser, setDeletingUser] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  const gradeDistribution = stats?.gradeDistribution || {};
  const globalGradeDistribution = stats?.global?.gradeDistribution || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-wide text-text">
              Admin Console
            </h1>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full border border-accent/30 bg-accent/5 text-accent font-medium">
              {user?.role}
            </span>
          </div>
          <p className="text-xs text-text-dim mt-1">
            {user?.email}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleClearAllHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-danger/5 border border-danger/30 rounded-lg text-xs font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear History
          </button>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-medium hover:border-accent hover:text-accent transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Total Scans
          </p>
          <p className="text-2xl font-bold text-accent mt-1">
            {stats?.global?.totalScans || 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Avg Score
          </p>
          <p className="text-2xl font-bold text-success mt-1">
            {stats?.global?.averageScore || 0}
            <span className="text-xs text-text-dim font-normal">/100</span>
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Unique Hosts
          </p>
          <p className="text-2xl font-bold text-warning mt-1">
            {stats?.global?.uniqueDomainsScanned || 0}
          </p>
        </div>

        <div className="bg-surface border border-border rounded-xl p-4">
          <p className="text-[10px] text-text-dim font-medium uppercase tracking-wider">
            Users
          </p>
          <p className="text-2xl font-bold text-accent mt-1">
            {usersList.length}
          </p>
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
                              {scan.domain}
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
                            <td className="py-3 text-right space-x-1.5">
                              <Link
                                href={`/scan/${scan._id}`}
                                className="inline-block px-2.5 py-1 bg-accent/5 border border-accent/30 text-accent rounded text-[10px] font-medium hover:bg-accent/10 transition-colors"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => handleDeleteScan(scan._id)}
                                className="p-1 bg-danger/5 border border-danger/30 text-danger rounded hover:bg-danger/10 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
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
                            <p className="font-medium text-text text-sm">{scan.domain}</p>
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
                          <div className="flex gap-1.5">
                            <Link
                              href={`/scan/${scan._id}`}
                              className="px-2.5 py-1 bg-accent/5 border border-accent/30 text-accent rounded text-[10px] font-medium hover:bg-accent/10 transition-colors"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => handleDeleteScan(scan._id)}
                              className="p-1.5 bg-danger/5 border border-danger/30 text-danger rounded hover:bg-danger/10 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
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
          <div className="bg-surface border border-border rounded-xl p-5 flex flex-col h-[500px]">
            <div className="flex items-center justify-between pb-3 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Users ({usersList.length})
                </h2>
              </div>
              {usersList.length > 1 && (
                <button
                  onClick={() => {
                    if (confirm("⚠️ Are you sure you want to delete ALL users except yourself?\n\nThis action is destructive and CANNOT be undone!")) {
                      if (confirm("Final confirmation: Delete ALL user accounts and their associated scans?")) {
                        handleDeleteAllUsers();
                      }
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 bg-danger/5 border border-danger/30 rounded text-[10px] font-medium text-danger hover:bg-danger/10 transition-colors flex-shrink-0"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Delete All
                </button>
              )}
            </div>

            {/* Scrollable User List */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden mt-3 -mx-1 px-1">
              <div className="space-y-2.5">
                {usersList.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-2.5 bg-bg/30 border border-border rounded-lg hover:border-border transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">
                        {u.email}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] text-text-dim">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                          u.role === "admin"
                            ? "border-accent/30 bg-accent/5 text-accent"
                            : "border-success/30 bg-success/5 text-success"
                        }`}>
                          {u.role}
                        </span>
                      </div>
                    </div>
                    {u.email !== user?.email && (
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user "${u.email}" and all their scans?`)) {
                            handleDeleteUser(u._id, u.email);
                          }
                        }}
                        disabled={deletingUser === u._id}
                        className="p-1.5 bg-danger/5 border border-danger/30 rounded text-danger hover:bg-danger/10 transition-colors disabled:opacity-50 flex-shrink-0"
                        title="Delete User"
                      >
                        {deletingUser === u._id ? (
                          <div className="h-3 w-3 border-2 border-danger border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}