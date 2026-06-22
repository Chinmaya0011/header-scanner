"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ScoreGauge from "@/components/ui/ScoreGauge";
import { useToast } from "@/components/common/Toast";
import {
  Shield,
  Key,
  Database,
  Terminal,
  Activity,
  ArrowRight,
  Copy,
  RefreshCw,
  Trash2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function UserDemoPage() {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);

  // States for interactive mock elements
  const [keys, setKeys] = useState([
    {
      id: "key-1",
      name: "Production Backend CI/CD",
      maskedKey: "hg_live_demo_usr_••••••••••••••••3b2c",
      rawKey: "hg_live_demo_usr_key_a8d7e9f3b2c1d0e93b2c",
      createdAt: "2026-06-15",
      lastUsed: "2026-06-22",
      isActive: true,
      allowedDomains: "api.my-app.dev, my-app.dev",
    },
    {
      id: "key-2",
      name: "Staging Test Script",
      maskedKey: "hg_live_demo_usr_••••••••••••••••f81e",
      rawKey: "hg_live_demo_usr_key_bc8f42d1e0a3e9c5f81e",
      createdAt: "2026-06-20",
      lastUsed: "2026-06-21",
      isActive: true,
      allowedDomains: "",
    }
  ]);
  
  const [newKeyName, setNewKeyName] = useState("");
  const [revealedKeyId, setRevealedKeyId] = useState(null);
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [justGeneratedKey, setJustGeneratedKey] = useState(null);

  // Stats
  const dailyLimit = 20;
  const dailyUsage = 5;
  const remainingUsage = dailyLimit - dailyUsage;

  // Chart data
  const mockChartData = [
    { date: "Jun 16", success: 2, failed: 0 },
    { date: "Jun 17", success: 4, failed: 1 },
    { date: "Jun 18", success: 3, failed: 0 },
    { date: "Jun 19", success: 5, failed: 0 },
    { date: "Jun 20", success: 1, failed: 1 },
    { date: "Jun 21", success: 6, failed: 0 },
    { date: "Jun 22", success: 5, failed: 0 },
  ];

  // Scans history
  const [mockScans, setMockScans] = useState([
    {
      id: "scan-1",
      domain: "my-app.dev",
      url: "https://my-app.dev",
      score: 92,
      grade: "A",
      createdAt: "2026-06-22T14:32:00Z",
      status: "passed",
      checks: { passed: 9, warnings: 2, failed: 0 },
    },
    {
      id: "scan-2",
      domain: "staging.website.io",
      url: "https://staging.website.io",
      score: 65,
      grade: "B",
      createdAt: "2026-06-21T09:15:00Z",
      status: "warning",
      checks: { passed: 6, warnings: 4, failed: 1 },
    },
    {
      id: "scan-3",
      domain: "vulnerable-test.net",
      url: "http://vulnerable-test.net",
      score: 28,
      grade: "F",
      createdAt: "2026-06-18T18:45:00Z",
      status: "failed",
      checks: { passed: 2, warnings: 3, failed: 6 },
    }
  ]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerateKey = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const newKeyId = `key-${Date.now()}`;
    const generatedRaw = `hg_live_demo_usr_key_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const newKey = {
      id: newKeyId,
      name: newKeyName.trim(),
      maskedKey: `hg_live_demo_usr_••••••••••••••••${generatedRaw.slice(-4)}`,
      rawKey: generatedRaw,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: null,
      isActive: true,
      allowedDomains: "",
    };

    setKeys([newKey, ...keys]);
    setJustGeneratedKey(newKey);
    setNewKeyName("");
    toast.success("Simulated Key generated successfully!");
  };

  const handleRegenerateKey = (id) => {
    const generatedRaw = `hg_live_demo_usr_key_regen_${Math.random().toString(36).substring(2)}`;
    setKeys(keys.map(k => k.id === id ? {
      ...k,
      maskedKey: `hg_live_demo_usr_••••••••••••••••${generatedRaw.slice(-4)}`,
      rawKey: generatedRaw,
      lastUsed: null,
    } : k));
    toast.success("Simulated Key regenerated successfully!");
  };

  const handleToggleKeyStatus = (id) => {
    setKeys(keys.map(k => k.id === id ? { ...k, isActive: !k.isActive } : k));
    toast.success("Simulated Key status updated.");
  };

  const handleRevokeKey = (id) => {
    setKeys(keys.filter(k => k.id !== id));
    toast.success("Simulated Key revoked.");
  };

  const handleDeleteScan = (id) => {
    setMockScans(mockScans.filter(s => s.id !== id));
    toast.success("Scan deleted from mock history.");
  };

  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col">
      <Navbar />

      {/* Demo Announcement Banner */}
      <div className="bg-accent/15 border-b border-accent/20 px-4 py-2.5 text-center text-xs font-mono tracking-wide text-accent z-20">
        🚀 <strong>Demo Environment:</strong> You are browsing as a mock <strong>Developer User</strong>. Operations are simulated client-side.
      </div>

      <main className="flex-1 mx-auto max-w-6xl w-full px-4 sm:px-6 py-8 space-y-8 animate-fadeInUp">
        
        {/* Welcome & Usage Quota */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/[0.05]">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-accent/10 text-accent flex-shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                  Welcome, Demo User!
                </h1>
                <Badge variant="success">Developer Tier</Badge>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Monitor security parameters, manage integration key credentials, and review recent scans.
              </p>
            </div>
          </div>

          {/* Daily limit gauge */}
          <div className="flex items-center gap-4 bg-surface border border-white/[0.05] p-3 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Daily Request Quota</span>
              <p className="text-xs font-mono font-bold text-text">
                {dailyUsage} / {dailyLimit} <span className="text-text-muted font-normal">used today</span>
              </p>
            </div>
            <div className="w-16 h-2 bg-white/5 rounded-full overflow-hidden relative">
              <div className="h-full bg-accent" style={{ width: `${(dailyUsage / dailyLimit) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Stats and Score Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Quick Metrics */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Remaining limit</p>
              <p className="text-xl font-bold font-mono text-success mt-1">{remainingUsage}</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Requests left today</p>
            </Card>

            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Active Keys</p>
              <p className="text-xl font-bold font-mono text-accent mt-1">
                {keys.filter(k => k.isActive).length}
              </p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">Ready for API execution</p>
            </Card>

            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">API Success Rate</p>
              <p className="text-xl font-bold font-mono text-warning mt-1">94.1%</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">7-day average</p>
            </Card>

            <Card>
              <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider">Avg Scan score</p>
              <p className="text-xl font-bold font-mono text-text mt-1">85 / 100</p>
              <p className="text-[8px] text-text-muted mt-1 uppercase">A- Grade security</p>
            </Card>

            {/* Recharts API Analytics Chart */}
            <div className="col-span-2 sm:col-span-4">
              {mounted && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.04]">
                    <div>
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                        My API Scan Requests History
                      </h3>
                      <p className="text-[9px] text-text-dim uppercase mt-0.5">
                        Breakdown of successful vs blocked scan runs (Last 7 Days)
                      </p>
                    </div>
                  </div>
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={mockChartData}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="demoSuccess" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: "#16161a", borderColor: "rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "11px" }} />
                        <Area type="monotone" dataKey="success" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#demoSuccess)" name="Successful" />
                        <Area type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1.5} fill="transparent" name="Failed/Blocked" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Security Score Preview Card */}
          <div className="md:col-span-4 flex flex-col">
            <Card glow className="bg-surface/50 border border-white/[0.04] p-5 flex flex-col justify-between items-center text-center flex-1">
              <div>
                <h3 className="text-xs font-bold text-text uppercase tracking-wider">Primary Site Posture</h3>
                <p className="text-[9px] text-text-dim uppercase mt-0.5">Metrics parsed from my-app.dev</p>
              </div>

              <div className="my-6">
                <ScoreGauge score={92} grade="A" domain="my-app.dev" />
              </div>

              <div className="w-full space-y-3">
                <div className="grid grid-cols-3 py-2 bg-bg/40 rounded-xl border border-white/[0.03] text-xs">
                  <div>
                    <span className="font-bold text-success font-mono">9</span>
                    <p className="text-[8px] text-text-dim uppercase mt-0.5">Passed</p>
                  </div>
                  <div className="border-x border-white/5">
                    <span className="font-bold text-warning font-mono">2</span>
                    <p className="text-[8px] text-text-dim uppercase mt-0.5">Warnings</p>
                  </div>
                  <div>
                    <span className="font-bold text-danger font-mono">0</span>
                    <p className="text-[8px] text-text-dim uppercase mt-0.5">Failed</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href="/scanner" className="flex-1">
                    <Button variant="primary" size="sm" className="w-full" icon={Shield}>
                      Run New Scan
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>

        </div>

        {/* Credentials Manager Section */}
        <section className="bg-surface/40 border border-white/[0.04] p-6 rounded-xl space-y-6">
          <div>
            <h2 className="text-sm font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-accent" />
              <span>Simulated API Credentials</span>
            </h2>
            <p className="text-xs text-text-dim mt-1">
              Issue tokens to authenticate your security scanner integrations. Disclosing keys here is mock-protected.
            </p>
          </div>

          {/* Key Generation Form */}
          <form onSubmit={handleGenerateKey} className="flex gap-3 max-w-xl">
            <input
              type="text"
              placeholder="Friendly identifier (e.g. Jenkins Pipeline)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1 px-3 py-2 bg-bg border border-white/[0.05] rounded-lg text-xs font-mono text-text outline-none focus:border-accent/40 transition-all placeholder:text-text-muted/50"
            />
            <Button type="submit" variant="primary" size="md">
              Generate Mock Key
            </Button>
          </form>

          {/* Just Generated Key Banner */}
          {justGeneratedKey && (
            <div className="bg-success/5 rounded-xl p-4 space-y-2 border border-success/15 animate-fadeInUp max-w-2xl">
              <p className="text-[9px] text-success font-bold uppercase tracking-wider">
                Simulated Key Created (Copy Now!)
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  readOnly
                  value={justGeneratedKey.rawKey}
                  className="flex-1 bg-bg rounded-lg px-3 py-1.5 text-xs font-mono text-success outline-none border border-success/10 select-all"
                />
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(justGeneratedKey.rawKey);
                    toast.success("Copied key value!");
                  }}
                  variant="secondary"
                  size="sm"
                  icon={Copy}
                >
                  Copy
                </Button>
              </div>
              <button
                onClick={() => setJustGeneratedKey(null)}
                className="text-[9px] text-accent font-bold hover:underline uppercase block text-left pt-1"
              >
                Done
              </button>
            </div>
          )}

          {/* Active Keys List */}
          <div className="space-y-3.5">
            {keys.map((key) => {
              const isEditing = editingKeyId === key.id;
              return (
                <div key={key.id} className="bg-bg/40 border border-white/[0.03] rounded-xl p-4.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text">{key.name}</span>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        key.isActive ? "bg-success/10 text-success border border-success/20" : "bg-white/5 text-text-dim"
                      }`}>
                        {key.isActive ? "Active" : "Deactivated"}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-text-dim flex items-center gap-2">
                      <span>{revealedKeyId === key.id ? key.rawKey : key.maskedKey}</span>
                      <button 
                        onClick={() => setRevealedKeyId(revealedKeyId === key.id ? null : key.id)}
                        className="text-accent text-[9px] hover:underline uppercase font-bold"
                      >
                        {revealedKeyId === key.id ? "Hide" : "Reveal"}
                      </button>
                    </div>
                    <div className="flex gap-4 text-[9px] text-text-muted font-mono uppercase">
                      <span>Created: {key.createdAt}</span>
                      <span>Last Used: {key.lastUsed || "Never"}</span>
                      {key.allowedDomains && <span className="text-warning">Domains: {key.allowedDomains}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleToggleKeyStatus(key.id)}
                      className="px-2.5 py-1.5 border border-white/[0.05] hover:bg-white/5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-text-dim transition-all"
                    >
                      {key.isActive ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => handleRegenerateKey(key.id)}
                      className="px-2.5 py-1.5 border border-white/[0.05] hover:bg-white/5 rounded-lg text-[9px] font-bold uppercase tracking-wider text-accent transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>Regen</span>
                    </button>
                    <button
                      onClick={() => handleRevokeKey(key.id)}
                      className="px-2.5 py-1.5 hover:bg-danger/10 rounded-lg text-[9px] font-bold uppercase tracking-wider text-danger transition-all flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span>Revoke</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Scan History Logs */}
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4.5 w-4.5 text-accent" />
              <span>Simulated Scan Log Registry</span>
            </h3>
            <span className="text-[10px] text-text-muted uppercase font-bold">{mockScans.length} Scans Archived</span>
          </div>

          <div className="space-y-3">
            {mockScans.map((scan) => (
              <Card key={scan.id} className="p-4 bg-surface/50 border border-white/[0.04] hover:border-white/10 transition-all duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-text">{scan.domain}</span>
                      <span className={`h-2 w-2 rounded-full ${
                        scan.status === "passed" ? "bg-success" :
                        scan.status === "warning" ? "bg-warning" : "bg-danger"
                      }`} />
                    </div>
                    <p className="text-[9px] text-text-dim font-mono">{scan.url}</p>
                    <div className="flex gap-4 text-[9px] text-text-muted font-mono uppercase">
                      <span>Audited: {new Date(scan.createdAt).toLocaleString()}</span>
                      <span>Passed: {scan.checks.passed}</span>
                      <span>Warnings: {scan.checks.warnings}</span>
                      <span>Failed: {scan.checks.failed}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                    <div className="text-right">
                      <span className={`font-mono font-bold text-sm ${
                        scan.score >= 80 ? "text-success" :
                        scan.score >= 60 ? "text-warning" : "text-danger"
                      }`}>
                        {scan.score}% Score
                      </span>
                      <p className="text-[8px] text-text-dim uppercase tracking-wider">Grade {scan.grade}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteScan(scan.id)}
                      className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-all"
                      title="Delete log"
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
