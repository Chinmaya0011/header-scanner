"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Shield,
  History,
  Users,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Eye,
  Settings,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Key,
  Database,
  UserX,
  Globe,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Info
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/common/Toast";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard({
  user,
  scans,
  totalScans,
  stats: parentStats,
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
  fetchData: parentFetchData,
  formatDate,
  gradeStyle,
  verifications = [],
}) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Verification states
  const [verifyingDomainId, setVerifyingDomainId] = useState(null);
  const [failedVerifications, setFailedVerifications] = useState({});
  const [expandedDomainId, setExpandedDomainId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Local modifications state
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingLimits, setEditingLimits] = useState({}); // user._id -> limit
  const [deletingUser, setDeletingUser] = useState(null);

  // Scan owner-type filter (client-side)
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("all"); // "all" | "public" | "own" | "users"

  const handleConfirmVerification = async (verifyId, domainName) => {
    setVerifyingDomainId(verifyId);
    setFailedVerifications(prev => {
      const updated = { ...prev };
      delete updated[verifyId];
      return updated;
    });
    
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", domain: domainName })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Domain ${domainName} successfully verified!`);
        await parentFetchData();
      } else {
        setFailedVerifications(prev => ({ ...prev, [verifyId]: data.error || "Verification failed." }));
        toast.error(data.error || `Verification failed for ${domainName}.`);
      }
    } catch {
      toast.error("Connection error during verification.");
    } finally {
      setVerifyingDomainId(null);
    }
  };

  const handleDeleteVerification = async (verifyId, domainName) => {
    if (!confirm(`Are you sure you want to delete verification setup for ${domainName}?`)) return;
    try {
      const res = await fetch(`/api/verify?id=${verifyId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Verification record removed for ${domainName}.`);
        await parentFetchData();
      } else {
        toast.error(data.error || "Failed to delete verification.");
      }
    } catch {
      toast.error("Network error deleting verification.");
    }
  };

  const handleCopyToken = (verifyId, token) => {
    navigator.clipboard.writeText(token);
    setCopiedId(verifyId);
    toast.success("Token copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    setMounted(true);
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setAdminStats(data.stats);
      } else {
        toast.error("Failed to load admin stats: " + data.error);
      }
    } catch (err) {
      console.error("Error loading admin stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([parentFetchData(), fetchAdminStats()]);
    toast.success("Console dashboard statistics refreshed.");
  };

  // Toggle API access status or update dailyLimit
  const handleUpdateUserConfig = async (userId, apiAccessEnabled, dailyLimit, revokeKeyId = null) => {
    setUpdatingUserId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiAccessEnabled,
          dailyLimit: dailyLimit !== undefined ? Number(dailyLimit) : undefined,
          revokeKeyId
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User access parameters updated.");
        await handleRefresh();
      } else {
        toast.error("Update failed: " + data.error);
      }
    } catch (err) {
      toast.error("Failed to update user access parameters.");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getBadgeVariant = (grade) => {
    if (grade?.startsWith("A")) return "success";
    if (grade?.startsWith("B")) return "accent";
    if (grade?.startsWith("C")) return "warning";
    return "danger";
  };

  return (
    <div className="space-y-6 font-sans text-text">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-wide text-text uppercase">
              Administrative Control Hub
            </h1>
            <Badge variant="accent">
              CONSOLE ADMIN
            </Badge>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Operating as <span className="font-mono text-[11px] text-accent font-bold">{user?.email}</span>. Configure limits, scan history, and user rights.
          </p>
        </div>
        <div className="flex gap-2.5 flex-wrap">
          <Button
            onClick={handleClearAllHistory}
            variant="danger"
            size="sm"
            icon={Trash2}
          >
            Purge History
          </Button>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            icon={RefreshCw}
          >
            Sync Console
          </Button>
        </div>
      </div>

      {/* Admin stats loading */}
      {statsLoading ? (
        <Card className="text-center py-10 text-xs text-text-dim italic">
          Fetching system aggregations...
        </Card>
      ) : adminStats ? (
        <>
          {/* Aggregated Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* ── Existing cards ── */}
            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Registered Users</p>
              <p className="text-2xl font-bold font-mono text-accent mt-1.5">{adminStats.totalUsers}</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Profiles in system</p>
            </Card>

            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Today's API Scans</p>
              <p className="text-2xl font-bold font-mono text-warning mt-1.5">{adminStats.dailyApiRequests}</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Scans since 00:00 UTC</p>
            </Card>

            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Global API Volume</p>
              <p className="text-2xl font-bold font-mono text-text mt-1.5">{adminStats.totalApiRequests}</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Cumulative API scans</p>
            </Card>

            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">API Success Rate</p>
              <p className="text-2xl font-bold font-mono text-success mt-1.5">
                {adminStats.totalApiRequests > 0
                  ? `${Math.round((adminStats.successfulApiCalls / adminStats.totalApiRequests) * 100)}%`
                  : "100%"
                }
              </p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">{adminStats.failedApiCalls} failures logged</p>
            </Card>

            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Active credentials</p>
              <p className="text-2xl font-bold font-mono text-text mt-1.5">{adminStats.activeKeys}</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">{adminStats.blockedUsers} Users Blocked</p>
            </Card>

            {/* ── New cards ── */}
            <Card>
              <div className="flex items-center gap-1.5 mb-1">
                <Globe className="w-3 h-3 text-accent opacity-70" />
                <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Page Visits</p>
              </div>
              <p className="text-2xl font-bold font-mono text-accent mt-1">
                {(adminStats.totalVisits ?? 0).toLocaleString()}
              </p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Total site page views</p>
            </Card>

            <Card>
              <div className="flex items-center gap-1.5 mb-1">
                <Database className="w-3 h-3 text-success opacity-70" />
                <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">All Scans</p>
              </div>
              <p className="text-2xl font-bold font-mono text-success mt-1">
                {(adminStats.totalAllScans ?? 0).toLocaleString()}
              </p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Web + API combined</p>
            </Card>

            <Card>
              <div className="flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3 h-3 text-warning opacity-70" />
                <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Public Scans</p>
              </div>
              <p className="text-2xl font-bold font-mono text-warning mt-1">
                {(adminStats.totalPublicScans ?? 0).toLocaleString()}
              </p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Guest / no-auth scans</p>
            </Card>
          </div>

          {/* Near Limit Quota Warnings */}
          {adminStats.usersNearLimit && adminStats.usersNearLimit.length > 0 && (
            <div className="bg-warning/[0.03] border border-warning/25 rounded-xl p-4.5 space-y-3">
              <div className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                  Attention: Users Near Daily Request Limits (Over 85%)
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {adminStats.usersNearLimit.map(u => (
                  <div key={u.id} className="bg-surface border border-white/[0.04] p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                    <div className="min-w-0 mr-2">
                      <p className="font-bold text-text truncate">{u.email}</p>
                      <p className="text-[10px] text-text-dim mt-0.5">Usage: {u.dailyUsage} / {u.dailyLimit}</p>
                    </div>
                    <Badge variant="warning">
                      {Math.round((u.dailyUsage / u.dailyLimit) * 100)}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Chart Area */}
          {mounted && adminStats.chartData && (
            <Card className="p-5">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.05]">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                    System API Scan Volumes
                  </h3>
                  <p className="text-[9px] text-text-dim uppercase mt-0.5">
                    Successful vs failed request audit parameters (Last 7 Days)
                  </p>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={adminStats.chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorSuccessAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorFailedAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="rgba(255,255,255,0.4)" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.4)" 
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#16161a", 
                        borderColor: "rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontFamily: "monospace"
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="success" 
                      stroke="#10b981" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorSuccessAdmin)" 
                      name="Success Scans"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="failed" 
                      stroke="#ef4444" 
                      strokeWidth={1.5}
                      fillOpacity={1} 
                      fill="url(#colorFailedAdmin)" 
                      name="Failed Scans"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      ) : null}

      {/* Main Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Global Audit Logs (Left Columns) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="flex flex-col h-[560px] p-5 border border-white/[0.05]">
            <div className="flex flex-col gap-2 pb-3 border-b border-white/[0.05] flex-shrink-0">
              {/* Row 1: Title + Domain Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <History className="text-accent h-4 w-4" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                    Global Audit Scan Logs
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
                    className="w-full pl-9 pr-3 py-1.5 bg-bg border border-white/[0.05] focus:border-accent rounded-lg text-xs font-mono text-text outline-none transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Owner-type filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] text-text-muted uppercase font-bold mr-1">Owner:</span>
                {[
                  { key: "all",    label: "All" },
                  { key: "public", label: "🌐 Public" },
                  { key: "own",    label: "⭐ Mine" },
                  { key: "users",  label: "👤 Users" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setOwnerTypeFilter(key)}
                    className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase transition-all border ${
                      ownerTypeFilter === key
                        ? "bg-accent/20 border-accent/40 text-accent"
                        : "bg-white/[0.03] border-white/[0.06] text-text-muted hover:text-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              {(() => {
                const filteredScans = scans.filter((scan) => {
                  if (ownerTypeFilter === "all") return true;
                  if (ownerTypeFilter === "public") return !scan.owner;
                  if (ownerTypeFilter === "own") return scan.owner?.email === user?.email;
                  if (ownerTypeFilter === "users") return scan.owner && scan.owner.email !== user?.email;
                  return true;
                });

                if (scans.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full text-text-dim text-xs font-semibold">
                      No audits found in the database.
                    </div>
                  );
                }

                if (filteredScans.length === 0) {
                  return (
                    <div className="flex items-center justify-center h-full text-text-dim text-xs font-semibold">
                      No scans match this filter.
                    </div>
                  );
                }

                return (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr className="border-b border-white/[0.05] text-text-muted text-[9px] font-bold uppercase tracking-wider">
                      <th className="py-2.5">Target Host</th>
                      <th className="py-2.5">Owner</th>
                      <th className="py-2.5 text-center">Score</th>
                      <th className="py-2.5 text-center">Grade</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-xs">
                    {filteredScans.map((scan) => {
                      const ownerEmail = scan.owner?.email;
                      const isSelf = ownerEmail === user?.email;
                      const isPublic = !scan.owner;

                      return (
                        <tr key={scan._id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3 font-mono font-semibold text-text truncate max-w-[110px]" title={scan.domain}>
                            {scan.domain}
                          </td>

                          {/* Owner cell */}
                          <td className="py-3 max-w-[130px]">
                            {isPublic ? (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <Globe className="w-2.5 h-2.5" />
                                Public
                              </span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-[10px] text-text truncate block" title={ownerEmail}>
                                  {ownerEmail}
                                </span>
                                {isSelf ? (
                                  <span className="text-[8px] font-bold text-accent uppercase">You</span>
                                ) : (
                                  <span className="text-[8px] text-text-muted uppercase">{scan.owner?.role || "user"}</span>
                                )}
                              </div>
                            )}
                          </td>

                          <td className="py-3 text-center font-mono font-bold text-text">
                            {scan.score}/100
                          </td>
                          <td className="py-3 text-center">
                            <Badge variant={getBadgeVariant(scan.grade)}>
                              {scan.grade}
                            </Badge>
                          </td>
                          <td className="py-3 text-text-dim font-mono text-[10px]">
                            {formatDate(scan.createdAt)}
                          </td>
                          <td className="py-3 text-right space-x-1.5">
                            <Link href={`/scan/${scan._id}`} passHref target="_blank">
                              <Button variant="secondary" size="sm" icon={Eye}>
                                View
                              </Button>
                            </Link>
                            <Button
                              onClick={() => handleDeleteScan(scan._id)}
                              variant="danger"
                              size="sm"
                              icon={Trash2}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                );
              })()}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05] flex-shrink-0 font-sans">
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

        {/* User limits and permissions manager (Right Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="flex flex-col h-[560px] p-5 border border-white/[0.05]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05] flex-shrink-0">
              <div className="flex items-center gap-2">
                <Users className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                  Console Users ({usersList.length})
                </h2>
              </div>
              {usersList.length > 1 && (
                <button
                  onClick={() => {
                    handleDeleteAllUsers();
                  }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-danger/5 border border-danger/20 rounded text-[9px] font-bold text-danger hover:bg-danger/10 transition-colors flex-shrink-0 uppercase"
                >
                  <UserX className="h-3.5 w-3.5" />
                  <span>Delete All</span>
                </button>
              )}
            </div>

            {/* User Configurations Table */}
            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              <div className="space-y-3.5">
                {usersList.map((u) => {
                  const currentLimit = editingLimits[u._id] !== undefined ? editingLimits[u._id] : (u.dailyLimit !== undefined ? u.dailyLimit : (u.role === "admin" ? 27 : 20));
                  const isUserUpdating = updatingUserId === u._id;
                  
                  return (
                    <div
                      key={u._id}
                      className="p-4 bg-white/[0.01] border border-white/[0.04] rounded-xl space-y-3.5"
                    >
                      {/* Top Header: Email & Access Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text truncate font-mono">
                            {u.email}
                          </p>
                          <p className="text-[9px] text-text-dim font-semibold mt-0.5 uppercase tracking-wide">
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant={u.role === "admin" ? "accent" : "success"} className="text-[8px] py-0.5 px-1.5 uppercase">
                            {u.role}
                          </Badge>
                          {u.email !== user?.email && (
                            <button
                              onClick={() => {
                                handleDeleteUser(u._id, u.email);
                              }}
                              disabled={deletingUser === u._id}
                              className="text-danger hover:bg-danger/10 p-1.5 rounded transition-all"
                              title="Delete user profile and history"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Controls: Quota & Key revokes */}
                      {u.role !== "admin" && (
                        <div className="space-y-2.5 pt-2.5 border-t border-white/[0.04] text-[10px]">
                          {/* Limit configuration and Enable toggle */}
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <span className="text-text-dim font-semibold uppercase">Daily Quota:</span>
                              <input
                                type="number"
                                value={currentLimit}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setEditingLimits(prev => ({ ...prev, [u._id]: val }));
                                }}
                                onBlur={() => {
                                  handleUpdateUserConfig(u._id, u.apiAccessEnabled, currentLimit);
                                }}
                                className="w-14 px-2 py-0.5 bg-bg border border-white/[0.05] focus:border-accent rounded text-xs font-mono text-center text-text"
                                min="0"
                                disabled={isUserUpdating}
                              />
                            </div>

                            <button
                              onClick={() => {
                                handleUpdateUserConfig(u._id, !u.apiAccessEnabled, u.dailyLimit);
                              }}
                              disabled={isUserUpdating}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase border transition-all ${
                                u.apiAccessEnabled !== false
                                  ? "bg-success/15 border-success/30 text-success"
                                  : "bg-danger/15 border-danger/30 text-danger"
                              }`}
                            >
                              {u.apiAccessEnabled !== false ? (
                                <>
                                  <Unlock className="h-3 w-3" />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="h-3 w-3" />
                                  <span>Suspended</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Keys credentials lists if user has keys */}
                          {u.apiKeys && u.apiKeys.length > 0 && (
                            <div className="space-y-1.5 pt-1.5 border-t border-white/[0.03]">
                              <p className="text-[8.5px] text-text-muted font-bold uppercase tracking-wider">User API Keys credentials:</p>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {u.apiKeys.map((key) => {
                                  const isKeyActive = key.isActive !== false && key.status === "active";
                                  return (
                                    <div key={key._id} className="flex items-center justify-between p-1.5 bg-bg/50 border border-white/[0.03] rounded-lg">
                                      <span className="font-mono text-[9px] truncate max-w-[120px] text-text-dim" title={key.name}>
                                        🔑 {key.name}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[7px] font-bold uppercase px-1 rounded ${
                                          isKeyActive ? 'bg-success/10 text-success' : 'bg-text-muted/10 text-text-muted'
                                        }`}>
                                          {key.status || (key.isActive !== false ? "active" : "revoked")}
                                        </span>
                                        {isKeyActive && (
                                          <button
                                            onClick={() => {
                                              handleUpdateUserConfig(u._id, u.apiAccessEnabled, u.dailyLimit, key._id);
                                            }}
                                            disabled={isUserUpdating}
                                            className="text-danger hover:underline text-[8px] font-bold uppercase"
                                          >
                                            Revoke
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
        
      </div>

      {/* Global Domain Verification Control (Admin View) */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card className="p-5 border border-white/[0.05]">
          <div className="flex items-center gap-2 pb-3 border-b border-white/[0.05] mb-4">
            <ShieldAlert className="text-warning h-4 w-4" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-text">
              Global Domain Verification Registry
            </h2>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
            {verifications.length === 0 ? (
              <div className="text-text-dim text-xs font-semibold py-8 text-center">
                No domain verifications registered in the system database.
              </div>
            ) : (
              verifications.map((verify) => {
                const isPending = !verify.verified;
                const isFailed = failedVerifications[verify._id];
                const isExpanded = expandedDomainId === verify._id;
                const ownerEmail = verify.owner?.email || "Unknown User";
                
                return (
                  <div key={verify._id} className="border border-white/[0.04] bg-bg/25 rounded-xl p-4 space-y-3 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Globe className="text-text-dim h-4 w-4 shrink-0" />
                          <span className="font-mono text-xs font-bold text-text truncate">{verify.domain}</span>
                        </div>
                        <p className="text-[10px] text-text-dim mt-0.5 font-mono">
                          Owner: <span className="text-accent font-semibold">{ownerEmail}</span>
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {isPending ? (
                          isFailed ? (
                            <Badge variant="danger">🔴 Verification Failed</Badge>
                          ) : (
                            <Badge variant="warning">🟡 Pending Verification</Badge>
                          )
                        ) : (
                          <Badge variant="success">🟢 Verified</Badge>
                        )}
                        
                        <div className="flex gap-1.5 ml-2">
                          {isPending && (
                            <>
                              <Button
                                onClick={() => setExpandedDomainId(isExpanded ? null : verify._id)}
                                variant="outline"
                                size="sm"
                                className="text-[9px] py-1 px-2.5"
                              >
                                {isExpanded ? "Hide Instructions" : "Show Instructions"}
                              </Button>
                              <Button
                                onClick={() => handleConfirmVerification(verify._id, verify.domain)}
                                variant="primary"
                                size="sm"
                                loading={verifyingDomainId === verify._id}
                                icon={RefreshCw}
                                className="text-[9px] py-1 px-2.5 bg-accent text-bg"
                              >
                                Verify Domain
                              </Button>
                            </>
                          )}
                          {!isPending && (
                            <Button
                              onClick={() => parentFetchData()}
                              variant="outline"
                              size="sm"
                              icon={RefreshCw}
                              className="text-[9px] py-1 px-2.5"
                            >
                              Refresh Status
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDeleteVerification(verify._id, verify.domain)}
                            variant="danger"
                            size="sm"
                            icon={Trash2}
                            className="text-[9px] py-1 px-2.5"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Expandable details and token info */}
                    {isPending && isExpanded && (
                      <div className="bg-surface/50 border border-white/[0.03] rounded-lg p-3.5 space-y-3 font-sans text-xs animate-fadeIn">
                        <p className="text-text-dim leading-relaxed">
                          This token has been generated by the user, but the file <code className="text-accent font-mono">headerguard-verification.txt</code> has not been detected at <code className="text-accent font-mono">http://{verify.domain}/headerguard-verification.txt</code>.
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-accent font-mono block">Required File Location</span>
                            <a 
                              href={`http://${verify.domain}/headerguard-verification.txt`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="font-mono text-[10px] text-text hover:underline break-all flex items-center gap-1.5"
                            >
                              http://{verify.domain}/headerguard-verification.txt
                              <ExternalLink className="h-3 w-3 inline" />
                            </a>
                          </div>
                          
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-accent font-mono block">Verification Token</span>
                            <div className="flex items-center gap-2 bg-black/40 px-2 py-1 rounded border border-white/[0.04]">
                              <code className="text-[9.5px] select-all font-mono text-accent-light break-all flex-1">
                                {verify.verificationToken}
                              </code>
                              <button
                                onClick={() => handleCopyToken(verify._id, verify.verificationToken)}
                                className="text-[9px] text-accent hover:text-accent-light shrink-0"
                              >
                                {copiedId === verify._id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}