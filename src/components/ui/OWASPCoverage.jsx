"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp } from "lucide-react";

const OWASP_CATEGORIES = [
  {
    id: "A01",
    code: "A01:2021",
    title: "Broken Access Control",
    desc: "Enforcement of authenticated access controls across API endpoints, CORS origins, and admin portals.",
    keywords: ["access", "permission", "cors", "origin", "admin", "privilege", "authorization"]
  },
  {
    id: "A02",
    code: "A02:2021",
    title: "Cryptographic Failures",
    desc: "Evaluation of TLS/SSL certificate trust, ciphers, HSTS enforcement, and transit encryption.",
    keywords: ["ssl", "tls", "hsts", "https", "certificate", "crypto", "encryption", "cipher"]
  },
  {
    id: "A03",
    code: "A03:2021",
    title: "Injection & XSS",
    desc: "Content Security Policy (CSP), framing restrictions, and untrusted script execution guards.",
    keywords: ["csp", "content-security-policy", "xss", "injection", "script", "framing", "clickjacking"]
  },
  {
    id: "A04",
    code: "A04:2021",
    title: "Insecure Design",
    desc: "Assessment of security design controls, privacy headers, and defensive architecture patterns.",
    keywords: ["privacy", "policy", "consent", "design", "architecture"]
  },
  {
    id: "A05",
    code: "A05:2021",
    title: "Security Misconfiguration",
    desc: "Missing HTTP security response headers, server banner disclosures, and permissive parameters.",
    keywords: ["header", "x-frame-options", "x-content-type-options", "server", "referrer-policy", "permissions-policy", "banner"]
  },
  {
    id: "A06",
    code: "A06:2021",
    title: "Vulnerable Components",
    desc: "Detection of outdated framework versions, web server banners, and vulnerable software stacks.",
    keywords: ["tech", "version", "framework", "component", "outdated", "wappalyzer"]
  },
  {
    id: "A07",
    code: "A07:2021",
    title: "Authentication Failures",
    desc: "Cookie hardening attributes (HttpOnly, Secure, SameSite) and exposed login surfaces.",
    keywords: ["cookie", "httponly", "secure", "samesite", "session", "jwt", "auth", "login"]
  },
  {
    id: "A08",
    code: "A08:2021",
    title: "Software & Data Integrity",
    desc: "Subresource Integrity (SRI) checks and integrity verification of external CDN resources.",
    keywords: ["sri", "integrity", "subresource", "signature", "checksum"]
  },
  {
    id: "A09",
    code: "A09:2021",
    title: "Logging & Monitoring",
    desc: "Email authentication records (SPF, DMARC, MTA-STS) and domain security reporting configurations.",
    keywords: ["dmarc", "spf", "email", "logging", "monitor", "reporting", "mta-sts"]
  },
  {
    id: "A10",
    code: "A10:2021",
    title: "Server-Side Request Forgery",
    desc: "Exposed network ports, open TCP services, and unvalidated internal resource fetching.",
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

      let status = "passed";
      if (failedCount > 0) status = "failed";
      else if (warningCount > 0) status = "warning";

      return {
        ...cat,
        status,
        matched,
        failedCount,
        warningCount,
        totalChecked: matched.length
      };
    });
  }, [findings]);

  const passedCategories = coverageMap.filter(c => c.status === "passed").length;
  const coveragePercent = Math.round((passedCategories / OWASP_CATEGORIES.length) * 100);

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="glass-card p-4 space-y-4 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
            <h3 className="font-bold text-xs text-text uppercase tracking-wide whitespace-nowrap">
              OWASP Top 10 Security Matrix (2021 Benchmark)
            </h3>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Evaluated security rules mapped directly to OWASP vulnerability categories
          </p>
        </div>

        <div className="inline-flex items-center gap-2 bg-panel border border-border px-3 py-1.5 rounded font-mono text-xs shrink-0 whitespace-nowrap">
          <span className="text-text-muted uppercase text-[10px]">Score:</span>
          <span className="font-bold text-accent">{coveragePercent}% Compliant</span>
          <span className="text-text-muted">({passedCategories}/10)</span>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-1.5">
        {coverageMap.map(cat => {
          const isExpanded = expandedId === cat.id;
          const isFailed = cat.status === "failed";
          const isWarning = cat.status === "warning";

          return (
            <div key={cat.id} className="border border-border rounded bg-panel/40 overflow-hidden">
              <div
                onClick={() => toggleExpand(cat.id)}
                className="flex items-center justify-between p-2.5 cursor-pointer hover:bg-panel/70 transition-colors select-none gap-2"
              >
                <div className="inline-flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono font-bold text-xs text-accent-light shrink-0 whitespace-nowrap">{cat.code}</span>
                  <span className="text-xs font-semibold text-text truncate min-w-0">{cat.title}</span>
                </div>

                <div className="inline-flex items-center gap-2 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 whitespace-nowrap ${
                    isFailed ? "badge-critical" : isWarning ? "badge-medium" : "badge-passed"
                  }`}>
                    {isFailed ? `${cat.failedCount} At Risk` : isWarning ? "Warning" : "Passed"}
                  </span>
                  <div className="text-text-muted shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 bg-surface border-t border-border space-y-2 text-xs font-sans">
                  <p className="text-text-dim leading-relaxed font-mono text-[11px]">{cat.desc}</p>
                  
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-mono uppercase text-text-muted font-bold block whitespace-nowrap">
                      Evaluated Checks ({cat.matched.length})
                    </span>
                    {cat.matched.length === 0 ? (
                      <p className="text-xs text-text-dim font-mono">No active findings detected for this category.</p>
                    ) : (
                      cat.matched.map((item, idx) => (
                        <div key={idx} className="p-2 rounded bg-panel border border-border flex items-center justify-between gap-2 font-mono text-[11px]">
                          <span className="text-text font-medium truncate min-w-0">{item.title}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 whitespace-nowrap ${
                            item.status === 'passed' ? 'badge-passed' : 'badge-critical'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      ))
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
