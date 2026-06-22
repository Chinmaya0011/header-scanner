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
}) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [adminStats, setAdminStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Local modifications state
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [editingLimits, setEditingLimits] = useState({}); // user._id -> limit
  const [deletingUser, setDeletingUser] = useState(null);

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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

            <Card className="col-span-2 lg:col-span-1">
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Active credentials</p>
              <p className="text-2xl font-bold font-mono text-text mt-1.5">{adminStats.activeKeys}</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">{adminStats.blockedUsers} Users Blocked</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.05] flex-shrink-0">
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

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto mt-3 -mx-1 px-1">
              {scans.length === 0 ? (
                <div className="flex items-center justify-center h-full text-text-dim text-xs font-semibold">
                  No audits found in the database.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-surface z-10">
                    <tr className="border-b border-white/[0.05] text-text-muted text-[9px] font-bold uppercase tracking-wider">
                      <th className="py-2.5">Target Host</th>
                      <th className="py-2.5 text-center">Score</th>
                      <th className="py-2.5 text-center">Grade</th>
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5 text-right" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-xs">
                    {scans.map((scan) => (
                      <tr key={scan._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 font-mono font-semibold text-text truncate max-w-[130px]" title={scan.domain}>
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
                    ))}
                  </tbody>
                </table>
              )}
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
                    if (confirm("⚠️ Are you sure you want to delete ALL users except yourself?\n\nThis action is destructive and CANNOT be undone!")) {
                      if (confirm("Final confirmation: Delete ALL user accounts and their associated scans?")) {
                        handleDeleteAllUsers();
                      }
                    }
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
                  const currentLimit = editingLimits[u._id] !== undefined ? editingLimits[u._id] : (u.dailyLimit !== undefined ? u.dailyLimit : 20);
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
                                if (confirm(`Are you sure you want to delete user "${u.email}" and all their scans?`)) {
                                  handleDeleteUser(u._id, u.email);
                                }
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
                                              if (confirm(`Revoke key "${key.name}"? This stops the key immediately.`)) {
                                                handleUpdateUserConfig(u._id, u.apiAccessEnabled, u.dailyLimit, key._id);
                                              }
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
    </div>
  );
}