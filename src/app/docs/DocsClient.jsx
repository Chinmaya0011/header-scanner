"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  Cpu,
  Sliders,
  Activity,
  Layers,
  Clock,
  ShieldAlert,
  Terminal,
  HardDrive,
  FileText,
  Flame,
  FileCode,
  Lock,
  UserCheck,
  Key,
  ShieldCheck,
  History,
  FileDown,
  Settings,
  Users,
  Bell,
  HelpCircle,
  Wrench,
  Search,
  ChevronRight,
  ArrowUp,
  ExternalLink
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

// Categories & Sections definitions
const docCategories = [
  {
    name: "Getting Started",
    sections: [
      { id: "project-overview", title: "Project Overview", icon: Compass, desc: "Introduction to HeaderGuard and unified digital attack surface management." },
      { id: "platform-architecture", title: "Platform Architecture", icon: Cpu, desc: "Details on our Next.js App Router and standalone WebSocket setup." },
      { id: "core-features", title: "Core Features", icon: Sliders, desc: "Explore multi-vector scans, AI advice, and automatic timeouts." }
    ]
  },
  {
    name: "Scanner Engine",
    sections: [
      { id: "scanner-engine-details", title: "Scanner Engine", icon: Activity, desc: "Head-to-Get request fallback logic and multi-threaded EASM queries." },
      { id: "supported-scan-types", title: "Supported Scan Types", icon: Layers, desc: "Overview of HTTP headers, SSL/TLS certificates, and DNS records checks." },
      { id: "scan-workflow", title: "Scan Workflow", icon: Clock, desc: "Detailed timeline of scan execution and WebSocket progress dispatching." },
      { id: "security-checks", title: "Security Checks & Rules", icon: ShieldCheck, desc: "Rules for HSTS preload, CSP parameters, and cookie SameSite safety." },
      { id: "attack-surface-analysis", title: "Attack Surface Analysis", icon: Terminal, desc: "Probe subdomains, discover sensitive paths, and map TCP port exposures." }
    ]
  },
  {
    name: "User Console & Scoring",
    sections: [
      { id: "dashboard-overview", title: "Console Dashboard", icon: HardDrive, desc: "Overview of verified assets list, credentials panel, and stats." },
      { id: "scan-results-explanation", title: "Reports & Grading", icon: FileText, desc: "Explain the vulnerability grade scoring, compliance status, and AI advice." },
      { id: "severity-scoring", title: "Weighted Risk Scoring", icon: Flame, desc: "How we compute overall domain grades using category-weighted parameters." }
    ]
  },
  {
    name: "Developer API Integration",
    sections: [
      { id: "api-documentation", title: "API Reference", icon: FileCode, desc: "Securely query domain security postures using HTTP endpoints." },
      { id: "full-redoc", title: "Full Redoc Specs", icon: ExternalLink, desc: "Interactive API Documentation", href: "/redoc", external: true },
      { id: "auth-authorization", title: "API Authentication", icon: Lock, desc: "Pass token credentials via X-API-Key request headers." },
      { id: "roles-permissions", title: "Roles & Permissions", icon: UserCheck, desc: "How permissions divide standard Developer accounts and Administrators." },
      { id: "developer-api-keys", title: "Keys Whitelisting & Locks", icon: Key, desc: "Issue developer credentials, restrict domains, and toggle webhook URLs." }
    ]
  },
  {
    name: "System Support",
    sections: [
      { id: "faq", title: "FAQs", icon: HelpCircle, desc: "Frequently asked questions regarding our EASM and headers audits." },
      { id: "troubleshooting", title: "Troubleshooting Guide", icon: Wrench, desc: "Resolve socket reconnection issues, verify tokens, and check API limit codes." }
    ]
  }
];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("project-overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Flat sections list for indexing
  const allSections = useMemo(() => {
    return docCategories.flatMap(cat => 
      cat.sections.map(sec => ({
        ...sec,
        category: cat.name
      }))
    );
  }, []);

  // Monitor scroll for sidebar spy and top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);

      if (searchQuery.trim() !== "") return;

      const scrollPos = window.scrollY + 180;
      let activeId = "project-overview";

      for (const sec of allSections) {
        const el = document.getElementById(sec.id);
        if (el && scrollPos >= el.offsetTop) {
          activeId = sec.id;
        }
      }
      setActiveSection(activeId);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allSections, searchQuery]);

  const handleSidebarClick = (secId) => {
    setMobileSidebarOpen(false);
    const el = document.getElementById(secId);
    if (el) {
      window.scrollTo({
        top: el.offsetTop - 90,
        behavior: "smooth"
      });
      setActiveSection(secId);
    }
  };

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return allSections;
    const q = searchQuery.toLowerCase().trim();
    return allSections.filter(sec => 
      sec.title.toLowerCase().includes(q) || 
      sec.category.toLowerCase().includes(q) ||
      sec.desc.toLowerCase().includes(q)
    );
  }, [searchQuery, allSections]);

  return (
    <div className="min-h-screen bg-bg font-sans text-text select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* LEFT SIDEBAR COLUMN */}
          <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-bg/95 backdrop-blur-sm border-r border-border p-6 transition-transform duration-300 lg:sticky lg:top-24 lg:z-0 lg:w-auto lg:translate-x-0 lg:border-none lg:p-0 lg:bg-transparent ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:col-span-3"
          }`}>
            {/* Search Box */}
            <div className="relative mb-5">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim/60" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-surface border border-white/[0.05] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-text placeholder:text-text-muted outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 font-medium"
              />
            </div>

            {/* Document Index Navigation */}
            <div className="space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
              {docCategories.map(cat => (
                <div key={cat.name} className="space-y-1">
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider pl-3.5 select-none">{cat.name}</p>
                  <nav className="space-y-0.5">
                    {cat.sections.map(sec => {
                      const Icon = sec.icon;
                      const isSelected = activeSection === sec.id;
                      if (sec.href) {
                        return (
                          <Link
                            key={sec.id}
                            href={sec.href}
                            target={sec.external ? "_blank" : undefined}
                            className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs rounded-lg font-semibold tracking-wide transition-all text-left uppercase text-text-dim hover:text-text hover:bg-white/[0.02] border border-transparent`}
                          >
                            <Icon className="h-4.5 w-4.5 shrink-0 text-text-muted" />
                            <span>{sec.title}</span>
                          </Link>
                        );
                      }

                      return (
                        <button
                          key={sec.id}
                          onClick={() => handleSidebarClick(sec.id)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs rounded-lg font-semibold tracking-wide transition-all text-left uppercase ${
                            isSelected
                              ? "bg-accent/10 text-accent border border-accent/20 font-bold"
                              : "text-text-dim hover:text-text hover:bg-white/[0.02] border border-transparent"
                          }`}
                        >
                          <Icon className={`h-4.5 w-4.5 shrink-0 ${isSelected ? "text-accent animate-pulse" : "text-text-muted"}`} />
                          <span>{sec.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </aside>

          {/* MAIN DOCUMENTATION VIEW */}
          <main className="lg:col-span-9 space-y-16 pb-20 text-left">
            
            {/* Project Overview */}
            <section id="project-overview" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "project-overview") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Compass className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Project Overview</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  <strong>HeaderGuard</strong> is a next-generation External Attack Surface Management (EASM) and security compliance platform. It programmatically maps domain vulnerabilities, audits HTTP header controls, validates transport protocols, and compiles compliance grades to safeguard web infrastructures.
                </p>
                <p>
                  By performing automated, non-invasive threat profiling, HeaderGuard ensures web assets stay locked down against common exploitation vectors (e.g. CSRF script injection, framing hijacks, MitM protocol downgrades).
                </p>
              </div>
            </section>

            {/* Platform Architecture */}
            <section id="platform-architecture" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "platform-architecture") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Cpu className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Platform Architecture</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  HeaderGuard is architected using a decoupled Next.js structure backed by a real-time event pipeline:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Frontend Client:</strong> Built on Next.js 14 App Router, styled using optimized Tailwind CSS sheets for performance and glassmorphism responsive visual grids.</li>
                  <li><strong>WebSocket Event Engine:</strong> Standalone `ws` Node server listening on port 3001, providing live heartbeat ping-pongs and progress status updates.</li>
                  <li><strong>Database Layer:</strong> MongoDB backend storing detailed scan configurations, historical grade reports, verified domains list, and notifications.</li>
                  <li><strong>API Middleware:</strong> Automated sliding rate limit gates and token check verification middlewares checking JWT credentials.</li>
                </ul>
              </div>
            </section>

            {/* Core Features */}
            <section id="core-features" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "core-features") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Sliders className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Core Features</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  Key features configured in the current codebase include:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Multi-Vector Threat Scans:</strong> Inspect HTTP headers, SSL/TLS parameters, SPF/DKIM DNS, and exposed public directories simultaneously.</li>
                  <li><strong>Real-Time Status Pipeline:</strong> Dynamic WebSocket connection logs and progress bars updating as checks resolve.</li>
                  <li><strong>AI Advice Remediation:</strong> Generates code fix guidelines for Nginx, Apache, Next.js, and Cloudflare.</li>
                  <li><strong>Domain Verifier:</strong> Verifies domain asset ownership by checking public text file tokens.</li>
                  <li><strong>Session Timeout Guard:</strong> Automatically logs out inactive browser sessions after 10 minutes of inactivity.</li>
                </ul>
              </div>
            </section>

            {/* Scanner Engine Details */}
            <section id="scanner-engine-details" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "scanner-engine-details") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Activity className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Scanner Engine Details</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  The audit process runs on a dual-handshake system. To fetch HTTP headers, the scanner first fires a `HEAD` request to maximize performance. If the target server restricts HEAD requests or fails to send security flags, the engine automatically falls back to a `GET` request.
                </p>
                <p>
                  For EASM analytics, the scanner maps DNS records, performs TCP connection checks, and crawls public domains for sensitive directory listings concurrently.
                </p>
              </div>
            </section>

            {/* Supported Scan Types */}
            <section id="supported-scan-types" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "supported-scan-types") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Layers className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Supported Scan Types</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>HeaderGuard executes four security audit scopes:</p>
                <ol className="list-decimal list-inside space-y-2 pl-2">
                  <li><strong>HTTP Headers:</strong> Audits CSP, HSTS max-age, X-Frame-Options, Referrer-Policy, and CORS configurations.</li>
                  <li><strong>SSL/TLS Certificates:</strong> Validates certificate expiration, authority trust, and TLS 1.2/1.3 cipher suite compatibility.</li>
                  <li><strong>DNS Zones:</strong> Evaluates anti-phishing SPF, DKIM, and DMARC TXT configurations.</li>
                  <li><strong>Ports & Exposures:</strong> Identifies exposed sensitive directories (e.g. `.env`, `.git`), audits `robots.txt` paths, and maps TCP connections.</li>
                </ol>
              </div>
            </section>

            {/* Scan Workflow */}
            <section id="scan-workflow" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "scan-workflow") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Clock className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Scan Workflow</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  When a scan is triggered, the server processes checkpoints and pushes progress events (`type: "scan_status"`) through WebSockets:
                </p>
                <div className="font-mono bg-surface border border-white/[0.05] p-4.5 rounded-xl space-y-2 text-[10px] text-accent">
                  <p>1. [queued] (0%) &rarr; Scan request initialized and placed in connection queue.</p>
                  <p>2. [started] (10%) &rarr; Check IP address guidelines, enforce private IP locks.</p>
                  <p>3. [progress] (20%) &rarr; Fetch server response headers (HEAD &rarr; GET fallback).</p>
                  <p>4. [progress] (45%) &rarr; Execute DNS SPF/DMARC zone validation.</p>
                  <p>5. [progress] (60%) &rarr; Probe SSL/TLS protocol cipher handshake parameters.</p>
                  <p>6. [progress] (85%) &rarr; Discover subdomains and probe TCP port maps.</p>
                  <p>7. [progress] (95%) &rarr; Finalize audit checklists, compile AI advises.</p>
                  <p>8. [completed] (100%) &rarr; Save report record to DB, emit dashboard notification.</p>
                </div>
              </div>
            </section>

            {/* Security Checks & Rules */}
            <section id="security-checks" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "security-checks") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><ShieldCheck className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Security Checks & Rules</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  Our analyzer calculates compliance scores based on standardized rulesets:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Strict CSP Validation:</strong> Flags `unsafe-inline` or wildcard directives.</li>
                  <li><strong>HSTS Preload:</strong> Checks that max-age exceeds 1 year (31536000s) and preload/includeSubDomains attributes are present.</li>
                  <li><strong>Cookie Flag Hardening:</strong> Ensures Secure, HttpOnly, and SameSite (Strict/Lax) properties exist on session cookies.</li>
                  <li><strong>Clickjacking Defenses:</strong> Requires `X-Frame-Options` (DENY/SAMEORIGIN) or CSP `frame-ancestors 'none'/'self'`.</li>
                </ul>
              </div>
            </section>

            {/* Attack Surface Analysis */}
            <section id="attack-surface-analysis" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "attack-surface-analysis") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Terminal className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Attack Surface Analysis</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  Beyond HTTP headers, the engine audits the public digital posture:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Ports Probe:</strong> Scans typical protocol ports (e.g. 21, 22, 80, 443, 8080) to detect open server portals.</li>
                  <li><strong>Environment Leaks:</strong> Probes common configuration paths like `.git/config`, `.env`, and `config/database.yml`.</li>
                  <li><strong>Subdomain Crawl:</strong> Aggregates external DNS records to list active subdomains mapping potential host takeover vulnerabilities.</li>
                </ul>
              </div>
            </section>

            {/* Console Dashboard */}
            <section id="dashboard-overview" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "dashboard-overview") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><HardDrive className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Console Dashboard</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  Standard authenticated developer profiles gain access to our unified Console Hub:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Domain Verification Desk:</strong> View and manage verified assets, trigger validation handshakes.</li>
                  <li><strong>Credentials Manager:</strong> Generate developer API key tokens, toggle active states, set webhook targets, and specify domain Whitelists.</li>
                  <li><strong>Recent Logs History:</strong> Browse complete posture scan logs. (Guests are strictly restricted to 4 records).</li>
                </ul>
              </div>
            </section>

            {/* Reports & Grading */}
            <section id="scan-results-explanation" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "scan-results-explanation") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><FileText className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Reports & Grading</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  HeaderGuard reports are structured for quick analysis and remediation:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Compliance Standards Mapping:</strong> Automatically flags GDPR, OWASP Top 10, and PCI-DSS compliance checkpoints.</li>
                  <li><strong>AI Advice Column:</strong> Renders copy-paste configuration snippets for server modules (Nginx, Apache) or setups (Next.js, Cloudflare).</li>
                  <li><strong>Vulnerability Grades:</strong> Translates score outputs directly into grades (A+, A, B, C, D, F) matching standard industry metrics.</li>
                </ul>
              </div>
            </section>

            {/* Weighted Risk Scoring */}
            <section id="severity-scoring" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "severity-scoring") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Flame className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Weighted Risk Scoring</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  To provide an accurate posture indicator, HeaderGuard aggregates individual category scores into a single weighted grade index:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-[10px] text-center text-accent py-2">
                  <div className="p-3 bg-surface border border-white/[0.04] rounded-xl"><p className="font-bold">HTTP Headers</p><p className="text-xs font-black mt-1">25%</p></div>
                  <div className="p-3 bg-surface border border-white/[0.04] rounded-xl"><p className="font-bold">SSL/TLS Certs</p><p className="text-xs font-black mt-1">20%</p></div>
                  <div className="p-3 bg-surface border border-white/[0.04] rounded-xl"><p className="font-bold">DNS Zones</p><p className="text-xs font-black mt-1">15%</p></div>
                  <div className="p-3 bg-surface border border-white/[0.04] rounded-xl"><p className="font-bold">Cookie Safety</p><p className="text-xs font-black mt-1">15%</p></div>
                </div>
                <p className="pt-2">
                  Remaining weights map to compliance indicators (10%), exposure analysis (10%), and network performance speeds (5%). Missing category scans adjust overall weights dynamically.
                </p>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-documentation" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "api-documentation") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><FileCode className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">API Reference</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  Developer keys permit remote trigger scans via standard POST endpoints:
                </p>
                <div className="font-mono bg-surface border border-white/[0.05] p-3 rounded-xl text-[10px] flex justify-between items-center text-text select-all">
                  <span>POST /api/scan</span>
                  <span className="text-[9px] font-bold bg-accent text-bg px-2 py-0.5 rounded uppercase">REST</span>
                </div>
                <p>
                  {"Pass a JSON request body containing target urls (e.g. `{\"url\": \"github.com\"}`). Response parameters return detailed scans payload, compliance scopes, and remediation advice."}
                </p>
              </div>
            </section>

            {/* API Authentication */}
            <section id="auth-authorization" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "auth-authorization") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Lock className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">API Authentication</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  To invoke Developer endpoints, authenticate by supplying your generated credentials in the HTTP request headers:
                </p>
                <div className="font-mono bg-surface border border-white/[0.05] p-4 rounded-xl text-[10px] text-accent space-y-1 select-all">
                  <p>Content-Type: application/json</p>
                  <p>X-API-Key: hg_sec_key_e5b4c10fa2...</p>
                </div>
                <p className="text-warning">
                  ⚠️ <strong>Security Advisory:</strong> Keep API credentials private. Do not embed keys in client-side code blocks.
                </p>
              </div>
            </section>

            {/* Roles & Permissions */}
            <section id="roles-permissions" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "roles-permissions") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><UserCheck className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Roles & Permissions</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  HeaderGuard separates access levels across standard Developer users and System Administrators:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Standard Users:</strong> Authenticate, run scans on verified domain assets, issue API credentials, and review usage limits. Daily limit: 20 requests.</li>
                  <li><strong>Administrator Users:</strong> Access the global control console, adjust standard limits, enable/disable developer credentials, review system-wide analytics logs, and bypass ownership locks. Daily limit: 27 requests.</li>
                </ul>
              </div>
            </section>

            {/* Keys Whitelisting & Locks */}
            <section id="developer-api-keys" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "developer-api-keys") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Key className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Keys Whitelisting & Locks</h2>
              </div>
              <div className="space-y-3.5 text-xs text-text-dim leading-relaxed font-sans">
                <p>
                  HARDEN credentials using our advanced safety parameters inside the API Manager:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li><strong>Allowed Domains Whitelist:</strong> Lock queries to specific domains (comma-separated strings). Requests targeting other hosts trigger 403 Forbidden checks.</li>
                  <li><strong>Webhook Alerts:</strong> Configure a target webhook URL. HeaderGuard fires HTTP POST alerts (`event: "scan.completed"`) automatically once asynchronous scans finish.</li>
                  <li><strong>Custom User-Agent:</strong> Set specialized User-Agent request header strings for auditing servers requiring firewall bypass bypasses.</li>
                </ul>
              </div>
            </section>

            {/* FAQs */}
            <section id="faq" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "faq") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><HelpCircle className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-4 text-xs text-text-dim font-sans leading-relaxed">
                <div>
                  <h4 className="font-bold text-text mb-1 uppercase font-mono text-[10.5px]">Is domain verification required for scans?</h4>
                  <p>For basic scans (HTTP headers only), guests can run scans without verification. For full EASM exposure audits, logged-in users must verify domain ownership using text token files.</p>
                </div>
                <div>
                  <h4 className="font-bold text-text mb-1 uppercase font-mono text-[10.5px]">What causes scan timeouts?</h4>
                  <p>We enforce a strict 10-second request timeout limit. Slow domain response handshakes or firewall blocks will abort scans and log F grade entries.</p>
                </div>
              </div>
            </section>

            {/* Troubleshooting Guide */}
            <section id="troubleshooting" className={`space-y-4 scroll-mt-24 ${filteredSections.some(s => s.id === "troubleshooting") ? "block" : "hidden"}`}>
              <div className="flex items-center gap-3 border-b border-white/[0.05] pb-3 mb-6">
                <div className="p-2 bg-accent/10 text-accent rounded-lg"><Wrench className="h-5 w-5" /></div>
                <h2 className="text-xl font-bold uppercase text-text">Troubleshooting Guide</h2>
              </div>
              <div className="space-y-4 text-xs text-text-dim font-sans leading-relaxed">
                <div>
                  <h4 className="font-bold text-text mb-1 uppercase font-mono text-[10.5px]">WebSocket connection terminates or drops</h4>
                  <p>Our client automatically tries reconnecting with exponential backoff delays. Ensure port 3001 is open on your host firewall network configurations.</p>
                </div>
                <div>
                  <h4 className="font-bold text-text mb-1 uppercase font-mono text-[10.5px]">Token verification file returns 403 or 404 error codes</h4>
                  <p>Check that `headerguard-verification.txt` resides in your server document root and contains the matching token. If you use reverse proxies, configure rules to bypass file authentication requirements.</p>
                </div>
              </div>
            </section>

          </main>
        </div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 p-3 bg-accent text-bg hover:bg-accent-light rounded-full shadow-2xl transition-all hover:scale-110 z-50 border border-accent/20"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-4.5 w-4.5" />
        </button>
      )}
    </div>
  );
}
