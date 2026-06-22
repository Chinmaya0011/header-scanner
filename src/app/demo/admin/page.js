"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/common/Toast";
import {
  Shield,
  Users,
  Activity,
  Key,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  Database,
  Trash2,
  ExternalLink,
  Edit2,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function AdminDemoPage() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  // Mock list of user records
  const [users, setUsers] = useState([
    {
      id: "usr-1",
      email: "dev.alpha@company.io",
      role: "user",
      apiAccessEnabled: true,
      dailyLimit: 20,
      dailyUsage: 19,
      keysCount: 2,
      createdAt: "2026-05-12",
    },
    {
      id: "usr-2",
      email: "sec-engineer@cloud.net",
      role: "user",
      apiAccessEnabled: true,
      dailyLimit: 50,
      dailyUsage: 35,
      keysCount: 3,
      createdAt: "2026-05-20",
    },
    {
      id: "usr-3",
      email: "qa-tester@firm.org",
      role: "user",
      apiAccessEnabled: false,
      dailyLimit: 20,
      dailyUsage: 0,
      keysCount: 1,
      createdAt: "2026-06-02",
    },
    {
      id: "usr-4",
      email: "developer.beta@stack.dev",
      role: "user",
      apiAccessEnabled: true,
      dailyLimit: 100,
      dailyUsage: 89,
      keysCount: 4,
      createdAt: "2026-06-10",
    },
    {
      id: "usr-5",
      email: "admin-helper@scanner.com",
      role: "admin",
      apiAccessEnabled: true,
      dailyLimit: 200,
      dailyUsage: 8,
      keysCount: 1,
      createdAt: "2026-04-01",
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [tempLimit, setTempLimit] = useState("");

  // Aggregate metrics
  const totalUsers = 142;
  const totalApiRequests = 8432;
  const activeKeysCount = 98;
  const revokedKeysCount = 14;

  // Chart data
  const requestHistoryData = [
    { date: "Jun 16", requests: 920 },
    { date: "Jun 17", requests: 1040 },
    { date: "Jun 18", requests: 1150 },
    { date: "Jun 19", requests: 1090 },
    { date: "Jun 20", requests: 880 },
    { date: "Jun 21", requests: 1210 },
    { date: "Jun 22", requests: 1142 },
  ];

  const successRateData = [
    { name: "Successful", value: 7982, color: "#10b981" },
    { name: "Failed", value: 320, color: "#ef4444" },
    { name: "Blocked (Quota)", value: 130, color: "#f59e0b" },
  ];

  // Recent scans
  const [recentScans, setRecentScans] = useState([
    { id: "s-1", email: "dev.alpha@company.io", host: "api.company.io", score: 85, grade: "A-", time: "3 mins ago" },
    { id: "s-2", email: "developer.beta@stack.dev", host: "app.stack.dev", score: 58, grade: "C", time: "12 mins ago" },
    { id: "s-3", email: "sec-engineer@cloud.net", host: "vault.cloud.net", score: 98, grade: "A+", time: "25 mins ago" },
    { id: "s-4", email: "external-user@web.com", host: "my-shop.com", score: 40, grade: "D", time: "1 hour ago" },
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleAccess = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, apiAccessEnabled: !u.apiAccessEnabled } : u));
    const targetUser = users.find(u => u.id === id);
    const action = targetUser.apiAccessEnabled ? "disabled" : "enabled";
    toast.success(`Simulated API access ${action} for ${targetUser.email}.`);
  };

  const handleStartEditLimit = (user) => {
    setEditingUserId(user.id);
    setTempLimit(user.dailyLimit.toString());
  };

  const handleSaveLimit = (id) => {
    const limitNum = parseInt(tempLimit);
    if (isNaN(limitNum) || limitNum <= 0) {
      toast.error("Please enter a valid positive number.");
      return;
    }
    setUsers(users.map(u => u.id === id ? { ...u, dailyLimit: limitNum } : u));
    setEditingUserId(null);
    toast.success("Simulated Daily Limit updated successfully!");
  };

  const handleDeleteScan = (id) => {
    setRecentScans(recentScans.filter(s => s.id !== id));
    toast.success("Recent scan record cleared from overview.");
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col">
      <Navbar />

      {/* Demo Announcement Banner */}
      <div className="bg-warning/15 border-b border-warning/20 px-4 py-2.5 text-center text-xs font-mono tracking-wide text-warning z-20">
        🛡️ <strong>Demo Control Panel:</strong> You are browsing as a mock <strong>Administrator</strong>. Access management and configuration options are simulated.
      </div>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-8 animate-fadeInUp">
        
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-warning/10 text-warning flex-shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                  System Control Console
                </h1>
                <Badge variant="danger">Administrator Portal</Badge>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Aggregate threat intel levels, modify daily limits quotas, and audit system API load performance.
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Stats Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Total Users Registered</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-xl font-bold font-mono text-text">{totalUsers}</p>
              <span className="text-[9px] text-success font-semibold font-mono">+12 this wk</span>
            </div>
            <p className="text-[8px] text-text-muted mt-1 uppercase">Database count index</p>
          </Card>

          <Card>
            <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">API Requests (Month)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-xl font-bold font-mono text-accent">{totalApiRequests}</p>
              <span className="text-[9px] text-success font-semibold font-mono">98.4% uptime</span>
            </div>
            <p className="text-[8px] text-text-muted mt-1 uppercase">System wide count logs</p>
          </Card>

          <Card>
            <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Active Credentials issued</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-xl font-bold font-mono text-warning">{activeKeysCount}</p>
              <span className="text-[9px] text-text-dim font-mono">{revokedKeysCount} revoked</span>
            </div>
            <p className="text-[8px] text-text-muted mt-1 uppercase">Valid tokens in registry</p>
          </Card>

          <Card>
            <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Blocked / Near limit</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-xl font-bold font-mono text-danger">3 / 8</p>
              <span className="text-[9px] text-danger font-semibold font-mono">Check profiles</span>
            </div>
            <p className="text-[8px] text-text-muted mt-1 uppercase">High load warning</p>
          </Card>
        </div>

        {/* Visual Charts Container */}
        {mounted && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* 7-day Line Chart */}
            <div className="md:col-span-8">
              <Card className="p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.04]">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider">Global API Scan Request Load</h3>
                    <p className="text-[9px] text-text-dim uppercase mt-0.5">Aggregated hourly calls mapped across 7 days</p>
                  </div>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={requestHistoryData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="adminChartGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#16161a", borderColor: "rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "11px" }} />
                      <Area type="monotone" dataKey="requests" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#adminChartGlow)" name="Requests" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Success Share Donut */}
            <div className="md:col-span-4 flex flex-col">
              <Card className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">API Verification Outcomes</h3>
                  <p className="text-[9px] text-text-dim uppercase mt-0.5">Status breakdown of monthly requests</p>
                </div>

                <div className="flex items-center justify-center h-40 relative my-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={successRateData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {successRateData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: "#16161a", borderColor: "rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold font-mono text-text">94.7%</span>
                    <span className="text-[8px] text-text-dim uppercase tracking-wider">Success</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-[9px] font-bold uppercase tracking-wider">
                  <div className="flex items-center justify-between text-success">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" /><span>Success</span></div>
                    <span>7,982 calls</span>
                  </div>
                  <div className="flex items-center justify-between text-danger">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" /><span>Failed Scan</span></div>
                    <span>320 calls</span>
                  </div>
                  <div className="flex items-center justify-between text-warning">
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-warning" /><span>Rate Blocked</span></div>
                    <span>130 calls</span>
                  </div>
                </div>
              </Card>
            </div>

          </div>
        )}

        {/* User Account limits configuration table */}
        <section className="bg-surface/40 border border-white/[0.04] p-6 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-accent" />
                <span>Simulated Client Accounts Manager</span>
              </h2>
              <p className="text-xs text-text-dim mt-1">
                Audit registered users credentials status, adjust daily request volume ceilings, and enable/disable access.
              </p>
            </div>
            
            {/* Search Input */}
            <div className="relative max-w-xs w-full flex items-center border border-white/[0.05] rounded-lg bg-bg focus-within:border-accent/40 transition-all">
              <span className="pl-3 text-text-muted"><Search className="h-3.5 w-3.5" /></span>
              <input
                type="text"
                placeholder="Search user email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent px-2.5 py-2 text-xs text-text outline-none placeholder:text-text-muted/50"
              />
            </div>
          </div>

          {/* User Table Grid */}
          <div className="overflow-x-auto border border-white/[0.03] rounded-xl">
            <table className="min-w-full divide-y divide-white/[0.04] text-left text-xs text-text-dim">
              <thead className="bg-bg/40 font-mono text-[9px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3.5 font-bold">Client Email</th>
                  <th className="px-5 py-3.5 font-bold">Registration</th>
                  <th className="px-5 py-3.5 font-bold text-center">API Keys</th>
                  <th className="px-5 py-3.5 font-bold text-center">Daily Quota limit</th>
                  <th className="px-5 py-3.5 font-bold text-center">Today Usage</th>
                  <th className="px-5 py-3.5 font-bold text-center">API Access</th>
                  <th className="px-5 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03] bg-surface/10 font-sans">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 italic text-text-muted">No mock user matches your search.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isEditing = editingUserId === user.id;
                    const nearLimit = user.dailyUsage >= user.dailyLimit * 0.85;

                    return (
                      <tr key={user.id} className="hover:bg-white/[0.01] transition-all">
                        {/* Email */}
                        <td className="px-5 py-4 whitespace-nowrap font-semibold text-text">
                          <div className="flex items-center gap-2">
                            <span>{user.email}</span>
                            {user.role === "admin" && (
                              <span className="text-[7px] px-1 py-0.2 rounded font-bold uppercase bg-warning/10 border border-warning/25 text-warning">Admin</span>
                            )}
                          </div>
                        </td>
                        
                        {/* Reg date */}
                        <td className="px-5 py-4 whitespace-nowrap text-[10px] font-mono">{user.createdAt}</td>
                        
                        {/* API keys count */}
                        <td className="px-5 py-4 text-center whitespace-nowrap font-mono">{user.keysCount}</td>
                        
                        {/* Daily limit adjustment */}
                        <td className="px-5 py-4 text-center whitespace-nowrap font-mono">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="text"
                                value={tempLimit}
                                onChange={(e) => setTempLimit(e.target.value)}
                                className="w-16 px-1.5 py-1 bg-bg border border-white/[0.08] text-center rounded text-xs font-mono outline-none text-text focus:border-accent/40"
                              />
                              <button
                                onClick={() => handleSaveLimit(user.id)}
                                className="p-1 bg-success/20 text-success rounded hover:bg-success/30 transition-colors"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1.5 group">
                              <span className="font-bold text-text">{user.dailyLimit}</span>
                              <button
                                onClick={() => handleStartEditLimit(user)}
                                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-0.5 text-accent hover:bg-accent/10 rounded transition-all"
                                title="Adjust Limit"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Today Usage */}
                        <td className="px-5 py-4 text-center whitespace-nowrap font-mono">
                          <span className={`font-bold ${
                            !user.apiAccessEnabled ? "text-text-muted" :
                            nearLimit ? "text-danger animate-pulse" : "text-text"
                          }`}>
                            {user.dailyUsage}
                          </span>
                          <span className="text-text-muted text-[10px]"> / {user.dailyLimit}</span>
                        </td>

                        {/* Access toggle status */}
                        <td className="px-5 py-4 text-center whitespace-nowrap">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            user.apiAccessEnabled 
                              ? "bg-success/10 text-success border-success/20" 
                              : "bg-danger/10 text-danger border-danger/20"
                          }`}>
                            {user.apiAccessEnabled ? "Enabled" : "Blocked"}
                          </span>
                        </td>

                        {/* Toggle active / edit limit actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleToggleAccess(user.id)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${
                              user.apiAccessEnabled 
                                ? "bg-transparent border-danger/20 text-danger hover:bg-danger/10" 
                                : "bg-transparent border-success/20 text-success hover:bg-success/10"
                            }`}
                          >
                            {user.apiAccessEnabled ? "Block API" : "Enable API"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Security Scan Logs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-accent" />
              <span>Simulated Global Security Event Logs</span>
            </h3>
            <span className="text-[10px] text-text-muted uppercase font-bold">{recentScans.length} events logged</span>
          </div>

          <div className="space-y-3">
            {recentScans.map((scan) => (
              <Card key={scan.id} className="p-4 bg-surface/50 border border-white/[0.04] hover:border-white/10 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text">{scan.host}</span>
                      <Badge variant={scan.score >= 80 ? "success" : scan.score >= 60 ? "warning" : "danger"}>
                        {scan.score}% Score
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-dim font-mono uppercase">
                      <span>User: {scan.email}</span>
                      <span>Grade: {scan.grade}</span>
                      <span className="text-accent">{scan.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleDeleteScan(scan.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all"
                      title="Clear log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
