"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";

import {
  Shield,
  History,
  Users,
  Trash2,
  Search,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dashboard states
  const [scans, setScans] = useState([]);
  const [totalScans, setTotalScans] = useState(0);
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [searchDomain, setSearchDomain] = useState("");
  
  // Scanner states
  const [scanUrl, setScanUrl] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState(null);
  const [scanSuccessId, setScanSuccessId] = useState(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch all dashboard data
  const fetchData = async () => {
    try {
      // 1. Fetch user status
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      
      if (!authData.loggedIn) {
        router.push("/login");
        return;
      }
      
      setUser(authData.user);

      // 2. Fetch user/admin scans with filters
      const scansRes = await fetch(
        `/api/scans?page=${currentPage}&limit=10&domain=${searchDomain}`
      );
      const scansData = await scansRes.json();
      
      if (scansData.success) {
        setScans(scansData.data.scans || []);
        setTotalScans(scansData.data.pagination.totalScans || 0);
        setTotalPages(scansData.data.pagination.totalPages || 1);
        setStats(scansData.data.summary || null);
      }

      // 3. If admin, fetch users list
      if (authData.user.role === "admin") {
        const usersRes = await fetch("/api/users");
        const usersData = await usersRes.json();
        if (usersData.success) {
          setUsersList(usersData.users || []);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, searchDomain]);

  // Handle deletion of scans (Admin only)
  const handleDeleteScan = async (scanId) => {
    if (!confirm("Are you sure you want to permanently delete this scan?")) return;
    
    try {
      const res = await fetch(`/api/scan/${scanId}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Scan deleted successfully.");
        fetchData();
      } else {
        toast.error("Delete failed: " + data.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // Handle clear all history (Admin only)
  const handleClearAllHistory = async () => {
    if (!confirm("Are you sure you want to permanently clear ALL scan history in the system?")) return;
    if (!confirm("This action is destructive and CANNOT be undone. Confirm clear all?")) return;

    try {
      const res = await fetch("/api/scans", { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("All scan history cleared successfully.");
        fetchData();
      } else {
        toast.error("Failed to clear history: " + data.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // Handle deletion of users (Admin only)
  const handleDeleteUser = async (userId, userEmail) => {
    if (!confirm(`Are you sure you want to permanently delete user account "${userEmail}"?`)) return;
    if (!confirm(`This will also delete ALL security scan reports owned by "${userEmail}". Confirm deletion?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("User account and associated scans deleted successfully.");
        fetchData();
      } else {
        toast.error("Failed to delete user: " + data.error);
      }
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };

  // Handle live scanning from dashboard
  const handleLiveScan = async (e) => {
    e.preventDefault();
    if (!scanUrl.trim()) return;

    setScanLoading(true);
    setScanError(null);
    setScanSuccessId(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scanUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScanError(data.error || "Scan failed.");
        return;
      }

      setScanSuccessId(data.scanId);
      setScanUrl("");
      // Refresh scans history and statistics
      fetchData();
    } catch {
      setScanError("Failed to connect to scanner API.");
    } finally {
      setScanLoading(false);
    }
  };

  // Grade style mapping
  const gradeStyle = (grade) => {
    if (grade?.startsWith("A")) return "text-success border-success/30 bg-success/10";
    if (grade === "B") return "text-accent border-accent/30 bg-accent/10";
    if (grade === "C") return "text-warning border-warning/30 bg-warning/10";
    return "text-danger border-danger/30 bg-danger/10";
  };

  // Date formatter
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col text-text font-mono">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-text-dim text-xs">Decrypting secure console session...</p>
          </div>
        </main>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const gradeDistribution = stats?.gradeDistribution || {};
  const globalGradeDistribution = stats?.global?.gradeDistribution || {};

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-mono">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeInUp">
        
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-wider text-text">{isAdmin ? "Admin Security Console" : "User Audit Console"}</h1>
              <span className={`text-[10px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider ${
                isAdmin 
                  ? "border-accent/40 bg-accent/10 text-accent shadow-glow" 
                  : "border-success/30 bg-success/10 text-success"
              }`}>
                {user?.role}
              </span>
            </div>
            <p className="text-text-dim text-xs mt-1">
              Console Operator: <span className="text-text font-semibold">{user?.email}</span>
            </p>
          </div>
          <div className="flex gap-2 self-start sm:self-center">
            {isAdmin && (
              <button
                onClick={handleClearAllHistory}
                className="flex items-center gap-2 px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg text-xs font-bold text-danger hover:bg-danger/25 hover:border-danger transition-colors"
              >
                Clear History
              </button>
            )}
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-panel border border-border rounded-lg text-xs font-bold hover:border-accent hover:text-accent transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" /> REFRESH
            </button>
          </div>
        </div>

        {/* Statistics Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-glow relative overflow-hidden">
            <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">
              {isAdmin ? "Global Scans" : "My Console Scans"}
            </p>
            <p className="text-3xl font-bold text-accent mt-2">
              {isAdmin ? stats?.global?.totalScans || 0 : totalScans}
            </p>
            <History className="absolute right-4 bottom-4 text-3xl text-border/30 h-8 w-8" />
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-glow relative overflow-hidden">
            <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">
              {isAdmin ? "Global Avg Score" : "My Average Score"}
            </p>
            <p className="text-3xl font-bold text-success mt-2">
              {isAdmin ? stats?.global?.averageScore || 0 : stats?.averageScore || 0}
              <span className="text-xs text-text-dim font-normal">/100</span>
            </p>
            <Shield className="absolute right-4 bottom-4 text-3xl text-border/30 h-8 w-8" />
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-glow relative overflow-hidden">
            <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">
              {isAdmin ? "Unique Hosts" : "My Scanned Hosts"}
            </p>
            <p className="text-3xl font-bold text-warning mt-2">
              {isAdmin ? stats?.global?.uniqueDomainsScanned || 0 : stats?.uniqueDomains || 0}
            </p>
            <BarChart3 className="absolute right-4 bottom-4 text-3xl text-border/30 h-8 w-8" />
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 shadow-glow relative overflow-hidden">
            <p className="text-text-dim text-[10px] font-bold uppercase tracking-widest">
              {isAdmin ? "Registered Users" : "Coverage Target"}
            </p>
            <p className="text-3xl font-bold text-accent mt-2">
              {isAdmin ? usersList.length : "OWASP / GDPR"}
            </p>
            {isAdmin ? (
              <Users className="absolute right-4 bottom-4 text-3xl text-border/30 h-8 w-8" />
            ) : (
              <CheckCircle2 className="absolute right-4 bottom-4 text-3xl text-border/30 h-8 w-8" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Controls & Live Scanner */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Scan Component (Available to User & Admin) */}
            <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4 border-b border-border/30 pb-3">
                <Shield className="text-accent h-4 w-4 animate-pulse" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-text">Launch Console Header Audit</h2>
              </div>

              <form onSubmit={handleLiveScan} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  placeholder="Enter domain e.g., google.com or https://example.com"
                  className="flex-1 bg-panel border border-border focus:border-accent rounded-lg px-4 py-2.5 text-xs text-text font-mono focus:outline-none scan-input w-full"
                  disabled={scanLoading}
                />
                <button
                  type="submit"
                  disabled={scanLoading || !scanUrl.trim()}
                  className="bg-accent/10 border border-accent/40 text-accent font-bold px-6 py-2.5 rounded-lg text-xs uppercase tracking-wider hover:bg-accent/25 transition-colors disabled:opacity-50 w-full sm:w-auto flex items-center justify-center"
                >
                  {scanLoading ? "Auditing..." : "Audit"}
                </button>
              </form>

              {scanError && (
                <div className="mt-3 p-3 bg-danger/5 border border-danger/25 text-danger text-xs rounded-lg font-mono">
                  ⚠ {scanError}
                </div>
              )}

              {scanSuccessId && (
                <div className="mt-3 p-3 bg-success/5 border border-success/25 text-success text-xs rounded-lg font-mono flex items-center justify-between">
                  <span>✔ Security evaluation successful!</span>
                  <Link
                    href={`/scan/${scanSuccessId}`}
                    className="text-accent hover:underline flex items-center font-bold"
                  >
                    View report console <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {scanLoading && (
                <div className="mt-4 p-4 border border-border bg-panel/30 rounded-lg flex items-center gap-3 animate-pulse text-xs text-text-dim">
                  <div className="h-4 w-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  <span>Connecting to target host & evaluating cryptographic configs...</span>
                </div>
              )}
            </div>

            {/* Scan History list */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <History className="text-accent h-4 w-4" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text">
                    {isAdmin ? "System Audit Logs" : "My Audit Logs"}
                  </h2>
                </div>
                
                {/* Search / Filter */}
                <div className="relative max-w-xs w-full">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-dim">
                    <Search className="h-3.5 w-3.5 text-accent/70" />
                  </span>
                  <input
                    type="text"
                    value={searchDomain}
                    onChange={(e) => {
                      setSearchDomain(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Filter by host..."
                    className="w-full pl-9 pr-4 py-1.5 bg-panel border border-border focus:border-accent rounded-lg text-xs focus:outline-none scan-input"
                  />
                </div>
              </div>

              {scans.length === 0 ? (
                <div className="py-8 text-center text-text-dim text-xs">
                  No audit logs found matching criteria.
                </div>
              ) : (
                <>
                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/40 text-text-dim uppercase tracking-wider text-[10px] font-bold">
                          <th className="py-3 px-3">Target Host</th>
                          <th className="py-3 px-3 text-center">Score</th>
                          <th className="py-3 px-3 text-center">Grade</th>
                          <th className="py-3 px-3">Inspected At</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {scans.map((scan) => (
                          <tr key={scan._id} className="hover:bg-panel/40 transition-colors">
                            <td className="py-3.5 px-3 font-semibold text-text max-w-[160px] truncate">
                              {isAdmin ? scan.domain : scan.domain || scan.maskedDomain}
                            </td>
                            <td className="py-3.5 px-3 text-center font-bold text-text">
                              {scan.score}/100
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`inline-block px-2 py-0.5 rounded border text-[9px] font-bold tracking-wider ${gradeStyle(scan.grade)}`}>
                                {scan.grade}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-text-dim text-[11px] font-medium">
                              {formatDate(scan.createdAt)}
                            </td>
                            <td className="py-3.5 px-3 text-right space-x-2">
                              <Link
                                href={`/scan/${scan._id}`}
                                className="inline-block bg-accent/10 border border-accent/30 text-accent font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider hover:bg-accent/20"
                              >
                                Report
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteScan(scan._id)}
                                  className="bg-danger/10 border border-danger/30 text-danger hover:bg-danger/25 p-1 rounded inline-flex items-center"
                                  title="Delete Scan"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {scans.map((scan) => (
                      <div key={scan._id} className="bg-panel/30 border border-border/50 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider block">Target Host</span>
                            <span className="font-semibold text-text text-sm break-all">
                              {isAdmin ? scan.domain : scan.domain || scan.maskedDomain}
                            </span>
                          </div>
                          <span className={`inline-block px-2.5 py-0.5 rounded border text-[10px] font-bold tracking-wider ${gradeStyle(scan.grade)}`}>
                            {scan.grade}
                          </span>
                        </div>
                        <div className="flex justify-between items-end border-t border-border/30 pt-3">
                          <div className="space-y-0.5">
                            <span className="text-[9px] text-text-dim uppercase block">Inspection</span>
                            <span className="text-[10px] text-text font-bold block">{scan.score}/100 Score</span>
                            <span className="text-[9px] text-text-dim block">{formatDate(scan.createdAt)}</span>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/scan/${scan._id}`}
                              className="bg-accent/10 border border-accent/30 text-accent font-bold px-3 py-1.5 rounded text-[10px] uppercase tracking-wider hover:bg-accent/20"
                            >
                              Report
                            </Link>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteScan(scan._id)}
                                className="bg-danger/10 border border-danger/30 text-danger hover:bg-danger/25 px-2 py-1.5 rounded inline-flex items-center"
                                title="Delete Scan"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/30 pt-4 text-[11px] font-bold uppercase tracking-wider">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-panel border border-border rounded-lg disabled:opacity-40 text-text-dim"
                  >
                    Previous
                  </button>
                  <span className="text-text-dim">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1.5 bg-panel border border-border rounded-lg disabled:opacity-40 text-text-dim"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (Admin Users list or user metrics breakdown) */}
          <div className="space-y-6">
            
            {isAdmin ? (
              /* Admin: User Accounts Management list */
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                  <Users className="text-accent h-4 w-4" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text">Registered Accounts</h2>
                </div>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {usersList.map((u) => (
                    <div
                      key={u._id}
                      className="p-3.5 bg-panel/30 border border-border/40 rounded-lg flex items-center justify-between text-xs hover:border-border transition-colors"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold truncate max-w-[130px] text-text">
                          {u.email}
                        </p>
                        <p className="text-[9px] text-text-dim flex items-center gap-1">
                          <Clock className="h-3 w-3 text-accent/60" /> {new Date(u.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          u.role === "admin" 
                            ? "border-accent/40 bg-accent/10 text-accent shadow-glow" 
                            : "border-success/30 bg-success/10 text-success"
                        }`}>
                          {u.role}
                        </span>
                        {u.email !== user?.email && (
                          <button
                            onClick={() => handleDeleteUser(u._id, u.email)}
                            className="p-1 bg-danger/10 border border-danger/30 rounded text-danger hover:bg-danger/25 transition-colors flex items-center justify-center"
                            title="Delete User Account"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* User: Security grades summary stats block */
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                  <BarChart3 className="text-accent h-4 w-4" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text">My Grade Distribution</h2>
                </div>

                <div className="space-y-3.5">
                  {["A+", "A", "B", "C", "D", "F"].map((grade) => {
                    const count = gradeDistribution[grade] || 0;
                    const pct = totalScans > 0 ? (count / totalScans) * 100 : 0;
                    return (
                      <div key={grade} className="text-xs space-y-1">
                        <div className="flex justify-between font-mono font-bold">
                          <span>{grade} Audits</span>
                          <span className="text-text-dim text-[11px] font-medium">{count} ({Math.round(pct)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-panel rounded-full overflow-hidden border border-border/50">
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
            )}

            {/* Global Grade Distribution for comparative metrics */}
            {(!isAdmin && stats?.global) && (
              <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-border/30 pb-3">
                  <Shield className="text-accent h-4 w-4" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text">Global Metrics</h2>
                </div>

                <div className="space-y-3.5">
                  {["A+", "A", "B", "C", "D", "F"].map((grade) => {
                    const count = globalGradeDistribution[grade] || 0;
                    const totalGlobal = stats?.global?.totalScans || 1;
                    const pct = (count / totalGlobal) * 100;
                    return (
                      <div key={grade} className="text-xs space-y-1">
                        <div className="flex justify-between font-mono font-bold">
                          <span>{grade}</span>
                          <span className="text-text-dim text-[11px] font-medium">{count} ({Math.round(pct)}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-panel rounded-full overflow-hidden">
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
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
