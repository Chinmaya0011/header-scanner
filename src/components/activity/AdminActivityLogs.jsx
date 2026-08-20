"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  ShieldAlert,
  Key,
  Lock,
  LogIn,
  LogOut,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  Clock,
  Layers,
  FileText
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/common/Toast";

export default function AdminActivityLogs({ usersList = [] }) {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalLogs: 0,
    totalPages: 1,
    currentPage: 1,
    pageLimit: 15,
  });

  // Filters State
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedVisibility, setSelectedVisibility] = useState("all");
  const [dateRange, setDateRange] = useState("all"); // "all", "today", "7days", "30days", "custom"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sort, setSort] = useState("newest");

  // Selected detail modal log
  const [detailLog, setDetailLog] = useState(null);

  // Quick stats computed locally or from api
  const [stats, setStats] = useState({
    total: 0,
    successes: 0,
    failures: 0,
    securityEvents: 0,
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let startStr = startDate;
      let endStr = endDate;

      if (dateRange === "today") {
        const today = new Date();
        startStr = today.toISOString().split("T")[0];
        endStr = startStr;
      } else if (dateRange === "7days") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        startStr = d.toISOString().split("T")[0];
        endStr = new Date().toISOString().split("T")[0];
      } else if (dateRange === "30days") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        startStr = d.toISOString().split("T")[0];
        endStr = new Date().toISOString().split("T")[0];
      }

      const params = new URLSearchParams();
      params.set("page", pagination.currentPage);
      params.set("limit", pagination.pageLimit);
      params.set("sort", sort);
      if (search.trim()) params.set("search", search.trim());
      if (selectedUser !== "all") params.set("user", selectedUser);
      if (selectedEventType !== "all") params.set("eventType", selectedEventType);
      if (selectedStatus !== "all") params.set("status", selectedStatus);
      if (selectedVisibility !== "all") params.set("isPublic", selectedVisibility);
      if (startStr) params.set("startDate", startStr);
      if (endStr) params.set("endDate", endStr);

      const res = await fetch(`/api/activity-logs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        setPagination(prev => ({
          ...prev,
          totalLogs: data.pagination.totalLogs,
          totalPages: data.pagination.totalPages,
        }));

        // Compute local stats from fetched array or response
        const total = data.pagination.totalLogs;
        const successes = data.logs.filter(l => l.status === "success").length;
        const failures = data.logs.filter(l => l.status === "failed").length;
        const securityEvents = data.logs.filter(l =>
          l.eventType.includes("LOGIN_FAILED") ||
          l.eventType.includes("DELETED") ||
          l.status === "warning" ||
          l.status === "failed"
        ).length;

        setStats({ total, successes, failures, securityEvents });
      } else {
        toast.error(data.error || "Failed to load activity logs.");
      }
    } catch (err) {
      toast.error("Error connecting to activity logs API.");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.currentPage,
    pagination.pageLimit,
    sort,
    search,
    selectedUser,
    selectedEventType,
    selectedStatus,
    selectedVisibility,
    dateRange,
    startDate,
    endDate,
    toast,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset pagination when filter changes
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Helper for Event Icon & Color
  const getEventBadgeProps = (eventType, status) => {
    if (eventType.includes("LOGIN_SUCCESS")) {
      return { icon: LogIn, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", label: "Login Success" };
    }
    if (eventType.includes("LOGIN_FAILED")) {
      return { icon: ShieldAlert, color: "text-rose-400 border-rose-500/30 bg-rose-500/10", label: "Login Failed" };
    }
    if (eventType.includes("LOGOUT")) {
      return { icon: LogOut, color: "text-slate-400 border-slate-500/30 bg-slate-500/10", label: "Logout" };
    }
    if (eventType.includes("REGISTER")) {
      return { icon: User, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", label: "User Register" };
    }
    if (eventType.includes("PASSWORD")) {
      return { icon: Lock, color: "text-amber-400 border-amber-500/30 bg-amber-500/10", label: "Password Change" };
    }
    if (eventType.includes("API_KEY")) {
      return { icon: Key, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10", label: "API Key Action" };
    }
    if (eventType.includes("PUBLIC_SCAN")) {
      return { icon: Globe, color: "text-sky-400 border-sky-500/30 bg-sky-500/10", label: "Public Scan" };
    }
    if (eventType.includes("SCAN")) {
      return { icon: Activity, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", label: "Private Scan" };
    }
    if (eventType.includes("DELETED") || eventType.includes("CLEARED")) {
      return { icon: ShieldAlert, color: "text-rose-400 border-rose-500/30 bg-rose-500/10", label: "Deletion Event" };
    }
    return { icon: Info, color: "text-blue-400 border-blue-500/30 bg-blue-500/10", label: eventType };
  };

  const getStatusPill = (status) => {
    if (status === "success") {
      return <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400"><CheckCircle2 className="w-3 h-3 mr-1" /> Success</Badge>;
    }
    if (status === "failed") {
      return <Badge className="bg-rose-500/10 border-rose-500/30 text-rose-400"><XCircle className="w-3 h-3 mr-1" /> Failed</Badge>;
    }
    if (status === "warning") {
      return <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400"><AlertTriangle className="w-3 h-3 mr-1" /> Warning</Badge>;
    }
    return <Badge className="bg-blue-500/10 border-blue-500/30 text-blue-400"><Info className="w-3 h-3 mr-1" /> Info</Badge>;
  };

  const formatDateFull = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Audit Logs</p>
            <h4 className="text-xl font-bold text-slate-100">{pagination.totalLogs}</h4>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Successful Actions</p>
            <h4 className="text-xl font-bold text-emerald-400">{stats.successes}</h4>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Failed Attempts</p>
            <h4 className="text-xl font-bold text-rose-400">{stats.failures}</h4>
          </div>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl p-4 flex items-center space-x-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Security Audits</p>
            <h4 className="text-xl font-bold text-amber-400">{stats.securityEvents}</h4>
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-slate-900/70 border-slate-800 backdrop-blur-xl p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search description, email, IP, event type, resource ID..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            {search && (
              <button
                onClick={() => handleFilterChange(setSearch, "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchLogs}
              disabled={loading}
              className="border-slate-800 hover:bg-slate-800 text-slate-300"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pt-2 border-t border-slate-800/60">
          {/* User Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">USER / EMAIL</label>
            <select
              value={selectedUser}
              onChange={(e) => handleFilterChange(setSelectedUser, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Users</option>
              {usersList.map((u) => (
                <option key={u._id} value={u.email}>
                  {u.email} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Event Type Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">EVENT TYPE</label>
            <select
              value={selectedEventType}
              onChange={(e) => handleFilterChange(setSelectedEventType, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Event Types</option>
              <option value="USER_LOGIN_SUCCESS">Login Success</option>
              <option value="USER_LOGIN_FAILED">Login Failed</option>
              <option value="USER_LOGOUT">User Logout</option>
              <option value="USER_REGISTER_VERIFIED">User Register</option>
              <option value="PASSWORD_CHANGED">Password Change</option>
              <option value="SCAN_EXECUTION_SUCCESS">Scan Success</option>
              <option value="SCAN_EXECUTION_FAILED">Scan Failed</option>
              <option value="PUBLIC_SCAN_EXECUTION">Public Scan</option>
              <option value="API_KEY_CREATED">API Key Created</option>
              <option value="API_KEY_DELETED">API Key Deleted</option>
              <option value="API_KEY_USED">API Key Used</option>
              <option value="USER_DELETED_BY_ADMIN">Admin User Deletion</option>
            </select>
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">STATUS</label>
            <select
              value={selectedStatus}
              onChange={(e) => handleFilterChange(setSelectedStatus, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>

          {/* Visibility Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">VISIBILITY</label>
            <select
              value={selectedVisibility}
              onChange={(e) => handleFilterChange(setSelectedVisibility, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All (Public & Private)</option>
              <option value="true">Public Scans Only</option>
              <option value="false">Private Scans & Actions</option>
            </select>
          </div>

          {/* Date Range Select */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">DATE RANGE</label>
            <select
              value={dateRange}
              onChange={(e) => handleFilterChange(setDateRange, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">SORT BY</label>
            <select
              value={sort}
              onChange={(e) => handleFilterChange(setSort, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Custom Date Inputs if "custom" selected */}
        {dateRange === "custom" && (
          <div className="flex items-center space-x-3 pt-2 border-t border-slate-800/40">
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleFilterChange(setStartDate, e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-0.5">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => handleFilterChange(setEndDate, e.target.value)}
                className="bg-slate-950/60 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Audit Logs Table */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
            <p className="text-sm">Retrieving audit activity records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Activity className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No activity logs found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching activity events fit your filter criteria. Try clearing search keywords or date filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Event Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                {logs.map((log) => {
                  const badgeProps = getEventBadgeProps(log.eventType, log.status);
                  const BadgeIcon = badgeProps.icon;

                  return (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Date & Time */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateFull(log.createdAt)}</span>
                        </div>
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 font-medium text-slate-200">
                        <div className="flex items-center space-x-2">
                          <span className="truncate max-w-[160px] font-mono text-[11px]">
                            {log.userEmail}
                          </span>
                          {log.userRole === "admin" && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[10px] font-semibold text-purple-300">
                              Admin
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Event Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${badgeProps.color}`}>
                          <BadgeIcon className="w-3 h-3 mr-1.5" />
                          {badgeProps.label}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 max-w-xs truncate text-slate-300">
                        {log.description}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusPill(log.status)}
                      </td>

                      {/* IP Address */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress}
                      </td>

                      {/* Details View Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailLog(log)}
                          className="text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 p-1.5 h-auto rounded-lg"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
            <div>
              Showing page <span className="font-semibold text-slate-200">{pagination.currentPage}</span> of{" "}
              <span className="font-semibold text-slate-200">{pagination.totalPages}</span> ({pagination.totalLogs} total events)
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage <= 1}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                className="border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.currentPage >= pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                className="border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Activity Log Event Detail Drawer Modal */}
      {detailLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDetailLog(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-400">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Activity Log Inspector</h3>
                <p className="text-xs text-slate-400 font-mono">Event ID: {detailLog._id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Event Type</span>
                <span className="font-mono text-slate-200 font-bold">{detailLog.eventType}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Status</span>
                <div>{getStatusPill(detailLog.status)}</div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">User Email</span>
                <span className="font-mono text-slate-200">{detailLog.userEmail}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">User Role</span>
                <span className="font-semibold text-purple-400 capitalize">{detailLog.userRole}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">IP Address</span>
                <span className="font-mono text-slate-200">{detailLog.ipAddress}</span>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Exact Timestamp</span>
                <span className="font-mono text-slate-200">{formatDateFull(detailLog.createdAt)}</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-400 font-semibold uppercase text-[10px] block">Description</span>
              <p className="text-xs text-slate-200 leading-relaxed">{detailLog.description}</p>
            </div>

            {/* Resource details if present */}
            {detailLog.resourceId && (
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1 text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Resource Reference</span>
                <p className="font-mono text-indigo-300">
                  Type: <span className="font-bold">{detailLog.resourceType}</span> | ID: {detailLog.resourceId}
                </p>
              </div>
            )}

            {/* Raw Metadata JSON */}
            {detailLog.metadata && Object.keys(detailLog.metadata).length > 0 && (
              <div className="space-y-1.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Event Metadata Payload</span>
                <pre className="p-3.5 bg-slate-950 font-mono text-[11px] text-emerald-400 rounded-xl border border-slate-800 overflow-x-auto">
                  {JSON.stringify(detailLog.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* User Agent */}
            {detailLog.userAgent && (
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Client User Agent</span>
                <p className="font-mono text-[11px] text-slate-400 break-all bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  {detailLog.userAgent}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailLog(null)}
                className="border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                Close Inspector
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
