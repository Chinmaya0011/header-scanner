"use client";

import Link from "next/link";
import {
  Shield,
  History,
  Users,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
              Admin Control Console
            </h1>
            <Badge variant="accent">
              {user?.role}
            </Badge>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Logged in as <span className="font-mono text-[11px] text-accent font-semibold">{user?.email}</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleClearAllHistory}
            variant="danger"
            size="sm"
            icon={Trash2}
          >
            Clear History
          </Button>
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            icon={RefreshCw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Global Scans
          </p>
          <p className="text-2xl font-bold font-mono text-accent mt-1">
            {stats?.global?.totalScans || 0}
          </p>
        </Card>

        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Avg Global Score
          </p>
          <p className="text-2xl font-bold font-mono text-success mt-1">
            {stats?.global?.averageScore || 0}
            <span className="text-xs text-text-dim font-normal font-sans">/100</span>
          </p>
        </Card>

        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Unique Hosts
          </p>
          <p className="text-2xl font-bold font-mono text-warning mt-1">
            {stats?.global?.uniqueDomainsScanned || 0}
          </p>
        </Card>

        <Card className="border border-border">
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">
            Registered Users
          </p>
          <p className="text-2xl font-bold font-mono text-accent mt-1">
            {usersList.length}
          </p>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Scans List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="flex flex-col h-[520px] p-5 border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <History className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Global Audit Logs
                </h2>
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
                  placeholder="Filter host endpoints..."
                  className="w-full pl-9 pr-3 py-1.5 bg-bg border border-border focus:border-accent rounded-lg text-xs font-mono text-text transition-all scan-input"
                />
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              {scans.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-dim text-xs font-semibold">
                  No audits found in the database.
                </div>
              ) : (
                <>
                  {/* Desktop view */}
                  <div className="hidden md:block">
                    <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-surface z-10">
                        <tr className="border-b border-border/80 text-text-muted text-[10px] font-bold uppercase tracking-wider">
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
                            <td className="py-3 font-mono font-semibold text-text truncate max-w-[150px]" title={scan.domain}>
                              {scan.domain}
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
                            <td className="py-3 text-right space-x-1.5">
                              <Link href={`/scan/${scan._id}`} passHref>
                                <Button variant="secondary" size="sm" icon={Eye}>
                                  View
                                </Button>
                              </Link>
                              <Button
                                onClick={() => handleDeleteScan(scan._id)}
                                variant="danger"
                                size="sm"
                                icon={Trash2}
                                title="Delete audit record"
                              >
                                Delete
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile view */}
                  <div className="md:hidden space-y-3">
                    {scans.map((scan) => (
                      <div key={scan._id} className="bg-bg/30 border border-border/70 rounded-xl p-4.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono font-semibold text-text text-xs truncate max-w-[180px]" title={scan.domain}>
                              {scan.domain}
                            </p>
                            <p className="text-[10px] text-text-dim mt-1 font-mono">
                              {formatDate(scan.createdAt)}
                            </p>
                          </div>
                          <Badge variant={getBadgeVariant(scan.grade)}>
                            {scan.grade}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40">
                          <span className="text-xs font-mono font-bold text-text">
                            {scan.score}/100
                          </span>
                          <div className="flex gap-1.5">
                            <Link href={`/scan/${scan._id}`} passHref>
                              <Button variant="secondary" size="sm" icon={Eye}>
                                View
                              </Button>
                            </Link>
                            <Button
                              onClick={() => handleDeleteScan(scan._id)}
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                            >
                              Delete
                            </Button>
                          </div>
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

        {/* Sidebar - User lists */}
        <div className="space-y-6">
          <Card className="flex flex-col h-[520px] p-5 border border-border">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Console Users ({usersList.length})
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
                  className="flex items-center gap-1.5 px-2 py-1 bg-danger/5 border border-danger/20 rounded text-[10px] font-bold text-danger hover:bg-danger/10 transition-colors flex-shrink-0"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Delete All</span>
                </button>
              )}
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              <div className="space-y-2.5">
                {usersList.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-3 bg-bg/30 border border-border rounded-xl hover:border-border-hover transition-all"
                  >
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="text-xs font-bold text-text truncate font-mono">
                        {u.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-text-dim font-semibold font-sans">
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                        <Badge variant={u.role === "admin" ? "accent" : "success"} className="text-[8px] py-0 px-1.5">
                          {u.role}
                        </Badge>
                      </div>
                    </div>
                    {u.email !== user?.email && (
                      <Button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user "${u.email}" and all their scans?`)) {
                            handleDeleteUser(u._id, u.email);
                          }
                        }}
                        disabled={deletingUser === u._id}
                        variant="danger"
                        size="sm"
                        icon={Trash2}
                        className="py-1 px-2 border-0 bg-danger/10"
                        title="Delete User Account"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}