"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ScoreGauge from "./ScoreGauge";
import Card from "./Card";
import Badge from "./Badge";
import { runSecurityAudit } from "@/lib/analyzer";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Globe,
  ExternalLink,
  Info,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ListFilter,
  Copy,
  BookOpen,
  CornerDownRight,
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
  Tooltip,
} from "recharts";

export default function ScanResults({ result }) {
  const [mounted, setMounted] = useState(false);
  const [expandedChecks, setExpandedChecks] = useState([]);
  const [remediationTab, setRemediationTab] = useState("nginx");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    url,
    domain,
    score,
    grade,
    headers,
    statusCode,
    scanDuration,
    summary,
    compliance,
    vulnerabilities,
    checks,
  } = result;

  // Fallback check generator for older database records
  let activeChecks = checks;
  if (!activeChecks || activeChecks.length === 0) {
    try {
      const headerMap = {};
      if (headers && Array.isArray(headers)) {
        headers.forEach(h => {
          headerMap[h.name.toLowerCase()] = h.value;
        });
      }
      const audit = runSecurityAudit(headerMap, url, statusCode);
      activeChecks = audit.checks || [];
    } catch (e) {
      console.error("Failed to generate fallback checks:", e);
      activeChecks = [];
    }
  }

  // Filter handlers
  const categoriesList = [
    { id: "all", label: "All Audits" },
    { id: "security-headers", label: "Security Headers" },
    { id: "ssl-tls", label: "SSL/TLS Security" },
    { id: "cookie", label: "Cookies" },
    { id: "cors", label: "CORS Policies" },
    { id: "server-info", label: "Server Disclosures" },
    { id: "vulnerability", label: "Vulnerabilities" },
  ];

  const filteredChecks = activeChecks.filter((c) => {
    if (filterCategory === "all") return true;
    return c.category === filterCategory;
  });

  const toggleCheck = (id) => {
    setExpandedChecks((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Metric counts
  const passedCount = activeChecks.filter(c => c.status === "passed").length;
  const warningCount = activeChecks.filter(c => c.status === "warning").length;
  const failedCount = activeChecks.filter(c => c.status === "failed").length;
  const infoCount = activeChecks.filter(c => c.status === "info" || c.severity === "info").length;
  const criticalCount = activeChecks.filter(c => (c.severity === "critical" || c.severity === "high") && c.status === "failed").length;

  const getSecurityPosture = () => {
    if (score >= 80) return { text: "Strong Protection", variant: "success" };
    if (score >= 60) return { text: "Moderate Risks", variant: "accent" };
    if (score >= 40) return { text: "Weak Safeguards", variant: "warning" };
    return { text: "Critical Deficiencies", variant: "danger" };
  };

  const posture = getSecurityPosture();

  const getStatusBadge = (status) => {
    if (status === "passed") return { text: "PASSED", variant: "success" };
    if (status === "warning") return { text: "WARNING", variant: "warning" };
    if (status === "info") return { text: "INFO", variant: "outline" };
    return { text: "FAILED", variant: "danger" };
  };

  const getSeverityBadgeVariant = (severity) => {
    if (severity === "critical" || severity === "high") return "danger";
    if (severity === "medium") return "warning";
    if (severity === "info") return "outline";
    return "success";
  };

  // Recharts Pie Chart Data (Passed vs Warnings vs Failed)
  const pieData = [
    { name: "Passed", value: passedCount, color: "#10b981" },
    { name: "Warnings", value: warningCount, color: "#f59e0b" },
    { name: "Failed", value: failedCount, color: "#ef4444" },
  ].filter(d => d.value > 0);

  // Recharts Severity Bar Chart Data
  const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  activeChecks.forEach(c => {
    if (severityCounts[c.severity] !== undefined) {
      severityCounts[c.severity]++;
    }
  });

  const barData = [
    { name: "Critical", count: severityCounts.critical, fill: "#ef4444" },
    { name: "High", count: severityCounts.high, fill: "#f97316" },
    { name: "Medium", count: severityCounts.medium, fill: "#f59e0b" },
    { name: "Low", count: severityCounts.low, fill: "#10b981" },
    { name: "Info", count: severityCounts.info, fill: "#3b82f6" },
  ];

  return (
    <div className="space-y-8 font-sans max-w-5xl mx-auto text-text">
      {/* Overview Block */}
      <Card glow className="bg-surface border border-white/[0.05]">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
          <div className="flex-shrink-0">
            <ScoreGauge score={score} grade={grade} domain={domain} />
          </div>

          <div className="flex-1 w-full space-y-4 text-center md:text-left">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center md:justify-start">
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-lg font-bold text-text hover:text-accent transition-colors group font-mono"
                >
                  <span>{domain}</span>
                  <ExternalLink className="h-4.5 w-4.5 text-text-muted group-hover:text-accent transition-colors" />
                </Link>
                <div className="inline-flex justify-center">
                  <Badge variant={posture.variant}>
                    {posture.text}
                  </Badge>
                </div>
              </div>
              <p className="text-text-dim text-xs mt-1">
                Audited Endpoint: <span className="font-mono text-accent-light">{url}</span>
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 px-3.5 bg-bg/50 rounded-xl border border-white/[0.03]">
              <div className="text-center">
                <p className="text-xl font-bold font-mono text-success">{passedCount}</p>
                <p className="text-[9px] text-text-dim uppercase tracking-wider font-semibold mt-0.5">Passed Checks</p>
              </div>
              <div className="text-center relative">
                <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-white/5" />
                <p className="text-xl font-bold font-mono text-warning">{warningCount}</p>
                <p className="text-[9px] text-text-dim uppercase tracking-wider font-semibold mt-0.5">Warnings</p>
              </div>
              <div className="text-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-white/5" />
                <p className="text-xl font-bold font-mono text-danger">{criticalCount}</p>
                <p className="text-[9px] text-text-dim uppercase tracking-wider font-semibold mt-0.5">Critical/High</p>
              </div>
              <div className="text-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-white/5" />
                <p className="text-xl font-bold font-mono text-accent">{infoCount}</p>
                <p className="text-[9px] text-text-dim uppercase tracking-wider font-semibold mt-0.5">Info Findings</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-dim font-mono">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                {statusCode && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4 w-4 text-accent/70" />
                    <span>HTTP {statusCode}</span>
                  </span>
                )}
                {scanDuration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent/70" />
                    <span>{scanDuration}ms duration</span>
                  </span>
                )}
              </div>
              <div className="text-[10px] text-text-muted">
                Scan timestamp: {new Date(result.createdAt || Date.now()).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Analytics Visualizations */}
      {mounted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Pie Chart */}
          <Card className="p-5 border border-white/[0.05]">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider pb-3 border-b border-white/[0.05] mb-4">
              Passed vs Failed Status Share
            </h3>
            <div className="flex items-center justify-center h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#16161a", 
                      borderColor: "rgba(255,255,255,0.08)",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold font-mono text-text">
                  {Math.round((passedCount / (activeChecks.length || 1)) * 100)}%
                </span>
                <span className="text-[9px] text-text-dim uppercase tracking-wider font-semibold">Passed Ratio</span>
              </div>
            </div>
            {/* Chart Legend */}
            <div className="flex justify-center gap-5 text-[10px] font-bold uppercase tracking-wider mt-2">
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-success" /><span>Passed ({passedCount})</span></div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-warning" /><span>Warnings ({warningCount})</span></div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-danger" /><span>Failed ({failedCount})</span></div>
            </div>
          </Card>

          {/* Bar Chart */}
          <Card className="p-5 border border-white/[0.05]">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider pb-3 border-b border-white/[0.05] mb-4">
              Audit Findings Severity Profile
            </h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
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
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                    cursor={{ fill: "rgba(255,255,255,0.02)" }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-[9px] text-text-dim uppercase tracking-wider mt-2.5">
              Findings distribution across strict security categories
            </p>
          </Card>
        </div>
      )}

      {/* Compliance Frameworks Section */}
      {compliance && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-accent/10">
              <ShieldCheck className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text uppercase tracking-wider">Regulatory Compliance Evaluations</h3>
              <p className="text-[9px] text-text-dim uppercase tracking-wide">Verification parameters against security frameworks</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(compliance).map(([key, val]) => {
              if (key === "GDDR") return null;
              const isCompliant = val?.compliant ?? false;
              return (
                <Card key={key} className="bg-surface/50 border border-white/[0.04] p-4.5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-text uppercase tracking-wider">{key.replace("_", " ")}</span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isCompliant 
                            ? "bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                            : "bg-danger shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                        }`}
                      />
                    </div>
                    <p className="text-[10px] text-text-dim leading-relaxed">
                      {val?.recommendation || "System security framework guidelines."}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-white/[0.05] flex justify-between items-center text-[9px] uppercase font-bold tracking-wider">
                    <span className="text-text-muted">Status</span>
                    <span className={isCompliant ? "text-success" : "text-danger"}>
                      {isCompliant ? "Compliant" : "Deficient"}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Main Audit Findings and Filter Panel */}
      <section className="space-y-4">
        {/* Category Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-3">
          <div className="flex items-center gap-2">
            <ListFilter className="h-4.5 w-4.5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-wider text-text">Audit Findings ({filteredChecks.length})</span>
          </div>

          <div className="flex overflow-x-auto gap-1 bg-surface border border-white/[0.05] p-0.5 rounded-lg max-w-full scrollbar-hide">
            {categoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFilterCategory(cat.id)}
                className={`text-[9px] font-bold px-3 py-1 rounded transition-all uppercase tracking-wider whitespace-nowrap ${
                  filterCategory === cat.id
                    ? "bg-accent/15 text-accent border border-accent/20"
                    : "text-text-dim hover:text-text border border-transparent"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Checks Accordion */}
        <div className="space-y-3.5">
          {filteredChecks.length === 0 ? (
            <Card className="text-center py-12 text-xs text-text-dim italic border-white/[0.04]">
              No checks match the selected category filter.
            </Card>
          ) : (
            filteredChecks.map((check) => {
              const isExpanded = expandedChecks.includes(check.id);
              const statusBadge = getStatusBadge(check.status);
              const severityVariant = getSeverityBadgeVariant(check.severity);

              // Check if it's a security header to render the deployment code guide
              const isSecurityHeaderCategory = check.category === "security-headers";
              const cleanHeaderName = check.title.replace(" Security Header Check", "");
              const snippetText = isSecurityHeaderCategory 
                ? getRemediationSnippets(cleanHeaderName.toLowerCase(), check.recommendation)[remediationTab] 
                : null;

              return (
                <div 
                  key={check.id} 
                  className="bg-surface border border-white/[0.04] rounded-xl overflow-hidden transition-all duration-200"
                >
                  {/* Row Trigger */}
                  <div
                    onClick={() => toggleCheck(check.id)}
                    className="flex items-center justify-between px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-white/[0.01] transition-colors duration-200"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          check.status === "passed" ? "bg-success" : 
                          check.status === "warning" ? "bg-warning" : "bg-danger"
                        }`}
                      />
                      <div className="truncate">
                        <span className="text-xs sm:text-sm font-semibold font-mono text-text truncate block">
                          {check.title}
                        </span>
                        <span className="text-[8px] text-text-muted uppercase tracking-wider font-sans mt-0.5 block">
                          Category: {check.category.replace("-", " ")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={severityVariant} className="hidden sm:inline-flex text-[8px] py-0.5 px-1.5 uppercase">
                        {check.severity} Risk
                      </Badge>
                      <Badge variant={statusBadge.variant} className="text-[8px] py-0.5 px-1.5">
                        {statusBadge.text}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="h-4.5 w-4.5 text-text-muted" />
                      ) : (
                        <ChevronDown className="h-4.5 w-4.5 text-text-muted" />
                      )}
                    </div>
                  </div>

                  {/* Accordion Expandable Panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2.5 space-y-4 bg-white/[0.01] border-t border-white/[0.03] animate-fadeInUp">
                      
                      {/* Description & Impact */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
                        <div>
                          <strong className="text-text font-bold uppercase tracking-wider text-[9px] block mb-1">
                            Audited Directive Description
                          </strong>
                          <p className="text-text-dim">{check.description}</p>
                        </div>
                        {check.whyItMatters && (
                          <div>
                            <strong className="text-text font-bold uppercase tracking-wider text-[9px] block mb-1">
                              Why It Matters
                            </strong>
                            <p className="text-text-dim">{check.whyItMatters}</p>
                          </div>
                        )}
                      </div>

                      {/* Evidence & Actionable Fix */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {check.evidence && (
                          <div className="bg-bg/60 rounded-lg p-3.5 border border-white/[0.03]">
                            <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                              Audit Evidence / Value Found
                            </p>
                            <code className="text-[11px] text-text break-all font-mono whitespace-pre-wrap">
                              {check.evidence}
                            </code>
                          </div>
                        )}

                        <div className="bg-accent/5 rounded-lg p-3.5 border border-accent/10">
                          <p className="text-[9px] font-bold text-accent uppercase tracking-wider mb-1.5">
                            Fix Recommendation
                          </p>
                          <p className="text-xs text-text-dim leading-relaxed mb-2">
                            {check.recommendation}
                          </p>
                          {check.references && check.references.length > 0 && (
                            <div className="pt-2 border-t border-accent/10 space-y-1">
                              <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider block">Documentation References</span>
                              {check.references.map((r, ri) => (
                                <a 
                                  key={ri} 
                                  href={r} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-accent hover:underline text-[10px] flex items-center gap-1.5 font-mono truncate"
                                >
                                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                  <span>{r}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Configuration Guide for Security Headers */}
                      {isSecurityHeaderCategory && snippetText && (
                        <div className="pt-3 border-t border-white/[0.04]">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                            <span className="text-[9px] font-bold text-text uppercase tracking-wider flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5 text-accent" />
                              <span>SaaS Config Deployment Guide:</span>
                            </span>
                            <div className="flex flex-wrap gap-1 bg-bg/50 border border-white/[0.05] rounded-md p-0.5">
                              {["nginx", "apache", "nextjs", "iis", "cloudflare"].map((tab) => (
                                <button
                                  key={tab}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRemediationTab(tab);
                                  }}
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all uppercase tracking-wider ${
                                    remediationTab === tab
                                      ? "bg-accent/15 text-accent border border-accent/25"
                                      : "text-text-dim hover:text-text border border-transparent"
                                  }`}
                                >
                                  {tab === "nextjs" ? "NextJS" : tab}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="bg-bg/75 border border-white/[0.03] rounded-lg p-3.5 relative group min-h-[60px]">
                            <CopyConfigButton text={snippetText} />
                            <pre className="text-xs text-accent-light/95 font-mono break-all whitespace-pre-wrap overflow-x-auto leading-relaxed pt-1.5">
                              {snippetText}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Fallback info when checks matches empty */}
      {activeChecks.length === 0 && (
        <Card className="p-5 border border-white/[0.05] text-xs text-text-dim text-center">
          <Info className="h-5 w-5 mx-auto text-accent mb-2" />
          <p>This report contains no detailed audit checks. Verify backend logs if scans fail repeatedly.</p>
        </Card>
      )}
    </div>
  );
}

function CopyConfigButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2.5 right-2.5 text-[9px] font-bold border rounded-lg px-2.5 py-1.5 transition-all ${
        copied
          ? "bg-success/15 border-success/30 text-success"
          : "bg-surface border-white/[0.05] text-text-muted hover:text-accent hover:border-accent/30 opacity-0 group-hover:opacity-100 focus:opacity-100"
      }`}
    >
      {copied ? "COPIED" : "COPY CONFIG"}
    </button>
  );
}

function getRemediationSnippets(headerKey, recommendationText) {
  const val = "configured-value";
  const name = headerKey.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
  
  switch(headerKey.toLowerCase()) {
    case "content-security-policy":
      return {
        nginx: `add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; base-uri 'self';" always;`,
        apache: `Header always set Content-Security-Policy "default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; base-uri 'self';"`,
        nextjs: `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n          {\n            key: 'Content-Security-Policy',\n            value: "default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; base-uri 'self';",\n          }\n        ]\n      }\n    ]\n  }\n}`,
        iis: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; base-uri 'self';" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
        cloudflare: `Create a Transform Rule under Rules > Transform Rules > Modify Response Header:\n- Header Name: Content-Security-Policy\n- Value: default-src 'self'; script-src 'self' https://trusted-cdn.com; object-src 'none'; base-uri 'self';`
      };
    case "strict-transport-security":
      return {
        nginx: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;`,
        apache: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"`,
        nextjs: `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n          {\n            key: 'Strict-Transport-Security',\n            value: "max-age=31536000; includeSubDomains; preload",\n          }\n        ]\n      }\n    ]\n  }\n}`,
        iis: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains; preload" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
        cloudflare: `Enable HSTS directly in SSL/TLS > Edge Certificates > HTTP Strict Transport Security (HSTS).`
      };
    case "x-frame-options":
      return {
        nginx: `add_header X-Frame-Options "DENY" always;`,
        apache: `Header always set X-Frame-Options "DENY"`,
        nextjs: `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n          {\n            key: 'X-Frame-Options',\n            value: "DENY",\n          }\n        ]\n      }\n    ]\n  }\n}`,
        iis: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="X-Frame-Options" value="DENY" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
        cloudflare: `Modify Response Header Rules:\n- Header Name: X-Frame-Options\n- Value: DENY`
      };
    case "x-content-type-options":
      return {
        nginx: `add_header X-Content-Type-Options "nosniff" always;`,
        apache: `Header always set X-Content-Type-Options "nosniff"`,
        nextjs: `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n          {\n            key: 'X-Content-Type-Options',\n            value: "nosniff",\n          }\n        ]\n      }\n    ]\n  }\n}`,
        iis: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="X-Content-Type-Options" value="nosniff" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
        cloudflare: `Modify Response Header Rules:\n- Header Name: X-Content-Type-Options\n- Value: nosniff`
      };
    case "referrer-policy":
      return {
        nginx: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
        apache: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
        nextjs: `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n          {\n            key: 'Referrer-Policy',\n            value: "strict-origin-when-cross-origin",\n          }\n        ]\n      }\n    ]\n  }\n}`,
        iis: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
        cloudflare: `Modify Response Header Rules:\n- Header Name: Referrer-Policy\n- Value: strict-origin-when-cross-origin`
      };
    case "permissions-policy":
      return {
        nginx: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;`,
        apache: `Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"`,
        nextjs: `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n          {\n            key: 'Permissions-Policy',\n            value: "camera=(), microphone=(), geolocation=()",\n          }\n        ]\n      }\n    ]\n  }\n}`,
        iis: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="Permissions-Policy" value="camera=(), microphone=(), geolocation=()" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
        cloudflare: `Modify Response Header Rules:\n- Header Name: Permissions-Policy\n- Value: camera=(), microphone=(), geolocation=()`
      };
    default:
      return {
        nginx: `add_header ${name} "${val}" always;`,
        apache: `Header always set ${name} "${val}"`,
        nextjs: `// next.config.js\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n          {\n            key: '${name}',\n            value: "${val}",\n          }\n        ]\n      }\n    ]\n  }\n}`,
        iis: `<system.webServer>\n  <httpProtocol>\n    <customHeaders>\n      <add name="${name}" value="${val}" />\n    </customHeaders>\n  </httpProtocol>\n</system.webServer>`,
        cloudflare: `Modify Response Header Rules:\n- Header Name: ${name}\n- Value: ${val}`
      };
  }
}
