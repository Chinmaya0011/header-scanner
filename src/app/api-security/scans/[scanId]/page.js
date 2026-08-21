"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Search,
  ChevronRight,
  Eye,
  RefreshCw,
  X,
  Copy,
  Check,
  Network,
  FileText,
  Lock,
  ArrowLeft,
  PieChart as PieIcon,
  BarChart2,
  Activity
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/common/Loading";
import { useToast } from "@/components/common/Toast";

export default function ApiScanResultsPage({ params }) {
  const resolvedParams = use(params);
  const scanId = resolvedParams.scanId;
  const toast = useToast();

  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "endpoints" | "findings" | "apimap" | "inventory" | "requests"

  // Endpoint Explorer state
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState(null);

  // Finding detail drawer state
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [copiedEvidence, setCopiedEvidence] = useState(false);

  const fetchScanDetails = async () => {
    try {
      const res = await fetch(`/api/api-security/scans/${scanId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setScan(data.scan);
      } else {
        toast.error(data.error || "Failed to load scan details.");
      }
    } catch {
      toast.error("Network error fetching scan details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScanDetails();

    // Auto-poll progress if scan is active
    const interval = setInterval(() => {
      if (scan && (scan.status === "queued" || scan.status === "discovering" || scan.status === "testing")) {
        fetchScanDetails();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [scanId, scan?.status]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <Loading message="Decrypting API Security Report..." />
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-4">
        <p className="text-sm text-text-dim">API Scan record not found or access denied.</p>
        <Link href="/api-security" className="mt-4">
          <Button variant="outline" size="sm" icon={ArrowLeft}>Back to Scanner</Button>
        </Link>
      </div>
    );
  }

  // Compute Dynamic Chart Data from Live Scan Response (NO HARDCODED DATA)
  const severityChartData = [
    { name: "Critical", count: scan.severitySummary?.critical || 0, color: "#ef4444" },
    { name: "High", count: scan.severitySummary?.high || 0, color: "#f87171" },
    { name: "Medium", count: scan.severitySummary?.medium || 0, color: "#f59e0b" },
    { name: "Low", count: scan.severitySummary?.low || 0, color: "#6366f1" },
    { name: "Info", count: scan.severitySummary?.info || 0, color: "#64748b" },
  ].filter(d => d.count > 0);

  const owaspBarChartData = [
    { category: "API1 BOLA", findings: scan.owaspDistribution?.api1_bola || 0 },
    { category: "API2 Auth", findings: scan.owaspDistribution?.api2_auth || 0 },
    { category: "API3 Props", findings: scan.owaspDistribution?.api3_properties || 0 },
    { category: "API4 Rate", findings: scan.owaspDistribution?.api4_resources || 0 },
    { category: "API5 BFLA", findings: scan.owaspDistribution?.api5_bfla || 0 },
    { category: "API6 Flow", findings: scan.owaspDistribution?.api6_business || 0 },
    { category: "API7 SSRF", findings: scan.owaspDistribution?.api7_ssrf || 0 },
    { category: "API8 Config", findings: scan.owaspDistribution?.api8_config || 0 },
    { category: "API9 Inven", findings: scan.owaspDistribution?.api9_inventory || 0 },
    { category: "API10 Cons", findings: scan.owaspDistribution?.api10_consumption || 0 },
  ];

  const endpointStatusData = (() => {
    let pass = 0, warn = 0, fail = 0, untested = 0;
    (scan.endpoints || []).forEach(ep => {
      if (ep.testStatus === "PASS") pass++;
      else if (ep.testStatus === "WARNING") warn++;
      else if (ep.testStatus === "FAIL") fail++;
      else untested++;
    });

    return [
      { name: "Passed", value: pass, color: "#10b981" },
      { name: "Warnings", value: warn, color: "#f59e0b" },
      { name: "Failed", value: fail, color: "#ef4444" },
      { name: "Untested", value: untested, color: "#64748b" },
    ].filter(d => d.value > 0);
  })();

  // Filtered Endpoints List
  const filteredEndpoints = (scan.endpoints || []).filter((ep) => {
    const matchesSearch = ep.path.toLowerCase().includes(searchQuery.toLowerCase()) || ep.method.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === "all" || ep.method.toUpperCase() === methodFilter.toUpperCase();
    return matchesSearch && matchesMethod;
  });

  const getMethodBadgeVariant = (method) => {
    switch (method.toUpperCase()) {
      case "GET": return "success";
      case "POST": return "accent";
      case "PUT": case "PATCH": return "warning";
      case "DELETE": return "danger";
      default: return "secondary";
    }
  };

  const getSeverityBadgeVariant = (severity) => {
    switch (severity.toLowerCase()) {
      case "critical": case "high": return "danger";
      case "medium": return "warning";
      case "low": return "accent";
      default: return "secondary";
    }
  };

  const copyEvidenceToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedEvidence(true);
    toast.success("Evidence copied to clipboard!");
    setTimeout(() => setCopiedEvidence(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans pb-16">
      {/* Header Bar */}
      <div className="bg-surface/50 border-b border-border py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/api-security" className="text-text-dim hover:text-text">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <h1 className="text-lg font-bold text-text uppercase tracking-wide">
                API Security Scan Report
              </h1>
              <Badge variant={scan.status === "completed" ? "success" : scan.status === "failed" ? "danger" : "warning"}>
                {scan.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs font-mono text-text-dim">
              Target: <span className="text-accent font-semibold">{scan.targetUrl}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={fetchScanDetails} variant="outline" size="sm" icon={RefreshCw}>
              Sync Report
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Summary Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4 border border-border">
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Security Score</p>
            <p className={`text-3xl font-extrabold font-mono mt-1 ${
              scan.score >= 80 ? "text-success" : scan.score >= 50 ? "text-warning" : "text-danger"
            }`}>
              {scan.score} / 100
            </p>
            <p className="text-[9px] text-text-muted mt-0.5 uppercase">OWASP API Compliance</p>
          </Card>

          <Card className="p-4 border border-border">
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Total Endpoints</p>
            <p className="text-3xl font-extrabold font-mono text-accent mt-1">
              {scan.totalEndpoints}
            </p>
            <p className="text-[9px] text-text-muted mt-0.5">{scan.testedEndpoints} Tested Endpoints</p>
          </Card>

          <Card className="p-4 border border-border">
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Total Findings</p>
            <p className="text-3xl font-extrabold font-mono text-danger mt-1">
              {scan.findings?.length || 0}
            </p>
            <p className="text-[9px] text-text-muted mt-0.5">
              {scan.severitySummary?.critical || 0} Critical / {scan.severitySummary?.high || 0} High
            </p>
          </Card>

          <Card className="p-4 border border-border">
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Scan Duration</p>
            <p className="text-3xl font-extrabold font-mono text-text mt-1">
              {Math.round((scan.durationMs || 0) / 1000)}s
            </p>
            <p className="text-[9px] text-text-muted mt-0.5 uppercase">Execution Time</p>
          </Card>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center space-x-2 border-b border-border pb-2 overflow-x-auto">
          {[
            { id: "overview", label: "Overview & Charts", icon: BarChart2 },
            { id: "endpoints", label: `Endpoints Explorer (${scan.totalEndpoints})`, icon: Layers },
            { id: "findings", label: `Security Findings (${scan.findings?.length || 0})`, icon: ShieldAlert },
            { id: "apimap", label: "API Graph Topology", icon: Network },
            { id: "inventory", label: "API Inventory", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id
                  ? "bg-accent/15 border border-accent/40 text-accent shadow-lg shadow-accent/10"
                  : "text-text-dim hover:text-text hover:bg-surface"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab Contents */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* OVERVIEW & CHARTS TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            
            {/* Visual Recharts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Chart 1: OWASP API Top 10 Findings Bar Chart */}
              <div className="lg:col-span-8">
                <Card className="p-5 border border-border space-y-4 h-[360px] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-accent" /> OWASP API Top 10 Vulnerability Distribution
                      </h3>
                      <p className="text-[10px] text-text-dim mt-0.5">Discovered findings per OWASP API Top 10 risk classification</p>
                    </div>
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={owaspBarChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis 
                          dataKey="category" 
                          stroke="rgba(255,255,255,0.4)" 
                          fontSize={9} 
                          interval={0}
                          angle={-25}
                          textAnchor="end"
                        />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "#16161a", 
                            borderColor: "rgba(255,255,255,0.1)", 
                            borderRadius: "8px", 
                            fontSize: "11px", 
                            fontFamily: "monospace" 
                          }} 
                        />
                        <Bar dataKey="findings" name="Findings" radius={[4, 4, 0, 0]}>
                          {owaspBarChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.findings > 0 ? "#ef4444" : "#10b981"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* Chart 2: Severity Distribution Pie Chart */}
              <div className="lg:col-span-4">
                <Card className="p-5 border border-border space-y-4 h-[360px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                      <PieIcon className="h-4 w-4 text-accent" /> Finding Severity Breakdown
                    </h3>
                    <p className="text-[10px] text-text-dim mt-0.5">Real-time risk composition ratio</p>
                  </div>

                  {severityChartData.length > 0 ? (
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={severityChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="count"
                          >
                            {severityChartData.map((entry, index) => (
                              <Cell key={`pie-cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: "#16161a", 
                              borderColor: "rgba(255,255,255,0.1)", 
                              borderRadius: "8px", 
                              fontSize: "11px" 
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex justify-center gap-3 flex-wrap text-[9px] font-mono mt-1">
                        {severityChartData.map((d) => (
                          <div key={d.name} className="flex items-center gap-1">
                            <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: d.color }} />
                            <span className="text-text-dim">{d.name}:</span>
                            <span className="font-bold text-text">{d.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-52 text-success font-mono text-xs">
                      <CheckCircle2 className="h-8 w-8 text-success mb-2" />
                      No security vulnerabilities detected.
                    </div>
                  )}
                </Card>
              </div>

            </div>

            {/* Detailed OWASP API Security Checklist Table */}
            <Card className="p-5 border border-border space-y-4">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-accent" /> OWASP API Security Top 10 Audit Verification
              </h3>
              <div className="space-y-2">
                {[
                  { key: "API1:2023", title: "API1 BOLA (Broken Object Level Authorization)", count: scan.owaspDistribution?.api1_bola || 0 },
                  { key: "API2:2023", title: "API2 Broken Authentication", count: scan.owaspDistribution?.api2_auth || 0 },
                  { key: "API3:2023", title: "API3 Object Property Level Authorization", count: scan.owaspDistribution?.api3_properties || 0 },
                  { key: "API4:2023", title: "API4 Unrestricted Resource Consumption", count: scan.owaspDistribution?.api4_resources || 0 },
                  { key: "API5:2023", title: "API5 BFLA (Broken Function Level Authorization)", count: scan.owaspDistribution?.api5_bfla || 0 },
                  { key: "API6:2023", title: "API6 Unrestricted Access to Business Flows", count: scan.owaspDistribution?.api6_business || 0 },
                  { key: "API7:2023", title: "API7 Server Side Request Forgery (SSRF)", count: scan.owaspDistribution?.api7_ssrf || 0 },
                  { key: "API8:2023", title: "API8 Security Misconfiguration", count: scan.owaspDistribution?.api8_config || 0 },
                  { key: "API9:2023", title: "API9 Improper Inventory Management", count: scan.owaspDistribution?.api9_inventory || 0 },
                  { key: "API10:2023", title: "API10 Unsafe Consumption of APIs", count: scan.owaspDistribution?.api10_consumption || 0 },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 bg-surface border border-border/60 rounded-xl text-xs font-mono">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-text">{item.key}:</span>{" "}
                      <span className="text-text-dim">{item.title}</span>
                    </div>
                    <Badge variant={item.count > 0 ? "danger" : "success"} className="text-[10px]">
                      {item.count > 0 ? `${item.count} Findings Discovered` : "PASSED AUDIT"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ENDPOINTS TAB */}
        {activeTab === "endpoints" && (
          <Card className="p-5 border border-border space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter endpoints..."
                  className="w-full pl-9 pr-3 py-1.5 bg-bg border border-border focus:border-accent rounded-lg text-xs font-mono text-text outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {["all", "GET", "POST", "PUT", "DELETE"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all border ${
                      methodFilter === m ? "bg-accent/20 border-accent text-accent" : "bg-bg border-border text-text-dim"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Endpoints Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-text-muted text-[9px] font-bold uppercase">
                    <th className="py-2.5">Method</th>
                    <th className="py-2.5">Endpoint Path</th>
                    <th className="py-2.5">Auth Required</th>
                    <th className="py-2.5">Source</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredEndpoints.map((ep, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02]">
                      <td className="py-3">
                        <Badge variant={getMethodBadgeVariant(ep.method)} className="text-[8px]">
                          {ep.method}
                        </Badge>
                      </td>
                      <td className="py-3 font-bold text-text truncate max-w-xs">{ep.path}</td>
                      <td className="py-3 text-text-dim">{ep.authenticationRequired ? "Required" : "Public"}</td>
                      <td className="py-3 text-text-dim uppercase text-[10px]">{ep.source}</td>
                      <td className="py-3 text-center">
                        <Badge variant={ep.testStatus === "FAIL" ? "danger" : ep.testStatus === "WARNING" ? "warning" : "success"}>
                          {ep.testStatus}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button onClick={() => setSelectedEndpoint(ep)} variant="outline" size="sm" icon={Eye} className="text-[9px] py-1 px-2">
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* FINDINGS TAB */}
        {activeTab === "findings" && (
          <Card className="p-5 border border-border space-y-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">
              Discovered Vulnerabilities & Evidence ({scan.findings?.length || 0})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-border text-text-muted text-[9px] font-bold uppercase">
                    <th className="py-2.5">Severity</th>
                    <th className="py-2.5">Finding Title</th>
                    <th className="py-2.5">OWASP Category</th>
                    <th className="py-2.5">Endpoint</th>
                    <th className="py-2.5 text-center">Confidence</th>
                    <th className="py-2.5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {(scan.findings || []).map((f, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="py-3">
                        <Badge variant={getSeverityBadgeVariant(f.severity)} className="text-[8px]">
                          {f.severity.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3 font-bold text-text truncate max-w-xs">{f.title}</td>
                      <td className="py-3 text-text-dim text-[10px]">{f.category}</td>
                      <td className="py-3 text-accent truncate max-w-xs">{f.endpoint}</td>
                      <td className="py-3 text-center">
                        <span className="text-[10px] text-text-muted uppercase font-semibold">{f.confidence}</span>
                      </td>
                      <td className="py-3 text-right">
                        <Button onClick={() => setSelectedFinding(f)} variant="outline" size="sm" icon={Eye} className="text-[9px] py-1 px-2">
                          Evidence
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* API GRAPH TAB */}
        {activeTab === "apimap" && (
          <Card className="p-6 border border-border space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <Network className="h-4 w-4" /> Visual API Route Topology
            </div>
            <div className="p-6 bg-black/60 border border-border rounded-xl space-y-4 font-mono text-xs">
              <div className="text-center font-bold text-accent text-sm">{scan.domain}</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-4 border-t border-border/50">
                {(scan.endpoints || []).slice(0, 16).map((ep, idx) => (
                  <div key={idx} className="p-3 bg-surface border border-border rounded-lg space-y-1">
                    <Badge variant={getMethodBadgeVariant(ep.method)} className="text-[7px]">{ep.method}</Badge>
                    <p className="text-[11px] font-bold text-text truncate">{ep.path}</p>
                    <p className="text-[9px] text-text-muted">Source: {ep.source}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4 border border-border">
              <p className="text-[10px] text-text-dim font-bold uppercase">Documented Routes</p>
              <p className="text-3xl font-extrabold font-mono text-success mt-1">{scan.inventory?.documented || 0}</p>
            </Card>
            <Card className="p-4 border border-border">
              <p className="text-[10px] text-text-dim font-bold uppercase">Undocumented Routes</p>
              <p className="text-3xl font-extrabold font-mono text-warning mt-1">{scan.inventory?.undocumented || 0}</p>
            </Card>
            <Card className="p-4 border border-border">
              <p className="text-[10px] text-text-dim font-bold uppercase">Legacy Versions</p>
              <p className="text-3xl font-extrabold font-mono text-danger mt-1">{scan.inventory?.legacy || 0}</p>
            </Card>
            <Card className="p-4 border border-border">
              <p className="text-[10px] text-text-dim font-bold uppercase">Internal Routes</p>
              <p className="text-3xl font-extrabold font-mono text-accent mt-1">{scan.inventory?.internal || 0}</p>
            </Card>
          </div>
        )}
      </div>

      {/* Finding Evidence Drawer / Modal */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden font-sans text-text">
            <div className="p-4 bg-panel border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-danger">
                <ShieldAlert className="h-5 w-5 text-danger" /> {selectedFinding.title}
              </div>
              <button onClick={() => setSelectedFinding(null)} className="text-text-dim hover:text-text p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 font-mono bg-black/40 p-3 rounded-lg border border-border">
                <div><span className="text-text-dim">Category:</span> {selectedFinding.category}</div>
                <div><span className="text-text-dim">Severity:</span> {selectedFinding.severity}</div>
                <div><span className="text-text-dim">Endpoint:</span> {selectedFinding.endpoint}</div>
                <div><span className="text-text-dim">Confidence:</span> {selectedFinding.confidence}</div>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-text-dim uppercase">Description</p>
                <p className="text-text leading-relaxed">{selectedFinding.description}</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-text-dim uppercase">Impact</p>
                <p className="text-text leading-relaxed">{selectedFinding.impact}</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-text-dim uppercase">Remediation</p>
                <p className="text-text leading-relaxed bg-black/40 p-3 rounded-lg border border-border">{selectedFinding.remediation}</p>
              </div>

              {selectedFinding.evidence && (
                <div className="space-y-2 pt-2 border-t border-border font-mono">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-accent uppercase">Request / Response Evidence</p>
                    <button
                      onClick={() => copyEvidenceToClipboard(JSON.stringify(selectedFinding.evidence, null, 2))}
                      className="text-[10px] text-accent hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedEvidence ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedEvidence ? "Copied" : "Copy JSON"}</span>
                    </button>
                  </div>
                  <pre className="p-3 bg-black/60 border border-border rounded-xl text-[10px] text-emerald-400 select-all overflow-x-auto leading-relaxed">
                    {JSON.stringify(selectedFinding.evidence, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Endpoint Detail Modal */}
      {selectedEndpoint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden font-sans text-text">
            <div className="p-4 bg-panel border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-accent font-mono">
                <Badge variant={getMethodBadgeVariant(selectedEndpoint.method)} className="text-[8px]">{selectedEndpoint.method}</Badge>
                <span>{selectedEndpoint.path}</span>
              </div>
              <button onClick={() => setSelectedEndpoint(null)} className="text-text-dim hover:text-text p-1">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-mono">
              <div className="space-y-1">
                <p className="text-text-dim font-bold uppercase">Discovery Source:</p>
                <p className="text-text uppercase font-semibold">{selectedEndpoint.source}</p>
              </div>

              <div className="space-y-1">
                <p className="text-text-dim font-bold uppercase">Authentication Requirement:</p>
                <p className="text-text font-semibold">{selectedEndpoint.authenticationRequired ? "Protected (Authentication Token Required)" : "Public Access"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-text-dim font-bold uppercase">Discovered Parameters:</p>
                {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 ? (
                  <div className="space-y-1 pt-1">
                    {selectedEndpoint.parameters.map((p, i) => (
                      <div key={i} className="p-2 bg-black/40 border border-border rounded flex justify-between">
                        <span className="font-bold text-accent">{p.name} ({p.location})</span>
                        <span className="text-text-muted">{p.type}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-text-muted">No explicit parameters extracted.</p>
                )}
              </div>

              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-text-dim font-bold uppercase">Raw Target URL:</p>
                <p className="text-accent break-all">{selectedEndpoint.url}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
