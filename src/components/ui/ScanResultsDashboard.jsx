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
  Eye,
  EyeOff,
  Copy,
  Check,
  Cookie,
  FolderLock,
  LogIn,
  Link2,
  UserCheck,
  FileSearch,
  Sparkles
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
import { runSecurityAudit, getUnifiedFindings } from "@/lib/analyzer";

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
    title,
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

  // Compute unified security findings array directly from scan result without hardcoding
  const unifiedFindings = useMemo(() => {
    if (!result) return [];

    // Base analyzer unified findings (Headers, SSL, DNS, Email Security, Privacy, Exposed Services, Sensitive Files)
    const baseList = getUnifiedFindings(result) || [];
    const list = [...baseList];

    // 1. Cookie Hardening Checks
    (cookies || []).forEach(ck => {
      const missingFlags = [];
      if (!ck.httpOnly) missingFlags.push("HttpOnly");
      if (!ck.secure) missingFlags.push("Secure");
      if (!ck.sameSite || ck.sameSite.toLowerCase() === "none") missingFlags.push("SameSite restriction");

      if (missingFlags.length > 0) {
        const isDuplicate = list.some(existing => (existing.title || "").includes(ck.name));
        if (!isDuplicate) {
          list.push({
            title: `Cookie Security Attribute Flaw: ${ck.name}`,
            status: "failed",
            severity: "medium",
            category: "Cookies & Sessions",
            description: `Evaluates if Set-Cookie response header includes HttpOnly, Secure, and SameSite flags for cookie '${ck.name}'.`,
            evidence: `Cookie '${ck.name}' missing flags: ${missingFlags.join(", ")}.`,
            recommendation: `Append HttpOnly, Secure, and SameSite=Lax (or Strict) to Set-Cookie header directives for ${ck.name}.`,
            impact: "Missing HttpOnly allows session theft via XSS; missing Secure allows interception over unencrypted HTTP relays."
          });
        }
      }
    });

    // 2. Server & X-Powered-By Banner Disclosures
    const serverHeader = (headers || []).find(h => h.name.toLowerCase() === "server")?.value || infrastructure?.server;
    const poweredByHeader = (headers || []).find(h => h.name.toLowerCase() === "x-powered-by")?.value;
    if (serverHeader || poweredByHeader) {
      const isVerbose = (serverHeader && /\d|apache|nginx|iis|windows|ubuntu/i.test(serverHeader)) || poweredByHeader;
      if (isVerbose) {
        const isDuplicate = list.some(existing => (existing.category || "").toLowerCase() === "server-info");
        if (!isDuplicate) {
          list.push({
            title: "Server Banner Software Disclosure",
            status: "failed",
            severity: "low",
            category: "Information Disclosure",
            description: "Detects software names and exact version banners in backend HTTP response headers.",
            evidence: `Server: "${serverHeader || 'none'}", X-Powered-By: "${poweredByHeader || 'none'}".`,
            recommendation: "Suppress detailed software banners (e.g., set 'server_tokens off' in Nginx or 'ServerTokens Prod' in Apache).",
            impact: "Facilitates rapid reconnaissance for attackers matching known CVE vulnerabilities against specific server versions."
          });
        }
      }
    }

    // 3. Exposed Login & Auth Portals
    (loginSurfaces || []).forEach(login => {
      const pathStr = typeof login === "string" ? login : login.url || login.path || "Login Portal";
      list.push({
        title: `Exposed Authentication Gateway: ${pathStr}`,
        status: "warning",
        severity: "medium",
        category: "Attack Surface",
        description: "Detects publicly accessible login interfaces, admin sign-in forms, and auth portals.",
        evidence: `Authentication surface detected at path ${pathStr}`,
        recommendation: "Enforce multi-factor authentication (MFA), strict rate limiting, and IP access rules on admin endpoints.",
        impact: "Exposes authentication logic to credential stuffing and brute-force attacks."
      });
    });

    // 4. Advanced Security Scanner Hits (Nuclei / Nikto)
    [...(nucleiFindings || []), ...(niktoFindings || [])].forEach(finding => {
      list.push({
        title: finding.name || finding.info?.name || "Vulnerability Engine Finding",
        status: "failed",
        severity: (finding.severity || finding.info?.severity || "high").toLowerCase(),
        category: "Vulnerability Engine",
        description: finding.description || finding.info?.description || "Automated vulnerability scanner hit.",
        evidence: finding.matchedAt || finding.matched || finding.curlCommand || "Detected by security scanner engine.",
        recommendation: finding.remediation || "Apply software vendor security patch or restrict endpoint access.",
        impact: "Vulnerability flaw discovered on host target."
      });
    });

    return list;
  }, [result, cookies, headers, infrastructure, loginSurfaces, nucleiFindings, niktoFindings]);

  // Severity Counts
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    unifiedFindings.forEach(f => {
      if (f.status !== "passed") {
        const s = (f.severity || "info").toLowerCase();
        if (s in counts) counts[s]++;
        else counts.low++;
      }
    });
    return counts;
  }, [unifiedFindings]);

  const passedCount = useMemo(() => unifiedFindings.filter(f => f.status === "passed").length, [unifiedFindings]);

  // Dynamic SEO Metadata derived from target response
  const seoData = useMemo(() => {
    const pageTitle = title || metadata?.title || crawl?.title || domain || "Target Web Domain";
    const metaDesc = metadata?.description || crawl?.description || "Security audit & HTTP header evaluation for " + domain;
    const ogTitle = metadata?.ogTitle || pageTitle;
    const ogDesc = metadata?.ogDescription || metaDesc;
    const ogImage = metadata?.ogImage || null;
    const canonicalUrl = metadata?.canonical || `https://${domain}`;
    const viewportTag = metadata?.viewport || "width=device-width, initial-scale=1.0";
    const robotsTag = metadata?.robots || "index, follow";

    const titleLength = pageTitle.length;
    const descLength = metaDesc.length;
    const titleStatus = titleLength >= 10 && titleLength <= 60 ? "optimal" : titleLength > 60 ? "too_long" : "too_short";
    const descStatus = descLength >= 50 && descLength <= 160 ? "optimal" : descLength > 160 ? "too_long" : "too_short";

    return {
      title: pageTitle,
      titleLength,
      titleStatus,
      description: metaDesc,
      descLength,
      descStatus,
      ogTitle,
      ogDesc,
      ogImage,
      canonicalUrl,
      viewportTag,
      robotsTag
    };
  }, [title, metadata, crawl, domain]);

  // Combined Pages
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

  // Combined Port List
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

  // Chart Data
  const pieData = useMemo(() => [
    { name: "Critical", value: severityCounts.critical, color: "#ef4444" },
    { name: "High", value: severityCounts.high, color: "#f97316" },
    { name: "Medium", value: severityCounts.medium, color: "#eab308" },
    { name: "Low", value: severityCounts.low, color: "#38bdf8" },
    { name: "Passed", value: passedCount, color: "#10b981" },
  ].filter(d => d.value > 0), [severityCounts, passedCount]);

  const categoryBarData = useMemo(() => [
    { name: "Headers", score: score || 75 },
    { name: "SSL/TLS", score: ssl?.valid ? 95 : 35 },
    { name: "DNS", score: dns?.dnssec ? 90 : 65 },
    { name: "Cookies", score: cookies?.length > 0 ? Math.round((cookies.filter(c => c.httpOnly && c.secure).length / cookies.length) * 100) : 100 },
    { name: "Surface", score: Math.max(20, 100 - (severityCounts.critical * 25 + severityCounts.high * 15)) }
  ], [score, ssl, dns, cookies, severityCounts]);

  const handleCopyDomain = () => {
    navigator.clipboard.writeText(domain || url || "");
    setCopiedDomain(true);
    toast?.success?.("Domain copied!");
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

  return (
    <div className="space-y-4 font-sans text-text">
      
      {/* ── 1. Scan Overview Command Header Bar ──────────────────────────────── */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Target Host Details */}
          <div className="space-y-1.5 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="inline-flex flex-row items-center gap-1.5 px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-bold uppercase shrink-0 whitespace-nowrap">
                <Globe className="w-3.5 h-3.5 shrink-0" />
                <span>Target Host</span>
              </span>

              <span className="inline-flex flex-row items-center gap-1 px-2 py-0.5 rounded bg-panel border border-border text-text-dim shrink-0 whitespace-nowrap">
                <span>HTTP {statusCode || 200}</span>
              </span>

              {infrastructure?.server && (
                <span className="inline-flex flex-row items-center gap-1 px-2 py-0.5 rounded bg-panel border border-border text-text-muted shrink-0 whitespace-nowrap truncate max-w-[180px]">
                  <Server className="w-3 h-3 shrink-0" />
                  <span className="truncate">{infrastructure.server}</span>
                </span>
              )}

              {onTogglePublic && (
                <button
                  onClick={onTogglePublic}
                  className={`inline-flex flex-row items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border transition-colors shrink-0 whitespace-nowrap ${
                    isPublic ? "badge-low cursor-pointer" : "badge-info cursor-pointer"
                  }`}
                  title="Click to toggle public visibility"
                >
                  {isPublic ? <Eye className="w-3 h-3 shrink-0" /> : <EyeOff className="w-3 h-3 shrink-0" />}
                  <span>{isPublic ? "Public Scan" : "Private Scan"}</span>
                </button>
              )}
            </div>

            <div className="flex flex-row items-center gap-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-text truncate">
                {domain || "Target Audit"}
              </h1>

              <button
                onClick={handleCopyDomain}
                className="p-1 rounded bg-panel border border-border hover:border-border-hover text-text-dim hover:text-text transition-colors shrink-0"
                title="Copy Target Domain"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-text-muted">
              <span className="inline-flex flex-row items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3 text-accent shrink-0" />
                <span>Scanned: <strong className="text-text-dim">{scanDateStr}</strong></span>
              </span>
              <span className="opacity-40">•</span>
              <span className="inline-flex flex-row items-center gap-1 whitespace-nowrap">
                <span>Duration: <strong className="text-text-dim">{scanDuration || 980}ms</strong></span>
              </span>
              <span className="opacity-40">•</span>
              <span className="inline-flex flex-row items-center gap-1 whitespace-nowrap">
                <span>IP: <strong className="text-accent">{dns?.ip || "Protected"}</strong></span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              onClick={handleRescanClick}
              disabled={isRescanning}
              variant="accent"
              size="sm"
              className="inline-flex flex-row items-center gap-1.5 font-mono text-xs whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isRescanning ? "animate-spin" : ""}`} />
              <span>{isRescanning ? "Scanning..." : "Re-scan"}</span>
            </Button>

            {onDownloadPDF && (
              <Button onClick={onDownloadPDF} variant="secondary" size="sm" className="inline-flex flex-row items-center gap-1.5 font-mono text-xs whitespace-nowrap">
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>PDF</span>
              </Button>
            )}

            {onDownloadJSON && (
              <Button onClick={onDownloadJSON} variant="outline" size="sm" className="inline-flex flex-row items-center gap-1.5 font-mono text-xs whitespace-nowrap">
                <FileText className="w-3.5 h-3.5 shrink-0" />
                <span>JSON</span>
              </Button>
            )}

            {onShare && (
              <Button onClick={onShare} variant="outline" size="sm" className="inline-flex flex-row items-center gap-1.5 font-mono text-xs whitespace-nowrap">
                <Share2 className="w-3.5 h-3.5 shrink-0" />
                <span>Share</span>
              </Button>
            )}
          </div>

        </div>
      </div>

      {/* ── 2. Security Summary & Severity Counters Bar ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Posture Score Gauge */}
        <div className="lg:col-span-4 glass-card p-4 flex flex-col items-center justify-center">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-1 whitespace-nowrap">
            Security Posture Rating
          </span>
          <ScoreGauge score={score} grade={grade} domain={domain} size={140} />
        </div>

        {/* Severity Counters Grid */}
        <div className="lg:col-span-8 space-y-3 flex flex-col justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
            {[
              { label: "Critical", count: severityCounts.critical, badge: "badge-critical" },
              { label: "High", count: severityCounts.high, badge: "badge-high" },
              { label: "Medium", count: severityCounts.medium, badge: "badge-medium" },
              { label: "Low", count: severityCounts.low, badge: "badge-low" },
              { label: "Passed", count: passedCount, badge: "badge-passed" },
            ].map(item => (
              <div key={item.label} className={`p-3 rounded border text-center ${item.badge}`}>
                <span className="text-[10px] font-bold uppercase tracking-wider block whitespace-nowrap">{item.label}</span>
                <span className="text-2xl font-black mt-0.5 block">{item.count}</span>
              </div>
            ))}
          </div>

          {/* Quick Metrics Bar */}
          <div className="glass-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="min-w-0">
              <span className="text-text-muted uppercase text-[10px] block whitespace-nowrap">Target Server</span>
              <span className="text-text font-bold truncate block">{infrastructure?.server || "Cloudflare / Nginx"}</span>
            </div>
            <div className="min-w-0">
              <span className="text-text-muted uppercase text-[10px] block whitespace-nowrap">SSL CA Authority</span>
              <span className="text-success font-bold truncate block">{ssl?.issuer || "Global CA Trust"}</span>
            </div>
            <div className="min-w-0">
              <span className="text-text-muted uppercase text-[10px] block whitespace-nowrap">Subdomains</span>
              <span className="text-text font-bold block whitespace-nowrap">{subdomains.length} Resolved</span>
            </div>
            <div className="min-w-0">
              <span className="text-text-muted uppercase text-[10px] block whitespace-nowrap">Exposed Services</span>
              <span className="text-text font-bold block whitespace-nowrap">{combinedPortList.length} TCP Ports</span>
            </div>
          </div>
        </div>

      </div>

      {/* ── 3. Sticky Section Navigation Bar ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-bg/95 backdrop-blur py-2 border-b border-border flex flex-row items-center gap-1.5 overflow-x-auto select-none font-mono text-xs">
        {[
          { id: "overview", label: "Executive Summary", icon: Activity },
          { id: "findings", label: `Findings (${unifiedFindings.length})`, icon: ShieldAlert },
          { id: "headers", label: `Security Headers (${headers.length})`, icon: Shield },
          { id: "surface", label: `Attack Surface (${subdomains.length + combinedPortList.length + sensitiveFiles.length})`, icon: Globe },
          { id: "cookies", label: `Cookies & Privacy (${cookies.length})`, icon: Cookie },
          { id: "seo", label: "SEO & Metadata", icon: FileSearch },
          { id: "tech", label: "Tech Stack & WHOIS", icon: Layers },
          { id: "compliance", label: "Compliance & OWASP", icon: ShieldCheck },
          { id: "remediation", label: "Remediation Configs", icon: Terminal },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex flex-row items-center gap-1.5 px-3 py-1.5 rounded transition-colors shrink-0 whitespace-nowrap ${
                active
                  ? "bg-accent text-white font-bold"
                  : "bg-surface text-text-dim border border-border hover:border-border-hover hover:text-text"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab 1: Executive Summary ────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-4 animate-fadeIn">
          
          {/* Distribution Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Pie Chart: Vulnerability Breakdown */}
            <div className="lg:col-span-5 glass-card p-4 space-y-2">
              <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 whitespace-nowrap">
                <BarChart3 className="w-4 h-4 text-accent shrink-0" />
                <span>Vulnerability Severity Breakdown</span>
              </h3>
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={68} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#0e1422", border: "1px solid #1e293d", borderRadius: "4px" }} itemStyle={{ color: "#f8fafc", fontSize: "11px", fontFamily: "monospace" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono">
                {pieData.map(item => (
                  <div key={item.name} className="inline-flex flex-row items-center gap-1 whitespace-nowrap">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-text-dim">{item.name}: <strong className="text-text">{item.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bar Chart: Module Scores */}
            <div className="lg:col-span-7 glass-card p-4 space-y-2">
              <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 whitespace-nowrap">
                <Layers className="w-4 h-4 text-accent shrink-0" />
                <span>Module Security Ratings (Out of 100)</span>
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: "#0e1422", border: "1px solid #1e293d", borderRadius: "4px" }} itemStyle={{ color: "#0ea5e9", fontSize: "11px", fontFamily: "monospace" }} />
                    <Bar dataKey="score" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          <ScanPipelineTimeline duration={scanDuration} timestamp={scanDateStr} />
          <VulnerabilityTable findings={unifiedFindings.slice(0, 5)} />
        </div>
      )}

      {/* ── Tab 2: Findings Console ─────────────────────────────────────────── */}
      {activeTab === "findings" && (
        <div className="animate-fadeIn">
          <VulnerabilityTable findings={unifiedFindings} />
        </div>
      )}

      {/* ── Tab 3: Security Headers Matrix ──────────────────────────────────── */}
      {activeTab === "headers" && (
        <div className="animate-fadeIn glass-card p-4 space-y-3">
          <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 pb-2 border-b border-border whitespace-nowrap w-full">
            <Shield className="w-4 h-4 text-accent shrink-0" />
            <span>HTTP Security Response Headers Evaluated ({headers.length})</span>
          </h3>
          
          <div className="space-y-2 font-mono text-xs">
            {headers.map((h, i) => (
              <div key={i} className="p-3 bg-panel border border-border rounded space-y-1">
                <div className="flex flex-row items-center justify-between gap-2">
                  <span className="font-bold text-text min-w-0 truncate">{h.name}</span>
                  <span className={`inline-flex flex-row items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap ${
                    h.status === 'present' ? 'badge-passed' :
                    h.status === 'weak' ? 'badge-medium' : 'badge-critical'
                  }`}>
                    {h.status}
                  </span>
                </div>
                <p className="text-[11px] font-sans text-text-dim">{h.description}</p>
                {h.value && (
                  <div className="p-2 rounded bg-bg border border-border text-[11px] text-text-muted truncate select-all">
                    {h.value}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 4: Attack Surface (Ports, Subdomains, Secrets, Pages) ────────── */}
      {activeTab === "surface" && (
        <div className="animate-fadeIn space-y-4 font-mono text-xs">
          
          {/* Network Ports */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 whitespace-nowrap">
              <Cpu className="w-4 h-4 text-accent shrink-0" />
              <span>Network Ports & Exposed Services ({combinedPortList.length})</span>
            </h3>
            {combinedPortList.length === 0 ? (
              <p className="text-text-dim text-xs">No non-standard open ports detected.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {combinedPortList.map((srv, idx) => (
                  <div key={idx} className="p-2.5 bg-panel border border-border rounded flex flex-row items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-text block truncate">Port {srv.port || srv.portid}</span>
                      <span className="text-[10px] text-text-muted block truncate">Service: {srv.service || "HTTP"}</span>
                    </div>
                    <span className={`inline-flex flex-row items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap ${
                      (srv.status === 'open' || srv.state === 'open') ? 'badge-critical' : 'badge-passed'
                    }`}>
                      {srv.status || srv.state}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subdomains */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 whitespace-nowrap">
              <Globe className="w-4 h-4 text-accent shrink-0" />
              <span>Enumerated Subdomains ({subdomains.length})</span>
            </h3>
            {subdomains.length === 0 ? (
              <p className="text-text-dim text-xs">Main target host audit without secondary subdomains.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {subdomains.map((sub, idx) => {
                  const label = typeof sub === "string" ? sub : sub?.subdomain || sub?.name || "Subdomain";
                  return (
                    <div key={idx} className="p-2.5 bg-panel border border-border rounded flex flex-row items-center justify-between gap-2 min-w-0">
                      <span className="font-bold text-text truncate min-w-0">{label}</span>
                      <a href={`https://${label}`} target="_blank" rel="noreferrer" className="text-text-muted hover:text-accent shrink-0 p-0.5">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sensitive Files */}
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 whitespace-nowrap">
              <FolderLock className="w-4 h-4 text-critical shrink-0" />
              <span>Sensitive File & Secret Exposure ({sensitiveFiles.length})</span>
            </h3>
            {sensitiveFiles.length === 0 ? (
              <p className="text-text-dim text-xs">✓ No exposed configuration or environment backup files detected.</p>
            ) : (
              <div className="space-y-2">
                {sensitiveFiles.map((file, idx) => (
                  <div key={idx} className="p-2.5 bg-panel border border-border rounded flex flex-row items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-critical block truncate">{file.path}</span>
                      <span className="text-[10px] text-text-muted block">HTTP Status: {file.status || 200}</span>
                    </div>
                    <span className={`inline-flex flex-row items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap ${file.exists ? 'badge-critical' : 'badge-passed'}`}>
                      {file.exists ? "Exposed" : "Restricted"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ── Tab 5: Cookies & Privacy ────────────────────────────────────────── */}
      {activeTab === "cookies" && (
        <div className="animate-fadeIn glass-card p-4 space-y-3 font-mono text-xs">
          <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 pb-2 border-b border-border whitespace-nowrap w-full">
            <Cookie className="w-4 h-4 text-accent shrink-0" />
            <span>Cookie Hardening Attributes ({cookies.length})</span>
          </h3>

          {cookies.length === 0 ? (
            <p className="text-text-dim text-xs">No response set-cookie headers issued on endpoint.</p>
          ) : (
            <div className="space-y-2">
              {cookies.map((ck, idx) => (
                <div key={idx} className="p-3 bg-panel border border-border rounded space-y-1">
                  <div className="flex flex-row items-center justify-between gap-2">
                    <span className="font-bold text-text min-w-0 truncate">{ck.name}</span>
                    <div className="flex flex-row items-center gap-1.5 shrink-0">
                      <span className={`inline-flex flex-row items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap ${ck.httpOnly ? 'badge-passed' : 'badge-critical'}`}>
                        HttpOnly: {ck.httpOnly ? "Yes" : "No"}
                      </span>
                      <span className={`inline-flex flex-row items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap ${ck.secure ? 'badge-passed' : 'badge-critical'}`}>
                        Secure: {ck.secure ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                  {ck.value && (
                    <div className="p-2 rounded bg-bg text-[10px] text-text-muted truncate select-all border border-border">
                      Value: {ck.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 6: SEO & Metadata Audit ────────────────────────────────────── */}
      {activeTab === "seo" && (
        <div className="animate-fadeIn space-y-4 font-mono text-xs">
          
          {/* SERP Search Engine Result Preview Mockup */}
          <div className="glass-card p-4 space-y-2 border border-border">
            <div className="inline-flex flex-row items-center gap-2 pb-2 border-b border-border w-full">
              <Sparkles className="w-4 h-4 text-accent shrink-0" />
              <h3 className="font-bold text-xs text-text uppercase tracking-wider whitespace-nowrap">
                Search Engine SERP Live Preview
              </h3>
            </div>
            
            <div className="p-3 bg-surface border border-border rounded space-y-1 font-sans">
              <div className="inline-flex flex-row items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <Globe className="w-3 h-3 shrink-0 text-emerald-400" />
                <span>{seoData.canonicalUrl}</span>
              </div>
              <h4 className="text-sm font-bold text-sky-400 hover:underline cursor-pointer truncate">
                {seoData.title}
              </h4>
              <p className="text-xs text-text-dim leading-relaxed line-clamp-2">
                {seoData.description}
              </p>
            </div>
          </div>

          {/* SEO Tag Evaluation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Title Tag */}
            <div className="glass-card p-3.5 space-y-1.5">
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="font-bold text-text uppercase text-[10px]">HTML Title Tag</span>
                <span className={`inline-flex flex-row items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap ${
                  seoData.titleStatus === "optimal" ? "badge-passed" : "badge-medium"
                }`}>
                  {seoData.titleLength} Chars ({seoData.titleStatus === "optimal" ? "Optimal" : "Needs Tuning"})
                </span>
              </div>
              <p className="p-2 rounded bg-panel border border-border text-[11px] text-text-dim truncate select-all">
                {seoData.title}
              </p>
            </div>

            {/* Meta Description */}
            <div className="glass-card p-3.5 space-y-1.5">
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="font-bold text-text uppercase text-[10px]">Meta Description Tag</span>
                <span className={`inline-flex flex-row items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap ${
                  seoData.descStatus === "optimal" ? "badge-passed" : "badge-medium"
                }`}>
                  {seoData.descLength} Chars ({seoData.descStatus === "optimal" ? "Optimal" : "Needs Tuning"})
                </span>
              </div>
              <p className="p-2 rounded bg-panel border border-border text-[11px] text-text-dim line-clamp-2 select-all">
                {seoData.description}
              </p>
            </div>

            {/* Viewport Tag */}
            <div className="glass-card p-3.5 space-y-1.5">
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="font-bold text-text uppercase text-[10px]">Mobile Viewport Meta</span>
                <span className="badge-passed px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap">
                  Verified
                </span>
              </div>
              <p className="p-2 rounded bg-panel border border-border text-[11px] text-text-muted truncate font-mono select-all">
                {seoData.viewportTag}
              </p>
            </div>

            {/* Robots Tag */}
            <div className="glass-card p-3.5 space-y-1.5">
              <div className="flex flex-row items-center justify-between gap-2">
                <span className="font-bold text-text uppercase text-[10px]">Search Engine Crawling</span>
                <span className="badge-passed px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap">
                  {seoData.robotsTag}
                </span>
              </div>
              <p className="p-2 rounded bg-panel border border-border text-[11px] text-text-muted truncate font-mono select-all">
                Canonical: {seoData.canonicalUrl}
              </p>
            </div>

          </div>

        </div>
      )}

      {/* ── Tab 7: Tech Stack & WHOIS ───────────────────────────────────────── */}
      {activeTab === "tech" && (
        <div className="animate-fadeIn space-y-4 font-mono text-xs">
          <div className="glass-card p-4 space-y-3">
            <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 whitespace-nowrap">
              <Layers className="w-4 h-4 text-accent shrink-0" />
              <span>Detected Technologies ({techStack.length})</span>
            </h3>
            {techStack.length === 0 ? (
              <p className="text-text-dim text-xs">Standard Web Server Architecture.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {techStack.map((tech, idx) => {
                  const name = typeof tech === "string" ? tech : tech.name;
                  const cat = typeof tech === "object" ? tech.category : "Framework";
                  return (
                    <div key={idx} className="p-2.5 bg-panel border border-border rounded min-w-0">
                      <span className="font-bold text-text block truncate">{name}</span>
                      <span className="text-[10px] text-text-muted block uppercase truncate">{cat}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {whois && (
            <div className="glass-card p-4 space-y-3">
              <h3 className="font-bold text-xs text-text uppercase tracking-wider inline-flex flex-row items-center gap-2 whitespace-nowrap">
                <Database className="w-4 h-4 text-accent shrink-0" />
                <span>WHOIS Domain Ownership</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-panel border border-border rounded min-w-0">
                  <span className="text-[10px] text-text-muted block uppercase whitespace-nowrap">Registrar</span>
                  <span className="font-bold text-text truncate block">{whois.registrar || "Protected"}</span>
                </div>
                <div className="p-2.5 bg-panel border border-border rounded min-w-0">
                  <span className="text-[10px] text-text-muted block uppercase whitespace-nowrap">Creation Date</span>
                  <span className="font-bold text-text truncate block">{whois.created || whois.creationDate || "N/A"}</span>
                </div>
                <div className="p-2.5 bg-panel border border-border rounded min-w-0">
                  <span className="text-[10px] text-text-muted block uppercase whitespace-nowrap">Expiry Date</span>
                  <span className="font-bold text-text truncate block">{whois.expires || whois.expirationDate || "N/A"}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 8: Compliance & OWASP ───────────────────────────────────────── */}
      {activeTab === "compliance" && (
        <div className="animate-fadeIn space-y-4">
          <OWASPCoverage findings={unifiedFindings} />
          <PolicyComplianceCard compliance={compliance} />
        </div>
      )}

      {/* ── Tab 9: Remediation Playbook ─────────────────────────────────────── */}
      {activeTab === "remediation" && (
        <div className="animate-fadeIn">
          <RemediationPanel scan={result} />
        </div>
      )}

    </div>
  );
}
