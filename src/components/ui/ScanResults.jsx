"use client";

import { useState } from "react";
import Link from "next/link";
import ScoreGauge from "./ScoreGauge";
import ImprovementGuideModal from "@/components/modals/ImprovementGuideModal";
import Card from "./Card";
import Badge from "./Badge";
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
} from "lucide-react";

export default function ScanResults({ result }) {
  const [showSummaryPopup, setShowSummaryPopup] = useState(false);
  const [expandedHeaders, setExpandedHeaders] = useState([]);
  const [remediationTab, setRemediationTab] = useState("nginx");

  const { url, domain, score, grade, headers, statusCode, scanDuration, summary, compliance, vulnerabilities } = result;

  const getSecurityPosture = () => {
    if (!headers || headers.length === 0) {
      return { text: "Unknown", variant: "info" };
    }
    const percentage = ((summary?.present || 0) / headers.length) * 100;
    if (percentage >= 80) return { text: "Strong", variant: "success" };
    if (percentage >= 60) return { text: "Moderate", variant: "accent" };
    if (percentage >= 40) return { text: "Weak", variant: "warning" };
    return { text: "Critical", variant: "danger" };
  };

  const posture = getSecurityPosture();

  const toggleHeader = (index) => {
    setExpandedHeaders((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const getSeverityBadgeVariant = (severity) => {
    if (severity === "critical" || severity === "high") return "danger";
    if (severity === "medium") return "warning";
    return "success";
  };

  const getStatusBadge = (status) => {
    if (status === "present") return { text: "Present", variant: "success" };
    if (status === "weak") return { text: "Weak", variant: "warning" };
    return { text: "Missing", variant: "danger" };
  };

  const coveragePct =
    headers && headers.length > 0
      ? Math.round(((summary?.present || 0) / headers.length) * 100)
      : 0;

  // Normalize compliance keys to format properly if backend sends alternative formats
  const complianceData = compliance || {
    GDPR: { compliant: false, recommendation: "HSTS, CSP, Referrer-Policy" },
    "PCI-DSS": { compliant: false, recommendation: "HSTS, X-Frame-Options, X-Content-Type-Options" },
    OWASP: { compliant: false, recommendation: "CSP, X-Frame-Options, X-Content-Type-Options, HSTS" },
    NIST: { compliant: false, recommendation: "HSTS, CSP, X-Frame-Options" },
  };

  return (
    <div className="space-y-6 font-sans max-w-4xl mx-auto text-text">
      {/* Overview Card */}
      <Card glow className="bg-surface/60 border border-border">
        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start">
          <div className="flex-shrink-0">
            <ScoreGauge score={score} grade={grade} domain={domain} />
          </div>

          <div className="flex-1 w-full space-y-4 text-center sm:text-left">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 justify-center sm:justify-start">
                <Link
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-lg font-bold text-text hover:text-accent transition-colors group font-mono"
                >
                  <span>{domain}</span>
                  <ExternalLink className="h-4 w-4 text-text-muted group-hover:text-accent transition-colors" />
                </Link>
                <div className="inline-flex justify-center">
                  <Badge variant={posture.variant}>
                    {posture.text} posture
                  </Badge>
                </div>
              </div>
              <p className="text-text-dim text-xs mt-1">
                Security response headers audit status
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-4 divide-x divide-border/60 border-y border-border/60 py-3.5 bg-panel/20 rounded-lg">
              <StatItem label="Present" value={summary?.present || 0} color="text-success" />
              <StatItem label="Weak" value={summary?.weak || 0} color="text-warning" />
              <StatItem label="Missing" value={summary?.missing || 0} color="text-danger" />
              <StatItem label="Coverage" value={`${coveragePct}%`} color="text-accent" />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-text-dim">
              <div className="flex items-center justify-center sm:justify-start gap-4">
                {statusCode && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Globe className="h-4 w-4 text-accent/70" />
                    <span>HTTP {statusCode}</span>
                  </span>
                )}
                {scanDuration && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-accent/70" />
                    <span>{scanDuration}ms response</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowSummaryPopup(true)}
                className="flex items-center justify-center gap-1 text-accent hover:text-accent-light font-bold transition-colors"
              >
                <Info className="h-4 w-4" />
                <span>Security Recommendations</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Compliance Frameworks */}
      <section className="space-y-3">
        <SectionTitle icon={ShieldCheck} title="Compliance Audits" desc="Evaluation against industry standard regulations" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Object.entries(complianceData).map(([key, val]) => {
            if (key === "GDDR") return null; // Avoid duplicated GDPR item if sent by backend
            const isCompliant = val?.compliant ?? false;
            return (
              <Card key={key} className="border border-border/80 bg-surface/50 flex flex-col justify-between p-4.5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-text uppercase tracking-wider">{key}</span>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isCompliant ? "bg-success shadow-[0_0_8px_var(--success)]" : "bg-danger shadow-[0_0_8px_var(--danger)]"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] text-text-dim leading-relaxed">
                    {val?.recommendation || "Framework requirements"}
                  </p>
                </div>
                <div className="mt-4 pt-2 border-t border-border/40 flex justify-between items-center">
                  <span className="text-[10px] uppercase font-semibold text-text-muted">Target status</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isCompliant ? "text-success" : "text-danger"
                    }`}
                  >
                    {isCompliant ? "Compliant" : "Deficient"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Extended Vulnerability Audits */}
      {vulnerabilities && vulnerabilities.length > 0 && (
        <section className="space-y-3">
          <SectionTitle
            icon={ShieldAlert}
            title="Extended Vulnerability Audits"
            desc={`${vulnerabilities.length} security vulnerability indicators flagged`}
          />
          <div className="space-y-3">
            {vulnerabilities.map((vuln) => (
              <Card key={vuln.id} className="border border-border/80 bg-surface/50 p-4.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/40">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 rounded bg-danger/10">
                      <AlertTriangle className={`h-4.5 w-4.5 ${
                        vuln.severity === "critical" || vuln.severity === "high"
                          ? "text-danger"
                          : vuln.severity === "medium"
                          ? "text-warning"
                          : "text-accent"
                      }`} />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-text">{vuln.name}</h4>
                      <p className="text-[10px] text-text-dim mt-0.5 uppercase font-semibold tracking-wider">
                        Category: <span className="text-accent">{vuln.category}</span>
                      </p>
                    </div>
                  </div>
                  <Badge variant={getSeverityBadgeVariant(vuln.severity)} className="text-[9px] uppercase self-start sm:self-auto">
                    {vuln.severity} Risk
                  </Badge>
                </div>
                
                <div className="mt-3.5 space-y-3 text-xs leading-relaxed">
                  <div>
                    <strong className="text-text-dim block mb-1">Vulnerability Description</strong>
                    <p className="text-text-muted">{vuln.description}</p>
                  </div>
                  <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                    <strong className="text-accent block mb-1">Fix Recommendation</strong>
                    <p className="text-text-dim">{vuln.recommendation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Header Lists */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle
            icon={CheckCircle2}
            title="Detailed Audit Metrics"
            desc={`${headers?.length || 0} response headers evaluated`}
          />
          <Badge variant="accent">
            {headers?.filter((h) => h.status === "present").length || 0} / {headers?.length || 0} secure
          </Badge>
        </div>

        <div className="border border-border bg-surface/40 rounded-xl divide-y divide-border overflow-hidden">
          {headers?.map((header, index) => {
            const isExpanded = expandedHeaders.includes(index);
            const statusBadge = getStatusBadge(header.status);
            const severityVariant = getSeverityBadgeVariant(header.severity);
            const snippetText = getRemediationSnippets(header.name.toLowerCase(), header.expectedFormat)[remediationTab];

            return (
              <div key={header.name} className="transition-all duration-200">
                <div
                  className="flex items-center justify-between px-4 sm:px-5 py-3.5 cursor-pointer hover:bg-panel/40 transition-colors"
                  onClick={() => toggleHeader(index)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleHeader(index);
                    }
                  }}
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                        header.severity === "critical" || header.severity === "high"
                          ? "bg-danger"
                          : header.severity === "medium"
                          ? "bg-warning"
                          : "bg-success"
                      }`}
                    />
                    <span className="text-xs sm:text-sm font-semibold font-mono text-text truncate">
                      {header.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3.5 flex-shrink-0">
                    <Badge variant={severityVariant} className="hidden sm:inline-flex text-[9px] py-0">
                      {header.severity}
                    </Badge>
                    <Badge variant={statusBadge.variant} className="text-[9px] py-0">
                      {statusBadge.text}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4.5 w-4.5 text-text-muted" />
                    ) : (
                      <ChevronDown className="h-4.5 w-4.5 text-text-muted" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-4 bg-panel/10 border-t border-border/40 animate-fadeInUp">
                    {header.description && (
                      <div className="text-xs text-text-dim leading-relaxed">
                        <strong className="text-text block mb-1">Security Risk Explanation</strong>
                        {header.description}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {header.value && (
                        <div className="bg-bg/85 rounded-lg p-3 border border-border">
                          <p className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1">
                            Current Header Value
                          </p>
                          <code className="text-xs text-text break-all font-mono">{header.value}</code>
                        </div>
                      )}
                      {header.recommendation && (
                        <div className="bg-accent/5 rounded-lg p-3 border border-accent/20">
                          <p className="text-[9px] font-bold text-accent uppercase tracking-wider mb-1">
                            Remediation Advice
                          </p>
                          <p className="text-xs text-text-dim leading-relaxed">{header.recommendation}</p>
                          {header.expectedFormat && (
                            <div className="mt-2 pt-2 border-t border-accent/10">
                              <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider">Target Format</span>
                              <code className="block text-[10px] text-accent mt-0.5 break-all font-mono">{header.expectedFormat}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Implementation Configuration Guides */}
                    <div className="pt-3 border-t border-border/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] font-bold text-text uppercase tracking-wider">
                          SaaS Deployment & Configuration Guide
                        </span>
                        <div className="flex flex-wrap gap-1 bg-surface border border-border/80 rounded-md p-0.5">
                          {["nginx", "apache", "nextjs", "iis", "cloudflare"].map((tab) => (
                            <button
                              key={tab}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRemediationTab(tab);
                              }}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all uppercase tracking-wider ${
                                remediationTab === tab
                                  ? "bg-accent text-white"
                                  : "text-text-dim hover:text-text hover:bg-panel/30"
                              }`}
                            >
                              {tab === "nextjs" ? "Next.js" : tab}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="bg-bg/95 border border-border/80 rounded-lg p-3.5 relative group min-h-[60px]">
                        <CopyConfigButton text={snippetText} />
                        <pre className="text-xs text-accent-light/90 font-mono break-all whitespace-pre-wrap overflow-x-auto">
                          {snippetText}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Improvement Modal */}
      <ImprovementGuideModal
        isOpen={showSummaryPopup}
        onClose={() => setShowSummaryPopup(false)}
        summary={summary}
      />
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
      className={`absolute top-3 right-3 text-[10px] font-semibold border rounded-md px-2.5 py-1.5 transition-all ${
        copied
          ? "bg-success/20 border-success/30 text-success"
          : "bg-surface/80 border-border text-text-muted hover:text-accent hover:border-accent/40 opacity-0 group-hover:opacity-100 focus:opacity-100"
      }`}
    >
      {copied ? "Copied!" : "Copy Snippet"}
    </button>
  );
}

function getRemediationSnippets(headerKey, expectedValue) {
  const val = expectedValue || "configured-value";
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

function StatItem({ label, value, color }) {
  return (
    <div className="text-center px-1">
      <p className={`text-lg sm:text-xl font-bold font-mono ${color}`}>{value}</p>
      <p className="text-[9px] text-text-dim uppercase tracking-wider mt-0.5 font-sans font-semibold">{label}</p>
    </div>
  );
}

function SectionTitle({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-center gap-2">
      <div className="p-1 rounded bg-accent/10">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div>
        <h3 className="text-xs font-bold text-text uppercase tracking-wider">{title}</h3>
        {desc && <p className="text-[10px] text-text-dim">{desc}</p>}
      </div>
    </div>
  );
}
