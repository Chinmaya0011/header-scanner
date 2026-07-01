"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { runSecurityAudit } from "@/lib/analyzer";
import { generateAIAdvice } from "@/lib/aiAssistant";
import { useToast } from "@/components/common/Toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Loading from "@/components/common/Loading";
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
  Server,
  Terminal,
  Lock,
  Download,
  FileText,
  Cookie,
  Key,
  Layout,
  Activity,
  Check,
  Search,
  Cpu,
  Fingerprint,
  Link2,
  Radio,
  FileCode,
  Mail,
  Code,
  Share2,
  RefreshCw,
  AlertOctagon,
  Shield,
  ArrowUpRight,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

export default function ScanResults({ result }) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [localResult, setLocalResult] = useState(result);
  const [isRescanning, setIsRescanning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [refreshingSection, setRefreshingSection] = useState(null);

  // Modals & Details Toggles
  const [selectedPort, setSelectedPort] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  const [selectedIp, setSelectedIp] = useState(null);
  const [sslDetailOpen, setSslDetailOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Search & filter states
  const [headersSearch, setHeadersSearch] = useState("");
  const [headersFilter, setHeadersFilter] = useState("all");
  const [globalSearch, setGlobalSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("severity");
  const [expandedHeaders, setExpandedHeaders] = useState([]);
  const [expandedFindings, setExpandedFindings] = useState({});
  const [remediationTab, setRemediationTab] = useState("nginx");
  const [copiedText, setCopiedText] = useState("");

  // Fetch current user and authentication status on mount
  useEffect(() => {
    setMounted(true);
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Auth status query failed:", err);
      }
    }
    checkAuth();
  }, []);

  // Update localResult when result prop changes
  useEffect(() => {
    if (result) {
      setLocalResult(result);
    }
  }, [result]);

  const {
    url,
    domain,
    score,
    grade,
    headers = [],
    statusCode,
    scanDuration,
    summary,
    compliance,
    vulnerabilities = [],
    checks = [],
    ssl,
    dns,
    infrastructure,
    techStack = [],
    cookies = [],
    deepCsp,
    httpProtocol,
    performance,
    robotsTxt,
    sitemapXml,
    sensitiveFiles = [],
    securityTxt,
    emailSecurity,
    privacy,
    subdomains = [],
    publicPages = [],
    exposedServices = [],
    loginSurfaces = [],
    whois,
    categoryScores,
    seo,
    metadata
  } = localResult || {};

  // Resolve fallbacks for SEO details if null/undefined in database
  const seoData = useMemo(() => {
    const defaultSeo = {
      title: "",
      description: "",
      canonicalUrl: "",
      metaRobots: "",
      isIndexable: true,
      h1Count: 0,
      h2Count: 0,
      imageCount: 0,
      imageAltCount: 0,
      favicon: "",
      openGraph: { title: "", description: "", image: "", type: "", url: "" },
      twitterCard: { card: "", title: "", description: "", image: "", site: "" },
      detectedImages: []
    };
    if (!seo) return defaultSeo;
    return {
      ...defaultSeo,
      ...seo,
      openGraph: { ...defaultSeo.openGraph, ...seo.openGraph },
      twitterCard: { ...defaultSeo.twitterCard, ...seo.twitterCard }
    };
  }, [seo]);

  // Compile checks
  const activeChecks = useMemo(() => {
    if (checks && checks.length > 0) return checks;
    try {
      const headerMap = {};
      if (headers && Array.isArray(headers)) {
        headers.forEach(h => {
          headerMap[h.name.toLowerCase()] = h.value;
        });
      }
      const audit = runSecurityAudit(headerMap, url, statusCode);
      return audit.checks || [];
    } catch (e) {
      return [];
    }
  }, [checks, headers, url, statusCode]);

  // Security posture helper
  const getSecurityPosture = () => {
    if (score >= 90) return { text: "Optimal Security", color: "text-success", bg: "bg-success/10", border: "border-success/20", glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]", badge: "success" };
    if (score >= 80) return { text: "Strong Protection", color: "text-success", bg: "bg-success/5", border: "border-success/15", glow: "shadow-[0_0_15px_rgba(34,197,94,0.1)]", badge: "success" };
    if (score >= 60) return { text: "Moderate Risks", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", glow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]", badge: "warning" };
    if (score >= 40) return { text: "Weak Safeguards", color: "text-warning", bg: "bg-warning/5", border: "border-warning/15", glow: "shadow-[0_0_15px_rgba(234,179,8,0.08)]", badge: "warning" };
    return { text: "Critical Risks", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20", glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]", badge: "danger" };
  };

  const posture = getSecurityPosture();

  const computedScores = useMemo(() => {
    return {
      headers: categoryScores?.headers ?? score ?? 0,
      ssl: categoryScores?.ssl ?? (ssl && ssl.expirationDate !== null ? (ssl.valid ? 100 : 40) : 0),
      dns: categoryScores?.dns ?? (dns ? ((dns.spf?.valid ? 30 : 10) + (dns.dmarc?.valid ? 30 : 10) + (dns.dnssec ? 40 : 10)) : 0),
      cookies: categoryScores?.cookies ?? (cookies.length > 0 ? Math.round((cookies.filter(c => c.httpOnly && c.secure).length / cookies.length) * 100) : 100),
      attackSurface: categoryScores?.exposure ?? Math.max(10, 100 - (exposedServices.filter(s => s.status === "open").length * 20) - (sensitiveFiles.filter(f => f.exists).length * 10) - (subdomains.length * 2)),
      compliance: categoryScores?.compliance ?? Math.round((([compliance?.GDPR?.compliant, compliance?.PCI_DSS?.compliant, compliance?.OWASP?.compliant, compliance?.NIST?.compliant].filter(Boolean).length) / 4) * 100)
    };
  }, [categoryScores, score, ssl, dns, cookies, compliance, exposedServices, sensitiveFiles, subdomains]);

  const unifiedFindings = useMemo(() => {
    const list = [];

    // Add header checks
    if (activeChecks && Array.isArray(activeChecks)) {
      activeChecks.forEach(c => {
        list.push({
          title: c.title || c.name || "HTTP Security Header Check",
          status: c.status || "failed",
          severity: c.severity || "medium",
          category: "Security Headers",
          description: c.description || "Evaluates security headers configuration.",
          evidence: c.evidence || "No evidence recorded.",
          recommendation: c.recommendation || null,
          impact: c.impact || "Lack of headers exposes pages to framing, injection or hijack vectors."
        });
      });
    }

    // SSL Checks
    if (ssl && ssl.expirationDate !== null) {
      list.push({
        title: "SSL/TLS Certificate Trusted Status",
        status: ssl.valid ? "passed" : "failed",
        severity: ssl.valid ? "info" : "critical",
        category: "SSL/TLS Health",
        description: "Checks if the domain's certificate is signed by a globally trusted Certificate Authority.",
        evidence: `CA Issuer: ${ssl.issuer || "Unknown"}. Valid: ${ssl.valid ? "Yes" : "No"}`,
        recommendation: ssl.valid ? null : "Install a trusted SSL certificate immediately.",
        impact: ssl.valid ? "Secures connection trust." : "Connections expose warning pages and invite intercepts."
      });

      if (ssl.daysRemaining !== null) {
        const isExpiring = ssl.daysRemaining < 30;
        list.push({
          title: "SSL/TLS Certificate Validity Window",
          status: isExpiring ? "failed" : "passed",
          severity: isExpiring ? "high" : "info",
          category: "SSL/TLS Health",
          description: "Tracks certificate validity duration to ensure continuity.",
          evidence: `${ssl.daysRemaining} days remaining before expiration.`,
          recommendation: isExpiring ? "Renew the SSL/TLS certificate immediately." : null,
          impact: isExpiring ? "Service downtime when certificate expires." : "Sufficient active validity."
        });
      }
    }

    // DNS Checks
    if (dns) {
      const dnssecValid = dns.dnssec;
      list.push({
        title: "DNSSEC Zone Authentication Protection",
        status: dnssecValid ? "passed" : "warning",
        severity: dnssecValid ? "info" : "low",
        category: "DNS Security",
        description: "Protects zones from spoofing and cache poisoning by cryptographically validating DNS queries.",
        evidence: dnssecValid ? "DNSSEC keys configured." : "DNSSEC is disabled.",
        recommendation: dnssecValid ? null : "Enable DNSSEC key signing at your registrar.",
        impact: dnssecValid ? "Authenticated zone resolution." : "Risk of DNS cache poisoning redirects."
      });
    }

    // Email Security
    if (emailSecurity) {
      list.push({
        title: "SPF Authentication Policy",
        status: emailSecurity.spfPresent ? "passed" : "failed",
        severity: emailSecurity.spfPresent ? "info" : "high",
        category: "Email Integrity",
        description: "SPF defines mail relay servers permitted to send domain's emails.",
        evidence: emailSecurity.spfPresent ? "SPF TXT record resolved." : "SPF TXT record missing.",
        recommendation: emailSecurity.spfPresent ? null : "Publish a standard SPF record.",
        impact: emailSecurity.spfPresent ? "Prevents unauthenticated relay." : "Spoofing templates invite spam."
      });

      list.push({
        title: "DMARC Spoofing Quarantine Policy",
        status: emailSecurity.dmarcPresent ? "passed" : "failed",
        severity: emailSecurity.dmarcPresent ? "info" : "high",
        category: "Email Integrity",
        description: "DMARC controls recipient actions when SPF/DKIM validations fail.",
        evidence: emailSecurity.dmarcPresent ? "DMARC TXT record resolved." : "DMARC TXT record missing.",
        recommendation: emailSecurity.dmarcPresent ? null : "Configure a DMARC policy with quarantine/reject mode.",
        impact: emailSecurity.dmarcPresent ? "Enforces validation rules." : "Allows spoofed mail relays directly to user inboxes."
      });

      list.push({
        title: "MTA-STS Strict Mail Handshake",
        status: emailSecurity.mtaStsPresent ? "passed" : "warning",
        severity: emailSecurity.mtaStsPresent ? "info" : "medium",
        category: "Email Integrity",
        description: "Enforces TLS encryption on inbound mail server relays.",
        evidence: emailSecurity.mtaStsPresent ? "MTA-STS policy configured." : "MTA-STS check omitted.",
        recommendation: emailSecurity.mtaStsPresent ? null : "Enable MTA-STS DNS key and policies.",
        impact: emailSecurity.mtaStsPresent ? "Encrypted SMTP traffic." : "SMTP fallback allows plaintext sniffing."
      });
    }

    // Privacy Checks
    if (privacy) {
      list.push({
        title: "Linked Privacy Policy Document",
        status: privacy.privacyPolicyPresent ? "passed" : "warning",
        severity: privacy.privacyPolicyPresent ? "info" : "medium",
        category: "Compliance & Privacy",
        description: "Verifies if the website links to transparent legal terms.",
        evidence: privacy.privacyPolicyPresent ? `URL: ${privacy.privacyPolicyUrl}` : "Privacy policy links absent.",
        recommendation: privacy.privacyPolicyPresent ? null : "Link a standard compliance Privacy Policy in page footers.",
        impact: privacy.privacyPolicyPresent ? "Legal compliance active." : "GDPR/CCPA penalty audit risk."
      });

      list.push({
        title: "Cookie Consent Alert System",
        status: privacy.cookieBannerPresent ? "passed" : "warning",
        severity: privacy.cookieBannerPresent ? "info" : "low",
        category: "Compliance & Privacy",
        description: "Ensures standard cookie notification prompts exist.",
        evidence: privacy.cookieBannerPresent ? "Consent alert verified." : "Consent alert not discovered.",
        recommendation: privacy.cookieBannerPresent ? null : "Integrate a modern cookie consent banner.",
        impact: privacy.cookieBannerPresent ? "Interactive consent resolved." : "Inability to document compliance consent."
      });
    }

    // Exposed Gateways (Ports)
    if (exposedServices && exposedServices.length > 0) {
      exposedServices.forEach(srv => {
        const isOpen = srv.status === "open";
        list.push({
          title: `Administrative Interface Port Exposure (Port ${srv.port})`,
          status: isOpen ? "failed" : "passed",
          severity: isOpen ? (srv.port === 80 ? "medium" : "high") : "info",
          category: "Attack Surface",
          description: `Checks for open TCP ports that invite brute-force and port mapping scanning.`,
          evidence: `Port: ${srv.port} | Service: ${srv.service} | Status: ${srv.status}`,
          recommendation: isOpen ? `Apply firewall whitelisting constraints to block public ports exposure.` : null,
          impact: isOpen ? "Daemon vulnerabilities search vectors exposed." : "Port securely filtered."
        });
      });
    }

    // Sensitive Directory configurations
    if (sensitiveFiles && sensitiveFiles.length > 0) {
      sensitiveFiles.forEach(file => {
        if (file.exists) {
          list.push({
            title: `Exposed Administrative Path: ${file.path}`,
            status: "failed",
            severity: "critical",
            category: "Attack Surface",
            description: "Detects exposed administrative console or backup folders.",
            evidence: `Path resolved with status HTTP ${file.status || 200}`,
            recommendation: `Add access rules to deny public requests to this directory.`,
            impact: "Severe credentials leaks or server takeover vectors."
          });
        }
      });
    }

    return list;
  }, [activeChecks, ssl, dns, emailSecurity, privacy, exposedServices, sensitiveFiles]);

  const passedCount = useMemo(() => unifiedFindings.filter(f => f.status === "passed").length, [unifiedFindings]);
  const warningCount = useMemo(() => unifiedFindings.filter(f => f.status === "warning" || (f.status === "info" && f.severity !== "info")).length, [unifiedFindings]);
  const failedCount = useMemo(() => unifiedFindings.filter(f => f.status === "failed").length, [unifiedFindings]);

  // Group findings by severity
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    unifiedFindings.forEach(c => {
      if (c.status !== "passed") {
        const sev = (c.severity || "info").toLowerCase();
        if (sev in counts) counts[sev]++;
        else if (sev === "informational") counts.info++;
        else counts.low++;
      } else {
        counts.info++;
      }
    });
    return counts;
  }, [unifiedFindings]);

  // Filter & Search checks
  const filteredFindings = useMemo(() => {
    let list = unifiedFindings;

    if (globalSearch.trim() !== "") {
      const q = globalSearch.toLowerCase();
      list = list.filter(c =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.recommendation || "").toLowerCase().includes(q) ||
        (c.evidence || "").toLowerCase().includes(q)
      );
    }

    if (severityFilter !== "all") {
      list = list.filter(c => {
        const sev = (c.severity || "info").toLowerCase();
        if (severityFilter === "info") {
          return sev === "info" || sev === "informational" || c.status === "passed";
        }
        return sev === severityFilter && c.status !== "passed";
      });
    }

    if (categoryFilter !== "all") {
      list = list.filter(c => c.category?.toLowerCase() === categoryFilter.toLowerCase());
    }

    const sorted = [...list];
    if (sortOrder === "severity") {
      const weight = { critical: 5, high: 4, medium: 3, low: 2, info: 1, informational: 1 };
      sorted.sort((a, b) => {
        const aWeight = a.status === "passed" ? 0 : (weight[a.severity?.toLowerCase()] || 1);
        const bWeight = b.status === "passed" ? 0 : (weight[b.severity?.toLowerCase()] || 1);
        return bWeight - aWeight;
      });
    } else if (sortOrder === "alphabetical") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortOrder === "category") {
      sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    }

    return sorted;
  }, [unifiedFindings, globalSearch, severityFilter, categoryFilter, sortOrder]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set();
    unifiedFindings.forEach(f => {
      if (f.category) cats.add(f.category);
    });
    return Array.from(cats);
  }, [unifiedFindings]);

  // Secrets mapping
  const secretsList = useMemo(() => {
    if (!sensitiveFiles || sensitiveFiles.length === 0) return [];
    const sensitiveKeywords = ["env", "git", "config", "key", "secret", "credential", "backup", "token", "rsa", "pem", "sql", "sqlite", "passwd", "shadow"];
    return sensitiveFiles.map(file => {
      const name = file.path.split("/").pop() || file.path;
      const isSensitive = sensitiveKeywords.some(kw => file.path.toLowerCase().includes(kw));
      return {
        ...file,
        name,
        isSensitive,
        category: file.path.includes(".git") ? "Version Control" :
          file.path.includes("env") ? "Environment Variables" :
            file.path.includes("backup") || file.path.includes("sql") ? "Database Backups" : "Credentials & Keys"
      };
    });
  }, [sensitiveFiles]);

  const aiAdvice = useMemo(() => {
    return generateAIAdvice({
      checks: activeChecks,
      headers,
      ssl,
      dns,
      cookies,
      sensitiveFiles
    });
  }, [activeChecks, headers, ssl, dns, cookies, sensitiveFiles]);

  // Actions handlers
  const handleRefreshSection = async (sectionKey) => {
    if (!domain || refreshingSection) return;
    setRefreshingSection(sectionKey);
    toast.info(`Refreshing ${sectionKey.toUpperCase()} section data...`);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain, section: sectionKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Section refresh failed.");
      }
      setLocalResult(data.data || data);
      toast.success(`${sectionKey.toUpperCase()} data refreshed successfully!`);
    } catch (e) {
      toast.error(e.message || `Failed to refresh ${sectionKey} section.`);
    } finally {
      setRefreshingSection(null);
    }
  };

  const renderSectionLoader = (sectionKey) => {
    if (refreshingSection !== sectionKey) return null;
    return (
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm z-35 flex flex-col items-center justify-center space-y-3 rounded-2xl animate-fadeIn min-h-[250px]">
        <RefreshCw className="h-6 w-6 text-accent animate-spin" />
        <span className="text-[10px] font-bold tracking-widest text-text-dim uppercase font-mono">
          Syncing {sectionKey.toUpperCase()} data matrix...
        </span>
      </div>
    );
  };

  const handleRescan = async () => {
    if (!domain) return;
    setIsRescanning(true);
    toast.info(`Initiating security scan for ${domain}...`);
    try {
      const endpoint = localResult?.isPublicScan ? "/api/scan/public" : "/api/scan";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Rescan failed.");
      }
      setLocalResult(data.data || data);
      toast.success("Security posture scan completed successfully!");
    } catch (e) {
      toast.error(e.message || "Failed to complete rescan.");
    } finally {
      setIsRescanning(false);
    }
  };

  const handleScanSubdomain = async (subdomainName) => {
    if (!subdomainName) return;
    setIsRescanning(true);
    toast.info(`Running EASM scan for subdomain: ${subdomainName}...`);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: subdomainName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Scan failed.");
      }
      setLocalResult(data.data || data);
      toast.success(`Subdomain scan resolved successfully for ${subdomainName}`);
    } catch (e) {
      toast.error(e.message || "Failed to complete scan on subdomain.");
    } finally {
      setIsRescanning(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!localResult) return;
    toast.info("Generating professional PDF report...");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor = "#0f172a";
      const accentColor = "#6366f1";
      const successColor = "#10b981";
      const warningColor = "#f59e0b";
      const dangerColor = "#ef4444";
      const textColor = "#334155";
      const textLightColor = "#64748b";

      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 42, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor("#ffffff");
      doc.text("HeaderGuard Security Assessment", 15, 18);

      const scanDateStr = metadata?.timestamp || new Date().toISOString();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor("#94a3b8");
      doc.text(`Scanned: ${new Date(scanDateStr).toLocaleString()} | Duration: ${scanDuration || 0}ms`, 15, 27);
      doc.text(`Target Host Domain: ${domain}`, 15, 34);

      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Vulnerability Audit Summary", 15, 54);

      doc.setDrawColor("#e2e8f0");
      doc.setFillColor("#f8fafc");
      doc.roundedRect(15, 59, 180, 28, 2, 2, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(textColor);
      doc.text(`Target Domain Host: ${domain}`, 20, 67);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textLightColor);
      doc.text(`Security Grade:`, 20, 78);

      let gColor = dangerColor;
      if (grade.startsWith("A")) gColor = successColor;
      else if (grade.startsWith("B")) gColor = accentColor;
      else if (grade.startsWith("C")) gColor = warningColor;

      doc.setTextColor(gColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(grade, 50, 78);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(textLightColor);
      doc.text(`Posture Score:`, 105, 78);

      doc.setTextColor(accentColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text(`${score}/100`, 135, 78);

      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Vulnerabilities & Hardening Checks", 15, 102);

      let yOffset = 111;

      activeChecks.forEach((header) => {
        if (yOffset > 265) {
          doc.addPage();
          yOffset = 25;
        }

        doc.setDrawColor("#e2e8f0");
        doc.line(15, yOffset - 4, 195, yOffset - 4);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(primaryColor);
        doc.text(header.title || header.name, 15, yOffset);

        let statusText = "Failed";
        let statusColor = dangerColor;
        if (header.status === "passed") {
          statusText = "Passed";
          statusColor = successColor;
        } else if (header.status === "warning") {
          statusText = "Warning";
          statusColor = warningColor;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(statusColor);
        doc.text(statusText, 130, yOffset);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(textLightColor);
        doc.text(`Severity: ${(header.severity || "Low").toUpperCase()}`, 162, yOffset);

        yOffset += 5.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColor);

        const splitDesc = doc.splitTextToSize(header.description || "", 175);
        doc.text(splitDesc, 15, yOffset);
        yOffset += splitDesc.length * 3.5 + 2;

        if (header.status !== "passed" && header.recommendation) {
          const recText = doc.splitTextToSize(header.recommendation, 140);
          const blockHeight = Math.max(8, recText.length * 3.5 + 3);

          if (yOffset + blockHeight > 275) {
            doc.addPage();
            yOffset = 25;
          }

          doc.setFillColor("#fffbeb");
          doc.setDrawColor("#fef3c7");
          doc.roundedRect(15, yOffset - 2, 180, blockHeight, 1, 1, "FD");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor("#b45309");
          doc.text("RECOMMENDED FIX:", 18, yOffset + 1.5);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor("#78350f");
          doc.text(recText, 50, yOffset + 1.5);

          yOffset += blockHeight + 4.5;
        } else {
          yOffset += 3.5;
        }
      });

      doc.save(`HeaderGuard_Audit_Report_${domain}.pdf`);
      toast.success("PDF report downloaded successfully.");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report.");
    }
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localResult, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `headerguard-scan-${domain || "audit"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("JSON report downloaded successfully.");
  };

  const isOwnerOrAdmin = useMemo(() => {
    if (!currentUser || !localResult) return false;
    return (
      currentUser.role === "admin" ||
      (localResult.owner && currentUser._id && localResult.owner.toString() === currentUser._id.toString())
    );
  }, [currentUser, localResult]);

  const handleShare = () => {
    const scanId = localResult._id || localResult.scanId;
    if (!scanId) {
      if (typeof window !== "undefined") {
        const shareUrl = `${window.location.origin}/scanner?url=${encodeURIComponent(domain || "")}`;
        navigator.clipboard.writeText(shareUrl);
        toast.success("Public scanner link copied to clipboard!");
      }
      return;
    }
    setShareModalOpen(true);
  };

  const handleTogglePublic = async () => {
    const scanId = localResult._id || localResult.scanId;
    if (!scanId) return;
    try {
      const res = await fetch(`/api/scan/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !localResult.isPublic }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalResult(prev => ({
          ...prev,
          isPublic: data.isPublic,
          shareToken: data.shareToken
        }));
        toast.success(data.isPublic ? "Report is now publicly accessible!" : "Report is now private.");
      } else {
        throw new Error(data.error || "Failed to update sharing settings.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update sharing settings.");
    }
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();
    const scanId = localResult._id || localResult.scanId;
    const trimmedRecipient = recipientEmail.trim();
    if (!trimmedRecipient) {
      toast.error("Email address is required.");
      return;
    }
    setEmailLoading(true);
    try {
      const res = await fetch(`/api/scan/${scanId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: trimmedRecipient }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send email report.");
      }
      toast.success(`Security audit report successfully shared with ${trimmedRecipient}!`);
      setEmailModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to send email report.");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText("Copied!");
    setTimeout(() => setCopiedText(""), 2000);
  };

  const toggleHeaderExpand = (headerName) => {
    setExpandedHeaders(prev =>
      prev.includes(headerName) ? prev.filter(h => h !== headerName) : [...prev, headerName]
    );
  };

  const toggleFindingExpand = (idx) => {
    setExpandedFindings(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const filteredHeaders = useMemo(() => {
    if (!headers || !Array.isArray(headers)) return [];
    let list = headers;
    if (headersSearch.trim()) {
      const q = headersSearch.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || (h.value || "").toLowerCase().includes(q));
    }
    if (headersFilter !== "all") {
      list = list.filter(h => h.status === headersFilter);
    }
    return list;
  }, [headers, headersSearch, headersFilter]);

  // Define tab navigation elements dynamically based on what data is present
  const availableTabs = useMemo(() => {
    return [
      { id: "overview", label: "Overview", icon: Layout, show: true },
      { id: "headers", label: "Security Headers", icon: ShieldCheck, show: headers && headers.length > 0, count: headers.filter(h => h.status !== "present").length },
      { id: "ssl", label: "SSL/TLS", icon: Lock, show: true },
      { id: "dns", label: "DNS Security", icon: Globe, show: true },
      { id: "whois", label: "WHOIS / Domain", icon: Calendar, show: true },
      { id: "ports", label: "Open Ports", icon: Terminal, show: true, count: exposedServices?.filter(s => s.status === "open").length || 0 },
      { id: "subdomains", label: "Subdomains", icon: Layers, show: true, count: subdomains?.length || 0 },
      { id: "pages", label: "Public Pages", icon: Link2, show: true, count: publicPages?.length || 0 },
      { id: "attack-surface", label: "Attack Surface", icon: Fingerprint, show: true, count: (sensitiveFiles?.filter(f => f.exists).length || 0) + (loginSurfaces?.length || 0) },
      { id: "seo", label: "SEO Data", icon: Search, show: true },
      { id: "performance", label: "Performance", icon: Activity, show: true },
      { id: "tech", label: "Tech Stack", icon: Cpu, show: true },
      { id: "recommendations", label: "Guidelines", icon: BookOpen, show: true, count: failedCount + warningCount },
      { id: "raw", label: "Raw JSON", icon: Code, show: true }
    ].filter(tab => tab.show);
  }, [headers, ssl, dns, exposedServices, subdomains, publicPages, sensitiveFiles, loginSurfaces, seo, performance, techStack, failedCount, warningCount, whois]);

  const isFirewallProtected = localResult?.isFirewallProtected || localResult?.statusCode === 403 || localResult?.statusCode === 401;

  if (isRescanning) {
    return (
      <div className="max-w-2xl mx-auto w-full py-16 text-center">
        <Loading message="RESCANNING ENDPOINT SECURITY MATRIX..." />
      </div>
    );
  }

  return (
    <div className="font-sans text-text max-w-6xl mx-auto space-y-8">
      
      {/* 1. SECURITY AUDIT HEADER TOOLBAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface/40 border border-white/[0.04] p-4.5 rounded-2xl backdrop-blur-md shadow-lg">
        {/* Left Side: Target Domain Asset */}
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
            <Globe className="h-5 w-5" />
          </div>
          <div className="min-w-0 text-left">
            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono block">Target Host Address</span>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black font-mono tracking-tight text-text select-all truncate" title={domain}>
                {domain}
              </h1>
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(domain)}
                  className="p-1 rounded bg-white/5 border border-white/[0.04] hover:bg-white/10 text-text-dim hover:text-text transition-all flex items-center gap-1"
                  title="Copy Domain Address"
                >
                  <Copy className="h-3 w-3" />
                  {copiedText && <span className="text-[8px] text-accent font-black font-mono">{copiedText}</span>}
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-white/5 border border-white/[0.04] hover:bg-white/10 text-text-dim hover:text-text transition-all">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Sleek Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <Button onClick={handleRescan} variant="outline" size="sm" icon={RefreshCw} className="hover:border-accent/40 hover:text-accent font-extrabold text-[9.5px] tracking-wider px-3.5 py-2">
            Re-scan
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" size="sm" icon={Download} className="hover:border-success/40 hover:text-success font-extrabold text-[9.5px] tracking-wider px-3.5 py-2">
            Export PDF
          </Button>
          <Button onClick={downloadJSON} variant="outline" size="sm" icon={FileCode} className="hover:border-blue-400/40 hover:text-blue-400 font-extrabold text-[9.5px] tracking-wider px-3.5 py-2">
            Raw JSON
          </Button>
          <Button onClick={handleShare} variant="outline" size="sm" icon={Share2} className="hover:border-indigo-400/40 hover:text-indigo-400 font-extrabold text-[9.5px] tracking-wider px-3.5 py-2">
            Share
          </Button>
          {currentUser && (
            <Button onClick={() => { setRecipientEmail(currentUser.email); setEmailModalOpen(true); }} variant="outline" size="sm" icon={Mail} className="hover:border-purple-400/40 hover:text-purple-400 font-extrabold text-[9.5px] tracking-wider px-3.5 py-2">
              Email PDF
            </Button>
          )}
        </div>
      </div>

      {/* 2. SECURITY METRICS KEYCARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Rating & Grade Card */}
        <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/30 border border-white/[0.05] rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group min-h-[125px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/5 to-transparent pointer-events-none rounded-full blur-2xl" />
          <div className="space-y-2 text-left relative z-10">
            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono block">Security Rating</span>
            <h3 className="text-[11.5px] font-bold text-text-dim">Overall posture evaluation grade</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9.5px] text-text-muted font-bold font-mono">Status:</span>
              <span className={`text-[9.5px] font-extrabold font-mono uppercase ${
                grade.startsWith("A") || grade.startsWith("B") ? "text-success" : "text-danger"
              }`}>
                {grade.startsWith("A") || grade.startsWith("B") ? "Secure Target" : "Vulnerable Target"}
              </span>
            </div>
          </div>
          <div className={`text-4xl font-black px-6 py-3 rounded-2xl border font-mono shrink-0 select-none transition-all duration-300 relative z-10 ${
            grade.startsWith("A") ? "text-success bg-success/5 border-success/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]" :
            grade.startsWith("B") ? "text-accent bg-accent/5 border-accent/20 shadow-[0_0_20px_rgba(99,102,241,0.2)]" :
            grade.startsWith("C") || grade.startsWith("D") ? "text-warning bg-warning/5 border-warning/20 shadow-[0_0_20px_rgba(245,158,11,0.2)]" :
            "text-danger bg-danger/5 border-danger/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          }`}>
            {grade}
          </div>
        </Card>

        {/* Posture Score Circular Gauge */}
        <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/30 border border-white/[0.05] rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group min-h-[125px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/5 to-transparent pointer-events-none rounded-full blur-2xl" />
          <div className="space-y-2 text-left relative z-10">
            <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono block">Threat Level</span>
            <Badge variant={posture.badge} className="text-[8.5px] uppercase tracking-widest font-black py-1 px-3 rounded-xl block w-max">
              {posture.text}
            </Badge>
            <p className="text-[9.5px] text-text-muted font-bold font-mono mt-1">Based on dynamic vulnerability profiling checks</p>
          </div>
          
          <div className="relative flex items-center justify-center h-20 w-20 flex-shrink-0 z-10 select-none">
            <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
              <circle cx="40" cy="40" r="34" className="stroke-white/[0.04] fill-none" strokeWidth="4.5" />
              <circle
                cx="40"
                cy="40"
                r="34"
                className={`fill-none transition-all duration-1000 ${
                  score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-danger"
                }`}
                strokeWidth="4.5"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black font-mono text-text leading-none">{score}</span>
              <span className="text-[8px] font-bold text-text-muted font-mono mt-0.5">/100</span>
            </div>
          </div>
        </Card>

        {/* Scan Telemetry Metadata */}
        <Card className="p-5 bg-gradient-to-br from-surface/80 to-surface/30 border border-white/[0.05] rounded-2xl flex flex-col justify-between shadow-lg relative overflow-hidden group min-h-[125px]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/5 to-transparent pointer-events-none rounded-full blur-2xl" />
          <div className="w-full relative z-10 space-y-2.5 font-mono text-[10.5px]">
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-bold text-[9px] uppercase tracking-wider">HTTP Status</span>
              {statusCode !== undefined ? (
                <span className={`font-black font-mono ${statusCode >= 400 ? "text-danger" : "text-success"}`}>
                  HTTP {statusCode}
                </span>
              ) : (
                <span className="text-text-muted">N/A</span>
              )}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-bold text-[9px] uppercase tracking-wider">Scan Duration</span>
              <span className="text-text font-black">{scanDuration ? `${scanDuration}ms` : "N/A"}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-muted font-bold text-[9px] uppercase tracking-wider">Audit Date</span>
              <span className="text-text font-black">
                {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
              </span>
            </div>
          </div>
        </Card>
      </div>


      {/* 2. HORIZONTAL TAB SELECTOR */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/[0.04]">
        {availableTabs.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11.5px] font-bold tracking-wider transition-all duration-300 border whitespace-nowrap ${
                isActive
                  ? "bg-gradient-to-r from-accent/15 to-indigo-500/10 text-accent border-accent/30 shadow-[0_4px_16px_rgba(99,102,241,0.15)] scale-[1.02]"
                  : "text-text-dim hover:text-text hover:bg-white/[0.03] border-transparent"
              }`}
            >
              <Icon className={`h-4 w-4 transition-transform duration-300 ${isActive ? "rotate-3 scale-110" : ""}`} />
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-md ${isActive ? "bg-accent/30 text-accent" : "bg-white/5 text-text-dim"}`}>
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. WORKSPACE CONTENT */}
      <main className="w-full">

        {/* ==================== 1. OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn text-left">
            {isFirewallProtected && (
              <Card className="p-5 bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 rounded-2xl flex gap-4 text-left items-start shadow-lg">
                <AlertOctagon className="h-5.5 w-5.5 text-warning shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-warning font-mono">
                    Active Bot Mitigation Firewall Detected
                  </h4>
                  <p className="text-[10.5px] text-text-dim leading-relaxed">
                    The target endpoint responded with an HTTP status of <strong>{statusCode || 403} Forbidden</strong>. 
                    A Web Application Firewall (WAF) or bot blocker (e.g. Vercel Security Checkpoint, Cloudflare) intercepted the scanning process.
                    Some headers and security results represent the edge firewall config, not the origin codebase environment.
                  </p>
                </div>
              </Card>
            )}

            <div className="border-b border-white/[0.05] pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Executive Posture Dashboard</h2>
              <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Posture scores, risk severity metrics, and category diagnostic charts.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Domain Card */}
              <Card className="p-5 bg-gradient-to-br from-surface/60 to-surface/20 border border-white/[0.04] flex flex-col justify-between min-h-[140px] shadow-lg rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative z-10">
                  <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono">Domain Identifier</span>
                  <h3 className="text-lg font-bold font-mono tracking-tight text-accent mt-2 truncate select-all">
                    {domain}
                  </h3>
                </div>
                <div className="flex gap-2 items-center mt-3 pt-3 border-t border-white/[0.04] relative z-10 text-[10px] text-text-dim font-mono uppercase font-bold">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <span>HTTP Response: <strong className="text-text font-black">{statusCode || 200}</strong></span>
                </div>
              </Card>

              {/* Score Card */}
              <Card className="p-5 bg-gradient-to-br from-surface/60 to-surface/20 border border-white/[0.04] flex items-center justify-between min-h-[140px] shadow-lg rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="space-y-2 relative z-10">
                  <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono">Posture Score</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black font-mono text-accent">{score}</span>
                    <span className="text-text-dim text-[11px] font-mono">/100</span>
                  </div>
                  <Badge variant={posture.badge} className="text-[8px] uppercase tracking-wider font-black py-0.5 px-2">
                    {posture.text}
                  </Badge>
                </div>
                <div className="relative flex items-center justify-center h-20 w-20 flex-shrink-0 z-10 transition-transform duration-300 group-hover:scale-105 select-none">
                  <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                    <circle cx="40" cy="40" r="34" className="stroke-white/[0.04] fill-none" strokeWidth="5" />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className={`fill-none transition-all duration-1000 ${
                        score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-danger"
                      }`}
                      strokeWidth="5"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - score / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="text-sm font-black font-mono text-text">{grade}</span>
                </div>
              </Card>

              {/* Findings */}
              <Card className="p-5 bg-gradient-to-br from-surface/60 to-surface/20 border border-white/[0.04] flex flex-col justify-between min-h-[140px] shadow-lg rounded-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="relative z-10 w-full">
                  <span className="text-[8px] font-black text-text-muted uppercase tracking-widest font-mono">Audits Checklist Status</span>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs font-mono">
                    <div className="bg-success/5 border border-success/15 p-2 rounded-xl text-success hover:bg-success/10 transition-all duration-300">
                      <div className="font-extrabold text-sm">{passedCount}</div>
                      <div className="text-[7.5px] text-text-dim font-bold uppercase tracking-wider mt-0.5">Pass</div>
                    </div>
                    <div className="bg-warning/5 border border-warning/15 p-2 rounded-xl text-warning hover:bg-warning/10 transition-all duration-300">
                      <div className="font-extrabold text-sm">{warningCount}</div>
                      <div className="text-[7.5px] text-text-dim font-bold uppercase tracking-wider mt-0.5">Warn</div>
                    </div>
                    <div className="bg-danger/5 border border-danger/15 p-2 rounded-xl text-danger hover:bg-danger/10 transition-all duration-300">
                      <div className="font-extrabold text-sm">{failedCount}</div>
                      <div className="text-[7.5px] text-text-dim font-bold uppercase tracking-wider mt-0.5">Fail</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              
              {/* Risk Distribution Chart */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Audited Risk Metrics
                </h3>
                <div className="h-48 w-full mt-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 text-[9.5px] font-bold font-mono flex-grow">
                    {[
                      { name: "Verify Passed", value: passedCount, color: "#10b981" },
                      { name: "Hardening Alerts", value: warningCount, color: "#f59e0b" },
                      { name: "Vulnerabilities Found", value: failedCount, color: "#ef4444" }
                    ].map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-bg/50 border border-white/[0.02]">
                        <span className="flex items-center gap-1.5" style={{ color: d.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-extrabold text-text">{d.value}</span>
                      </div>
                    ))}
                  </div>
                  {mounted && (
                    <div className="h-32 w-32 flex-shrink-0 relative select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Passed", value: passedCount, color: "#10b981" },
                              { name: "Warning", value: warningCount, color: "#f59e0b" },
                              { name: "Failed", value: failedCount, color: "#ef4444" }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={40}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { color: "#10b981" },
                              { color: "#f59e0b" },
                              { color: "#ef4444" }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                        <span className="text-sm font-black text-text">{passedCount + warningCount + failedCount}</span>
                        <span className="text-[7.5px] text-text-muted uppercase tracking-wider">Total</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Severity Bar Chart */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-accent" /> Severity Posture Checklist
                </h3>
                <div className="h-48 w-full mt-4 select-none">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: "Critical", value: severityCounts.critical, fill: "#ef4444" },
                        { name: "High", value: severityCounts.high, fill: "#f97316" },
                        { name: "Medium", value: severityCounts.medium, fill: "#f59e0b" },
                        { name: "Low", value: severityCounts.low, fill: "#3b82f6" },
                        { name: "Info", value: severityCounts.info, fill: "#10b981" }
                      ]} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={8} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", fontSize: "10px" }}
                          itemStyle={{ color: "#f3f4f6" }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {[
                            { fill: "#ef4444" },
                            { fill: "#f97316" },
                            { fill: "#f59e0b" },
                            { fill: "#3b82f6" },
                            { fill: "#10b981" }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Radar Chart */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-accent" /> Category Analysis Radar
                </h3>
                <div className="h-48 w-full mt-4 flex items-center justify-center select-none">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="68%" data={[
                        { subject: "Headers", score: computedScores.headers },
                        { subject: "SSL/TLS", score: computedScores.ssl },
                        { subject: "DNS", score: computedScores.dns },
                        { subject: "Cookies", score: computedScores.cookies },
                        { subject: "Exposure", score: computedScores.attackSurface },
                        { subject: "Compliance", score: computedScores.compliance }
                      ]}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={8} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#6b7280" fontSize={7} />
                        <Radar name="Category Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Headers Status pie */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Response Headers Checklist
                </h3>
                <div className="h-48 w-full mt-4 flex items-center justify-between gap-4">
                  <div className="space-y-1.5 text-[9.5px] font-bold font-mono flex-grow">
                    {[
                      { name: "Present (Passed)", value: headers.filter(h => h.status === "present").length, color: "#10b981" },
                      { name: "Weak Configuration", value: headers.filter(h => h.status === "weak").length, color: "#f59e0b" },
                      { name: "Missing Headers", value: headers.filter(h => h.status === "missing").length, color: "#ef4444" }
                    ].map((d, i) => (
                      <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-bg/50 border border-white/[0.02]">
                        <span className="flex items-center gap-1.5" style={{ color: d.color }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-extrabold text-text">{d.value}</span>
                      </div>
                    ))}
                  </div>
                  {mounted && (
                    <div className="h-32 w-32 flex-shrink-0 relative select-none">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: "Present", value: headers.filter(h => h.status === "present").length, color: "#10b981" },
                              { name: "Weak", value: headers.filter(h => h.status === "weak").length, color: "#f59e0b" },
                              { name: "Missing", value: headers.filter(h => h.status === "missing").length, color: "#ef4444" }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={40}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {[
                              { color: "#10b981" },
                              { color: "#f59e0b" },
                              { color: "#ef4444" }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                        <span className="text-sm font-black text-text">{headers.length}</span>
                        <span className="text-[7.5px] text-text-muted uppercase tracking-wider">Headers</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== 2. SECURITY HEADERS TAB ==================== */}
        {activeTab === "headers" && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("headers")}
            <div className="border-b border-white/[0.05] pb-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Response Headers Security</h2>
                <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Standard security headers configuration verification</p>
              </div>
              {!localResult?.isPublicScan && (
                <Button
                  onClick={() => handleRefreshSection("headers")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider"
                >
                  Sync Headers
                </Button>
              )}
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between bg-surface/30 border border-white/[0.04] p-3.5 rounded-2xl">
              <div className="relative w-full sm:max-w-xs flex items-center">
                <Search className="absolute left-3.5 text-text-muted h-4 w-4" />
                <input
                  type="text"
                  placeholder="Filter response headers..."
                  value={headersSearch}
                  onChange={(e) => setHeadersSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-bg border border-white/[0.05] focus:border-accent/40 rounded-xl text-xs text-text outline-none transition-all font-mono"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto text-[10.5px]">
                <select
                  value={headersFilter}
                  onChange={(e) => setHeadersFilter(e.target.value)}
                  className="bg-bg border border-white/[0.05] text-text-dim rounded-xl px-4 py-2.5 font-mono outline-none cursor-pointer focus:border-accent/40 w-full sm:w-auto font-bold uppercase tracking-wider"
                >
                  <option value="all">All States</option>
                  <option value="present">Present (Passed)</option>
                  <option value="weak">Weak Config</option>
                  <option value="missing">Missing Headers</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3.5">
              {filteredHeaders.length === 0 ? (
                <div className="text-center py-14 text-text-dim italic text-xs font-mono uppercase tracking-wider">
                  No headers match current selection query criteria.
                </div>
              ) : (
                filteredHeaders.map((header) => {
                  const isExpanded = expandedHeaders.includes(header.name);
                  const isPresent = header.status === "present";
                  const isWeak = header.status === "weak";
                  const badgeVariant = isPresent ? "success" : isWeak ? "warning" : "danger";

                  return (
                    <Card key={header.name} className="border border-white/[0.04] bg-surface/30 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 p-0 sm:p-0">
                      <div
                        onClick={() => toggleHeaderExpand(header.name)}
                        className="flex justify-between items-center p-4.5 cursor-pointer hover:bg-white/[0.01] gap-4"
                      >
                        <div className="min-w-0 text-left font-mono">
                          <span className="font-extrabold text-text block text-xs tracking-tight">{header.name}</span>
                          <span className="text-[10px] text-text-dim truncate block max-w-lg mt-1 font-bold" title={header.value || "Header omitted in response."}>
                            {header.value || <span className="italic text-text-muted">Header Omitted</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 select-none">
                          <Badge variant={badgeVariant} className="text-[8px] py-0.5 px-2 tracking-wider font-mono">
                            {header.status.toUpperCase()}
                          </Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-5 border-t border-white/[0.03] space-y-4 bg-black/15 text-xs font-sans">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                              <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block font-mono">Vulnerability Risk</span>
                              <p className="text-text-dim leading-relaxed text-[11px] font-medium">{header.description || "Omission of this header leaves client interfaces vulnerable to framing, script injection, or cookie leaks."}</p>
                            </div>
                            {header.recommendation && (
                              <div className="space-y-1">
                                <span className="text-[8px] font-black text-success uppercase tracking-wider block font-mono">Remediation Guideline</span>
                                <code className="bg-bg border border-white/[0.05] p-2.5 rounded-lg block text-[9.5px] text-accent-light font-mono select-all select-text leading-normal font-bold">{header.recommendation}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ==================== 3. SSL/TLS CERTIFICATE TAB ==================== */}
        {activeTab === "ssl" && ssl && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("ssl")}
            <div className="border-b border-white/[0.05] pb-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">SSL/TLS Handshake &amp; Cert</h2>
                <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Trusted Certificate Authority validation and protocol checks</p>
              </div>
              {!localResult?.isPublicScan && (
                <Button
                  onClick={() => handleRefreshSection("ssl")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider"
                >
                  Sync SSL
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <Key className="h-4 w-4 text-accent" /> Encryption Summary
                </h3>
                <div className="space-y-3.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                    <span className="text-text-dim">Trusted Authority (CA)</span>
                    <span className="font-extrabold text-text truncate max-w-[200px]" title={ssl.issuer}>{ssl.issuer || "Unknown"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                    <span className="text-text-dim">TLS Protocol Version</span>
                    <span className="font-extrabold text-accent">{ssl.tlsVersion || "TLSv1.3"}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                    <span className="text-text-dim">Certificate Valid</span>
                    <Badge variant={ssl.valid ? "success" : "danger"} className="text-[7.5px] py-0.5">
                      {ssl.valid ? "VALID" : "INVALID"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Remaining Lifespan</span>
                    <span className={`font-extrabold ${ssl.daysRemaining < 30 ? "text-danger animate-pulse" : "text-success"}`}>
                      {ssl.daysRemaining ?? "N/A"} Days
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-accent" /> Key Parameters
                </h3>
                <div className="space-y-3.5 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                    <span className="text-text-dim">Signature Algorithm</span>
                    <span className="font-extrabold text-text">{ssl.keyType || "RSA"} ({ssl.keyLength || "2048"} bits)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                    <span className="text-text-dim">HSTS Preload Status</span>
                    <Badge variant={ssl.hstsPreload ? "success" : "warning"} className="text-[7.5px] py-0.5">
                      {ssl.hstsPreload ? "ACTIVE" : "NO PRELOAD"}
                    </Badge>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                    <span className="text-text-dim">OCSP Stapling Status</span>
                    <span className="font-extrabold text-text">{ssl.ocspStatus || "Good"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-dim">Wildcard Domain Cert</span>
                    <span className="font-extrabold text-text">{ssl.wildcard ? "Yes" : "No"}</span>
                  </div>
                </div>
              </Card>
            </div>

            {ssl.supportedVersions && ssl.supportedVersions.length > 0 && (
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                  Supported Cipher Protocols
                </h3>
                <div className="flex flex-wrap gap-2 pt-1 font-mono select-none">
                  {ssl.supportedVersions.map((ver, idx) => (
                    <span
                      key={idx}
                      className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg border ${
                        ver.includes("1.3") ? "border-success/30 bg-success/5 text-success" :
                        ver.includes("1.2") ? "border-accent/30 bg-accent/5 text-accent" :
                        "border-danger/30 bg-danger/5 text-danger line-through"
                      }`}
                    >
                      {ver}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {ssl.sans && ssl.sans.length > 0 && (
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                  Subject Alternative Names (SANs) ({ssl.sans.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-mono text-[9.5px] max-h-48 overflow-y-auto pr-1">
                  {ssl.sans.map((san, idx) => (
                    <div key={idx} className="bg-surface/40 border border-white/[0.02] px-2.5 py-1.5 rounded-lg select-all truncate font-bold hover:border-white/10 transition-colors" title={san}>
                      {san}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ==================== 4. DNS SECURITY TAB ==================== */}
        {activeTab === "dns" && dns && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("dns")}
            <div className="border-b border-white/[0.05] pb-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">DNS Records &amp; Zones</h2>
                <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Mail authentication policies and domain zone configuration records</p>
              </div>
              {!localResult?.isPublicScan && (
                <Button
                  onClick={() => handleRefreshSection("dns")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider"
                >
                  Sync DNS
                </Button>
              )}
            </div>

            {/* SPF / DMARC */}
            {emailSecurity && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                    Sender Policy Framework (SPF)
                  </h3>
                  <div className="space-y-3.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span>SPF Record Present</span>
                      <Badge variant={emailSecurity.spfPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity.spfPresent ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    {dns.spf?.value && (
                      <div className="space-y-1">
                        <span className="text-[8px] text-text-muted uppercase">Record Content</span>
                        <code className="bg-bg border border-white/[0.05] p-2.5 rounded-lg block text-[9.5px] break-all select-all font-mono font-bold leading-normal">{dns.spf.value}</code>
                      </div>
                    )}
                    {dns.spf?.error && (
                      <div className="p-3 bg-danger/5 border border-danger/10 rounded-xl text-[10px] text-danger font-sans leading-relaxed">
                        ⚠️ {dns.spf.error}
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                    Domain Message Authentication (DMARC)
                  </h3>
                  <div className="space-y-3.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span>DMARC Record Present</span>
                      <Badge variant={emailSecurity.dmarcPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity.dmarcPresent ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    {dns.dmarc?.value && (
                      <div className="space-y-1">
                        <span className="text-[8px] text-text-muted uppercase">Record Content</span>
                        <code className="bg-bg border border-white/[0.05] p-2.5 rounded-lg block text-[9.5px] break-all select-all font-mono font-bold leading-normal">{dns.dmarc.value}</code>
                      </div>
                    )}
                    {dns.dmarc?.error && (
                      <div className="p-3 bg-danger/5 border border-danger/10 rounded-xl text-[10px] text-danger font-sans leading-relaxed">
                        ⚠️ {dns.dmarc.error}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            )}

            {/* Sitemap/robots list */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs text-left">
              {robotsTxt && (
                <Card className="p-4 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[130px] rounded-2xl">
                  <div>
                    <span className="text-[8px] text-text-muted uppercase font-bold">robots.txt</span>
                    <span className="font-extrabold text-text text-[11px] block mt-1">{robotsTxt.exists ? "Active Indexing Policy" : "Missing / Omitted"}</span>
                  </div>
                  {robotsTxt.exists && (
                    <p className={`text-[9px] font-bold ${robotsTxt.sensitiveExposed ? "text-danger" : "text-success"}`}>
                      {robotsTxt.sensitiveExposed ? "⚠️ Sensitive paths exposed" : "✓ Public paths protected"}
                    </p>
                  )}
                  <Badge variant={robotsTxt.exists ? "success" : "warning"} className="text-[7px] py-0.5 w-max">
                    {robotsTxt.exists ? "RESOLVED" : "ADVISORY"}
                  </Badge>
                </Card>
              )}

              {sitemapXml && (
                <Card className="p-4 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[130px] rounded-2xl">
                  <div>
                    <span className="text-[8px] text-text-muted uppercase font-bold">sitemap.xml</span>
                    <span className="font-extrabold text-text text-[11px] block mt-1">{sitemapXml.exists ? `${sitemapXml.urlCount ?? 0} links found` : "Missing / Omitted"}</span>
                  </div>
                  {sitemapXml.exists && sitemapXml.lastModified && (
                    <span className="text-[9px] text-text-dim">Modified: {new Date(sitemapXml.lastModified).toLocaleDateString()}</span>
                  )}
                  <Badge variant={sitemapXml.exists ? "success" : "warning"} className="text-[7px] py-0.5 w-max">
                    {sitemapXml.exists ? "RESOLVED" : "ADVISORY"}
                  </Badge>
                </Card>
              )}

              {securityTxt && (
                <Card className="p-4 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[130px] rounded-2xl">
                  <div>
                    <span className="text-[8px] text-text-muted uppercase font-bold">security.txt</span>
                    <span className="font-extrabold text-text text-[11px] block mt-1">{securityTxt.exists ? "Disclosure Active" : "Missing / Omitted"}</span>
                  </div>
                  {securityTxt.exists && securityTxt.contact && (
                    <span className="text-[9px] text-text-dim truncate font-mono block max-w-full" title={securityTxt.contact}>{securityTxt.contact}</span>
                  )}
                  <Badge variant={securityTxt.exists ? "success" : "warning"} className="text-[7px] py-0.5 w-max">
                    {securityTxt.exists ? "RESOLVED" : "ADVISORY"}
                  </Badge>
                </Card>
              )}
            </div>

            {/* Published Zone Records */}
            <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" /> Domain Zone Records
              </h3>
              <div className="space-y-4 font-mono text-xs">
                {dns.a && dns.a.length > 0 && (
                  <div className="bg-bg/40 p-3.5 rounded-2xl border border-white/[0.02]">
                    <span className="text-[8px] font-bold text-text-muted block uppercase mb-1.5">A Record Mappings (IPv4)</span>
                    <div className="flex flex-wrap gap-2">
                      {dns.a.map((ip, idx) => (
                        <span key={idx} className="bg-surface border border-white/[0.04] px-2.5 py-1.5 rounded-lg text-[9.5px] text-accent-light font-bold select-all">{ip}</span>
                      ))}
                    </div>
                  </div>
                )}

                {dns.aaaa && dns.aaaa.length > 0 && (
                  <div className="bg-bg/40 p-3.5 rounded-2xl border border-white/[0.02]">
                    <span className="text-[8px] font-bold text-text-muted block uppercase mb-1.5">AAAA Record Mappings (IPv6)</span>
                    <div className="flex flex-wrap gap-2">
                      {dns.aaaa.map((ip, idx) => (
                        <span key={idx} className="bg-surface border border-white/[0.04] px-2.5 py-1.5 rounded-lg text-[9.5px] text-accent-light font-bold select-all">{ip}</span>
                      ))}
                    </div>
                  </div>
                )}

                {dns.mx && dns.mx.length > 0 && (
                  <div className="bg-bg/40 p-3.5 rounded-2xl border border-white/[0.02]">
                    <span className="text-[8px] font-bold text-text-muted block uppercase mb-2">MX Records (Mail Handlers)</span>
                    <div className="space-y-1.5">
                      {dns.mx.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] bg-surface/50 p-2.5 rounded-lg select-all border border-white/[0.02] font-bold text-text">{m}</div>
                      ))}
                    </div>
                  </div>
                )}

                {dns.txt && dns.txt.length > 0 && (
                  <div className="bg-bg/40 p-3.5 rounded-2xl border border-white/[0.02]">
                    <span className="text-[8px] font-bold text-text-muted block uppercase mb-2">TXT Records</span>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      {dns.txt.map((t, idx) => (
                        <div key={idx} className="bg-surface/50 p-2.5 rounded-lg text-[10px] text-text-dim select-all break-all leading-normal border border-white/[0.02] font-bold">{t}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* ==================== WHOIS / DOMAIN REGISTRY SECURITY TAB ==================== */}
        {activeTab === "whois" && whois && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("whois")}
            <div className="border-b border-white/[0.05] pb-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Domain Registration &amp; Ownership</h2>
                <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Domain registrar details, age checks, and expiry warnings</p>
              </div>
              {!localResult?.isPublicScan && (
                <Button
                  onClick={() => handleRefreshSection("whois")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider"
                >
                  Sync WHOIS
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Domain Age Status */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-wider font-mono">
                    Domain Trust &amp; Age
                  </h3>
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-3xl font-black font-mono tracking-tight text-accent">
                      {whois.domainAgeDays !== null ? `${whois.domainAgeDays}` : "N/A"}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono font-black">Days Old</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/[0.03]">
                  {whois.isRecent ? (
                    <div className="flex items-start gap-2 text-danger bg-danger/10 border border-danger/25 p-3 rounded-xl">
                      <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <div className="text-[10px] font-bold font-sans leading-normal">
                        <span className="block font-black uppercase tracking-wider">High Risk Alert</span>
                        Domain was registered less than 30 days ago. Brand-new domains are highly correlated with phishing and social engineering campaigns.
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-success bg-success/10 border border-success/20 px-3 py-2.5 rounded-xl text-[10px] font-bold font-sans">
                      <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-success" />
                      <span>Domain is established and mature.</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Expiry Warning Status */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-wider font-mono">
                    Downtime &amp; Expiry Risk
                  </h3>
                  <div className="flex items-baseline gap-2.5">
                    <span className={`text-3xl font-black font-mono tracking-tight ${whois.isExpiringSoon ? "text-danger" : "text-success"}`}>
                      {whois.daysToExpiry !== null ? `${whois.daysToExpiry}` : "N/A"}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-mono font-black">Days to Expiry</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/[0.03]">
                  {whois.isExpiringSoon ? (
                    <div className="flex items-start gap-2 text-danger bg-danger/10 border border-danger/25 p-3 rounded-xl">
                      <AlertOctagon className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                      <div className="text-[10px] font-bold font-sans leading-normal">
                        <span className="block font-black uppercase tracking-wider">Critical Expiry Warning</span>
                        Domain is expiring in less than 30 days! Ensure automatic renewal is enabled to prevent downtime, email loss, and hijack.
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-success bg-success/10 border border-success/20 px-3 py-2.5 rounded-xl text-[10px] font-bold font-sans">
                      <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-success" />
                      <span>Active registration validity window is secure.</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Registrar Details */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl flex flex-col justify-between">
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-wider font-mono">
                    Domain Registrar
                  </h3>
                  <p className="text-sm font-black font-mono text-text truncate">
                    {whois.registrar || "Unknown Registrar"}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/[0.03] space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-text-muted">Registered</span>
                    <span className="font-bold text-text">
                      {whois.createdDate ? new Date(whois.createdDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="text-text-muted">Expires</span>
                    <span className="font-bold text-text">
                      {whois.expiryDate ? new Date(whois.expiryDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : "N/A"}
                    </span>
                  </div>
                  {whois.updatedDate && (
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-text-muted">Last Updated</span>
                      <span className="font-bold text-text">
                        {new Date(whois.updatedDate).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Nameservers List */}
            {whois.nameServers && whois.nameServers.length > 0 && (
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                  Authoritative Name Servers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {whois.nameServers.map((ns, idx) => (
                    <div key={idx} className="bg-bg/40 p-3 rounded-xl border border-white/[0.02] flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 text-xs font-bold font-mono">
                          {idx + 1}
                        </div>
                        <span className="text-[10.5px] font-black font-mono text-text select-all truncate">
                          {ns}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ==================== 5. OPEN PORTS TAB ==================== */}
        {activeTab === "ports" && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("ports")}
            <div className="border-b border-white/[0.05] pb-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Open Application Interfaces</h2>
                <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Active TCP port status and listening services mapping</p>
              </div>
              <Button
                onClick={() => handleRefreshSection("ports")}
                disabled={!!refreshingSection}
                variant="outline"
                size="sm"
                icon={RefreshCw}
                className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider"
              >
                Sync Ports
              </Button>
            </div>

            {!exposedServices || exposedServices.length === 0 ? (
              <Card className="p-8 text-center bg-surface/30 border border-white/[0.04] rounded-2xl">
                <ShieldCheck className="h-10 w-10 text-success mx-auto mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-text mb-1">All Ports Closed / Protected</h3>
                <p className="text-xs text-text-dim max-w-md mx-auto">
                  No exposed administrative TCP services (like SSH, MySQL, FTP, or RDP) were detected on public interfaces.
                </p>
              </Card>
            ) : (
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-accent" /> Scan Port Results
                </h3>
                <p className="text-xs text-text-dim font-sans leading-relaxed">
                  The following TCP listening ports were detected on target host public interfaces. Exposed administrative ports (SSH, SQL, FTP, RDP) represent high-value hijack vectors.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {exposedServices.map((srv, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPort(srv)}
                      className="flex items-center gap-2 bg-bg/50 hover:bg-bg border border-white/[0.04] hover:border-accent/30 px-4 py-2.5 rounded-xl text-xs font-mono transition-all text-left group"
                    >
                      <span className="h-2 w-2 rounded-full bg-danger animate-pulse shrink-0" />
                      <span className="font-extrabold text-text">Port {srv.port}</span>
                      <span className="text-text-muted">/ {srv.service}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-text-dim group-hover:translate-x-0.5 transition-transform ml-1" />
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ==================== 6. SUBDOMAINS TAB ==================== */}
        {activeTab === "subdomains" && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("subdomains")}
            <div className="border-b border-white/[0.05] pb-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Discovered Domain Assets</h2>
                <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Subdomains validated via DNS resolving and Certificate Transparency logs</p>
              </div>
              <Button onClick={() => handleRefreshSection("subdomains")} disabled={!!refreshingSection} variant="outline" size="sm" icon={RefreshCw} className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider">
                Sync Assets
              </Button>
            </div>

            {!subdomains || subdomains.length === 0 ? (
              <Card className="p-8 text-center bg-surface/30 border border-white/[0.04] rounded-2xl">
                <Layers className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <h3 className="text-sm font-bold text-text mb-1">No Subdomains Discovered</h3>
                <p className="text-xs text-text-dim max-w-md mx-auto">
                  No other active subdomains were resolved for this domain through Certificate Transparency logs or DNS searches.
                </p>
              </Card>
            ) : (
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" /> Active Subdomains ({subdomains.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {subdomains.map((sub, idx) => {
                    const subName = sub.subdomain || sub;
                    const sourceLabel = sub.source?.includes("ssl-cert") ? "SSL Cert" : "DNS Probe";
                    return (
                      <div key={idx} className="bg-surface/50 border border-white/[0.05] p-3.5 rounded-2xl space-y-3 hover:border-accent/20 transition-all">
                        <div className="flex justify-between items-start gap-2">
                          <span className="truncate font-bold text-[11.5px] text-text font-mono select-all block" title={subName}>{subName}</span>
                          <Badge variant={sub.severity === "medium" ? "warning" : "info"} className="text-[7.5px] py-0.5 shrink-0">{sub.severity?.toUpperCase() || "INFO"}</Badge>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {sub.ip && <span className="text-[9px] text-text-dim font-mono bg-bg/40 px-2 py-0.5 rounded-md font-bold">{sub.ip}</span>}
                          <span className="text-[9px] text-accent font-mono bg-accent/5 border border-accent/20 px-2 py-0.5 rounded-md font-bold">{sourceLabel}</span>
                        </div>
                        {sub.evidence && <p className="text-[9.5px] text-text-dim font-sans leading-normal">{sub.evidence}</p>}
                        <Button onClick={() => handleScanSubdomain(subName)} variant="secondary" size="sm" className="py-1 text-[9.5px] w-full mt-1.5" icon={RefreshCw}>
                          Audit Asset
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ==================== 7. PUBLIC PAGES TAB ==================== */}
        {activeTab === "pages" && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("pages")}
            <div className="border-b border-white/[0.05] pb-3 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Discovered Public Pages</h2>
                <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Internal hyperlinks extracted and verified via home page crawling</p>
              </div>
              <Button onClick={() => handleRefreshSection("pages")} disabled={!!refreshingSection} variant="outline" size="sm" icon={RefreshCw} className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider">
                Sync Pages
              </Button>
            </div>

            {!publicPages || publicPages.length === 0 ? (
              <Card className="p-8 text-center bg-surface/30 border border-white/[0.04] rounded-2xl">
                <Link2 className="h-10 w-10 text-text-muted mx-auto mb-3" />
                <h3 className="text-sm font-bold text-text mb-1">No Pages Crawled</h3>
                <p className="text-xs text-text-dim max-w-md mx-auto">
                  No other active pages were discovered on the homepage crawled paths.
                </p>
              </Card>
            ) : (
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-accent" /> Indexable Pages ({publicPages.length})
                  </h3>
                  <button
                    onClick={() => { navigator.clipboard.writeText(publicPages.map(p => p.url || p.path).join("\n")); toast.success("Paths copied to clipboard"); }}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-text-dim hover:text-accent transition-all font-mono px-2.5 py-1.5 rounded-lg hover:bg-accent/8 border border-transparent hover:border-accent/20 uppercase"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy List
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1 font-mono text-[11px]">
                  {publicPages.map((page, idx) => {
                    const statusColor = !page.status ? "text-text-dim" :
                      page.status < 300 ? "text-success" :
                      page.status < 400 ? "text-warning" : "text-danger";
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-surface/50 border border-white/[0.03] px-3.5 py-2.5 rounded-xl hover:border-white/[0.08] transition-all group justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`text-[9px] font-black w-8 text-center shrink-0 font-mono ${statusColor}`}>{page.status || "—"}</span>
                          <span className="truncate text-text select-all font-bold" title={page.path || page.url}>{page.path || page.url}</span>
                        </div>
                        <a href={page.url} target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-dim hover:text-accent p-1">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ==================== 8. ATTACK SURFACE TAB ==================== */}
        {activeTab === "attack-surface" && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="border-b border-white/[0.05] pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Exposed Directories &amp; Panels</h2>
              <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Unauthenticated admin consoles or configuration backups audits</p>
            </div>

            {((!sensitiveFiles || sensitiveFiles.filter(f => f.exists).length === 0) && (!loginSurfaces || loginSurfaces.length === 0)) ? (
              <Card className="p-8 text-center bg-surface/30 border border-white/[0.04] rounded-2xl">
                <ShieldCheck className="h-10 w-10 text-success mx-auto mb-3 animate-pulse" />
                <h3 className="text-sm font-bold text-text mb-1">Attack Surface Secure</h3>
                <p className="text-xs text-text-dim max-w-md mx-auto">
                  No exposed code repository directories, environment file backups, or unauthenticated administrative panels were discovered.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Exposed files */}
                {sensitiveFiles && sensitiveFiles.filter(f => f.exists).length > 0 && (
                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-accent" /> Leaked Code / Env Backups ({sensitiveFiles.filter(f => f.exists).length})
                    </h3>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 font-mono text-[11px]">
                      {sensitiveFiles.filter(f => f.exists).map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-bg/40 border border-white/[0.03] p-3 rounded-xl">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-text select-all block truncate" title={file.path}>{file.path}</span>
                            <span className="text-[9px] text-text-muted mt-0.5 block font-bold">Status: HTTP {file.status || 200}</span>
                          </div>
                          <Badge variant="danger" className="text-[7px] py-0.5 shrink-0 font-sans">EXPOSED</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Login interfaces */}
                {loginSurfaces && loginSurfaces.length > 0 && (
                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <Lock className="h-4.5 w-4.5 text-accent" /> Administrative Portal Entries ({loginSurfaces.length})
                    </h3>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 font-mono text-[11px]">
                      {loginSurfaces.map((login, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-bg/40 border border-white/[0.03] p-3 rounded-xl">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-text select-all block truncate" title={login.path}>{login.path}</span>
                          </div>
                          <Badge variant="warning" className="text-[7px] py-0.5 shrink-0 font-sans">ACCESSIBLE</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== 9. SEO OPTIMIZATION TAB ==================== */}
        {activeTab === "seo" && (
          <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
            {renderSectionLoader("seo")}
            <div className="border-b border-white/[0.05] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 flex items-center gap-3">
                {seoData.favicon && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={seoData.favicon} 
                    alt="Favicon" 
                    className="h-5 w-5 rounded bg-white/10 p-0.5 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                )}
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">SEO Optimization &amp; Metadata</h2>
                  <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Crawler directives, metadata validation, and page audits</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 shrink-0">
                {seoData.title && (
                  <div className="hidden lg:flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] py-1.5 px-3 rounded-xl max-w-[200px] truncate text-[9px] font-mono text-text-dim">
                    <span className="text-[7.5px] uppercase tracking-wider text-accent font-bold">Title:</span>
                    <span className="truncate select-all font-bold" title={seoData.title}>{seoData.title}</span>
                  </div>
                )}
                <Button
                  onClick={() => handleRefreshSection("seo")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[9.5px] py-1.5 tracking-wider"
                >
                  Sync SEO
                </Button>
              </div>
            </div>

            {!seo || (!seoData.title && !seoData.description && seoData.imageCount === 0 && seoData.h1Count === 0) ? (
              <Card className="p-8 border border-warning/20 bg-warning/5 text-center space-y-4 font-sans max-w-lg mx-auto rounded-3xl shadow-xl my-6">
                <div className="flex justify-center">
                  <div className="p-3.5 bg-warning/10 border border-warning/20 rounded-full text-warning">
                    <AlertTriangle className="h-8 w-8 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-text font-mono">SEO Analytics Unavailable</h3>
                  <p className="text-xs text-text-dim leading-relaxed">
                    We were unable to extract the HTML structure of the target page during this scan.
                  </p>
                </div>
                <ul className="text-[10px] text-text-dim list-disc list-inside space-y-1.5 max-w-xs mx-auto text-left font-mono bg-black/20 p-3.5 rounded-xl border border-white/[0.03]">
                  <li>Target blocks requests (e.g. Cloudflare / WAF)</li>
                  <li>HTTP timeout error during scan</li>
                </ul>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                    <Search className="h-4.5 w-4.5 text-accent" /> Meta Content Tags
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                    <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3 rounded-2xl">
                      <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                        <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">Page Title</span>
                        {(() => {
                          const len = (seoData.title || "").length;
                          if (len === 0) return <Badge variant="danger" className="text-[7.5px] py-0.5">MISSING</Badge>;
                          if (len >= 50 && len <= 60) return <Badge variant="success" className="text-[7.5px] py-0.5">OPTIMAL</Badge>;
                          return <Badge variant="warning" className="text-[7.5px] py-0.5">UNHARMONIOUS</Badge>;
                        })()}
                      </div>
                      <div className="space-y-2">
                        <div className="bg-bg/40 p-2.5 rounded-xl border border-white/[0.02] text-xs font-sans text-text select-all leading-normal font-bold">
                          {seoData.title || <span className="italic text-text-muted font-mono">No Title Element</span>}
                        </div>
                        <div className="flex justify-between text-[9.5px] text-text-dim">
                          <span>Characters:</span>
                          <span className="font-bold text-text">{(seoData.title || "").length} / 60 max (ideal: 50-60)</span>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3 rounded-2xl">
                      <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                        <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">Description</span>
                        {(() => {
                          const len = (seoData.description || "").length;
                          if (len === 0) return <Badge variant="danger" className="text-[7.5px] py-0.5">MISSING</Badge>;
                          if (len >= 120 && len <= 160) return <Badge variant="success" className="text-[7.5px] py-0.5">OPTIMAL</Badge>;
                          return <Badge variant="warning" className="text-[7.5px] py-0.5">UNHARMONIOUS</Badge>;
                        })()}
                      </div>
                      <div className="space-y-2">
                        <div className="bg-bg/40 p-2.5 rounded-xl border border-white/[0.02] text-xs font-sans text-text select-all leading-normal font-bold">
                          {seoData.description || <span className="italic text-text-muted font-mono">No Meta Description</span>}
                        </div>
                        <div className="flex justify-between text-[9.5px] text-text-dim">
                          <span>Characters:</span>
                          <span className="font-bold text-text">{(seoData.description || "").length} / 160 max (ideal: 120-160)</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-accent" /> Page Semantics &amp; Alt Tags
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                    <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                      <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                        <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">Image Alt Checklist</span>
                        {(() => {
                          const count = seoData.imageCount || 0;
                          const alt = seoData.imageAltCount || 0;
                          if (count === 0) return <Badge variant="success" className="text-[7.5px] py-0.5">NO IMAGES</Badge>;
                          if (count === alt) return <Badge variant="success" className="text-[7.5px] py-0.5">WCAG PASS</Badge>;
                          return <Badge variant="warning" className="text-[7.5px] py-0.5">ALT INCOMPLETE</Badge>;
                        })()}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                          <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-xl">
                            <div className="font-bold text-text">{seoData.imageCount ?? 0}</div>
                            <div className="text-[7.5px] text-text-muted uppercase mt-0.5 font-bold">Total</div>
                          </div>
                          <div className="bg-success/5 border border-success/15 p-2.5 rounded-xl text-success">
                            <div className="font-bold">{seoData.imageAltCount ?? 0}</div>
                            <div className="text-[7.5px] text-text-muted uppercase mt-0.5 font-bold">With Alt</div>
                          </div>
                          <div className="bg-danger/5 border border-danger/15 p-2.5 rounded-xl text-danger">
                            <div className="font-bold">{Math.max(0, (seoData.imageCount ?? 0) - (seoData.imageAltCount ?? 0))}</div>
                            <div className="text-[7.5px] text-text-muted uppercase mt-0.5 font-bold font-mono">Missing</div>
                          </div>
                        </div>

                        {(() => {
                          const count = seoData.imageCount || 0;
                          const alt = seoData.imageAltCount || 0;
                          const percentage = count > 0 ? Math.round((alt / count) * 100) : 100;
                          return (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] text-text-dim uppercase font-bold">
                                <span>Alt compliance:</span>
                                <span>{percentage}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </Card>

                    <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                      <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                        <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">Heading hierarchy</span>
                        {seoData.h1Count === 1 ? <Badge variant="success" className="text-[7.5px] py-0.5">OPTIMAL</Badge> : <Badge variant="danger" className="text-[7.5px] py-0.5">SUBOPTIMAL</Badge>}
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3.5 text-center font-mono text-xs">
                          <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-xl">
                            <div className="text-[8px] text-text-muted uppercase mb-0.5 font-bold">&lt;h1&gt; Count</div>
                            <div className={`text-xl font-bold font-mono ${seoData.h1Count === 1 ? "text-success" : "text-danger"}`}>
                              {seoData.h1Count ?? 0}
                            </div>
                          </div>
                          <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-xl">
                            <div className="text-[8px] text-text-muted uppercase mb-0.5 font-bold">&lt;h2&gt; Count</div>
                            <div className="text-xl font-bold font-mono text-accent">
                              {seoData.h2Count ?? 0}
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-text-muted leading-relaxed font-sans mt-1">
                          Standard search bots require exactly one &lt;h1&gt; node to index pages cleanly.
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3.5 text-[10.5px] rounded-2xl">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                      <Layers className="h-4.5 w-4.5 text-accent" /> Crawler Directives
                    </h3>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim">Search Engine Indexable</span>
                      <Badge variant={seoData.isIndexable ? "success" : "warning"} className="text-[7.5px] py-0.5 font-sans">
                        {seoData.isIndexable ? "INDEXABLE" : "NOINDEX"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-dim text-[8px] uppercase font-mono block">robots Directive</span>
                      <code className="bg-bg border border-white/[0.05] p-2.5 rounded-lg block text-[9.5px] truncate select-all font-bold">{seoData.metaRobots || "Omitted"}</code>
                    </div>
                    <div className="space-y-1">
                      <span className="text-text-dim text-[8px] uppercase font-mono block">Canonical URL Path</span>
                      <code className="bg-bg border border-white/[0.05] p-2.5 rounded-lg block text-[9.5px] truncate select-all font-bold">{seoData.canonicalUrl || "Omitted"}</code>
                    </div>
                  </Card>

                  {seoData.twitterCard && (
                    <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3.5 rounded-2xl">
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                        <Code className="h-4 w-4 text-accent" /> Twitter Social Metadata
                      </h3>
                      <div className="space-y-2 text-[10px]">
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span className="text-text-dim uppercase text-[8px] font-mono">twitter:card</span>
                          <span className="font-bold text-text">{seoData.twitterCard.card || "summary"}</span>
                        </div>
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span className="text-text-dim uppercase text-[8px] font-mono">twitter:site</span>
                          <span className="font-bold text-text">{seoData.twitterCard.site || "N/A"}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-text-dim uppercase text-[8px] font-mono block">twitter:title</span>
                          <p className="text-text truncate select-all font-sans font-bold leading-normal">{seoData.twitterCard.title || "N/A"}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {seoData.openGraph && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {seoData.openGraph.image && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                          <Globe className="h-4.5 w-4.5 text-accent" /> OpenGraph Social Embed Preview
                        </h3>
                        <Card className="bg-[#0b0f19] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300 p-0 sm:p-0">
                          <div className="relative aspect-video bg-bg/50 border-b border-white/[0.04] overflow-hidden flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={seoData.openGraph.image}
                              alt="Social Preview"
                              className="object-cover w-full h-full"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                          <div className="p-4.5 space-y-1 text-left font-sans">
                            <span className="text-[9px] font-black text-accent uppercase tracking-wider font-mono">{domain}</span>
                            <h4 className="text-xs sm:text-sm font-bold text-text line-clamp-1">{seoData.openGraph.title || seoData.title || "No Title"}</h4>
                            <p className="text-[11px] text-text-dim line-clamp-2 leading-relaxed">{seoData.openGraph.description || seoData.description || "No description tags available."}</p>
                          </div>
                        </Card>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                        <Link2 className="h-4.5 w-4.5 text-accent" /> OpenGraph Social Tags
                      </h3>
                      <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3.5 font-mono text-xs rounded-2xl">
                        <div className="space-y-1">
                          <span className="text-text-dim uppercase text-[8px] font-mono block">og:title</span>
                          <div className="bg-bg/40 p-2.5 rounded-lg text-text border border-white/[0.02] font-sans font-bold select-all truncate">{seoData.openGraph.title || "N/A"}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-text-dim uppercase text-[8px] font-mono block">og:type</span>
                          <div className="bg-bg/40 p-2.5 rounded-lg text-text border border-white/[0.02] select-all truncate font-bold">{seoData.openGraph.type || "website"}</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-text-dim uppercase text-[8px] font-mono block">og:url</span>
                          <div className="bg-bg/40 p-2.5 rounded-lg text-accent-light border border-white/[0.02] select-all truncate font-bold">{seoData.openGraph.url || "N/A"}</div>
                        </div>
                      </Card>
                    </div>
                  </div>
                )}

                {seoData.detectedImages && seoData.detectedImages.length > 0 && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                      <Globe className="h-4.5 w-4.5 text-accent" /> Brand Assets &amp; Images ({seoData.detectedImages.length})
                    </h3>
                    <Card className="p-5 bg-surface/30 border border-white/[0.04] rounded-2xl">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {seoData.detectedImages.map((img, idx) => (
                          <div key={idx} className="bg-[#0b0f19] border border-white/[0.05] rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300 flex flex-col justify-between">
                            <div className="relative aspect-square bg-white/[0.02] border-b border-white/[0.04] p-3.5 flex items-center justify-center group overflow-hidden select-none">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.src}
                                alt={img.alt}
                                className="object-contain max-h-full max-w-full rounded transition-transform duration-300 group-hover:scale-105"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                            <div className="p-2 space-y-1.5 font-mono text-[9px] text-left">
                              <p className="font-bold text-text truncate select-all block" title={img.alt}>{img.alt}</p>
                              <div className="flex justify-between items-center text-text-dim text-[8px]">
                                <span className="uppercase font-bold text-accent">{img.type || "asset"}</span>
                                <a href={img.src} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline hover:text-accent-light font-bold">
                                  View
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================== 10. PERFORMANCE TAB ==================== */}
        {activeTab === "performance" && performance && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="border-b border-white/[0.05] pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Response Speed Latency</h2>
              <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Active network latency times and socket handshake durations</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono text-xs">
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-accent" /> Latency Timers Checklist
                </h3>

                <div className="space-y-4">
                  {[
                    { label: "DNS Lookup Latency", value: performance.dnsLookup || 45, max: 200, unit: "ms" },
                    { label: "TLS Handshake Cryptography", value: performance.tlsHandshake || 110, max: 500, unit: "ms" },
                    { label: "Time to First Byte (TTFB)", value: performance.ttfb || 230, max: 1000, unit: "ms" },
                    { label: "Total Server Response", value: performance.responseTime || scanDuration || 350, max: 1500, unit: "ms" }
                  ].map((metric, i) => {
                    const percentage = Math.min(100, Math.round((metric.value / metric.max) * 100));
                    const isSlow = metric.value > (metric.max * 0.7);

                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-text-dim font-bold">{metric.label}</span>
                          <span className="font-extrabold text-text">{metric.value} {metric.unit}</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface border border-white/[0.02] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isSlow ? "bg-danger" : "bg-accent"}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[220px] rounded-2xl">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-accent" /> Latency Diagnostics
                  </h3>
                  <p className="text-xs text-text-dim font-sans leading-relaxed mt-2.5">
                    Fast response times reduce visitor drop rates and safeguard systems from connection exhaustion. Long DNS lookup times or slow TLS handshakes indicate a need for CDN integrations or DNSSEC caching rule modifications.
                  </p>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-white/[0.03] uppercase">
                  <span className="text-text-muted text-[9px] font-bold tracking-wider">Evaluation Speed</span>
                  <Badge variant={(performance.responseTime || 350) < 500 ? "success" : "warning"} className="text-[7.5px] py-0.5">
                    {(performance.responseTime || 350) < 500 ? "OPTIMAL SPEED" : "LATENCY ALERT"}
                  </Badge>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ==================== 11. TECHNOLOGIES TAB ==================== */}
        {activeTab === "tech" && techStack && techStack.length > 0 && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="border-b border-white/[0.05] pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Detected Technology Footprint</h2>
              <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Active system stack components profile identified from server response</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
              <Card className="p-5 bg-surface/30 border border-white/[0.04] md:col-span-2 space-y-4 rounded-2xl">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <Cpu className="h-4.5 w-4.5 text-accent" /> Stack Components ({techStack.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {techStack.map((tech, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTech(tech)}
                      className="bg-bg/40 border border-white/[0.04] hover:border-accent/20 p-3.5 rounded-2xl text-left space-y-1.5 transition-all group flex flex-col justify-between min-h-[85px]"
                    >
                      <span className="text-[8px] text-text-muted block uppercase tracking-widest font-black">{tech.category || "Stack Element"}</span>
                      <div className="flex justify-between items-center gap-2 w-full">
                        <span className="font-extrabold text-text block truncate text-xs">{tech.name}</span>
                        <ChevronRight className="h-4 w-4 text-text-dim group-hover:translate-x-0.5 transition-transform shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {infrastructure && (
                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 rounded-2xl">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Server className="h-4.5 w-4.5 text-accent" /> Server Hosting
                  </h3>

                  <div className="space-y-3.5 font-mono text-[11px]">
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim uppercase text-[8px] block font-bold">Server Engine</span>
                      <span className="font-bold text-text truncate max-w-[120px]">{infrastructure.cdn || infrastructure.reverseProxy || "Nginx"}</span>
                    </div>
                    {infrastructure.hosting && (
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span className="text-text-dim uppercase text-[8px] block font-bold">Cloud Network</span>
                        <span className="font-bold text-text truncate max-w-[120px]">{infrastructure.hosting}</span>
                      </div>
                    )}
                    {infrastructure.asn && (
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span className="text-text-dim uppercase text-[8px] block font-bold">Network ASN</span>
                        <span className="font-bold text-text select-all">{infrastructure.asn}</span>
                      </div>
                    )}
                    {infrastructure.isp && (
                      <div className="flex justify-between">
                        <span className="text-text-dim uppercase text-[8px] block font-bold">ISP Provider</span>
                        <span className="font-bold text-text truncate max-w-[120px]" title={infrastructure.isp}>{infrastructure.isp}</span>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ==================== 12. RECOMMENDATIONS TAB ==================== */}
        {activeTab === "recommendations" && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="border-b border-white/[0.05] pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Action Guidelines &amp; Hardening</h2>
              <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Actionable checklists, server directives, and configuration guidelines</p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3.5 items-center justify-between bg-surface/30 border border-white/[0.04] p-3.5 rounded-2xl">
              <div className="relative w-full sm:max-w-xs flex items-center">
                <Search className="absolute left-3.5 text-text-muted h-4 w-4" />
                <input
                  type="text"
                  placeholder="Filter security checks..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-bg border border-white/[0.05] focus:border-accent/40 rounded-xl text-xs text-text outline-none transition-all font-mono"
                />
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto text-[10.5px]">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-bg border border-white/[0.05] text-text-dim rounded-xl px-4 py-2.5 font-mono outline-none cursor-pointer focus:border-accent/40 w-full sm:w-auto font-bold uppercase tracking-wider"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                  <option value="info">Info/Pass</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3.5 font-mono text-xs">
              {filteredFindings.filter(f => f.status !== "passed").length === 0 ? (
                <div className="text-center py-14 text-success font-bold font-mono text-xs space-y-3 border border-white/[0.03] rounded-3xl bg-surface/20 p-6 shadow-inner">
                  <CheckCircle2 className="h-10 w-10 text-success mx-auto animate-pulse" />
                  <p className="uppercase tracking-widest text-[10px]">ALL VERIFICATION AUDITS SUCCESSFULLY PASSED</p>
                </div>
              ) : (
                filteredFindings.filter(f => f.status !== "passed").map((finding, idx) => {
                  const isOpen = expandedFindings[idx];
                  const badgeVariant = finding.severity === "critical" || finding.severity === "high" ? "danger" : finding.severity === "medium" ? "warning" : "info";

                  return (
                    <div key={idx} className="border border-white/[0.04] rounded-2xl bg-surface/30 overflow-hidden hover:border-white/10 transition-all duration-300">
                      <div
                        onClick={() => toggleFindingExpand(idx)}
                        className="flex justify-between items-center p-4.5 cursor-pointer hover:bg-white/[0.01] gap-4"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 font-sans text-left">
                          <span className={`h-2 w-2 rounded-full shrink-0 ${finding.severity === "critical" || finding.severity === "high" ? "bg-danger" : "bg-warning"}`} />
                          <span className="font-bold text-text text-xs font-mono truncate">{finding.title}</span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 select-none">
                          <Badge variant={badgeVariant} className="text-[8px] py-0.5 px-2 tracking-wider uppercase font-mono">{finding.severity}</Badge>
                          {isOpen ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                        </div>
                      </div>

                      {isOpen && (
                        <div className="p-5 border-t border-white/[0.03] space-y-4 bg-black/15 text-xs font-sans text-left">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1">
                              <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block font-mono">Diagnostics</span>
                              <p className="text-text-dim leading-relaxed font-sans text-[11px] font-medium">{finding.description}</p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[8px] font-black text-warning uppercase tracking-wider block font-mono">Vulnerability Risk</span>
                              <p className="text-text-dim leading-relaxed font-sans text-[11px] font-medium">{finding.impact}</p>
                            </div>
                          </div>

                          {finding.evidence && (
                            <div className="space-y-1.5 font-mono">
                              <span className="text-[8px] font-black text-accent-light uppercase tracking-wider block">Audited Evidence</span>
                              <pre className="bg-bg border border-white/[0.05] p-3 rounded-lg text-[9.5px] text-accent-light break-all select-all font-mono select-text whitespace-pre-wrap font-bold leading-normal">{finding.evidence}</pre>
                            </div>
                          )}

                          {finding.recommendation && (
                            <div className="p-4 bg-indigo-500/[0.01] border border-indigo-500/10 rounded-2xl space-y-1.5 font-mono">
                              <span className="text-[8.5px] font-black text-accent uppercase tracking-wider block">Remediation Snippet</span>
                              <code className="text-text select-all block text-[9.5px] break-all select-text font-bold leading-normal">{finding.recommendation}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Hardening Header config code panels */}
            <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 text-left rounded-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.05] pb-3.5 gap-3">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                  <Code className="h-4.5 w-4.5 text-accent" /> Config Templates
                </h3>

                <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/[0.04] text-[9.5px] font-mono select-none">
                  {["nginx", "apache", "iis"].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setRemediationTab(tab)}
                      className={`px-3.5 py-1 rounded-md transition-colors uppercase font-bold tracking-wider ${
                        remediationTab === tab ? "bg-accent text-bg" : "text-text-dim hover:text-text"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative rounded-xl bg-black/50 border border-white/[0.04] p-4.5 font-mono text-[10px] leading-relaxed text-accent-light overflow-x-auto min-h-[120px]">
                {remediationTab === "nginx" && (
                  <pre className="whitespace-pre">
{`# Add directives inside http, server, or location context block
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;`}
                  </pre>
                )}
                {remediationTab === "apache" && (
                  <pre className="whitespace-pre">
{`# Add directives in httpd.conf or .htaccess file
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "no-referrer-when-downgrade"
Header always set Permissions-Policy "geolocation=(), camera=(), microphone=()"`}
                  </pre>
                )}
                {remediationTab === "iis" && (
                  <pre className="whitespace-pre">
{`<!-- Add inside web.config configuration tag -->
<system.webServer>
  <httpProtocol>
    <customHeaders>
      <add name="Content-Security-Policy" value="default-src 'self';" />
      <add name="Strict-Transport-Security" value="max-age=31536000; includeSubDomains" />
      <add name="X-Frame-Options" value="SAMEORIGIN" />
      <add name="X-Content-Type-Options" value="nosniff" />
    </customHeaders>
  </httpProtocol>
</system.webServer>`}
                  </pre>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const codeText = remediationTab === "nginx" ? `add_header Content-Security-Policy "default-src 'self';" always;\nadd_header Strict-Transport-Security "max-age=31536000;" always;\nadd_header X-Frame-Options "SAMEORIGIN" always;` : remediationTab === "apache" ? `Header always set X-Frame-Options "SAMEORIGIN"` : `customHeaders`;
                    handleCopy(codeText);
                    toast.success("Configuration configs template copied to clipboard!");
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.08] text-text-dim hover:text-text transition-all"
                  title="Copy Configuration Template"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </Card>

            {/* AI Advisor Panel */}
            {aiAdvice && Array.isArray(aiAdvice) && aiAdvice.length > 0 && (
              <div className="space-y-4">
                {aiAdvice.map((advice, i) => (
                  <Card key={advice.key || i} className="p-5 sm:p-6 bg-gradient-to-r from-accent/5 via-surface/60 to-accent/5 border border-white/[0.05] space-y-3.5 rounded-2xl text-left">
                    <div className="flex justify-between items-center border-b border-white/[0.04] pb-2.5">
                      <h3 className="text-xs font-bold text-accent uppercase tracking-wider font-mono flex items-center gap-2">
                        <Shield className="h-4.5 w-4.5 text-accent" /> Security Analyst Advice: {advice.title}
                      </h3>
                      <Badge variant={advice.severity === "critical" || advice.severity === "high" ? "danger" : "warning"} className="text-[8px] uppercase tracking-wider font-mono py-0.5 px-2.5">
                        {advice.severity}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-text-dim uppercase tracking-wider block font-mono font-bold">Analysis Description</span>
                        <p className="text-text-dim leading-relaxed text-[11px] font-medium">{advice.description}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-warning uppercase tracking-wider block font-mono font-bold">Impact Severity Level</span>
                        <p className="text-text-dim leading-relaxed text-[11px] font-medium">{advice.businessImpact}</p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-bg/50 border border-white/[0.03] rounded-xl text-xs font-mono">
                      <span className="text-[8px] font-black text-accent uppercase tracking-wider block mb-1">Risk Exploitation Scenario</span>
                      <p className="text-text-dim leading-relaxed font-sans text-[11px] font-medium">{advice.exploitationRisk}</p>
                      {advice.realWorldExample && (
                        <p className="text-text-muted font-sans mt-2.5 italic text-[10.5px] border-t border-white/[0.03] pt-2 font-medium">Real-world reference: {advice.realWorldExample}</p>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs font-sans">
                      <span className="text-[8px] font-black text-success uppercase tracking-wider block font-mono">Remediation Guidelines</span>
                      <p className="text-text-dim leading-relaxed whitespace-pre-line text-[11px] font-medium">{advice.remediationSteps}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== 13. RAW PAYLOAD JSON TAB ==================== */}
        {activeTab === "raw" && (
          <div className="space-y-6 animate-fadeIn text-left">
            <div className="border-b border-white/[0.05] pb-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono">Raw Scan Payload JSON</h2>
              <p className="text-[9.5px] text-text-dim mt-0.5 uppercase tracking-wider font-mono font-bold">Full REST API response JSON payload structure details</p>
            </div>

            <Card className="p-4 bg-black/60 border border-white/[0.04] relative font-mono text-[9.5px] leading-relaxed text-accent-light rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  handleCopy(JSON.stringify(localResult, null, 2));
                  toast.success("Raw JSON payload copied to clipboard!");
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.08] text-text-dim hover:text-text transition-all"
                title="Copy JSON Payload"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <pre className="max-h-[500px] overflow-y-auto pr-2 select-text whitespace-pre-wrap font-bold leading-normal">{JSON.stringify(localResult, null, 2)}</pre>
            </Card>
          </div>
        )}

      </main>

      {/* ==================== MODALS & POPUPS ==================== */}

      {/* Email Share PDF report Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-sm border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Mail className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Email Audit Report
                </h3>
              </div>
              <button type="button" onClick={() => setEmailModalOpen(false)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-[8px] text-text-muted font-bold uppercase tracking-wider block font-sans">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-bg border border-white/[0.06] focus:border-accent/40 rounded-xl text-xs text-text outline-none transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed font-sans">
                Share security posture report for <span className="font-mono font-bold text-text">{domain}</span> (Score: {score}/100, Grade: {grade}) directly with this address.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEmailModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" disabled={emailLoading}>
                  {emailLoading ? "Sending..." : "Send Report"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Public Share Token Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-md border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Share2 className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Share Security Report
                </h3>
              </div>
              <button type="button" onClick={() => setShareModalOpen(false)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-4">
              {isOwnerOrAdmin ? (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-bg/50 border border-white/[0.03]">
                  <div>
                    <h4 className="text-xs font-bold text-text">Public URL Sharing</h4>
                    <p className="text-[10px] text-text-dim mt-0.5 font-sans">Enable public URL access to share this report with anyone.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePublic}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                      localResult.isPublic ? "bg-accent" : "bg-white/10"
                    }`}
                    aria-label="Toggle public access"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        localResult.isPublic ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-bg/40 border border-white/[0.03] text-[10px] text-text-dim font-bold font-mono">
                  🛡️ Public Sharing status is managed by the audit owner or administrators.
                </div>
              )}

              {(!isOwnerOrAdmin || localResult.isPublic) ? (
                <div className="space-y-1.5 font-mono">
                  <label className="text-[8px] text-text-muted font-bold uppercase tracking-wider block font-sans">Public Shareable Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={localResult.shareToken ? `${window.location.origin}/shared/scan/${localResult.shareToken}` : `${window.location.origin}/shared/scan/${localResult._id || localResult.scanId}`}
                      className="flex-grow bg-bg border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-[10px] text-accent-light outline-none truncate select-all font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(localResult.shareToken ? `${window.location.origin}/shared/scan/${localResult.shareToken}` : `${window.location.origin}/shared/scan/${localResult._id || localResult.scanId}`)}
                      className="text-[10px] font-bold border border-white/[0.06] rounded-xl px-4 py-2.5 bg-surface hover:text-accent hover:border-accent/40 transition-all font-sans uppercase tracking-wider"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[10px] text-text-dim leading-relaxed pt-1.5 font-sans">
                    Anyone with this link can view the posture score, resolved headers checklist, and recommendations.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-text-dim text-[10.5px] italic uppercase font-bold tracking-wider font-mono">
                  Report is currently private. Enable Public Sharing above to generate a shareable link.
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setShareModalOpen(false)}>Close</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Port Details Modal */}
      {selectedPort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-sm border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left font-sans rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Terminal className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Port Exposure Details
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedPort(null)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5 font-bold">
                <span className="text-text-dim">Port Number</span>
                <span className="font-extrabold text-accent">{selectedPort.port}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5 font-bold">
                <span className="text-text-dim">Protocol Name</span>
                <span className="font-extrabold text-text uppercase">{selectedPort.service}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5 font-bold">
                <span className="text-text-dim">Port Status</span>
                <Badge variant={selectedPort.status === "open" ? "danger" : "success"} className="text-[7px] py-0.5 uppercase">
                  {selectedPort.status}
                </Badge>
              </div>

              <div className="pt-2 font-sans text-xs text-text-dim leading-relaxed">
                <span className="font-bold text-text block mb-1">Risk Summary:</span>
                An open listening socket can allow public networks to communicate directly with backend services. Limit or firewall administrative ports.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedPort(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Technology Details Modal */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-sm border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left font-sans rounded-3xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Cpu className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Stack Component Details
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedTech(null)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5 font-bold">
                <span className="text-text-dim">Component Name</span>
                <span className="font-extrabold text-accent">{selectedTech.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5 font-bold">
                <span className="text-text-dim">Category</span>
                <span className="font-extrabold text-text uppercase">{selectedTech.category || "General Stack"}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5 font-bold">
                <span className="text-text-dim">Version Parameter</span>
                <span className="font-extrabold text-text">{selectedTech.version || "Not Disclosed (Secure)"}</span>
              </div>

              {selectedTech.version && (
                <div className="p-3 bg-danger/5 border border-danger/10 rounded-xl text-[10px] text-text-dim leading-relaxed font-sans space-y-1">
                  <span className="text-danger font-bold block font-mono uppercase tracking-wider text-[9px]">Vulnerability Risks Disclosed</span>
                  <span>Exposing version parameters simplifies exploit profiling. Configure response headers to hide server engine versions.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedTech(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
