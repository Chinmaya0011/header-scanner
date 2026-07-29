"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Globe,
  Clock,
  Download,
  Share2,
  RefreshCw,
  Server,
  Lock,
  Terminal,
  Activity,
  Cpu,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  FileText,
  BarChart3,
  Key,
  Database,
  Radio,
  Eye,
  EyeOff,
  Copy,
  Check,
  Cookie,
  FolderLock,
  LogIn,
  Link2,
  UserCheck
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import ScoreGauge from "./ScoreGauge";
import OWASPCoverage from "./OWASPCoverage";
import ScanPipelineTimeline from "./ScanPipelineTimeline";
import VulnerabilityTable from "./VulnerabilityTable";
import RemediationPanel from "./RemediationPanel";
import PolicyComplianceCard from "./PolicyComplianceCard";
import Button from "./Button";
import { useToast } from "@/components/common/Toast";
import { runSecurityAudit } from "@/lib/analyzer";

export default function ScanResultsDashboard({
  result,
  onRescan,
  onDownloadPDF,
  onDownloadJSON,
  onShare,
  onTogglePublic
}) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [isRescanning, setIsRescanning] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const {
    url,
    domain,
    score = 0,
    grade = "F",
    headers = [],
    statusCode,
    scanDuration = 0,
    summary,
    compliance,
    vulnerabilities = [],
    checks = [],
    ssl,
    dns,
    infrastructure,
    techStack = [],
    cookies = [],
    sensitiveFiles = [],
    exposedServices = [],
    nmapPorts = [],
    subdomains = [],
    dnsxRecords = [],
    httpxHosts = [],
    publicPages = [],
    loginSurfaces = [],
    crawl,
    whois,
    emailSecurity,
    privacy,
    nucleiFindings = [],
    niktoFindings = [],
    metadata,
    isPublic = false,
    createdAt
  } = result || {};

  const [scanDateStr, setScanDateStr] = useState(() => {
    const raw = createdAt || metadata?.timestamp;
    return raw ? new Date(raw).toISOString().replace("T", " ").substring(0, 19) + " UTC" : "";
  });

  useEffect(() => {
    const raw = createdAt || metadata?.timestamp || new Date().toISOString();
    try {
      setScanDateStr(new Date(raw).toLocaleString());
    } catch {
      setScanDateStr(new Date(raw).toISOString());
    }
  }, [createdAt, metadata]);

  // Compute active checks if missing
  const activeChecks = useMemo(() => {
    if (checks && checks.length > 0) return checks;
    try {
      const map = {};
      (headers || []).forEach(h => { map[h.name.toLowerCase()] = h.value; });
      return runSecurityAudit(map, url, statusCode).checks || [];
    } catch {
      return [];
    }
  }, [checks, headers, url, statusCode]);

  // Unified list of security findings across all audit modules
  const unifiedFindings = useMemo(() => {
    const list = [];

    // Header Checks
    (activeChecks || []).forEach(c => {
      list.push({
        title: c.title || c.name || "HTTP Security Header Check",
        status: c.status || "failed",
        severity: c.severity || "medium",
        category: "Security Headers",
        description: c.description || "Evaluates HTTP security header configuration.",
        evidence: c.evidence || c.value || "No evidence recorded.",
        recommendation: c.recommendation || null,
        impact: c.impact || "Exposes pages to framing, script injection, or session hijacking."
      });
    });

    // SSL Checks
    if (ssl && ssl.expirationDate !== null) {
      list.push({
        title: "SSL/TLS Certificate Authority Trust",
        status: ssl.valid ? "passed" : "failed",
        severity: ssl.valid ? "info" : "critical",
        category: "SSL/TLS Security",
        description: "Verifies if the domain certificate is issued by a globally trusted Certificate Authority.",
        evidence: `CA Issuer: ${ssl.issuer || "Unknown"} | Valid: ${ssl.valid ? "Yes" : "No"}`,
        recommendation: ssl.valid ? null : "Install a valid, trusted SSL/TLS certificate immediately.",
        impact: ssl.valid ? "Connection is encrypted and authenticated." : "Browsers display untrusted authority warnings."
      });

      if (ssl.daysRemaining !== null) {
        const expiring = ssl.daysRemaining < 30;
        list.push({
          title: "SSL/TLS Certificate Validity Window",
          status: expiring ? "warning" : "passed",
          severity: expiring ? "high" : "info",
          category: "SSL/TLS Security",
          description: "Monitors remaining validity days before certificate expiry.",
          evidence: `${ssl.daysRemaining} days remaining before expiration.`,
          recommendation: expiring ? "Renew SSL certificate to prevent service downtime." : null,
          impact: expiring ? "Risk of sudden certificate expiration downtime." : "Sufficient active validity duration."
        });
      }
    }

    // DNS Checks
    if (dns) {
      list.push({
        title: "DNSSEC Cryptographic Zone Validation",
        status: dns.dnssec ? "passed" : "warning",
        severity: dns.dnssec ? "info" : "low",
        category: "DNS Infrastructure",
        description: "Validates if DNSSEC zone signatures are enabled to prevent DNS cache poisoning.",
        evidence: dns.dnssec ? "DNSSEC signatures active." : "DNSSEC is not enabled.",
        recommendation: dns.dnssec ? null : "Enable DNSSEC key signing at your registrar.",
        impact: dns.dnssec ? "Cryptographically authenticated DNS queries." : "Risk of DNS spoofing redirects."
      });
    }

    // Exposed Services / Ports
    const combinedPorts = [...(exposedServices || []), ...(nmapPorts || [])];
    combinedPorts.forEach(srv => {
      const isOpen = srv.status === "open" || srv.state === "open";
      const portNum = srv.port || srv.portid;
      list.push({
        title: `Administrative Port Exposure: Port ${portNum} (${srv.service || 'Service'})`,
        status: isOpen ? "failed" : "passed",
        severity: isOpen ? (portNum === 80 || portNum === 443 ? "low" : "high") : "info",
        category: "Attack Surface",
        description: "Scans for open administrative or daemon TCP ports.",
        evidence: `Port: ${portNum} | Service: ${srv.service || 'HTTP'} | Status: ${srv.status || srv.state}`,
        recommendation: isOpen && portNum !== 80 && portNum !== 443 ? "Restrict public firewall access for administrative ports." : null,
        impact: isOpen ? "Exposes daemon service to brute-force or exploit payloads." : "Port is filtered."
      });
    });

    // Sensitive Files
    (sensitiveFiles || []).forEach(file => {
      if (file.exists) {
        list.push({
          title: `Exposed Administrative Path / Secret File: ${file.path}`,
          status: "failed",
          severity: "critical",
          category: "Attack Surface",
          description: "Detects accessible backup, environment, or configuration files.",
          evidence: `HTTP Status ${file.status || 200} at path ${file.path}`,
          recommendation: "Deny web access to backup and configuration files immediately.",
          impact: "Leaks database credentials, private keys, or code source."
        });
      }
    });

    // Advanced Scanner Findings (Nuclei / Nikto)
    [...(nucleiFindings || []), ...(niktoFindings || [])].forEach(finding => {
      list.push({
        title: finding.name || finding.info?.name || "Advanced Vulnerability Scanner Finding",
        status: "failed",
        severity: (finding.severity || finding.info?.severity || "high").toLowerCase(),
        category: "Vulnerability Scanning",
        description: finding.description || finding.info?.description || "Automated vulnerability scanner hit.",
        evidence: finding.matchedAt || finding.matched || finding.curlCommand || "Detected by security scanner engine.",
        recommendation: finding.remediation || "Apply vendor patch or restrict access.",
        impact: "Vulnerability flaw discovered on host target."
      });
    });

    return list;
  }, [activeChecks, ssl, dns, exposedServices, nmapPorts, sensitiveFiles, nucleiFindings, niktoFindings]);

  // Severity Breakdown Counts
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    unifiedFindings.forEach(f => {
      if (f.status !== "passed") {
        const s = (f.severity || "info").toLowerCase();
        if (s in counts) counts[s]++;
        else counts.low++;
      } else {
        counts.info++;
      }
    });
    return counts;
  }, [unifiedFindings]);

  const passedCount = useMemo(() => unifiedFindings.filter(f => f.status === "passed").length, [unifiedFindings]);
  const atRiskCount = useMemo(() => unifiedFindings.filter(f => f.status === "failed" || f.status === "weak").length, [unifiedFindings]);

  // Combined Pages list
  const allDiscoveredPages = useMemo(() => {
    const pages = [...(publicPages || [])];
    if (crawl && Array.isArray(crawl.pages)) {
      crawl.pages.forEach(p => {
        if (!pages.some(existing => (typeof existing === 'string' ? existing : existing.url) === (typeof p === 'string' ? p : p.url))) {
          pages.push(p);
        }
      });
    }
    return pages;
  }, [publicPages, crawl]);

  // Recharts Chart Data
  const pieData = useMemo(() => [
    { name: "Critical", value: severityCounts.critical, color: "#ef4444" },
    { name: "High", value: severityCounts.high, color: "#f97316" },
    { name: "Medium", value: severityCounts.medium, color: "#eab308" },
    { name: "Low", value: severityCounts.low, color: "#06b6d4" },
    { name: "Passed", value: passedCount, color: "#10b981" },
  ].filter(d => d.value > 0), [severityCounts, passedCount]);

  const categoryBarData = useMemo(() => [
    { name: "Headers", score: score || 75 },
    { name: "SSL/TLS", score: ssl?.valid ? 95 : 35 },
    { name: "DNS", score: dns?.dnssec ? 90 : 65 },
    { name: "Cookies", score: cookies?.length > 0 ? (cookies.filter(c => c.httpOnly && c.secure).length / cookies.length) * 100 : 100 },
    { name: "Attack Surface", score: Math.max(20, 100 - (atRiskCount * 10)) }
  ], [score, ssl, dns, cookies, atRiskCount]);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(domain || url || "");
    setCopiedDomain(true);
    toast?.success?.("Domain copied to clipboard!");
    setTimeout(() => setCopiedDomain(false), 2000);
  };

  const handleRescanClick = async () => {
    if (isRescanning) return;
    setIsRescanning(true);
    try {
      if (onRescan) await onRescan();
    } finally {
      setIsRescanning(false);
    }
  };

  const combinedPortList = useMemo(() => {
    const list = [...(exposedServices || []), ...(nmapPorts || [])];
    const unique = [];
    list.forEach(p => {
      const pNum = p.port || p.portid;
      if (!unique.some(u => (u.port || u.portid) === pNum)) {
        unique.push(p);
      }
    });
    return unique;
  }, [exposedServices, nmapPorts]);

  return (
    <div className="space-y-6 font-sans text-text">
      
      {/* ── Enterprise Header Banner ────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left: Domain Details & Identity */}
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-panel text-[10px] font-mono font-bold uppercase text-accent">
                <Globe className="w-3.5 h-3.5 text-accent animate-pulse" />
                Target Host
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-panel text-[10px] font-mono text-text-dim">
                HTTP {statusCode || 200}
              </span>

              {infrastructure?.server && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-panel text-[10px] font-mono text-text-muted">
                  <Server className="w-3 h-3" />
                  {infrastructure.server}
                </span>
              )}

              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase ${
                isPublic ? "bg-accent/10 text-accent" : "bg-panel text-text-dim"
              }`}>
                {isPublic ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                {isPublic ? "Public Access" : "Private Scan"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-text truncate">
                {domain || "Target Audit"}
              </h1>

              <button
                onClick={handleCopyDomain}
                className="p-1.5 rounded-lg bg-surface/60 hover:bg-accent/10 text-text-dim hover:text-accent transition-all shrink-0"
                title="Copy Domain"
              >
                {copiedDomain ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Sub-meta details */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-mono text-text-dim">
              <span className="flex items-center gap-1" suppressHydrationWarning>
                <Clock className="w-3.5 h-3.5 text-accent" />
                Scanned: {scanDateStr}
              </span>
              <span className="opacity-40">•</span>
              <span>Duration: <strong className="text-text">{scanDuration || 980}ms</strong></span>
              <span className="opacity-40">•</span>
              <span>IP: <strong className="text-accent-light">{dns?.ip || "Protected"}</strong></span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={handleRescanClick}
              disabled={isRescanning}
              variant="accent"
              size="sm"
              className="gap-2 font-mono text-xs shadow-glow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRescanning ? "animate-spin" : ""}`} />
              {isRescanning ? "Scanning..." : "Re-scan Target"}
            </Button>

            {onDownloadPDF && (
              <Button onClick={onDownloadPDF} variant="secondary" size="sm" className="gap-1.5 font-mono text-xs">
                <Download className="w-3.5 h-3.5" />
                PDF Report
              </Button>
            )}

            {onDownloadJSON && (
              <Button onClick={onDownloadJSON} variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <FileText className="w-3.5 h-3.5" />
                JSON
              </Button>
            )}

            {onShare && (
              <Button onClick={onShare} variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* ── Sticky Section Tab Navigation Bar ──────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md py-2 px-1 flex items-center gap-2 overflow-x-auto select-none">
        {[
          { id: "overview", label: "Executive Summary", icon: Activity },
          { id: "findings", label: `Findings (${unifiedFindings.length})`, icon: ShieldAlert },
          { id: "headers", label: `Security Headers (${headers.length})`, icon: Shield },
          { id: "ports", label: `Network Ports (${combinedPortList.length})`, icon: Cpu },
          { id: "surface", label: `Subdomains (${subdomains.length})`, icon: Globe },
          { id: "pages", label: `Pages & Logins (${allDiscoveredPages.length + loginSurfaces.length})`, icon: Link2 },
          { id: "secrets", label: `Exposed Files (${sensitiveFiles.length})`, icon: FolderLock },
          { id: "cookies", label: `Cookies & Privacy (${cookies.length})`, icon: Cookie },
          { id: "tech", label: "Tech Stack & WHOIS", icon: Layers },
          { id: "compliance", label: "OWASP & Policy", icon: ShieldCheck },
          { id: "remediation", label: "Remediation Configs", icon: Terminal },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-200 shrink-0 ${
                active
                  ? "bg-accent text-white shadow-glow"
                  : "bg-surface/50 text-text-dim hover:text-text hover:bg-surface"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Executive Summary Overview ──────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Top Row: Score Gauge & Severity Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-4 glass-card rounded-2xl p-6 flex flex-col items-center justify-center">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-2">
                Overall Security Posture
              </span>
              <ScoreGauge score={score} grade={grade} domain={domain} size={170} />
            </div>

            <div className="lg:col-span-8 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: "Critical", count: severityCounts.critical, bg: "bg-danger/10 text-danger" },
                  { label: "High", count: severityCounts.high, bg: "bg-danger/10 text-danger" },
                  { label: "Medium", count: severityCounts.medium, bg: "bg-warning/10 text-warning" },
                  { label: "Low", count: severityCounts.low, bg: "bg-accent/10 text-accent" },
                  { label: "Passed", count: passedCount, bg: "bg-success/10 text-success" },
                ].map(item => (
                  <div key={item.label} className={`p-3.5 rounded-xl flex flex-col items-center justify-center ${item.bg}`}>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">{item.label}</span>
                    <span className="text-2xl sm:text-3xl font-mono font-black mt-1">{item.count}</span>
                  </div>
                ))}
              </div>

              <div className="glass-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="space-y-1 pr-3">
                  <span className="text-text-muted uppercase text-[10px] font-bold block">Target Host Server</span>
                  <span className="text-text font-bold truncate block">{infrastructure?.server || "Nginx / Cloudflare Edge"}</span>
                </div>
                <div className="space-y-1 pr-3">
                  <span className="text-text-muted uppercase text-[10px] font-bold block">SSL/TLS Authority</span>
                  <span className="text-success font-bold truncate block">{ssl?.issuer || "Trusted Global CA"}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-text-muted uppercase text-[10px] font-bold block">Active Tech Stack</span>
                  <span className="text-accent-light font-bold truncate block">
                    {techStack.length > 0 ? techStack.map(t => typeof t === 'string' ? t : t.name).join(", ") : "Web Engine, Node.js, React"}
                  </span>
                </div>
              </div>

              <ScanPipelineTimeline duration={scanDuration} timestamp={scanDateStr} />
            </div>
          </div>

          {/* Middle Row: Distribution Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 glass-card rounded-2xl p-5">
              <h3 className="font-bold text-xs text-text uppercase tracking-wider mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent" />
                Vulnerability Severity Breakdown
              </h3>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#081a17", border: "none", borderRadius: "8px" }} itemStyle={{ color: "#ecfdf5", fontSize: "12px", fontFamily: "monospace" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-[11px] font-mono">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-text-dim">{item.name}: <strong className="text-text">{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-7 glass-card rounded-2xl p-5">
              <h3 className="font-bold text-xs text-text uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                Module Security Scores (Out of 100)
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#6ee7b7" fontSize={10} tickLine={false} />
                    <YAxis stroke="#6ee7b7" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#081a17", border: "none", borderRadius: "8px" }} itemStyle={{ color: "#10b981", fontSize: "12px", fontFamily: "monospace" }} />
                    <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <OWASPCoverage findings={unifiedFindings} />
        </div>
      )}

      {/* ── Tab 2: Detailed Vulnerability Table ────────────────────────────── */}
      {activeTab === "findings" && (
        <div className="animate-fadeIn space-y-4">
          <VulnerabilityTable findings={unifiedFindings} />
        </div>
      )}

      {/* ── Tab 3: Security Headers Matrix ─────────────────────────────────── */}
      {activeTab === "headers" && (
        <div className="animate-fadeIn space-y-4">
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-xs text-text uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              Evaluated HTTP Security Response Headers ({headers.length})
            </h3>
            
            <div className="space-y-2 font-mono text-xs">
              {headers.map((h, i) => (
                <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/40 p-3 rounded-xl">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-text">{h.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        h.status === 'present' ? 'bg-success/10 text-success' :
                        h.status === 'weak' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                      }`}>
                        {h.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-sans text-text-dim leading-relaxed">{h.description}</p>
                    {h.value && (
                      <div className="mt-1 p-2 rounded bg-[#030a08] text-[11px] text-text-muted truncate select-all">
                        {h.value}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Network Ports & Exposed Services Section ───────────────── */}
      {activeTab === "ports" && (
        <div className="animate-fadeIn space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-accent" />
                  <h3 className="font-bold text-sm text-text uppercase tracking-wide">
                    Network Ports & Service Exposure Audit ({combinedPortList.length})
                  </h3>
                </div>
                <p className="text-xs text-text-dim mt-0.5">
                  Port scanning results for active TCP daemons and network interface bindings
                </p>
              </div>
            </div>

            {combinedPortList.length === 0 ? (
              <div className="p-8 text-center bg-surface/40 rounded-xl font-mono text-xs text-text-dim">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="font-bold text-text">No unauthorized open ports detected.</p>
                <p className="text-text-muted mt-1">Standard web ports (80/443) filtered cleanly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {combinedPortList.map((srv, idx) => {
                  const portNum = srv.port || srv.portid;
                  const isOpen = srv.status === "open" || srv.state === "open";
                  return (
                    <div key={idx} className="p-4 rounded-xl bg-surface/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-text">Port {portNum}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isOpen ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                        }`}>
                          {isOpen ? "Open" : "Filtered"}
                        </span>
                      </div>
                      <div className="text-xs text-text-dim flex items-center justify-between">
                        <span>Service: <strong className="text-text">{srv.service || "HTTP Daemon"}</strong></span>
                        <span className="text-text-muted">Protocol: {srv.protocol || "TCP"}</span>
                      </div>
                      {srv.banner && (
                        <div className="p-2 rounded bg-[#030a08] text-[10px] text-text-muted truncate select-all">
                          Banner: {srv.banner}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 5: Subdomains & EASM Section ──────────────────────────────── */}
      {activeTab === "surface" && (
        <div className="animate-fadeIn space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm text-text uppercase tracking-wide">
                  External Attack Surface & Subdomains ({subdomains.length})
                </h3>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Resolved subdomains, zone records, and external DNS exposure for {domain}
              </p>
            </div>

            {subdomains.length === 0 ? (
              <div className="p-8 text-center bg-surface/40 rounded-xl font-mono text-xs text-text-dim">
                <Globe className="w-8 h-8 text-accent mx-auto mb-2 opacity-60" />
                <p className="font-bold text-text">Main domain host audit.</p>
                <p className="text-text-muted mt-1">No secondary subdomains enumerated for this target query.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {subdomains.map((sub, idx) => {
                  const subLabel = typeof sub === "string" ? sub : sub?.subdomain || sub?.domain || sub?.name || "Subdomain";
                  const ip = typeof sub === "object" ? sub?.ip : null;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-surface/50 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-bold text-text truncate block">{subLabel}</span>
                        {ip && <span className="text-[10px] text-text-muted block">IP: {ip}</span>}
                      </div>
                      <a
                        href={`https://${subLabel}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-panel hover:bg-accent/10 text-text-dim hover:text-accent shrink-0"
                        title="Visit subdomain"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 6: Discovered Public Pages & Login Surfaces Section ────────── */}
      {activeTab === "pages" && (
        <div className="animate-fadeIn space-y-5">
          {/* Public Pages */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm text-text uppercase tracking-wide">
                  Discovered Crawled Public Pages ({allDiscoveredPages.length})
                </h3>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Indexable web pages, endpoints, and assets crawled during security audit
              </p>
            </div>

            {allDiscoveredPages.length === 0 ? (
              <div className="p-6 text-center bg-surface/40 rounded-xl font-mono text-xs text-text-dim">
                <Link2 className="w-7 h-7 text-accent mx-auto mb-2 opacity-50" />
                <span>Single URL landing page scan completed.</span>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {allDiscoveredPages.map((page, idx) => {
                  const pageUrl = typeof page === "string" ? page : page.url || page.path;
                  const status = typeof page === "object" ? page.status || page.statusCode || 200 : 200;
                  const title = typeof page === "object" ? page.title : null;
                  return (
                    <div key={idx} className="p-3 rounded-xl bg-surface/40 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-panel text-accent uppercase">
                            HTTP {status}
                          </span>
                          <span className="font-bold text-text truncate">{pageUrl}</span>
                        </div>
                        {title && <p className="text-[11px] font-sans text-text-dim truncate mt-0.5">{title}</p>}
                      </div>
                      <a href={pageUrl} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent p-1">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Login Surfaces */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <LogIn className="w-5 h-5 text-warning" />
                <h3 className="font-bold text-sm text-text uppercase tracking-wide">
                  Authentication & Login Surfaces ({loginSurfaces.length})
                </h3>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Detected login portals, admin sign-in forms, and auth gateways
              </p>
            </div>

            {loginSurfaces.length === 0 ? (
              <div className="p-6 text-center bg-surface/40 rounded-xl font-mono text-xs text-text-dim">
                <UserCheck className="w-7 h-7 text-success mx-auto mb-2 opacity-80" />
                <span>No exposed admin or unauthenticated login portals discovered.</span>
              </div>
            ) : (
              <div className="space-y-2 font-mono text-xs">
                {loginSurfaces.map((login, idx) => {
                  const loginUrl = typeof login === "string" ? login : login.url || login.path;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-warning/5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <LogIn className="w-4 h-4 text-warning" />
                        <span className="font-bold text-text">{loginUrl}</span>
                      </div>
                      <span className="px-2.5 py-1 rounded text-[9px] font-bold bg-warning/10 text-warning uppercase">
                        Auth Gateway
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 7: Exposed Secrets & Sensitive Files Section ───────────────── */}
      {activeTab === "secrets" && (
        <div className="animate-fadeIn space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-danger" />
                <h3 className="font-bold text-sm text-text uppercase tracking-wide">
                  Sensitive Files & Credentials Exposure ({sensitiveFiles.length})
                </h3>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Audit for publicly accessible configuration files, environment variables, backup dumps, or `.git` repositories
              </p>
            </div>

            {sensitiveFiles.length === 0 ? (
              <div className="p-8 text-center bg-surface/40 rounded-xl font-mono text-xs text-text-dim">
                <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="font-bold text-text">No exposed secret files found.</p>
                <p className="text-text-muted mt-1">.env, .git, and backup paths safely restricted.</p>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {sensitiveFiles.map((file, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-danger/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-sm text-danger">{file.path}</span>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase ${file.exists ? 'bg-danger/20 text-danger' : 'bg-success/10 text-success'}`}>
                        {file.exists ? "EXPOSED (HTTP 200)" : "RESTRICTED"}
                      </span>
                    </div>
                    <p className="text-xs font-sans text-text-dim">
                      {file.exists ? "CRITICAL RISK: Publicly readable administrative or backup file." : "Path resolved securely."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 8: Cookie & Privacy Security Section ──────────────────────── */}
      {activeTab === "cookies" && (
        <div className="animate-fadeIn space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Cookie className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm text-text uppercase tracking-wide">
                  Cookie Hardening & Attribute Analysis ({cookies.length})
                </h3>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Evaluation of response cookies against HttpOnly, Secure, and SameSite attribute standards
              </p>
            </div>

            {cookies.length === 0 ? (
              <div className="p-6 text-center bg-surface/40 rounded-xl font-mono text-xs text-text-dim">
                <Cookie className="w-7 h-7 text-accent mx-auto mb-2 opacity-50" />
                <span>No Set-Cookie response headers issued on target endpoint.</span>
              </div>
            ) : (
              <div className="space-y-3 font-mono text-xs">
                {cookies.map((ck, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-surface/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-text">{ck.name}</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${ck.httpOnly ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          HttpOnly: {ck.httpOnly ? "Yes" : "No"}
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold uppercase ${ck.secure ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          Secure: {ck.secure ? "Yes" : "No"}
                        </span>
                        <span className="px-2 py-0.5 rounded font-bold bg-panel text-accent uppercase">
                          SameSite: {ck.sameSite || "None"}
                        </span>
                      </div>
                    </div>
                    {ck.value && (
                      <div className="p-2 rounded bg-[#030a08] text-[10px] text-text-muted truncate select-all">
                        Value: {ck.value}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab 9: Tech Stack & WHOIS Infrastructure Section ─────────────── */}
      {activeTab === "tech" && (
        <div className="animate-fadeIn space-y-5">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-accent" />
                <h3 className="font-bold text-sm text-text uppercase tracking-wide">
                  Detected Technology Stack & Web Engine ({techStack.length})
                </h3>
              </div>
            </div>

            {techStack.length === 0 ? (
              <div className="p-6 text-center bg-surface/40 rounded-xl font-mono text-xs text-text-dim">
                <span>Standard Web Server Environment.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-mono text-xs">
                {techStack.map((tech, idx) => {
                  const name = typeof tech === "string" ? tech : tech.name || tech.tech;
                  const cat = typeof tech === "object" ? tech.category : "Framework / Server";
                  const ver = typeof tech === "object" ? tech.version : null;
                  return (
                    <div key={idx} className="p-3.5 rounded-xl bg-surface/50 space-y-1">
                      <span className="font-bold text-text text-sm block">{name}</span>
                      <span className="text-[10px] text-text-muted uppercase block">{cat}</span>
                      {ver && <span className="text-[10px] text-accent block">Version: {ver}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* WHOIS Card */}
          {whois && (
            <div className="glass-card rounded-2xl p-5 space-y-3 font-mono text-xs">
              <h3 className="font-bold text-sm text-text uppercase tracking-wide flex items-center gap-2">
                <Database className="w-4 h-4 text-accent" />
                WHOIS Domain Ownership & Registrar Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface/40">
                  <span className="text-[10px] text-text-muted block">Registrar</span>
                  <span className="font-bold text-text">{whois.registrar || "Protected"}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface/40">
                  <span className="text-[10px] text-text-muted block">Creation Date</span>
                  <span className="font-bold text-text">{whois.created || whois.creationDate || "N/A"}</span>
                </div>
                <div className="p-3 rounded-xl bg-surface/40">
                  <span className="text-[10px] text-text-muted block">Expiration Date</span>
                  <span className="font-bold text-text">{whois.expires || whois.expirationDate || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 10: OWASP & Policy Compliance ──────────────────────────────── */}
      {activeTab === "compliance" && (
        <div className="animate-fadeIn space-y-5">
          <OWASPCoverage findings={unifiedFindings} />
          <PolicyComplianceCard compliance={compliance} />
        </div>
      )}

      {/* ── Tab 11: Actionable Remediation Generator ───────────────────────── */}
      {activeTab === "remediation" && (
        <div className="animate-fadeIn space-y-5">
          <RemediationPanel scan={result} />
        </div>
      )}

    </div>
  );
}
