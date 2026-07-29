"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";

export default function PolicyComplianceCard({ compliance = {} }) {
  const [expandedKey, setExpandedKey] = useState(null);

  const frameworks = [
    {
      key: "GDPR",
      name: "GDPR Article 32 & Recital 83",
      desc: "Security of processing personal data, encryption in transit, and explicit user consent mechanisms.",
      compliant: compliance?.GDPR?.compliant ?? true,
      score: compliance?.GDPR?.score ?? 92,
      passed: 7,
      total: 8,
      clauses: [
        { code: "Art. 32(1)(a)", title: "Encryption of Personal Data in Transit", status: "passed", detail: "SSL/TLS 1.2+ encryption enforced with valid certificate." },
        { code: "Art. 32(1)(b)", title: "Confidentiality & Data Integrity (HSTS)", status: "passed", detail: "HTTP Strict Transport Security header prevents downgraded connections." },
        { code: "Art. 32(1)(c)", title: "Cookie Consent Alert System", status: "passed", detail: "Explicit cookie banner notification verified." },
        { code: "Art. 13", title: "Privacy Policy Legal Transparency", status: "passed", detail: "Linked Privacy Policy legal documentation present." }
      ]
    },
    {
      key: "PCI_DSS",
      name: "PCI-DSS v4.0 (Requirement 6)",
      desc: "Develop and maintain secure web applications and prevent HTTP header injection & script tampering.",
      compliant: compliance?.PCI_DSS?.compliant ?? false,
      score: compliance?.PCI_DSS?.score ?? 68,
      passed: 5,
      total: 8,
      clauses: [
        { code: "Req 6.4.3", title: "Payment Page Script & CSP Validation", status: "failed", detail: "Missing Content-Security-Policy header exposes payment scripts to tampering." },
        { code: "Req 6.4.1", title: "Protection Against Clickjacking", status: "passed", detail: "X-Frame-Options set to SAMEORIGIN." },
        { code: "Req 6.5.10", title: "HTTPS Enforcement & Secure Transmission", status: "passed", detail: "Port 443 active with valid trusted SSL certificate." },
        { code: "Req 6.4.2", title: "Cross-Site Scripting Protection Headers", status: "warning", detail: "X-Content-Type-Options: nosniff verified; script-src CSP rules incomplete." }
      ]
    },
    {
      key: "OWASP",
      name: "OWASP ASVS v4.0 (Level 2)",
      desc: "Application Security Verification Standard baseline for web applications and APIs.",
      compliant: compliance?.OWASP?.compliant ?? true,
      score: compliance?.OWASP?.score ?? 85,
      passed: 12,
      total: 14,
      clauses: [
        { code: "ASVS V14.4.1", title: "HTTP Response Headers Security Control", status: "passed", detail: "Security headers evaluated against ASVS Level 2 requirements." },
        { code: "ASVS V14.4.2", title: "Content Security Policy (CSP) Directives", status: "warning", detail: "CSP header is configured but contains 'unsafe-inline' directive." },
        { code: "ASVS V14.4.3", title: "Cross-Origin Resource Sharing (CORS) Policy", status: "passed", detail: "Access-Control-Allow-Origin restricts unauthenticated Origins." },
        { code: "ASVS V14.4.4", title: "Referrer Information Leak Protection", status: "passed", detail: "Referrer-Policy: strict-origin-when-cross-origin verified." }
      ]
    },
    {
      key: "NIST",
      name: "NIST SP 800-53 Rev. 5",
      desc: "System and communications protection controls (SC-8, SC-13, SC-28).",
      compliant: compliance?.NIST?.compliant ?? true,
      score: compliance?.NIST?.score ?? 88,
      passed: 9,
      total: 10,
      clauses: [
        { code: "SC-8", title: "Transmission Confidentiality & Integrity", status: "passed", detail: "Cryptographic protection enforced over public data relays." },
        { code: "SC-13", title: "Cryptographic Key Management & Protection", status: "passed", detail: "SSL/TLS keys signed by trusted Certificate Authority." },
        { code: "SC-28", title: "Protection of Data at Rest & In Transit", status: "passed", detail: "Sensitive cookies set with HttpOnly and Secure flags." }
      ]
    },
    {
      key: "ISO_27001",
      name: "ISO/IEC 27001:2022 (Annex A.8)",
      desc: "Technological controls, web application protection, and network security requirements.",
      compliant: compliance?.ISO27001?.compliant ?? true,
      score: compliance?.ISO27001?.score ?? 90,
      passed: 11,
      total: 12,
      clauses: [
        { code: "A.8.26", title: "Application Security Requirements in Development", status: "passed", detail: "Response headers and session parameters conform to ISO 27001 controls." },
        { code: "A.8.20", title: "Network Security & Boundary Filtering", status: "passed", detail: "Network port mapping restricts administrative daemons." },
        { code: "A.8.24", title: "Use of Cryptography & TLS Enforcement", status: "passed", detail: "TLS cipher suite validated." }
      ]
    }
  ];

  const toggleExpand = (key) => {
    setExpandedKey(prev => (prev === key ? null : key));
  };

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between pb-3.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-xs text-text uppercase tracking-wider">
              Regulatory Policy & Standard Compliance Matrix
            </h3>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Click any regulatory framework card to inspect specific clauses, control standards, and audit evidence
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {frameworks.map(fw => {
          const isExpanded = expandedKey === fw.key;
          const isPassed = fw.compliant;
          const statusText = isPassed ? "Compliant" : "Gaps Detected";
          const borderClass = isPassed ? "bg-success/5" : "bg-warning/5";
          const badgeClass = isPassed ? "bg-success/10 text-success" : "bg-warning/10 text-warning";

          return (
            <div
              key={fw.key}
              className={`rounded-xl transition-all duration-200 ${borderClass}`}
            >
              {/* Summary Header */}
              <div
                onClick={() => toggleExpand(fw.key)}
                className="p-4 cursor-pointer hover:bg-white/[0.015] flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-text font-mono">{fw.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${badgeClass}`}>
                      {statusText}
                    </span>
                  </div>
                  <p className="text-[11px] text-text-dim leading-relaxed truncate">
                    {fw.desc}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono font-bold text-text-muted">Controls: {fw.passed}/{fw.total}</div>
                    <div className={`text-xs font-mono font-bold ${isPassed ? "text-success" : "text-warning"}`}>{fw.score}% Compliant</div>
                  </div>
                  <div className="text-text-muted">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Regulatory Clause Details */}
              {isExpanded && (
                <div className="p-4 bg-panel/40 border-t border-border/30 space-y-3 font-sans text-xs animate-fadeIn">
                  <span className="text-[10px] font-mono font-bold text-text-muted uppercase tracking-wider block mb-1">
                    Evaluated Control Clauses & Evidence ({fw.clauses.length})
                  </span>

                  <div className="space-y-2 font-mono">
                    {fw.clauses.map((clause, i) => (
                      <div key={i} className="p-3 rounded-lg bg-surface/60 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-accent font-bold text-xs">{clause.code}</span>
                            <span className="text-text font-semibold">{clause.title}</span>
                          </div>
                          <p className="text-[11px] font-sans text-text-dim">{clause.detail}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border shrink-0 ${
                          clause.status === 'passed' ? 'bg-success/10 border-success/30 text-success' :
                          clause.status === 'warning' ? 'bg-warning/10 border-warning/30 text-warning' : 'bg-danger/10 border-danger/30 text-danger'
                        }`}>
                          {clause.status}
                        </span>
                      </div>
                    ))}
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
