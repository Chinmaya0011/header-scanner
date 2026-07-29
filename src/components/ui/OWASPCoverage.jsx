"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Info, ExternalLink } from "lucide-react";

const OWASP_CATEGORIES = [
  {
    id: "A01",
    code: "A01:2021",
    title: "Broken Access Control",
    desc: "Restrictions on what authenticated users are allowed to do are not properly enforced. Attackers can exploit these flaws to access unauthorized functionality, data, or admin portals.",
    keywords: ["access", "permission", "cors", "origin", "admin", "privilege", "authorization"]
  },
  {
    id: "A02",
    code: "A02:2021",
    title: "Cryptographic Failures",
    desc: "Failures related to cryptography (or lack thereof), leading to exposure of sensitive data like credentials, payment info, or session tokens in transit.",
    keywords: ["ssl", "tls", "hsts", "https", "certificate", "crypto", "encryption", "cipher"]
  },
  {
    id: "A03",
    code: "A03:2021",
    title: "Injection & Cross-Site Scripting (XSS)",
    desc: "Hostile data sent to an interpreter as part of a command or query. XSS occurs when web applications include untrusted data without proper validation or escaping.",
    keywords: ["csp", "content-security-policy", "xss", "injection", "script", "framing", "clickjacking"]
  },
  {
    id: "A04",
    code: "A04:2021",
    title: "Insecure Design & Architecture",
    desc: "Focuses on risks related to design and architectural flaws. Call for more use of threat modeling, secure design patterns, and reference architectures.",
    keywords: ["privacy", "policy", "consent", "design", "architecture"]
  },
  {
    id: "A05",
    code: "A05:2021",
    title: "Security Misconfiguration",
    desc: "Includes missing security hardening across web server HTTP headers, default configurations, open cloud storage, or overly permissive settings.",
    keywords: ["header", "x-frame-options", "x-content-type-options", "server", "referrer-policy", "permissions-policy", "banner"]
  },
  {
    id: "A06",
    code: "A06:2021",
    title: "Vulnerable & Outdated Components",
    desc: "Using software modules, libraries, or frameworks with known security vulnerabilities that can compromise the application environment.",
    keywords: ["tech", "version", "framework", "component", "outdated", "wappalyzer"]
  },
  {
    id: "A07",
    code: "A07:2021",
    title: "Identification & Authentication Failures",
    desc: "Confirmation of the user's identity, session management, or credential protection is flawed, allowing attackers to compromise passwords or session tokens.",
    keywords: ["cookie", "httponly", "secure", "samesite", "session", "jwt", "auth", "login"]
  },
  {
    id: "A08",
    code: "A08:2021",
    title: "Software & Data Integrity Failures",
    desc: "Relates to code and infrastructure that does not protect against integrity violations, such as untrusted CDN scripts or unvalidated updates.",
    keywords: ["sri", "integrity", "subresource", "signature", "checksum"]
  },
  {
    id: "A09",
    code: "A09:2021",
    title: "Security Logging & Monitoring Failures",
    desc: "Failure to log, monitor, or report email authentication policies, domain spoofing records, or anomalous events in real-time.",
    keywords: ["dmarc", "spf", "email", "logging", "monitor", "reporting", "mta-sts"]
  },
  {
    id: "A10",
    code: "A10:2021",
    title: "Server-Side Request Forgery (SSRF)",
    desc: "Occurs when a web application fetches a remote resource without validating the user-supplied URL, allowing requests to internal infrastructure.",
    keywords: ["ssrf", "dns", "subdomain", "zone", "port", "service", "exposure"]
  },
];

