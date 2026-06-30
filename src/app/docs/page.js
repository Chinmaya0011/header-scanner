"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Book,
  Search,
  ChevronRight,
  ChevronDown,
  Info,
  Lightbulb,
  AlertTriangle,
  Flame,
  FileCode,
  Lock,
  Globe,
  Mail,
  Shield,
  Terminal,
  Layers,
  Cpu,
  Cookie,
  Sliders,
  Activity,
  HardDrive,
  CheckCircle,
  HelpCircle,
  Settings,
  Users,
  Key,
  ShieldCheck,
  History,
  FileDown,
  UserCheck,
  Bell,
  Wrench,
  Compass,
  FileText,
  Clock,
  ExternalLink,
  Menu,
  X,
  ArrowUp,
  Cpu as CpuIcon
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// Categories & Sections definitions
const docCategories = [
  {
    name: "Getting Started",
    sections: [
      { id: "project-overview", title: "Project Overview", icon: Compass },
      { id: "platform-architecture", title: "Platform Architecture", icon: CpuIcon },
      { id: "core-features", title: "Core Features", icon: Sliders }
    ]
  },
  {
    name: "Scanner Engine",
    sections: [
      { id: "scanner-engine-details", title: "Scanner Engine", icon: Activity },
      { id: "supported-scan-types", title: "Supported Scan Types", icon: Layers },
      { id: "scan-workflow", title: "Scan Workflow", icon: Clock },
      { id: "security-checks", title: "Security Checks & Detection", icon: ShieldCheck },
      { id: "attack-surface-analysis", title: "Attack Surface Analysis", icon: Terminal }
    ]
  },
  {
    name: "User Dashboard",
    sections: [
      { id: "dashboard-overview", title: "Dashboard Overview", icon: HardDrive },
      { id: "scan-results-explanation", title: "Scan Results Explanation", icon: FileText },
      { id: "severity-scoring", title: "Severity & Risk Scoring", icon: Flame }
    ]
  },
  {
    name: "Integrations & API",
    sections: [
      { id: "api-documentation", title: "API Documentation", icon: FileCode },
      { id: "auth-authorization", title: "Authentication & Auth", icon: Lock },
      { id: "roles-permissions", title: "User Roles & Permissions", icon: UserCheck },
      { id: "developer-api-keys", title: "Developer API & Keys", icon: Key },
      { id: "rate-limits", title: "Rate & Usage Limits", icon: Sliders },
      { id: "verification-methods", title: "Verification Methods", icon: Shield }
    ]
  },
  {
    name: "Usage & History",
    sections: [
      { id: "scan-history", title: "Scan History", icon: History },
      { id: "reports-export", title: "Reports & Export Options", icon: FileDown },
      { id: "settings-configuration", title: "Settings & Configuration", icon: Settings },
      { id: "organization-management", title: "Organization & Teams", icon: Users },
      { id: "notifications-logs", title: "Notifications & Audit Logs", icon: Bell }
    ]
  },
  {
    name: "Support & FAQ",
    sections: [
      { id: "faq", title: "FAQ", icon: HelpCircle },
      { id: "troubleshooting", title: "Troubleshooting", icon: Wrench }
    ]
  },
  {
    name: "Best Practices & Security",
    sections: [
      { id: "best-practices", title: "Best Practices", icon: Lightbulb },
      { id: "security-privacy", title: "Security & Privacy", icon: ShieldCheck },
      { id: "limitations", title: "Limitations", icon: AlertTriangle }
    ]
  },
  {
    name: "Roadmap & Changelog",
    sections: [
      { id: "changelog", title: "Changelog", icon: History },
      { id: "future-roadmap", title: "Future Roadmap", icon: Compass }
    ]
  }
];

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSection, setActiveSection] = useState("project-overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({
    "Getting Started": true,
    "Scanner Engine": true,
    "User Dashboard": true,
    "Integrations & API": true,
    "Usage & History": true,
    "Support & FAQ": true,
    "Best Practices & Security": true,
    "Roadmap & Changelog": true
  });

  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [expandedTrouble, setExpandedTrouble] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  const contentRefs = useRef({});


  // Flat array of all sections for easier filtering and active tracking
  const allSections = useMemo(() => {
    return docCategories.flatMap(cat => 
      cat.sections.map(sec => ({
        ...sec,
        category: cat.name
      }))
    );
  }, []);

  // Monitor scroll position to update active sidebar section
  useEffect(() => {
    const handleScroll = () => {
      // Toggle back to top button visibility
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      // Track active section on scroll
      if (searchQuery.trim() !== "") return; // Disable scrollspy during active search

      const scrollPosition = window.scrollY + 180;
      let currentActive = "project-overview";

      for (const section of allSections) {
        const element = document.getElementById(section.id);
        if (element) {
          const offsetTop = element.offsetTop;
          if (scrollPosition >= offsetTop) {
            currentActive = section.id;
          }
        }
      }

      setActiveSection(currentActive);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [allSections, searchQuery]);

  const toggleCategory = (catName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleSidebarClick = (sectionId) => {
    setMobileSidebarOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const topOffset = element.offsetTop - 90;
      window.scrollTo({
        top: topOffset,
        behavior: "smooth"
      });
      setActiveSection(sectionId);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // Simple client-side search indexing matching terms in titles and keywords
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return allSections;
    const query = searchQuery.toLowerCase().trim();
    return allSections.filter(sec => {
      const element = document.getElementById(`content-${sec.id}`);
      const textContent = element ? element.innerText.toLowerCase() : "";
      return (
        sec.title.toLowerCase().includes(query) ||
        sec.category.toLowerCase().includes(query) ||
        textContent.includes(query)
      );
    });
  }, [searchQuery, allSections]);

  const activeBreadcrumbs = useMemo(() => {
    const activeSec = allSections.find(s => s.id === activeSection);
    if (!activeSec) return ["Docs", "Overview"];
    return ["Documentation", activeSec.category, activeSec.title];
  }, [activeSection, allSections]);

  return (
    <div className="min-h-screen bg-bg font-sans text-text select-none">
      <Navbar />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative items-start">
          
          {/* ================= SIDEBAR NAVIGATION (lg:col-span-3) ================= */}
          <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-bg border-r border-white/[0.05] p-6 transition-transform duration-300 lg:sticky lg:top-24 lg:z-0 lg:w-auto lg:translate-x-0 lg:border-none lg:p-0 ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:col-span-3"
          }`}>
            
            {/* Mobile close menu */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.05] lg:hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-text">Documentation Index</span>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="text-text-dim hover:text-text p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sidebar Search Bar */}
            <div className="relative mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-surface/50 border border-white/[0.05] focus:border-accent/40 focus:ring-1 focus:ring-accent/40 rounded-lg text-xs text-text placeholder:text-text-muted outline-none transition-all"
              />
            </div>

            {/* Navigation Lists */}
            <div className="space-y-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-1 select-none no-scrollbar">
              {docCategories.map((cat, idx) => {
                const isExpanded = expandedCategories[cat.name];
                
                // If searching, only show category if it has matching children
                const catFilteredSections = cat.sections.filter(s => 
                  filteredSections.some(fs => fs.id === s.id)
                );
                
                if (searchQuery.trim() !== "" && catFilteredSections.length === 0) {
                  return null;
                }

                return (
                  <div key={idx} className="space-y-1 text-left">
                    <button
                      onClick={() => toggleCategory(cat.name)}
                      className="w-full flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-text-muted hover:text-text-dim transition-colors py-1 pl-1"
                    >
                      <span>{cat.name}</span>
                      {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-0.5 border-l border-white/[0.03] ml-1.5 pl-2.5">
                        {cat.sections.map((sec) => {
                          const isSecActive = activeSection === sec.id;
                          const isSecFiltered = filteredSections.some(fs => fs.id === sec.id);
                          const Icon = sec.icon;

                          if (!isSecFiltered) return null;

                          return (
                            <button
                              key={sec.id}
                              onClick={() => handleSidebarClick(sec.id)}
                              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 text-left font-semibold ${
                                isSecActive
                                  ? "bg-accent/15 text-accent border border-accent/20"
                                  : "text-text-dim hover:text-text hover:bg-white/5 border border-transparent"
                              }`}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{sec.title}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </aside>

          {/* ================= CONTENT PANEL (lg:col-span-9) ================= */}
          <main className="lg:col-span-9 space-y-8 text-left min-w-0">
            
            {/* Mobile Sidebar Trigger & Breadcrumbs */}
            <div className="flex items-center justify-between bg-surface/30 border border-white/[0.04] p-3 rounded-xl lg:hidden">
              <div className="flex items-center gap-2 text-[10px] font-mono text-text-dim">
                <span>Docs</span>
                <ChevronRight className="h-3 w-3 text-text-muted" />
                <span className="text-text font-bold truncate max-w-[120px]">
                  {allSections.find(s => s.id === activeSection)?.title || "Overview"}
                </span>
              </div>
              <Button 
                onClick={() => setMobileSidebarOpen(true)}
                variant="outline" 
                size="sm"
                icon={Menu}
                className="text-[10px] py-1 px-2.5"
              >
                Index
              </Button>
            </div>

            {/* Breadcrumbs (Desktop) */}
            <div className="hidden lg:flex items-center gap-2.5 text-[10px] font-mono text-text-muted select-none">
              {activeBreadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="h-3 w-3 text-white/10" />}
                  <span className={idx === activeBreadcrumbs.length - 1 ? "text-accent font-bold" : ""}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Active Search Notification */}
            {searchQuery.trim() !== "" && (
              <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 flex items-center justify-between text-xs font-semibold">
                <p className="text-text-dim">
                  Filtering matches for: <span className="font-mono text-accent">"{searchQuery}"</span>
                </p>
                <Badge variant="accent">{filteredSections.length} matches found</Badge>
              </div>
            )}

            {/* Documentation Sections */}
            <div className="space-y-16">
              
              {/* ================= 1. PROJECT OVERVIEW ================= */}
              <section id="project-overview" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "project-overview") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Compass className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Project Overview</h2>
                </div>
                <div id="content-project-overview" className="space-y-4 text-xs text-text-dim leading-relaxed font-sans">
                  <p>
                    HeaderGuard is an enterprise-grade, comprehensive **External Attack Surface Management (EASM)**, network perimeter scanner, and HTTP response intelligence audit tool. It facilitates real-time monitoring of domains, server architectures, public communication records, and transmission certificates.
                  </p>
                  <p>
                    By combining concurrent socket scanning, DNS records query parsers, web path crawlers, and server response banner analyzers, HeaderGuard gives defensive security teams and developers immediate visibility into configuration hygiene, vulnerable stack exposures, information leakage vectors, and anti-spoofing coverage.
                  </p>
                  <Card className="p-4 bg-accent/5 border-accent/15 space-y-2">
                    <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Security Posture Governance</span>
                    </div>
                    <p className="text-[11px] leading-normal">
                      The core mission of HeaderGuard is to provide automated compliance mapping against industry governance targets (such as GDPR privacy directives, PCI-DSS requirements, and OWASP Top 10 recommendations) by converting configurations into actionable directives.
                    </p>
                  </Card>
                </div>
              </section>

              {/* ================= 2. PLATFORM ARCHITECTURE ================= */}
              <section id="platform-architecture" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "platform-architecture") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <CpuIcon className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Platform Architecture</h2>
                </div>
                <div id="content-platform-architecture" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard is constructed utilizing a highly optimized modern JavaScript pipeline. It is architected for maximum network throughput, low memory footprint, and low response latency.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-[10px] pt-2">
                    <Card className="p-4 bg-surface/30 border-white/[0.04]">
                      <span className="text-accent font-bold block mb-1">FRONT-END INTERFACE</span>
                      <p className="text-text-muted leading-relaxed text-[9px]">
                        Responsive web interface built on Next.js 16 (Turbopack layout compiler) and React. Incorporates custom dark-mode modules, SVG charts, and interactive toast states.
                      </p>
                    </Card>
                    <Card className="p-4 bg-surface/30 border-white/[0.04]">
                      <span className="text-warning font-bold block mb-1">DATABASE STORAGE</span>
                      <p className="text-text-muted leading-relaxed text-[9px]">
                        NoSQL storage layer built on MongoDB. Models are structured via Mongoose for scan records, user credentials, active monitors, and verified domain assets.
                      </p>
                    </Card>
                    <Card className="p-4 bg-surface/30 border-white/[0.04]">
                      <span className="text-success font-bold block mb-1">SCANNING CORES</span>
                      <p className="text-text-muted leading-relaxed text-[9px]">
                        Isolatable network sweeper modules executing standard Node.js socket queries (`net.Socket`), recursive DNS checks (`dns.promises`), and target path HTTP controllers.
                      </p>
                    </Card>
                  </div>
                  
                  {/* Visually descriptive diagram */}
                  <div className="bg-surface border border-white/[0.06] rounded-xl p-4.5 space-y-3 mt-4 text-center font-mono">
                    <span className="text-[9px] font-bold text-accent uppercase tracking-wider block">System Component Blueprint</span>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-[10px] text-text pt-2">
                      <div className="border border-white/10 bg-bg p-2 rounded-lg w-full sm:w-32">Client UI (Dashboard)</div>
                      <ChevronRight className="h-4 w-4 text-text-dim rotate-90 sm:rotate-0" />
                      <div className="border border-accent/25 bg-accent/5 p-2 rounded-lg w-full sm:w-36">REST Next.js API Routes</div>
                      <ChevronRight className="h-4 w-4 text-text-dim rotate-90 sm:rotate-0" />
                      <div className="border border-white/10 bg-bg p-2 rounded-lg w-full sm:w-36">EASM Sweeper Engines</div>
                      <ChevronRight className="h-4 w-4 text-text-dim rotate-90 sm:rotate-0" />
                      <div className="border border-success/20 bg-success/5 p-2 rounded-lg w-full sm:w-32">MongoDB Database</div>
                    </div>
                  </div>
                </div>
              </section>

              {/* ================= 3. CORE FEATURES ================= */}
              <section id="core-features" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "core-features") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Sliders className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Core Features</h2>
                </div>
                <div id="content-core-features" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard hosts a comprehensive security toolbelt designed for proactive compliance and perimeter auditing:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-dim ml-2 font-semibold">
                    <li><span className="text-text">Deep HTTP Security Audits:</span> Full validation of standard security header configurations.</li>
                    <li><span className="text-text">SSL/TLS Configuration Inspections:</span> Analysis of certificate validation layers and ciphers.</li>
                    <li><span className="text-text">DNS & Email Protection Checks:</span> Auditing DNSSEC, SPF, DKIM, DMARC, MTA-STS, and BIMI.</li>
                    <li><span className="text-text">Attack Surface Sweepers:</span> Network port sweeping and exposed path scanner checks.</li>
                    <li><span className="text-text">Continuous Monitoring:</span> Periodic automated scans that evaluate domain health.</li>
                    <li><span className="text-text">Developer Platform:</span> Webhook notifications, whitelisted domains, and programmatic API access.</li>
                  </ul>
                </div>
              </section>

              {/* ================= 4. SCANNER ENGINE ================= */}
              <section id="scanner-engine-details" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "scanner-engine-details") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Activity className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Scanner Engine</h2>
                </div>
                <div id="content-scanner-engine-details" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    The HeaderGuard scanner engine executes parallel sweeps across distinct security vectors. Each module operates inside a concurrency-controlled limit to balance target server stress against scan speed.
                  </p>
                  <p>
                    The scanner implements customized `User-Agent` strings and request headers to minimize blocking by standard web application firewalls (WAFs) and Cloudflare protection screens.
                  </p>
                  <div className="bg-surface/50 border border-white/[0.05] rounded-xl p-4.5 space-y-2">
                    <span className="font-bold text-text block text-[11px] font-mono">Scanner Parameters:</span>
                    <table className="w-full text-left border-collapse text-[10px] font-mono mt-2">
                      <thead>
                        <tr className="border-b border-white/10 text-text-muted">
                          <th className="pb-1.5">Parameter</th>
                          <th className="pb-1.5">Value</th>
                          <th className="pb-1.5">Purpose</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-text-dim">
                        <tr>
                          <td className="py-2 font-bold text-accent">TIMEOUT_MS</td>
                          <td className="py-2">10,000ms</td>
                          <td className="py-2">Maximum connection abort threshold for target hosts</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-accent">CRAWL_TIMEOUT_MS</td>
                          <td className="py-2">8,000ms</td>
                          <td className="py-2">Page crawl abort threshold for HTML analysis</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-accent">MAX_REDIRECTS</td>
                          <td className="py-2">5</td>
                          <td className="py-2">Maximum redirect follow limits for root domains</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-accent">CONCURRENCY_LIMIT</td>
                          <td className="py-2">40-50 workers</td>
                          <td className="py-2">Parallel worker task pool size for port and subdomain sweeps</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* ================= 5. SUPPORTED SCAN TYPES ================= */}
              <section id="supported-scan-types" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "supported-scan-types") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Layers className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Supported Scan Types</h2>
                </div>
                <div id="content-supported-scan-types" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard supports two primary scan configurations to optimize usage quota allocation and execute target checks:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    <Card className="p-5 bg-surface/30 border-white/[0.04] space-y-2">
                      <div className="flex items-center gap-2 text-accent font-bold font-mono">
                        <CheckCircle className="h-4 w-4" />
                        <span>COMPREHENSIVE FULL SCAN</span>
                      </div>
                      <p className="text-text-muted leading-relaxed text-[11px]">
                        Sweeps all 12 configuration and EASM categories. Probes 500+ subdomains, checks standard target TCP ports, resolves active DNS keys, crawls page HTML for SEO, metadata, favicon brand logos, and probes for 140+ sensitive configuration files. Recommended for initial target indexing.
                      </p>
                    </Card>

                    <Card className="p-5 bg-surface/30 border-white/[0.04] space-y-2">
                      <div className="flex items-center gap-2 text-warning font-bold font-mono">
                        <CheckCircle className="h-4 w-4" />
                        <span>SELECTIVE SECTION SCAN</span>
                      </div>
                      <p className="text-text-muted leading-relaxed text-[11px]">
                        Allows users to update specific subsections (e.g. *only* DNS, SSL/TLS, Security Headers, Open Ports, Subdomains, or SEO details) directly from the details tab. The backend clones the baseline parameters from the latest successful scan log, executes the isolated engine, and recalculates grades.
                      </p>
                    </Card>
                  </div>
                </div>
              </section>

              {/* ================= 6. SCAN WORKFLOW ================= */}
              <section id="scan-workflow" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "scan-workflow") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Clock className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Scan Workflow</h2>
                </div>
                <div id="content-scan-workflow" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    Understanding how HeaderGuard audits a target domain endpoint helps developers optimize API setups:
                  </p>
                  
                  {/* Visual SVG flow chart */}
                  <div className="bg-surface border border-white/[0.06] rounded-xl p-5 overflow-x-auto flex justify-center">
                    <svg className="w-full max-w-xl" viewBox="0 0 500 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Step 1 */}
                      <rect x="180" y="10" width="140" height="30" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1"/>
                      <text x="250" y="28" fill="#e2e8f0" fontSize="9" fontFamily="monospace" textAnchor="middle">1. Client Request</text>
                      
                      <line x1="250" y1="40" x2="250" y2="60" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3"/>
                      
                      {/* Step 2 */}
                      <rect x="150" y="60" width="200" height="30" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
                      <text x="250" y="78" fill="#e2e8f0" fontSize="9" fontFamily="monospace" textAnchor="middle">2. Rate Limit & Ownership Check</text>
                      
                      <line x1="250" y1="90" x2="250" y2="110" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3"/>
                      
                      {/* Step 3 */}
                      <rect x="130" y="110" width="240" height="30" rx="6" fill="#1e293b" stroke="#475569" strokeWidth="1"/>
                      <text x="250" y="128" fill="#e2e8f0" fontSize="9" fontFamily="monospace" textAnchor="middle">3. Headers Fetch (HEAD/GET fallback)</text>
                      
                      <line x1="250" y1="140" x2="250" y2="160" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3"/>
                      
                      {/* Step 4 */}
                      <rect x="110" y="160" width="280" height="40" rx="6" fill="#064e3b" stroke="#10b981" strokeWidth="1"/>
                      <text x="250" y="178" fill="#e2e8f0" fontSize="9" fontFamily="monospace" textAnchor="middle">4. Concurrently Run Scanner Engines</text>
                      <text x="250" y="192" fill="#a7f3d0" fontSize="8" fontFamily="monospace" textAnchor="middle">(SSL, DNS, subdomains, ports, SEO crawl)</text>
                      
                      <line x1="250" y1="200" x2="250" y2="220" stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3"/>
                      
                      {/* Step 5 */}
                      <rect x="150" y="220" width="200" height="30" rx="6" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1"/>
                      <text x="250" y="238" fill="#e2e8f0" fontSize="9" fontFamily="monospace" textAnchor="middle">5. Save Report & Trigger Webhooks</text>
                    </svg>
                  </div>
                  
                  <p>
                    When a scan executes, the backend sanitizes the hostname, resolves standard redirect chains, inspects TLS versions, queries DNS MX records for secure mail, checks active ports, and parses HTML meta tags for branding/SEO details.
                  </p>
                </div>
              </section>

              {/* ================= 7. SECURITY CHECKS & DETECTION LOGIC ================= */}
              <section id="security-checks" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "security-checks") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Security Checks &amp; Detection Logic</h2>
                </div>
                <div id="content-security-checks" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard validates HTTP security configuration setups based on precise criteria. The standard detection guidelines evaluate:
                  </p>
                  
                  <div className="space-y-3 font-sans">
                    <Card className="p-4 bg-surface/30 border-white/[0.04] space-y-2">
                      <span className="font-bold text-text block text-[11px] font-mono">1. Content-Security-Policy (CSP)</span>
                      <p className="text-text-muted leading-relaxed text-[11.5px]">
                        Analyzes header directives for potential cross-site scripting (XSS) exposures. Flags wildcard domains (`*`), `unsafe-inline`, or `unsafe-eval` declarations within script/style source restrictions.
                      </p>
                    </Card>

                    <Card className="p-4 bg-surface/30 border-white/[0.04] space-y-2">
                      <span className="font-bold text-text block text-[11px] font-mono">2. Strict-Transport-Security (HSTS)</span>
                      <p className="text-text-muted leading-relaxed text-[11.5px]">
                        Verifies that HTTP requests automatically encrypt. Flags missing `max-age` policies, policies specifying durations less than 1 year (31,536,000s), or missing `includeSubDomains` extensions.
                      </p>
                    </Card>

                    <Card className="p-4 bg-surface/30 border-white/[0.04] space-y-2">
                      <span className="font-bold text-text block text-[11px] font-mono">3. X-Frame-Options (XFO)</span>
                      <p className="text-text-muted leading-relaxed text-[11.5px]">
                        Audits frame embed permissions to block clickjacking. The header must exist and declare either `DENY` or `SAMEORIGIN`.
                      </p>
                    </Card>

                    <Card className="p-4 bg-surface/30 border-white/[0.04] space-y-2">
                      <span className="font-bold text-text block text-[11px] font-mono">4. X-Content-Type-Options (XCTO)</span>
                      <p className="text-text-muted leading-relaxed text-[11.5px]">
                        Ensures browsers do not ignore server-defined MIME types. Checks that the header exists and is set precisely to `nosniff`.
                      </p>
                    </Card>
                  </div>
                </div>
              </section>

              {/* ================= 8. ATTACK SURFACE ANALYSIS ================= */}
              <section id="attack-surface-analysis" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "attack-surface-analysis") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Terminal className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Attack Surface Analysis</h2>
                </div>
                <div id="content-attack-surface-analysis" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    The platform evaluates exposed perimeter nodes to map potential targets:
                  </p>
                  
                  <div className="space-y-3 font-sans">
                    <Card className="p-4 bg-surface/30 border-white/[0.04] space-y-2">
                      <span className="font-bold text-text block text-[11px] font-mono">TCP Port Sweeping</span>
                      <p className="text-text-muted leading-relaxed text-[11px]">
                        Evaluates network listener availability across common interfaces. Probes FTP (21), SSH (22), Telnet (23), SMTP (25), HTTP (80), POP3 (110), IMAP (143), HTTPS (443), WHM/cPanel, databases (MySQL 3306, Postgres 5432, MongoDB 27017), and DevOps tools (Redis, Kubernetes).
                      </p>
                    </Card>

                    <Card className="p-4 bg-surface/30 border-white/[0.04] space-y-2">
                      <span className="font-bold text-text block text-[11px] font-mono">Sensitive Storage &amp; Config Path Probing</span>
                      <p className="text-text-muted leading-relaxed text-[11px]">
                        Checks for the accessibility of files like environment secrets (`/.env`), code repositories (`/.git/HEAD`), log archives (`/logs/error.log`), backups (`/backup.zip`), and config scripts.
                      </p>
                    </Card>

                    <Card className="p-4 bg-surface/30 border-white/[0.04] space-y-2">
                      <span className="font-bold text-text block text-[11px] font-mono">Web Identity &amp; Access Portals</span>
                      <p className="text-text-muted leading-relaxed text-[11px]">
                        Identifies authentication endpoints (e.g. `/login`, `/admin`, `/auth`, `/wp-admin`, `/dashboard`). Helpful for identifying login portals that should be IP-restricted or behind a VPN.
                      </p>
                    </Card>
                  </div>
                </div>
              </section>

              {/* ================= 9. DASHBOARD OVERVIEW ================= */}
              <section id="dashboard-overview" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "dashboard-overview") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <HardDrive className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Dashboard Overview</h2>
                </div>
                <div id="content-dashboard-overview" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    The HeaderGuard Console acts as a central hub for security management. It is divided into two primary workspaces:
                  </p>
                  
                  <ul className="list-disc list-inside space-y-3 ml-2 font-semibold text-text-dim">
                    <li>
                      <span className="text-text">User Console Workspace:</span>
                      <p className="pl-5 font-normal font-sans text-text-muted text-[11px] mt-1">
                        Accessible to all authenticated accounts. Displays the scan launcher input, current daily usage ratios, list of recently generated report logs, and shortcuts to monitor domains.
                      </p>
                    </li>
                    <li>
                      <span className="text-text">Administrative Control Hub:</span>
                      <p className="pl-5 font-normal font-sans text-text-muted text-[11px] mt-1">
                        Restricted to Console Admins. Displays global system telemetry charts, lists of registered platform profiles, domain verification records, and toggle tools to override user daily limits or suspend API access.
                      </p>
                    </li>
                  </ul>
                </div>
              </section>

              {/* ================= 10. SCAN RESULTS EXPLANATION ================= */}
              <section id="scan-results-explanation" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "scan-results-explanation") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <FileText className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Scan Results Explanation</h2>
                </div>
                <div id="content-scan-results-explanation" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    Every completed scan report populates interactive diagnostic widgets. Security checks are marked with color-coded status badges:
                  </p>
                  <ul className="list-none space-y-2.5 font-mono text-[10px]">
                    <li className="flex items-center gap-2"><Badge variant="success">PASSED</Badge> <span className="text-text-muted">Configuration meets target industry standards. No action required.</span></li>
                    <li className="flex items-center gap-2"><Badge variant="warning">WARNING</Badge> <span className="text-text-muted">Header exists but lacks hardening options (e.g. short HSTS max-age, missing includeSubDomains).</span></li>
                    <li className="flex items-center gap-2"><Badge variant="danger">FAILED</Badge> <span className="text-text-muted">Required control is entirely missing or disabled. Remediation highly recommended.</span></li>
                  </ul>

                  <h3 className="font-bold text-text uppercase text-[11px] font-mono pt-3">Remediation Directives:</h3>
                  <p>
                    Expand any warning or failed finding card to access copyable configuration templates. The platform provides instructions for:
                  </p>
                  
                  {/* Multi tab config code visual */}
                  <Card className="p-4 bg-surface border border-white/[0.06] rounded-xl font-mono text-[10.5px] space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2 text-[9px] text-accent">
                      <span>HTTP STRICT TRANSPORT SECURITY (HSTS) DIRECTIVE</span>
                      <span>NGINX CONFIGURATION</span>
                    </div>
                    <pre className="text-accent-light whitespace-pre-wrap select-all leading-relaxed">
{`# Add HSTS security headers directive to site block
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;`}
                    </pre>
                  </Card>
                </div>
              </section>

              {/* ================= 11. SEVERITY LEVELS & RISK SCORING ================= */}
              <section id="severity-scoring" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "severity-scoring") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Flame className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Severity &amp; Risk Scoring</h2>
                </div>
                <div id="content-severity-scoring" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard maps security posture using a mathematical scoring algorithm from **0 to 100**. Scans start with a perfect score of 100, and points are deducted based on detected vulnerabilities:
                  </p>
                  
                  <div className="bg-surface/50 border border-white/[0.05] rounded-xl p-4.5 space-y-3">
                    <span className="font-bold text-text block text-[11px] font-mono">Severity Level Deductions:</span>
                    <table className="w-full text-left border-collapse text-[10px] font-mono">
                      <thead>
                        <tr className="border-b border-white/10 text-text-muted">
                          <th className="pb-1.5">Severity</th>
                          <th className="pb-1.5">Points Deducted</th>
                          <th className="pb-1.5">Example Exposure</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5 text-text-dim">
                        <tr>
                          <td className="py-2.5 font-bold text-danger">CRITICAL</td>
                          <td className="py-2.5">-20 to -25 points</td>
                          <td className="py-2.5">Missing Content-Security-Policy or Expired SSL certificate</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-danger">HIGH</td>
                          <td className="py-2.5">-10 to -15 points</td>
                          <td className="py-2.5">Missing X-Frame-Options or disabled SPF/DMARC email records</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-warning">MEDIUM</td>
                          <td className="py-2.5">-5 to -10 points</td>
                          <td className="py-2.5">Missing Referrer-Policy or weak SSL cipher suite support</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-accent">LOW</td>
                          <td className="py-2.5">-2 to -5 points</td>
                          <td className="py-2.5">Information disclosure banner leaks (e.g. server: Apache/2.4.41)</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-text-muted">INFO</td>
                          <td className="py-2.5">0 points</td>
                          <td className="py-2.5">HTTPS protocol type or DNS resource listings</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p>
                    The overall posture score is mapped to a letter grade:
                  </p>
                  <div className="flex flex-wrap gap-2.5 font-mono text-[10.5px]">
                    <span className="bg-success/15 border border-success/35 text-success px-2 py-1 rounded">A+ (95 - 100)</span>
                    <span className="bg-success/15 border border-success/35 text-success px-2 py-1 rounded">A (90 - 94)</span>
                    <span className="bg-accent/15 border border-accent/35 text-accent px-2 py-1 rounded">B (80 - 89)</span>
                    <span className="bg-warning/15 border border-warning/35 text-warning px-2 py-1 rounded">C (60 - 79)</span>
                    <span className="bg-danger/15 border border-danger/35 text-danger px-2 py-1 rounded">D (50 - 59)</span>
                    <span className="bg-danger/15 border border-danger/35 text-danger px-2 py-1 rounded">F (&lt; 50)</span>
                  </div>
                </div>
              </section>

              {/* ================= 12. API DOCUMENTATION ================= */}
              <section id="api-documentation" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "api-documentation") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <FileCode className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">API Documentation</h2>
                </div>
                <div id="content-api-documentation" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard provides developer endpoints to run security audits programmatically:
                  </p>
                  
                  <div className="bg-surface/50 border border-white/[0.05] rounded-xl p-4.5 space-y-3 font-mono text-[11px]">
                    <div className="flex items-center gap-2">
                      <Badge variant="accent">POST</Badge>
                      <span className="font-bold text-text">/api/scan</span>
                    </div>
                    <p className="text-text-muted text-[10.5px]">
                      Triggers a scanning audit run against a target domain address.
                    </p>
                    
                    <span className="font-bold text-text text-[10px] block mt-3">REQUEST BODY:</span>
                    <pre className="bg-surface border border-white/5 p-3 rounded-lg text-accent-light text-[10px] select-all">
{`{
  "url": "example.com",
  "section": "all" // Optional: "headers" | "ssl" | "dns" | "ports" | "subdomains" | "seo"
}`}
                    </pre>

                    <span className="font-bold text-text text-[10px] block mt-3">HTTP RESPONSE (200 OK):</span>
                    <pre className="bg-surface border border-white/5 p-3 rounded-lg text-text-dim/80 text-[9px] select-all leading-normal max-h-56 overflow-y-auto">
{`{
  "success": true,
  "scanId": "6f29e1d8cd34",
  "url": "https://example.com",
  "score": 85,
  "grade": "A-",
  "headers": [
    { "name": "Content-Security-Policy", "status": "present", "value": "..." }
  ],
  "ssl": { "valid": true, "expirationDate": "..." },
  "dns": { "a": ["..."] }
}`}
                    </pre>
                  </div>
                </div>
              </section>

              {/* ================= 13. AUTHENTICATION & AUTHORIZATION ================= */}
              <section id="auth-authorization" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "auth-authorization") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Lock className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Authentication &amp; Authorization</h2>
                </div>
                <div id="content-auth-authorization" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    Platform interface transactions are secured via cookies storing JSON Web Tokens (JWT). The token encrypts user credentials and authentication attributes, and is validated by backend middleware.
                  </p>
                  <p>
                    Account registrations enforce email identity verification using a 6-digit One-Time Password (OTP) dispatched to the target email. The OTP code is valid for 10 minutes and is cleared from the database upon verification.
                  </p>
                </div>
              </section>

              {/* ================= 14. USER ROLES & PERMISSIONS ================= */}
              <section id="roles-permissions" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "roles-permissions") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <UserCheck className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">User Roles &amp; Permissions</h2>
                </div>
                <div id="content-roles-permissions" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard enforces role-based access controls (RBAC) separating administrative governance from standard users:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    <Card className="p-5 bg-surface/30 border-white/[0.04] space-y-2">
                      <div className="flex items-center gap-2 text-success font-bold font-mono">
                        <Badge variant="success">STANDARD USER</Badge>
                      </div>
                      <p className="text-text-muted leading-relaxed text-[11px]">
                        Can launch manual audits, retrieve historical scan records, add domains, execute verification challenges, configure developer API keys, and set up alert monitors. Cannot access admin dashboards or modify other user configurations.
                      </p>
                    </Card>

                    <Card className="p-5 bg-surface/30 border-white/[0.04] space-y-2">
                      <div className="flex items-center gap-2 text-accent font-bold font-mono">
                        <Badge variant="accent">CONSOLE ADMIN</Badge>
                      </div>
                      <p className="text-text-muted leading-relaxed text-[11px]">
                        Holds complete platform control. Can access global statistics, toggle profile suspended status, delete user records, override daily rate-limit quotas, revoke key credentials, and clear global historical scans.
                      </p>
                    </Card>
                  </div>
                </div>
              </section>

              {/* ================= 15. DEVELOPER API & API KEYS ================= */}
              <section id="developer-api-keys" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "developer-api-keys") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Key className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Developer API &amp; API Keys</h2>
                </div>
                <div id="content-developer-api-keys" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    Programmatic access is enabled via keys generated inside the Developers Settings page. Developers can adjust parameters to restrict key usage:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-dim ml-2 font-semibold">
                    <li><span className="text-text">Domain Locking Constraints:</span> Restricts scans to a comma-separated whitelist of host domains.</li>
                    <li><span className="text-text">Webhook Callback URL:</span> Automatically dispatches a POST request with the full JSON payload upon scan completion.</li>
                    <li><span className="text-text">Custom User-Agent:</span> Customizes HTTP headers used by the scanner to bypass local WAF blocks.</li>
                  </ul>
                  
                  <Card className="p-4 bg-amber/5 border-warning/15 space-y-2">
                    <div className="flex items-center gap-2 text-warning font-bold text-[10px] uppercase">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Security Warning</span>
                    </div>
                    <p className="text-[11px] leading-normal text-text-dim">
                      API keys are hashed prior to database storage. The raw key is displayed only once during initial generation. If lost, the token must be revoked and regenerated.
                    </p>
                  </Card>
                </div>
              </section>

              {/* ================= 16. RATE LIMITS & USAGE LIMITS ================= */}
              <section id="rate-limits" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "rate-limits") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Sliders className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Rate Limits &amp; Usage Limits</h2>
                </div>
                <div id="content-rate-limits" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard enforces sliding-window limits and daily quotas to protect infrastructure:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-xs text-text-dim">
                    <li><strong className="text-text">Minute Sliding Limit:</strong> Max <strong className="text-text">10 requests per minute</strong> per user account IP (database-backed slide).</li>
                    <li><strong className="text-text">Standard Daily Quota:</strong> Max <strong className="text-text">20 requests per day</strong> by default (reset at 00:00 UTC).</li>
                    <li><strong className="text-text">Admin Daily Quota:</strong> Max <strong className="text-text">27 requests per day</strong> by default.</li>
                  </ul>
                  <p>
                    Administrators can customize daily quota boundaries for standard users dynamically inside the Admin Console.
                  </p>
                </div>
              </section>

              {/* ================= 17. VERIFICATION METHODS ================= */}
              <section id="verification-methods" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "verification-methods") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Shield className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Verification Methods</h2>
                </div>
                <div id="content-verification-methods" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    To scan public web properties, non-admin accounts must verify domain ownership. Verification uses file-based confirmation:
                  </p>
                  <ol className="list-decimal list-inside space-y-2.5 font-semibold text-text-dim pl-1">
                    <li>
                      <span className="text-text">Generate Token:</span> Create a domain verification record inside the dashboard to receive a secure token.
                    </li>
                    <li>
                      <span className="text-text">Create File:</span> Host a plain text file named <code className="text-accent font-mono text-[10.5px]">headerguard-verification.txt</code> containing the token in your site's root directory.
                    </li>
                    <li>
                      <span className="text-text">Verify:</span> Trigger ownership checks to make the domain queryable.
                    </li>
                  </ol>
                  <p className="text-text-muted text-[11px] italic pl-2 border-l border-white/5">
                    Note: Domain verification rules are bypassed for Localhost (127.0.0.1 / private subnets), Admin accounts, or when bypassed in server settings.
                  </p>
                </div>
              </section>

              {/* ================= 18. SCAN HISTORY ================= */}
              <section id="scan-history" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "scan-history") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <History className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Scan History</h2>
                </div>
                <div id="content-scan-history" className="space-y-4 text-xs text-text-dim leading-relaxed font-sans">
                  <p>
                    The Scan History page logs all security checks. Users can view past reports, filter records by target hostname, and verify score fluctuations over time.
                  </p>
                  <p>
                    Console Admins can purge all logs globally or delete individual logs to manage storage limits.
                  </p>
                </div>
              </section>

              {/* ================= 19. REPORTS & EXPORT OPTIONS ================= */}
              <section id="reports-export" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "reports-export") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <FileDown className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Reports &amp; Export Options</h2>
                </div>
                <div id="content-reports-export" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard provides several methods to share and export compliance reports:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-dim ml-2 font-semibold">
                    <li><span className="text-text">PDF Export:</span> Generates client-side PDF summaries including grade metrics, categories, finding descriptions, and recommendations.</li>
                    <li><span className="text-text">JSON Metadata:</span> Downloads the raw scan payload returned by backend routes.</li>
                    <li><span className="text-text">Public Share Link:</span> Generates unique, secure tokens (`shareToken`) to allow unauthorized viewers to access specific reports.</li>
                    <li><span className="text-text">Email Reports:</span> Dispatches the audit report directly to recipient mailboxes.</li>
                  </ul>
                </div>
              </section>

              {/* ================= 20. SETTINGS & CONFIGURATION ================= */}
              <section id="settings-configuration" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "settings-configuration") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Settings className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Settings &amp; Configuration</h2>
                </div>
                <div id="content-settings-configuration" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    The Profile Settings tab provides account configuration tools. Users can modify their security passwords, toggle notifications, or trigger account deletions, which recursively removes associated scans, monitors, and API keys.
                  </p>
                </div>
              </section>

              {/* ================= 21. ORGANIZATION & TEAM MANAGEMENT ================= */}
              <section id="organization-management" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "organization-management") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Users className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Organization &amp; Teams</h2>
                </div>
                <div id="content-organization-management" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    HeaderGuard currently operates on a single-tenant per-user authentication architecture. Team members can set up independent accounts. Enterprise administrative controls are centralized under Console Admins, who can enable, disable, and monitor individual accounts. Future roadmaps plan for multi-member organization scopes.
                  </p>
                </div>
              </section>

              {/* ================= 22. NOTIFICATIONS & AUDIT LOGS ================= */}
              <section id="notifications-logs" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "notifications-logs") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Bell className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Notifications &amp; Audit Logs</h2>
                </div>
                <div id="content-notifications-logs" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    Administrative governance tools log system actions to maintain compliance. The platform monitors:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-dim ml-2 font-semibold">
                    <li><span className="text-text">Verification Events:</span> Logs domain registration and verification logs.</li>
                    <li><span className="text-text">Quota Alerts:</span> Flags user daily limits utilization above 85% on the admin console dashboard.</li>
                    <li><span className="text-text">Failure Logs:</span> Records scanning failures, timeouts, block states, and rate limits.</li>
                  </ul>
                </div>
              </section>

              {/* ================= 23. FAQ ================= */}
              <section id="faq" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "faq") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <HelpCircle className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">FAQ</h2>
                </div>
                <div id="content-faq" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <div className="space-y-3 font-sans">
                    {[
                      {
                        q: "What is an HTTP Security Header?",
                        a: "HTTP Security Headers are server response directives that tell the user's browser how to handle website content. Correctly configuring these headers protects visitors against Cross-Site Scripting (XSS), clickjacking, and packet interception."
                      },
                      {
                        q: "Why is my security grade low even though SSL is valid?",
                        a: "Scoring is determined by points deductions across all categories. Even if your SSL certificate is valid, missing a Content-Security-Policy (CSP) or having exposed TCP ports will lower your grade."
                      },
                      {
                        q: "How does domain verification work?",
                        a: "Users upload a challenge token file to their server at `http://domain.com/headerguard-verification.txt`. The platform fetches this file to confirm ownership."
                      },
                      {
                        q: "What triggers a scan failure?",
                        a: "Scans fail if the target server is unreachable, denies HEAD/GET request patterns, times out (exceeds 10s limits), or resolves to private subnets (e.g. 192.168.x.x)."
                      }
                    ].map((faq, idx) => {
                      const isOpen = expandedFaqs[idx];
                      return (
                        <Card key={idx} className="p-4 bg-surface/30 border-white/[0.04]">
                          <button
                            onClick={() => setExpandedFaqs(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="w-full flex justify-between items-center text-xs font-bold text-text hover:text-accent transition-colors"
                          >
                            <span>{faq.q}</span>
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          {isOpen && (
                            <p className="mt-2.5 text-text-muted text-[11px] leading-relaxed border-t border-white/[0.03] pt-2.5">
                              {faq.a}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* ================= 24. TROUBLESHOOTING ================= */}
              <section id="troubleshooting" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "troubleshooting") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Wrench className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Troubleshooting</h2>
                </div>
                <div id="content-troubleshooting" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <div className="space-y-3 font-sans">
                    {[
                      {
                        issue: "Domain Ownership Verification Fails",
                        steps: "Ensure the verification file is hosted using HTTP/HTTPS on port 80/443 and is publicly accessible. Verify there are no redirect loops, and that the file returns exactly the token string without extra spaces, HTML markup, or formatting."
                      },
                      {
                        issue: "Crawling Timeouts / Blocked by Cloudflare WAF",
                        steps: "If your target page blocks scans, configure a Custom User-Agent string inside your Developer API settings. If you use Cloudflare, add a firewall rule to whitelist the HeaderGuard scanner User-Agent string or server IP."
                      },
                      {
                        issue: "API Quota Limits / Rate Limit Errors",
                        steps: "If you receive `QUOTA_EXCEEDED` or `RATE_LIMIT_EXCEEDED` errors, check your Developers tab to view current usage metrics. Daily quotas reset at 00:00 UTC. If you require higher limits, contact your account administrator."
                      }
                    ].map((t, idx) => {
                      const isOpen = expandedTrouble[idx];
                      return (
                        <Card key={idx} className="p-4 bg-surface/30 border-white/[0.04]">
                          <button
                            onClick={() => setExpandedTrouble(prev => ({ ...prev, [idx]: !prev[idx] }))}
                            className="w-full flex justify-between items-center text-xs font-bold text-text hover:text-accent transition-colors"
                          >
                            <span>Issue: {t.issue}</span>
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          {isOpen && (
                            <div className="mt-2.5 text-text-muted text-[11px] leading-relaxed border-t border-white/[0.03] pt-2.5 space-y-1.5">
                              <span className="font-bold text-text text-[10px] block">Remediation Steps:</span>
                              <p>{t.steps}</p>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* ================= 25. BEST PRACTICES ================= */}
              <section id="best-practices" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "best-practices") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Lightbulb className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Best Practices</h2>
                </div>
                <div id="content-best-practices" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <ul className="list-disc list-inside space-y-2 text-text-dim ml-2 font-semibold">
                    <li><span className="text-text">Use Domain whitelists:</span> Restrict developer API keys to whitelisted domains to prevent abuse.</li>
                    <li><span className="text-text">Establish Webhook Workflows:</span> Configure webhook URLs to automate compliance logging.</li>
                    <li><span className="text-text">Secure API Credentials:</span> Keep keys in environment variables, and rotate them regularly.</li>
                    <li><span className="text-text">Perform Selective Refreshes:</span> Use section refreshes during development to conserve scanning quotas.</li>
                  </ul>
                </div>
              </section>

              {/* ================= 26. SECURITY & PRIVACY ================= */}
              <section id="security-privacy" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "security-privacy") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <ShieldCheck className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Security &amp; Privacy</h2>
                </div>
                <div id="content-security-privacy" className="space-y-4 text-xs text-text-dim leading-relaxed font-sans">
                  <p>
                    HeaderGuard hashes user passwords using `bcrypt` (10 rounds) and hashes developer API keys in the database. 
                  </p>
                  <p>
                    Authentication cookies use HTTP-Only flags to block XSS credential access. Reports are private by default unless explicitly toggled to public sharing.
                  </p>
                </div>
              </section>

              {/* ================= 27. LIMITATIONS ================= */}
              <section id="limitations" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "limitations") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Limitations</h2>
                </div>
                <div id="content-limitations" className="space-y-4 text-xs text-text-dim leading-relaxed">
                  <p>
                    The platform implements several limits to balance infrastructure load and target compliance:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-text-dim ml-2 font-semibold">
                    <li><span className="text-text">Shallow Path Crawls:</span> The SEO/sensitive file crawler checks defined target lists. It does not recursively crawl all site subpages.</li>
                    <li><span className="text-text">Fixed Port Lists:</span> Port checks are limited to standard services in `attackSurface.json` (max 500 ports), rather than full 65k sweeps.</li>
                    <li><span className="text-text">Rate-Limit Bounds:</span> Scans resolve to a single IPv4/IPv6 target address; concurrent target sweeps are constrained by concurrency workers.</li>
                  </ul>
                </div>
              </section>

              {/* ================= 28. CHANGELOG ================= */}
              <section id="changelog" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "changelog") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <History className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Changelog</h2>
                </div>
                <div id="content-changelog" className="space-y-4 text-xs text-text-dim leading-relaxed font-mono">
                  <div className="space-y-4">
                    <div className="border-l-2 border-accent pl-3.5 space-y-1">
                      <span className="text-text font-bold text-xs">v2.2.0 - Active Release</span>
                      <p className="text-[10px] text-text-muted">Introduced automated Favicon &amp; logo crawler matching brand assets from webimg.json inside the SEO tab, and updated admin daily scan quotas to 27/day.</p>
                    </div>
                    <div className="border-l-2 border-white/10 pl-3.5 space-y-1">
                      <span className="text-text-dim font-bold text-xs">v2.1.0</span>
                      <p className="text-[10px] text-text-muted">Added support for selective section-level refreshes (DNS, SSL, Headers, Ports, Subdomains, SEO) and localized loading animations.</p>
                    </div>
                    <div className="border-l-2 border-white/10 pl-3.5 space-y-1">
                      <span className="text-text-dim font-bold text-xs">v2.0.0</span>
                      <p className="text-[10px] text-text-muted">Released database-backed Sliding IP Rate Limiter and developer API webhook integrations.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* ================= 29. FUTURE ROADMAP ================= */}
              <section id="future-roadmap" className={`space-y-4 scroll-mt-24 transition-opacity duration-300 ${
                filteredSections.some(s => s.id === "future-roadmap") ? "opacity-100" : "hidden"
              }`}>
                <div className="border-b border-white/[0.05] pb-3 flex items-center gap-3">
                  <Compass className="h-6 w-6 text-accent" />
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text font-mono">Future Roadmap</h2>
                </div>
                <div id="content-future-roadmap" className="space-y-4 text-xs text-text-dim leading-relaxed font-semibold">
                  <ul className="list-disc list-inside space-y-2 text-text-dim ml-2">
                    <li><span className="text-text">Slack &amp; Discord Alerts:</span> Automated notices dispatched to webhook endpoints.</li>
                    <li><span className="text-text">Scheduled Monitoring:</span> Running scans on configured days/hours automatically.</li>
                    <li><span className="text-text">Enterprise Team Scopes:</span> Access dashboards shared by multiple organization profiles.</li>
                  </ul>
                </div>
              </section>

              {/* Search Empty State */}
              {filteredSections.length === 0 && (
                <Card className="p-8 text-center space-y-3 font-sans text-xs text-text-muted italic max-w-md mx-auto my-12 border border-white/[0.04]">
                  No matching documentation sections found for "{searchQuery}". Try searching for other terms like "HSTS", "API", or "DMARC".
                </Card>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-accent text-bg hover:bg-accent-light rounded-full shadow-lg hover:shadow-glow transition-all duration-300 focus:outline-none"
          title="Scroll back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
