"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Activity,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  LogIn,
  LogOut,
  User,
  Lock,
  Key,
  Globe,
  ShieldAlert,
  FileText
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/common/Toast";

export default function UserActivityLogs() {
  const toast = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    totalLogs: 0,
    totalPages: 1,
    currentPage: 1,
    pageLimit: 12,
  });

  // Filter State
  const [search, setSearch] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sort, setSort] = useState("newest");

  // Selected Detail Log for Modal
  const [detailLog, setDetailLog] = useState(null);

  const fetchUserLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.currentPage);
      params.set("limit", pagination.pageLimit);
      params.set("sort", sort);
      if (search.trim()) params.set("search", search.trim());
      if (selectedEventType !== "all") params.set("eventType", selectedEventType);
      if (selectedStatus !== "all") params.set("status", selectedStatus);

      const res = await fetch(`/api/activity-logs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.logs || []);
        setPagination(prev => ({
          ...prev,
          totalLogs: data.pagination.totalLogs,
          totalPages: data.pagination.totalPages,
        }));
      } else {
        toast.error(data.error || "Failed to fetch your activity history.");
      }
    } catch (err) {
      toast.error("Failed to connect to activity history API.");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageLimit, sort, search, selectedEventType, selectedStatus, toast]);

  useEffect(() => {
    fetchUserLogs();
  }, [fetchUserLogs]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getEventBadgeProps = (eventType) => {
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
      return { icon: User, color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10", label: "Registration" };
    }
    if (eventType.includes("PASSWORD")) {
      return { icon: Lock, color: "text-amber-400 border-amber-500/30 bg-amber-500/10", label: "Password Change" };
    }
    if (eventType.includes("API_KEY")) {
      return { icon: Key, color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10", label: "API Key" };
    }
    if (eventType.includes("SCAN")) {
      return { icon: Activity, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", label: "Security Scan" };
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
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center">
            <Activity className="w-5 h-5 text-indigo-400 mr-2" />
            My Activity History
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Private audit log of actions performed on your account, including security scans, logins, and API key updates.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchUserLogs}
          disabled={loading}
          className="border-slate-800 hover:bg-slate-800 text-slate-300 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Activity
        </Button>
      </div>

      {/* Toolbar Filters */}
      <Card className="bg-slate-900/70 border-slate-800 backdrop-blur-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search your actions..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
            {search && (
              <button
                onClick={() => handleFilterChange(setSearch, "")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Event Type Filter */}
          <div>
            <select
              value={selectedEventType}
              onChange={(e) => handleFilterChange(setSelectedEventType, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="all">All Event Types</option>
              <option value="USER_LOGIN_SUCCESS">Successful Logins</option>
              <option value="USER_LOGIN_FAILED">Failed Login Attempts</option>
              <option value="SCAN_EXECUTION_SUCCESS">Security Scans</option>
              <option value="API_KEY_CREATED">API Key Actions</option>
              <option value="PASSWORD_CHANGED">Password Changes</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sort}
              onChange={(e) => handleFilterChange(setSort, e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Activity History Table */}
      <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-400" />
            <p className="text-sm">Loading your activity history...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <Activity className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-base font-semibold text-slate-300">No activity recorded yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your actions will automatically appear here as you run security scans, update API keys, or manage your account.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Activity Type</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">IP Address</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                {logs.map((log) => {
                  const badgeProps = getEventBadgeProps(log.eventType);
                  const BadgeIcon = badgeProps.icon;

                  return (
                    <tr key={log._id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateFull(log.createdAt)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium border ${badgeProps.color}`}>
                          <BadgeIcon className="w-3 h-3 mr-1.5" />
                          {badgeProps.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-md truncate text-slate-200">
                        {log.description}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusPill(log.status)}
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {log.ipAddress}
                      </td>

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
              Page <span className="font-semibold text-slate-200">{pagination.currentPage}</span> of{" "}
              <span className="font-semibold text-slate-200">{pagination.totalPages}</span>
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

      {/* Detail Modal */}
      {detailLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="bg-slate-900 border-slate-800 text-slate-200 max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
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
                <h3 className="text-base font-bold text-slate-100">Activity Details</h3>
                <p className="text-xs text-slate-400 font-mono">{formatDateFull(detailLog.createdAt)}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 font-semibold uppercase text-[10px] block">Description</span>
                <p className="text-slate-200 leading-relaxed font-medium">{detailLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Status</span>
                  <div>{getStatusPill(detailLog.status)}</div>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">IP Address</span>
                  <span className="font-mono text-slate-200">{detailLog.ipAddress}</span>
                </div>
              </div>

              {detailLog.metadata && Object.keys(detailLog.metadata).length > 0 && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block">Details Payload</span>
                  <pre className="p-3 bg-slate-950 font-mono text-[11px] text-emerald-400 rounded-xl border border-slate-800 overflow-x-auto">
                    {JSON.stringify(detailLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailLog(null)}
                className="border-slate-800 hover:bg-slate-800 text-slate-300"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