export default function OWASPCoverage({ findings = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  const coverageMap = useMemo(() => {
    return OWASP_CATEGORIES.map(cat => {
      const matched = findings.filter(f => {
        const text = `${f.title || ''} ${f.category || ''} ${f.description || ''} ${f.evidence || ''}`.toLowerCase();
        return cat.keywords.some(kw => text.includes(kw));
      });

      const failedCount = matched.filter(m => m.status === "failed" || m.status === "weak").length;
      const warningCount = matched.filter(m => m.status === "warning").length;
      const passedCount = matched.filter(m => m.status === "passed").length;

      let status = "passed";
      if (failedCount > 0) status = "failed";
      else if (warningCount > 0) status = "warning";
      else if (matched.length === 0) status = "clear";

      return {
        ...cat,
        status,
        matched,
        failedCount,
        warningCount,
        passedCount,
        totalChecked: matched.length
      };
    });
  }, [findings]);

  const passedCategories = coverageMap.filter(c => c.status === "passed" || c.status === "clear").length;
  const coveragePercent = Math.round((passedCategories / OWASP_CATEGORIES.length) * 100);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h3 className="font-bold text-sm text-text uppercase tracking-wide">
              OWASP Top 10 Full Security Matrix (2021 Benchmark)
            </h3>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Click any OWASP category below to inspect exact findings, descriptions, and evaluated rules
          </p>
        </div>

        {/* Coverage Stat Pill */}
        <div className="flex items-center gap-3 bg-panel/60 rounded-xl px-3.5 py-2 shrink-0">
          <div className="text-right">
            <div className="text-[10px] text-text-muted uppercase font-bold tracking-wider">OWASP Score</div>
            <div className="text-sm font-mono font-bold text-accent">{coveragePercent}% Compliant</div>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs text-text bg-accent/10">
            {passedCategories}/10
          </div>
        </div>
      </div>

      {/* Grid of OWASP Categories */}
      <div className="space-y-2.5">
        {coverageMap.map(cat => {
          const isExpanded = expandedId === cat.id;
          let badgeColor = "bg-success/10 text-success";
          let Icon = CheckCircle2;

          if (cat.status === "failed") {
            badgeColor = "bg-danger/10 text-danger";
            Icon = ShieldAlert;
          } else if (cat.status === "warning") {
            badgeColor = "bg-warning/10 text-warning";
            Icon = AlertTriangle;
          }

          return (
            <div
              key={cat.id}
              className="rounded-xl bg-surface/40 overflow-hidden transition-all duration-200"
            >
              {/* Summary Bar */}
              <div
                onClick={() => toggleExpand(cat.id)}
                className="flex items-center justify-between gap-3 p-3.5 cursor-pointer hover:bg-white/[0.015] select-none"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${cat.status === 'failed' ? 'text-danger' : cat.status === 'warning' ? 'text-warning' : 'text-success'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-accent-light shrink-0">{cat.code}</span>
                      <span className="text-xs font-bold text-text truncate">{cat.title}</span>
                    </div>
                    <p className="text-[11px] text-text-dim truncate mt-0.5 font-mono">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase border ${badgeColor}`}>
                    {cat.status === "failed" ? "Vulnerabilities Found" : cat.status === "warning" ? "Warnings" : "Compliant"}
                  </span>
                  <div className="text-text-muted">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Drawer */}
              {isExpanded && (
                <div className="p-4 bg-panel/40 border-t border-border/30 space-y-3 font-sans text-xs animate-fadeIn">
                  <div className="p-3 rounded-lg bg-surface/60 border border-border/40">
                    <span className="text-[10px] font-mono font-bold text-accent uppercase tracking-wider block mb-1">
                      OWASP Risk Definition & Scope
                    </span>
                    <p className="text-xs text-text leading-relaxed">{cat.desc}</p>
                  </div>

                  {/* List of Matched Security Checks */}
                  <div>
                    <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block mb-2">
                      Evaluated Security Checks ({cat.matched.length})
                    </span>

                    {cat.matched.length === 0 ? (
                      <div className="p-3 rounded-lg bg-surface/40 text-text-dim font-mono text-xs text-center">
                        ✓ No active vulnerability findings detected for this OWASP vector.
                      </div>
                    ) : (
                      <div className="space-y-2 font-mono">
                        {cat.matched.map((item, i) => (
                          <div key={i} className="p-3 rounded-lg bg-surface/60 border border-border/30 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-text text-xs">{item.title}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                item.status === 'passed' ? 'bg-success/10 border-success/30 text-success' :
                                item.status === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-danger/10 border-danger/30 text-danger'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="text-[11px] font-sans text-text-dim leading-relaxed">{item.description}</p>
                            {item.evidence && (
                              <div className="p-2 rounded bg-[#030a08] text-[10px] text-text-dim truncate select-all">
                                Evidence: {item.evidence}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
