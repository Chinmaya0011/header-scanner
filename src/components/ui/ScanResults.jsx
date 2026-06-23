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
    exposedServices = [],
    loginSurfaces = [],
    categoryScores,
    seo,
    metadata
  } = localResult || {};

  // Resolve fallbacks for SEO details if null/undefined in database (e.g. older scans or failed crawls)
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
    return { text: "Critical Deficiencies", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20", glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]", badge: "danger" };
  };

  const posture = getSecurityPosture();

  const computedScores = useMemo(() => {
    return {
      headers: categoryScores?.headers ?? score ?? 0,
      ssl: categoryScores?.ssl ?? (ssl && ssl.expirationDate !== null ? (ssl.valid ? 100 : 40) : 0),
      dns: categoryScores?.dns ?? (dns ? ((dns.spf?.valid ? 30 : 10) + (dns.dmarc?.valid ? 30 : 10) + (dns.dnssec ? 40 : 10)) : 0),
      cookies: categoryScores?.cookies ?? (cookies.length > 0 ? Math.round((cookies.filter(c => c.httpOnly && c.secure).length / cookies.length) * 100) : 100),
      attackSurface: categoryScores?.exposure ?? Math.max(10, 100 - (exposedServices.filter(s => s.status === "open").length * 20) - (sensitiveFiles.filter(f => f.exists).length * 10) - (subdomains.length * 5)),
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
      <div className="absolute inset-0 bg-bg/85 backdrop-blur-sm z-30 flex flex-col items-center justify-center space-y-3 rounded-2xl animate-fadeIn min-h-[250px]">
        <RefreshCw className="h-6 w-6 text-accent animate-spin" />
        <span className="text-[9px] font-bold tracking-widest text-text-dim uppercase font-mono">
          Refreshing {sectionKey.toUpperCase()} data matrix...
        </span>
      </div>
    );
  };

  const handleRescan = async () => {
    if (!domain) return;
    setIsRescanning(true);
    toast.info(`Initiating security scan for ${domain}...`);
    try {
      const res = await fetch("/api/scan", {
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

      // Header Banner
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 42, "F");

      // Title
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

      // Body Overview Section
      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Vulnerability Audit Summary", 15, 54);

      // Stats box
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

      // Detailed Audits
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
      toast.warning("Local scan: Save scan or check history for shareable logs.");
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
      { id: "ssl", label: "SSL/TLS Certificate", icon: Lock, show: ssl && ssl.expirationDate !== null },
      { id: "dns", label: "DNS Security", icon: Globe, show: dns && (dns.a?.length > 0 || dns.aaaa?.length > 0 || dns.mx?.length > 0 || dns.txt?.length > 0) },
      { id: "ports", label: "Open Ports", icon: Terminal, show: exposedServices && exposedServices.length > 0, count: exposedServices.filter(s => s.status === "open").length },
      { id: "subdomains", label: "Subdomains Discovery", icon: Layers, show: subdomains && subdomains.length > 0, count: subdomains.length },
      { id: "attack-surface", label: "Attack Surface Exposure", icon: Fingerprint, show: (sensitiveFiles && sensitiveFiles.filter(f => f.exists).length > 0) || (loginSurfaces && loginSurfaces.length > 0), count: (sensitiveFiles?.filter(f => f.exists).length || 0) + (loginSurfaces?.length || 0) },
      { id: "seo", label: "SEO Parameters", icon: Search, show: true },
      { id: "performance", label: "Performance Latencies", icon: Activity, show: performance && (performance.responseTime !== undefined || performance.ttfb !== undefined) },
      { id: "tech", label: "Technologies Stack", icon: Cpu, show: techStack && techStack.length > 0 },
      { id: "recommendations", label: "Action Guidelines", icon: BookOpen, show: true, count: failedCount + warningCount },
      { id: "raw", label: "Raw JSON API", icon: Code, show: true }
    ].filter(tab => tab.show);
  }, [headers, ssl, dns, exposedServices, subdomains, sensitiveFiles, loginSurfaces, seo, performance, techStack, failedCount, warningCount]);

  if (isRescanning) {
    return <Loading message="RESCANNING ENDPOINT SECURITY MATRIX..." />;
  }
  return (
    <div className="font-sans text-text max-w-5xl mx-auto px-1 sm:px-4 space-y-6">
      
      {/* 1. SUMMARY HEADER CARD */}
      <Card className="p-6 bg-surface border border-white/[0.05] rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6 text-left shadow-md">
        {/* Domain and metadata */}
        <div className="space-y-3 flex-grow">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">Target Domain</span>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-mono tracking-tight text-text uppercase select-all" title={domain}>
                {domain}
              </h1>
              <button
                onClick={() => handleCopy(domain)}
                className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-text transition-colors flex items-center gap-1"
                title="Copy Domain Address"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedText && <span className="text-[9px] text-accent font-bold font-mono">{copiedText}</span>}
              </button>
              <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-text transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-text-dim font-mono">
            {statusCode !== undefined && (
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-accent-light" />
                <span>Status: <span className="text-text font-bold">HTTP {statusCode}</span></span>
              </div>
            )}
            {scanDuration !== undefined && (
              <>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent-light" />
                  <span>Duration: <span className="text-text font-bold">{scanDuration}ms</span></span>
                </div>
              </>
            )}
            {metadata?.timestamp && (
              <>
                <div className="h-3 w-px bg-white/10" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-accent-light" />
                  <span>Audited: <span className="text-text font-bold">{new Date(metadata.timestamp).toLocaleTimeString()}</span></span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Grade, Score & Risk */}
        <div className="flex items-center gap-6 bg-bg/20 border border-white/[0.03] p-4 rounded-xl shrink-0 justify-between md:justify-start">
          <div className="text-center space-y-0.5">
            <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider font-mono">Grade</span>
            <div className={`text-2xl font-black px-3.5 py-1.5 rounded-lg border font-mono ${grade.startsWith("A") ? "text-success bg-success/5 border-success/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]" :
                grade.startsWith("B") ? "text-accent bg-accent/5 border-accent/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]" :
                  grade.startsWith("C") || grade.startsWith("D") ? "text-warning bg-warning/5 border-warning/20 shadow-[0_0_12px_rgba(245,158,11,0.1)]" :
                    "text-danger bg-danger/5 border-danger/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
              }`}>
              {grade}
            </div>
          </div>

          <div className="h-8 w-px bg-white/10" />

          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-12 w-12 shrink-0">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                <circle cx="24" cy="24" r="20" className="stroke-white/[0.03] fill-none" strokeWidth="3" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className={`fill-none ${score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-danger"
                    }`}
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - score / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xs font-black font-mono text-text">{score}</span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-text-muted uppercase tracking-wider font-mono block">Risk Level</span>
              <Badge variant={posture.badge} className="text-[7.5px] uppercase tracking-widest font-black py-0.5 px-2">
                {posture.text}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="flex flex-col gap-2 shrink-0 justify-center min-w-[150px]">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleRescan} variant="outline" size="sm" icon={RefreshCw} className="hover:border-accent/40 hover:text-accent font-bold text-[10px] justify-center py-1.5">
              Re-scan
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" icon={Download} className="hover:border-success/40 hover:text-success font-bold text-[10px] justify-center py-1.5">
              PDF
            </Button>
            <Button onClick={downloadJSON} variant="outline" size="sm" icon={FileCode} className="hover:border-blue-500/40 hover:text-blue-400 font-bold text-[10px] justify-center py-1.5">
              JSON
            </Button>
            <Button onClick={handleShare} variant="outline" size="sm" icon={Share2} className="hover:border-indigo-500/40 hover:text-indigo-400 font-bold text-[10px] justify-center py-1.5">
              Share
            </Button>
          </div>
          {currentUser && (
            <Button onClick={() => { setRecipientEmail(currentUser.email); setEmailModalOpen(true); }} variant="outline" size="sm" icon={Mail} className="hover:border-purple-500/40 hover:text-purple-400 font-bold text-[10px] w-full justify-center py-1.5">
              Email PDF Report
            </Button>
          )}
        </div>
      </Card>

      {/* 2. HORIZONTAL TAB SELECTOR */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-white/[0.05]">
        {availableTabs.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all duration-200 border whitespace-nowrap ${isActive
                  ? "bg-accent/10 text-accent border-accent/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]"
                  : "text-text-dim hover:text-text hover:bg-white/5 border-transparent"
                }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              {item.count !== undefined && item.count > 0 && (
                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-accent/20 text-accent" : "bg-white/5 text-text-dim"}`}>
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
              <div className="border-b border-white/[0.05] pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Executive Overview</h2>
                <p className="text-[10px] text-text-dim mt-0.5 font-sans">Summary metrics, key category diagnostics, and posture score distribution charts.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Domain Card */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[140px] shadow-lg">
                  <div>
                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">Target Host Domain</span>
                    <h3 className="text-lg font-bold font-mono tracking-tight text-accent mt-2 truncate flex items-center gap-1.5 select-all">
                      {domain}
                    </h3>
                  </div>
                  <div className="flex gap-2 items-center mt-3 pt-3 border-t border-white/[0.03]">
                    <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] text-text-muted font-mono">Status: HTTP {statusCode || 200}</span>
                  </div>
                </Card>

                {/* Score Card */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04] flex items-center justify-between min-h-[140px] shadow-lg">
                  <div className="space-y-2">
                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">Posture Score</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black font-mono text-accent">{score}</span>
                      <span className="text-text-muted text-xs font-mono">/ 100</span>
                    </div>
                    <Badge variant={posture.badge} className="text-[7.5px] uppercase tracking-wider font-black py-0.5 px-1.5">
                      {posture.text}
                    </Badge>
                  </div>
                  <div className="relative flex items-center justify-center h-18 w-18 flex-shrink-0">
                    <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                      <circle cx="36" cy="36" r="30" className="stroke-white/[0.03] fill-none" strokeWidth="5" />
                      <circle
                        cx="36"
                        cy="36"
                        r="30"
                        className={`fill-none ${score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-danger"
                          }`}
                        strokeWidth="5"
                        strokeDasharray={`${2 * Math.PI * 30}`}
                        strokeDashoffset={`${2 * Math.PI * 30 * (1 - score / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-[11px] font-black font-mono text-text">{grade}</span>
                  </div>
                </Card>

                {/* Summary status */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[140px] shadow-lg">
                  <div>
                    <span className="text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">Security Check Findings</span>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-center text-xs font-mono">
                      <div className="bg-success/5 border border-success/15 p-1.5 rounded-lg text-success">
                        <div className="font-bold">{passedCount}</div>
                        <div className="text-[7px] text-text-muted uppercase">Pass</div>
                      </div>
                      <div className="bg-warning/5 border border-warning/15 p-1.5 rounded-lg text-warning">
                        <div className="font-bold">{warningCount}</div>
                        <div className="text-[7px] text-text-muted uppercase">Warn</div>
                      </div>
                      <div className="bg-danger/5 border border-danger/15 p-1.5 rounded-lg text-danger">
                        <div className="font-bold">{failedCount}</div>
                        <div className="text-[7px] text-text-muted uppercase">Fail</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Risk Distribution (Pie Chart) */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-accent" /> Security Risk Distribution
                  </h3>
                  <div className="h-48 w-full mt-4 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 text-[10px] font-semibold font-mono flex-1">
                      {[
                        { name: "Passed Verification", value: passedCount, color: "#10b981" },
                        { name: "Warning / Hardening", value: warningCount, color: "#f59e0b" },
                        { name: "Vulnerabilities Found", value: failedCount, color: "#ef4444" }
                      ].map((d, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-bg/50 border border-white/[0.02]">
                          <span className="flex items-center gap-1.5" style={{ color: d.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-text">{d.value}</span>
                        </div>
                      ))}
                    </div>
                    {mounted && (
                      <div className="h-32 w-32 flex-shrink-0 relative">
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

                {/* 2. Findings by Severity (Bar Chart) */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-accent" /> Vulnerabilities by Severity
                  </h3>
                  <div className="h-48 w-full mt-4">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: "Critical", value: severityCounts.critical, fill: "#ef4444" },
                          { name: "High", value: severityCounts.high, fill: "#f97316" },
                          { name: "Medium", value: severityCounts.medium, fill: "#f59e0b" },
                          { name: "Low", value: severityCounts.low, fill: "#3b82f6" },
                          { name: "Info/Pass", value: severityCounts.info, fill: "#10b981" }
                        ]} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={8} tickLine={false} allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ background: "#0b0f19", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", fontSize: "10px" }}
                            itemStyle={{ color: "#f3f4f6" }}
                          />
                          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
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

                {/* 3. Scan Categories Status (Radar Chart) */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-accent" /> Scan Categories Status
                  </h3>
                  <div className="h-48 w-full mt-4 flex items-center justify-center">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
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

                {/* 4. Security Headers Status (Pie Chart) */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04]">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-accent" /> Security Headers Status
                  </h3>
                  <div className="h-48 w-full mt-4 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 text-[10px] font-semibold font-mono flex-1">
                      {[
                        { name: "Passed (Present)", value: headers.filter(h => h.status === "present").length, color: "#10b981" },
                        { name: "Warning (Weak)", value: headers.filter(h => h.status === "weak").length, color: "#f59e0b" },
                        { name: "Failed (Missing)", value: headers.filter(h => h.status === "missing").length, color: "#ef4444" }
                      ].map((d, i) => (
                        <div key={i} className="flex justify-between items-center p-2 rounded bg-bg/50 border border-white/[0.02]">
                          <span className="flex items-center gap-1.5" style={{ color: d.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name}
                          </span>
                          <span className="font-bold text-text">{d.value}</span>
                        </div>
                      ))}
                    </div>
                    {mounted && (
                      <div className="h-32 w-32 flex-shrink-0 relative">
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
              <div className="border-b border-white/[0.05] pb-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">HTTP Security Headers</h2>
                  <p className="text-[10px] text-text-dim mt-0.5 font-sans font-medium">Verify standard security response headers configured on the remote server.</p>
                </div>
                <Button
                  onClick={() => handleRefreshSection("headers")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[10px] py-1.5"
                >
                  Refresh Headers
                </Button>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface/20 border border-white/[0.04] p-3 rounded-2xl">
                <div className="relative w-full sm:max-w-xs flex items-center">
                  <Search className="absolute left-3 text-text-muted h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search response headers..."
                    value={headersSearch}
                    onChange={(e) => setHeadersSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-bg/50 border border-white/[0.05] focus:border-accent/40 rounded-xl text-xs text-text outline-none transition-all font-mono"
                  />
                </div>

                <div className="flex gap-2 w-full sm:w-auto text-[10.5px]">
                  <select
                    value={headersFilter}
                    onChange={(e) => setHeadersFilter(e.target.value)}
                    className="bg-bg/50 border border-white/[0.05] text-text-dim rounded-xl px-3.5 py-2 font-mono outline-none cursor-pointer focus:border-accent/40 w-full sm:w-auto"
                  >
                    <option value="all">All States</option>
                    <option value="present">Present (Passed)</option>
                    <option value="weak">Weak configuration</option>
                    <option value="missing">Missing header</option>
                  </select>
                </div>
              </div>

              {/* Headers List */}
              <div className="space-y-4">
                {filteredHeaders.length === 0 ? (
                  <div className="text-center py-12 text-text-dim italic text-xs font-mono">
                    No headers match the selected search or state filters.
                  </div>
                ) : (
                  filteredHeaders.map((header) => {
                    const isExpanded = expandedHeaders.includes(header.name);
                    const isPresent = header.status === "present";
                    const isWeak = header.status === "weak";
                    const isMissing = header.status === "missing";
                    const badgeVariant = isPresent ? "success" : isWeak ? "warning" : "danger";

                    return (
                      <Card key={header.name} className="border border-white/[0.04] bg-surface/30 rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-300">
                        <div
                          onClick={() => toggleHeaderExpand(header.name)}
                          className="flex justify-between items-center p-4.5 cursor-pointer hover:bg-white/[0.01] gap-4"
                        >
                          <div className="min-w-0 text-left font-mono">
                            <span className="font-bold text-text block text-xs tracking-tight">{header.name}</span>
                            <span className="text-[10px] text-text-dim truncate block max-w-lg mt-0.5" title={header.value || "Header omitted in response."}>
                              {header.value || <span className="italic text-text-muted">Header Omitted</span>}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant={badgeVariant} className="text-[8px] py-0.5 tracking-wider font-mono select-none">
                              {header.status.toUpperCase()}
                            </Badge>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-5 border-t border-white/[0.03] space-y-4 bg-bg/25 text-xs font-sans">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider block font-mono">Direct Risk Impact</span>
                                <p className="text-text-dim leading-relaxed">{header.description || "Omission of this header leaves clients vulnerable to framing, script injection, or context leakage."}</p>
                              </div>
                              {header.recommendation && (
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-success uppercase tracking-wider block font-mono">Recommended Formatting</span>
                                  <code className="bg-bg border border-white/[0.05] p-2 rounded block text-[9.5px] text-accent-light font-mono select-all select-text">{header.recommendation}</code>
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

          {/* ==================== 3. SSL/TLS TAB ==================== */}
          {activeTab === "ssl" && ssl && (
            <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
              {renderSectionLoader("ssl")}
              <div className="border-b border-white/[0.05] pb-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">SSL/TLS Certificates</h2>
                  <p className="text-[10px] text-text-dim mt-0.5 font-sans">Inspect encryption keys validation, trusted CA issuers, and validity schedules.</p>
                </div>
                <Button
                  onClick={() => handleRefreshSection("ssl")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[10px] py-1.5"
                >
                  Refresh SSL
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Key className="h-4 w-4 text-accent" /> Certificate Summary
                  </h3>
                  <div className="space-y-3.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim">Trusted Authority (CA)</span>
                      <span className="font-bold text-text truncate max-w-[200px]" title={ssl.issuer}>{ssl.issuer || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim">TLS Version Handshake</span>
                      <span className="font-bold text-accent">{ssl.tlsVersion || "TLSv1.3"}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim">Certificate Valid</span>
                      <Badge variant={ssl.valid ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {ssl.valid ? "VALID" : "INVALID / EXPIRED"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Remaining Validity</span>
                      <span className={`font-bold ${ssl.daysRemaining < 30 ? "text-danger animate-pulse" : "text-success"}`}>
                        {ssl.daysRemaining ?? "N/A"} Days
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Lock className="h-4 w-4 text-accent" /> Key Parameters
                  </h3>
                  <div className="space-y-3.5 font-mono text-xs">
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim">Asymmetric Signature</span>
                      <span className="font-bold text-text">{ssl.keyType || "RSA"} ({ssl.keyLength || "2048"} bits)</span>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim">HSTS Preload Status</span>
                      <Badge variant={ssl.hstsPreload ? "success" : "warning"} className="text-[7.5px] py-0.5">
                        {ssl.hstsPreload ? "PRELOADED" : "NO PRELOAD"}
                      </Badge>
                    </div>
                    <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                      <span className="text-text-dim">OCSP Stapling Status</span>
                      <span className="font-bold text-text">{ssl.ocspStatus || "Good"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-dim">Wildcard Certificate</span>
                      <span className="font-bold text-text">{ssl.wildcard ? "Yes" : "No"}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {ssl.supportedVersions && ssl.supportedVersions.length > 0 && (
                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                    Supported Protocol Negotiation
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1.5 font-mono">
                    {ssl.supportedVersions.map((ver, idx) => (
                      <span
                        key={idx}
                        className={`text-[9.5px] font-bold px-2.5 py-1 rounded-lg border ${ver.includes("1.3") ? "border-success/30 bg-success/5 text-success" :
                          ver.includes("1.2") ? "border-accent/30 bg-accent/5 text-accent" :
                            "border-danger/30 bg-danger/5 text-danger font-line-through"
                          }`}
                      >
                        {ver}
                      </span>
                    ))}
                  </div>
                </Card>
              )}

              {ssl.sans && ssl.sans.length > 0 && (
                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                    Subject Alternative Names (SANs) ({ssl.sans.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1 font-mono text-[10px] max-h-48 overflow-y-auto pr-1">
                    {ssl.sans.map((san, idx) => (
                      <div key={idx} className="bg-bg/40 border border-white/[0.02] px-2.5 py-1.5 rounded-lg select-all truncate" title={san}>
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
              <div className="border-b border-white/[0.05] pb-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">DNS &amp; Domain Records</h2>
                  <p className="text-[10px] text-text-dim mt-0.5 font-sans">Active DNS server zones lookup and validation check summaries.</p>
                </div>
                <Button
                  onClick={() => handleRefreshSection("dns")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[10px] py-1.5"
                >
                  Refresh DNS
                </Button>
              </div>

              {/* SPF, DMARC, MTA-STS email integrity cards */}
              {emailSecurity && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                      Sender Policy Framework (SPF)
                    </h3>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span>Record Present</span>
                        <Badge variant={emailSecurity.spfPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                          {emailSecurity.spfPresent ? "PASSED" : "FAILED"}
                        </Badge>
                      </div>
                      {dns.spf?.value && (
                        <div className="space-y-1">
                          <span className="text-[8px] text-text-muted uppercase">TXT Payload</span>
                          <code className="bg-bg border border-white/[0.05] p-2 rounded block text-[9.5px] break-all select-all font-mono">{dns.spf.value}</code>
                        </div>
                      )}
                      {dns.spf?.error && (
                        <div className="p-2.5 bg-danger/5 border border-danger/10 rounded-lg text-[10px] text-danger font-sans leading-relaxed">
                          ⚠️ {dns.spf.error}
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2">
                      Domain Mail Authentication (DMARC)
                    </h3>
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span>Record Present</span>
                        <Badge variant={emailSecurity.dmarcPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                          {emailSecurity.dmarcPresent ? "PASSED" : "FAILED"}
                        </Badge>
                      </div>
                      {dns.dmarc?.value && (
                        <div className="space-y-1">
                          <span className="text-[8px] text-text-muted uppercase">TXT Payload</span>
                          <code className="bg-bg border border-white/[0.05] p-2 rounded block text-[9.5px] break-all select-all font-mono">{dns.dmarc.value}</code>
                        </div>
                      )}
                      {dns.dmarc?.error && (
                        <div className="p-2.5 bg-danger/5 border border-danger/10 rounded-lg text-[10px] text-danger font-sans leading-relaxed">
                          ⚠️ {dns.dmarc.error}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}

              {/* Crawler Files */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs text-left">
                {robotsTxt && (
                  <Card className="p-4 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[130px]">
                    <div>
                      <span className="text-[9px] text-text-muted uppercase font-bold">robots.txt</span>
                      <span className="font-bold text-text text-[11px] block mt-1">{robotsTxt.exists ? "Active Policy" : "Omitted"}</span>
                    </div>
                    {robotsTxt.exists && (
                      <p className={`text-[9.5px] font-bold ${robotsTxt.sensitiveExposed ? "text-danger animate-pulse" : "text-success"}`}>
                        {robotsTxt.sensitiveExposed ? "⚠️ Sensitive Paths Listed" : "✓ Safe Paths Indexing"}
                      </p>
                    )}
                    <Badge variant={robotsTxt.exists ? "success" : "warning"} className="text-[7.5px] py-0.5 w-max">
                      {robotsTxt.exists ? "RESOLVED" : "ADVISORY"}
                    </Badge>
                  </Card>
                )}

                {sitemapXml && (
                  <Card className="p-4 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[130px]">
                    <div>
                      <span className="text-[9px] text-text-muted uppercase font-bold">sitemap.xml</span>
                      <span className="font-bold text-text text-[11px] block mt-1">{sitemapXml.exists ? `${sitemapXml.urlCount ?? 0} URLs Listed` : "Omitted"}</span>
                    </div>
                    {sitemapXml.exists && sitemapXml.lastModified && (
                      <span className="text-[9.5px] text-text-dim">Last modified: {new Date(sitemapXml.lastModified).toLocaleDateString()}</span>
                    )}
                    <Badge variant={sitemapXml.exists ? "success" : "warning"} className="text-[7.5px] py-0.5 w-max">
                      {sitemapXml.exists ? "RESOLVED" : "ADVISORY"}
                    </Badge>
                  </Card>
                )}

                {securityTxt && (
                  <Card className="p-4 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[130px]">
                    <div>
                      <span className="text-[9px] text-text-muted uppercase font-bold">security.txt</span>
                      <span className="font-bold text-text text-[11px] block mt-1">{securityTxt.exists ? "Disclosure Active" : "Omitted"}</span>
                    </div>
                    {securityTxt.exists && securityTxt.contact && (
                      <span className="text-[9.5px] text-text-dim truncate font-mono" title={securityTxt.contact}>{securityTxt.contact}</span>
                    )}
                    <Badge variant={securityTxt.exists ? "success" : "warning"} className="text-[7.5px] py-0.5 w-max">
                      {securityTxt.exists ? "RESOLVED" : "ADVISORY"}
                    </Badge>
                  </Card>
                )}
              </div>

              {/* Records Explorer */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-accent" /> Published Zone Records
                </h3>
                <div className="space-y-3 font-mono text-xs">
                  {dns.a && dns.a.length > 0 && (
                    <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                      <span className="text-[9px] font-bold text-text-muted block uppercase mb-1">A Address Mappings</span>
                      <div className="flex flex-wrap gap-2">
                        {dns.a.map((ip, idx) => (
                          <span key={idx} className="bg-surface border border-white/[0.04] px-2.5 py-1.5 rounded-lg text-[10px] text-accent-light font-bold select-all">{ip}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {dns.aaaa && dns.aaaa.length > 0 && (
                    <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                      <span className="text-[9px] font-bold text-text-muted block uppercase mb-1">AAAA (IPv6) Address Mappings</span>
                      <div className="flex flex-wrap gap-2">
                        {dns.aaaa.map((ip, idx) => (
                          <span key={idx} className="bg-surface border border-white/[0.04] px-2.5 py-1.5 rounded-lg text-[10px] text-accent-light font-bold select-all">{ip}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {dns.mx && dns.mx.length > 0 && (
                    <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                      <span className="text-[9px] font-bold text-text-muted block uppercase mb-1.5">MX Mail Servers</span>
                      <div className="space-y-1">
                        {dns.mx.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] bg-surface/50 p-2 rounded-lg select-all">{m}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dns.txt && dns.txt.length > 0 && (
                    <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                      <span className="text-[9px] font-bold text-text-muted block uppercase mb-1.5">TXT Records</span>
                      <div className="space-y-1.5">
                        {dns.txt.map((t, idx) => (
                          <div key={idx} className="bg-surface/50 p-2.5 rounded-lg text-[10px] text-text-dim select-all break-all leading-normal">{t}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* ==================== 5. OPEN PORTS TAB ==================== */}
          {activeTab === "ports" && exposedServices && exposedServices.length > 0 && (
            <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
              {renderSectionLoader("ports")}
              <div className="border-b border-white/[0.05] pb-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Open Application Ports</h2>
                  <p className="text-[10px] text-text-dim mt-0.5 font-sans">Active port state mapping and service listening daemons scans.</p>
                </div>
                <Button
                  onClick={() => handleRefreshSection("ports")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[10px] py-1.5"
                >
                  Refresh Ports
                </Button>
              </div>

              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-accent" /> Port Scans Checklist
                </h3>
                <p className="text-xs text-text-dim font-sans leading-relaxed">
                  The following active TCP listening ports were detected on target host interfaces. Administrative interfaces (SSH, SQL, FTP) should always be closed to the public.
                </p>
                <div className="flex flex-wrap gap-2.5 pt-2">
                  {exposedServices.map((srv, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedPort(srv)}
                      className="flex items-center gap-2 bg-bg/60 hover:bg-bg border border-white/[0.05] px-4 py-2.5 rounded-xl text-xs font-mono transition-all text-left group"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                      <span className="font-bold text-text">Port {srv.port}</span>
                      <span className="text-text-muted font-normal">/ {srv.service}</span>
                      <ChevronRight className="h-3 w-3 text-text-dim group-hover:translate-x-0.5 transition-transform ml-1" />
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ==================== 6. SUBDOMAINS TAB ==================== */}
          {activeTab === "subdomains" && subdomains && subdomains.length > 0 && (
            <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
              {renderSectionLoader("subdomains")}
              <div className="border-b border-white/[0.05] pb-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Active Subdomains Discovery</h2>
                  <p className="text-[10px] text-text-dim mt-0.5 font-sans">Discovered active dns subdomains mapping. Verify configurations to prevent stale link takeovers.</p>
                </div>
                <Button
                  onClick={() => handleRefreshSection("subdomains")}
                  disabled={!!refreshingSection}
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  className="hover:border-accent/40 hover:text-accent font-bold text-[10px] py-1.5"
                >
                  Refresh Subdomains
                </Button>
              </div>

              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                  <Layers className="h-4 w-4 text-accent" /> Active Subdomains ({subdomains.length})
                </h3>
                <p className="text-xs text-text-dim leading-relaxed font-sans pb-2">
                  Click on any discovered subdomain URL path to perform an instant, active security header scan directly against it.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
                  {subdomains.map((sub, idx) => {
                    const subName = sub.subdomain || sub;
                    return (
                      <div key={idx} className="flex justify-between items-center bg-bg/40 border border-white/[0.03] p-3 rounded-xl text-xs font-mono hover:border-white/[0.08] transition-all">
                        <span className="truncate max-w-[200px] text-text select-all" title={subName}>{subName}</span>
                        <Button
                          onClick={() => handleScanSubdomain(subName)}
                          variant="secondary"
                          size="sm"
                          className="py-1 text-[9.5px] flex-shrink-0"
                          icon={RefreshCw}
                        >
                          Audit Site
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}

          {/* ==================== 7. ATTACK SURFACE TAB ==================== */}
          {activeTab === "attack-surface" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-white/[0.05] pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Attack Surface Exposure</h2>
                <p className="text-[10px] text-text-dim mt-0.5 font-sans font-medium">Verify publicly accessible administration directories and environment variable logs.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Exposed Paths */}
                {sensitiveFiles && sensitiveFiles.filter(f => f.exists).length > 0 && (
                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-accent" /> Leaked Environment / git Files ({sensitiveFiles.filter(f => f.exists).length})
                    </h3>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 font-mono text-[11px]">
                      {sensitiveFiles.filter(f => f.exists).map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-bg/40 border border-white/[0.03] p-3 rounded-xl">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-text select-all block truncate" title={file.path}>{file.path}</span>
                            <span className="text-[9px] text-text-muted mt-0.5 block">Response code: HTTP {file.status || 200}</span>
                          </div>
                          <Badge variant="danger" className="text-[7.5px] py-0.5 shrink-0">EXPOSED</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Login surfaces */}
                {loginSurfaces && loginSurfaces.length > 0 && (
                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <Lock className="h-4.5 w-4.5 text-accent" /> Administrative Portal Links ({loginSurfaces.length})
                    </h3>
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 font-mono text-[11px]">
                      {loginSurfaces.map((login, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-bg/40 border border-white/[0.03] p-3 rounded-xl">
                          <div className="min-w-0 pr-2">
                            <span className="font-bold text-text select-all block truncate" title={login.path}>{login.path}</span>
                          </div>
                          <Badge variant="warning" className="text-[7.5px] py-0.5 shrink-0">ACCESSIBLE</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ==================== 8. SEO TAB ==================== */}
          {activeTab === "seo" && (
            <div className="space-y-6 animate-fadeIn text-left relative min-h-[300px]">
              {renderSectionLoader("seo")}
              <div className="border-b border-white/[0.05] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    {seoData.favicon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={seoData.favicon} 
                        alt="Target Website Icon Logo" 
                        className="h-5 w-5 rounded bg-white/10 p-0.5 object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">SEO Optimization &amp; Crawling</h2>
                  </div>
                  <p className="text-[10px] text-text-dim mt-0.5 font-sans">Analyze search crawler indexing, title & description tags, HTML heading structures, image alt compliance, and OpenGraph social shares.</p>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                  {seoData.title && (
                    <div className="hidden lg:flex items-center gap-2 bg-white/[0.02] border border-white/[0.05] py-1.5 px-3 rounded-xl max-w-[200px] truncate text-[9px] font-mono text-text-dim">
                      <span className="text-[7.5px] uppercase tracking-wider text-accent font-bold">Site Title:</span>
                      <span className="truncate select-all" title={seoData.title}>{seoData.title}</span>
                    </div>
                  )}
                  <Button
                    onClick={() => handleRefreshSection("seo")}
                    disabled={!!refreshingSection}
                    variant="outline"
                    size="sm"
                    icon={RefreshCw}
                    className="hover:border-accent/40 hover:text-accent font-bold text-[10px] py-1.5"
                  >
                    Refresh SEO
                  </Button>
                </div>
              </div>

              {!seo || (!seoData.title && !seoData.description && seoData.imageCount === 0 && seoData.h1Count === 0) ? (
                <Card className="p-8 border border-warning/20 bg-warning/5 text-center space-y-4 font-sans max-w-lg mx-auto rounded-2xl shadow-xl my-6">
                  <div className="flex justify-center">
                    <div className="p-3.5 bg-warning/10 border border-warning/20 rounded-full">
                      <AlertTriangle className="h-8 w-8 text-warning animate-pulse" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black uppercase tracking-wider text-text font-mono">SEO Content Diagnostics Unavailable</h3>
                    <p className="text-xs text-text-dim leading-relaxed">
                      We were unable to crawl or retrieve the HTML structure of the target page for this scan. This occurs when:
                    </p>
                  </div>
                  <ul className="text-[11px] text-text-dim list-disc list-inside space-y-1.5 max-w-xs mx-auto text-left font-mono bg-black/20 p-3.5 rounded-xl border border-white/[0.03]">
                    <li>The target server blocks crawler requests (e.g. Cloudflare / WAF rules)</li>
                    <li>Network timeouts occurred during scanning</li>
                    <li>This is an older scan record stored before SEO features were introduced</li>
                  </ul>
                  <p className="text-[10px] text-text-muted">
                    Try running a new scan or check if the domain is fully public and reachable.
                  </p>
                </Card>
              ) : (
                <>
                  {/* SECTION: HTML Meta Audits */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                      <Search className="h-4.5 w-4.5 text-accent" /> Meta Content Tags Audit
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                      {/* Title Audit Card */}
                      <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3">
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                          <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">HTML Page Title</span>
                          {(() => {
                            const len = (seoData.title || "").length;
                            if (len === 0) return <Badge variant="danger" className="text-[7.5px] py-0.5">CRITICAL MISSING</Badge>;
                            if (len >= 50 && len <= 60) return <Badge variant="success" className="text-[7.5px] py-0.5">OPTIMAL LENGTH</Badge>;
                            return <Badge variant="warning" className="text-[7.5px] py-0.5">{len < 50 ? "SHORT" : "TOO LONG"}</Badge>;
                          })()}
                        </div>
                        <div className="space-y-2">
                          <div className="bg-bg/40 p-2.5 rounded-lg border border-white/[0.02] text-xs font-sans text-text select-all leading-normal">
                            {seoData.title || <span className="italic text-text-muted font-mono">Omitted (No Title Element Detected)</span>}
                          </div>
                          <div className="flex justify-between text-[10px] text-text-dim">
                            <span>Character Count:</span>
                            <span className="font-bold text-text">{(seoData.title || "").length} / 60 max (ideal: 50-60)</span>
                          </div>
                        </div>
                      </Card>

                      {/* Description Audit Card */}
                      <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3">
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                          <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">Meta Description</span>
                          {(() => {
                            const len = (seoData.description || "").length;
                            if (len === 0) return <Badge variant="danger" className="text-[7.5px] py-0.5">CRITICAL MISSING</Badge>;
                            if (len >= 120 && len <= 160) return <Badge variant="success" className="text-[7.5px] py-0.5">OPTIMAL LENGTH</Badge>;
                            return <Badge variant="warning" className="text-[7.5px] py-0.5">{len < 120 ? "SHORT" : "TOO LONG"}</Badge>;
                          })()}
                        </div>
                        <div className="space-y-2">
                          <div className="bg-bg/40 p-2.5 rounded-lg border border-white/[0.02] text-xs font-sans text-text select-all leading-normal">
                            {seoData.description || <span className="italic text-text-muted font-mono">Omitted (No Meta Description Detected)</span>}
                          </div>
                          <div className="flex justify-between text-[10px] text-text-dim">
                            <span>Character Count:</span>
                            <span className="font-bold text-text">{(seoData.description || "").length} / 160 max (ideal: 120-160)</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* SECTION: Accessibility & Heading Structure */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                      <Activity className="h-4.5 w-4.5 text-accent" /> Page Accessibility &amp; Structure
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                      {/* Image Alt Compliance Card */}
                      <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                          <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">Image Alt Tags Audit</span>
                          {(() => {
                            const count = seoData.imageCount || 0;
                            const alt = seoData.imageAltCount || 0;
                            if (count === 0) return <Badge variant="success" className="text-[7.5px] py-0.5">NO IMAGES</Badge>;
                            if (count === alt) return <Badge variant="success" className="text-[7.5px] py-0.5">WCAG COMPLIANT</Badge>;
                            return <Badge variant="warning" className="text-[7.5px] py-0.5">ALT TEXT MISSING</Badge>;
                          })()}
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                            <div className="bg-bg/40 border border-white/[0.02] p-2 rounded-lg">
                              <div className="font-bold text-text">{seoData.imageCount ?? 0}</div>
                              <div className="text-[7px] text-text-muted uppercase mt-0.5">Total Imgs</div>
                            </div>
                            <div className="bg-success/5 border border-success/15 p-2 rounded-lg text-success">
                              <div className="font-bold">{seoData.imageAltCount ?? 0}</div>
                              <div className="text-[7px] text-text-muted uppercase mt-0.5">With Alt</div>
                            </div>
                            <div className="bg-danger/5 border border-danger/15 p-2 rounded-lg text-danger">
                              <div className="font-bold">{Math.max(0, (seoData.imageCount ?? 0) - (seoData.imageAltCount ?? 0))}</div>
                              <div className="text-[7px] text-text-muted uppercase mt-0.5">Missing Alt</div>
                            </div>
                          </div>

                          {/* Compliance Progress Bar */}
                          {(() => {
                            const count = seoData.imageCount || 0;
                            const alt = seoData.imageAltCount || 0;
                            const percentage = count > 0 ? Math.round((alt / count) * 100) : 100;
                            const isOptimal = percentage === 100;
                            const isPoor = percentage < 50;
                            return (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] text-text-dim">
                                  <span>Alt Attribute Compliance Rate:</span>
                                  <span className={`font-bold ${isOptimal ? "text-success" : isPoor ? "text-danger" : "text-warning"}`}>{percentage}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/[0.03] rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${isOptimal ? "bg-success" : isPoor ? "bg-danger" : "bg-warning"}`} 
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </Card>

                      {/* Heading Tag Distribution Card */}
                      <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                        <div className="flex justify-between items-center border-b border-white/[0.05] pb-2">
                          <span className="font-bold text-text uppercase text-[10px] tracking-wider font-mono">Headings Structure</span>
                          {(() => {
                            const h1 = seoData.h1Count || 0;
                            if (h1 === 1) return <Badge variant="success" className="text-[7.5px] py-0.5">OPTIMAL HIERARCHY</Badge>;
                            if (h1 > 1) return <Badge variant="warning" className="text-[7.5px] py-0.5">MULTIPLE H1 TAGS</Badge>;
                            return <Badge variant="danger" className="text-[7.5px] py-0.5">MISSING H1 TAG</Badge>;
                          })()}
                        </div>

                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-center font-mono text-xs">
                            <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                              <div className="text-[8px] text-text-muted uppercase mb-0.5">&lt;h1&gt; Tag Count</div>
                              <div className={`text-xl font-bold font-mono ${seoData.h1Count === 1 ? "text-success" : seoData.h1Count > 1 ? "text-warning" : "text-danger"}`}>
                                {seoData.h1Count ?? 0}
                              </div>
                            </div>
                            <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                              <div className="text-[8px] text-text-muted uppercase mb-0.5">&lt;h2&gt; Tag Count</div>
                              <div className="text-xl font-bold font-mono text-accent">
                                {seoData.h2Count ?? 0}
                              </div>
                            </div>
                          </div>
                          <p className="text-[9.5px] text-text-muted leading-relaxed font-sans mt-1">
                            Search bots prioritize the &lt;h1&gt; element to establish focus. Exactly one &lt;h1&gt; tag must exist per page, followed by structured &lt;h2&gt; subheadings.
                          </p>
                        </div>
                      </Card>
                    </div>
                  </div>

                  {/* SECTION: Social Preview & Metadata details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono">
                    {/* Global Crawl Parameters */}
                    <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3.5 text-[10.5px]">
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                        <Layers className="h-4.5 w-4.5 text-accent" /> Crawler Indexing Directives
                      </h3>
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span className="text-text-dim">Search Engine Indexable</span>
                        <Badge variant={seoData.isIndexable ? "success" : "warning"} className="text-[7.5px] py-0.5 font-sans">
                          {seoData.isIndexable ? "INDEXABLE" : "NOINDEX"}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <span className="text-text-dim text-[9px] uppercase font-mono">Crawler Directives (meta name="robots")</span>
                        <code className="bg-bg border border-white/[0.05] p-2 rounded block text-[9.5px] truncate select-all">{seoData.metaRobots || "Omitted"}</code>
                      </div>
                      <div className="space-y-1">
                        <span className="text-text-dim text-[9px] uppercase font-mono">Canonical Link Configuration</span>
                        <code className="bg-bg border border-white/[0.05] p-2 rounded block text-[9.5px] truncate select-all">{seoData.canonicalUrl || "Omitted"}</code>
                      </div>
                    </Card>

                    {/* Twitter Cards Metadata Table */}
                    {seoData.twitterCard && (
                      <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3">
                        <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                          <Code className="h-4 w-4 text-accent" /> Twitter Cards Raw Metadata
                        </h3>
                        <div className="space-y-2 text-[10px]">
                          <div className="flex justify-between border-b border-white/[0.02] pb-1">
                            <span className="text-text-dim uppercase text-[8px] font-mono">twitter:card</span>
                            <span className="font-bold text-text">{seoData.twitterCard.card || "summary"}</span>
                          </div>
                          <div className="flex justify-between border-b border-white/[0.02] pb-1">
                            <span className="text-text-dim uppercase text-[8px] font-mono">twitter:site</span>
                            <span className="font-bold text-text">{seoData.twitterCard.site || "N/A"}</span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-text-dim uppercase text-[8px] font-mono block">twitter:title</span>
                            <p className="text-text truncate select-all font-sans font-semibold">{seoData.twitterCard.title || "N/A"}</p>
                          </div>
                        </div>
                      </Card>
                    )}
                  </div>

                  {/* Social Media Link Embed Preview Card (Visualizing og:image) */}
                  {seoData.openGraph && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Visual Social Card Preview */}
                      {seoData.openGraph.image && (
                        <div className="space-y-3">
                          <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                            <Globe className="h-4.5 w-4.5 text-accent" /> Social Media Embed Card Preview
                          </h3>
                          <Card className="bg-[#0b0f19] border border-white/[0.06] rounded-xl overflow-hidden hover:border-white/10 transition-all duration-300">
                            <div className="relative aspect-video bg-bg/50 border-b border-white/[0.04] overflow-hidden flex items-center justify-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={seoData.openGraph.image}
                                alt="OpenGraph Sharing Preview"
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="p-4 space-y-1 text-left font-sans">
                              <span className="text-[9px] font-bold text-accent uppercase tracking-wider font-mono">{domain}</span>
                              <h4 className="text-xs sm:text-sm font-bold text-text line-clamp-1">{seoData.openGraph.title || seoData.title || "No Title Defined"}</h4>
                              <p className="text-[11px] text-text-dim line-clamp-2 leading-relaxed">{seoData.openGraph.description || seoData.description || "No description tags available to preview."}</p>
                            </div>
                          </Card>
                        </div>
                      )}

                      {/* OpenGraph Raw Fields */}
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                          <Link2 className="h-4.5 w-4.5 text-accent" /> OpenGraph Social Metadata
                        </h3>
                        <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-3 font-mono text-xs">
                          <div className="space-y-1.5">
                            <span className="text-text-dim uppercase text-[8px] font-mono block">og:title</span>
                            <div className="bg-bg/40 p-2.5 rounded-lg text-text border border-white/[0.02] font-sans font-semibold select-all truncate">{seoData.openGraph.title || "N/A"}</div>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-text-dim uppercase text-[8px] font-mono block">og:type</span>
                            <div className="bg-bg/40 p-2.5 rounded-lg text-text border border-white/[0.02] select-all truncate">{seoData.openGraph.type || "website"}</div>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-text-dim uppercase text-[8px] font-mono block">og:url</span>
                            <div className="bg-bg/40 p-2.5 rounded-lg text-accent-light border border-white/[0.02] select-all truncate">{seoData.openGraph.url || "N/A"}</div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Discovered Brand Images & Logos */}
                  {seoData.detectedImages && seoData.detectedImages.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                        <Globe className="h-4.5 w-4.5 text-accent" /> Discovered Brand Images &amp; Logos ({seoData.detectedImages.length})
                      </h3>
                      <Card className="p-5 bg-surface/30 border border-white/[0.04]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {seoData.detectedImages.map((img, idx) => (
                            <div key={idx} className="bg-[#0b0f19] border border-white/[0.05] rounded-xl overflow-hidden hover:border-accent/30 transition-all duration-300 flex flex-col justify-between">
                              <div className="relative aspect-square bg-white/[0.02] border-b border-white/[0.04] p-3 flex items-center justify-center group overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={img.src}
                                  alt={img.alt}
                                  className="object-contain max-h-full max-w-full rounded transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                              <div className="p-2 space-y-1 font-mono text-[9px]">
                                <p className="font-bold text-text truncate select-all" title={img.alt}>{img.alt}</p>
                                <div className="flex justify-between items-center text-text-dim text-[8px]">
                                  <span className="uppercase font-semibold text-accent">{img.type || "asset"}</span>
                                  <a 
                                    href={img.src} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-accent hover:underline hover:text-accent-light"
                                  >
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

          {/* ==================== 9. PERFORMANCE TAB ==================== */}
          {activeTab === "performance" && performance && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-white/[0.05] pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Performance Timing Latencies</h2>
                <p className="text-[10px] text-text-dim mt-0.5 font-sans">Active network response latencies, TLS handshake, and DNS lookups durations.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 font-mono text-xs">
                {/* Speed Gauges */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-accent" /> Network Response Durations
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
                            <span className="text-text-dim">{metric.label}</span>
                            <span className="font-bold text-text">{metric.value} {metric.unit}</span>
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

                {/* Score Summary */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04] flex flex-col justify-between min-h-[220px]">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                      <Clock className="h-4.5 w-4.5 text-accent" /> Performance Health Metrics
                    </h3>
                    <p className="text-xs text-text-dim font-sans leading-relaxed mt-2.5">
                      Fast response times are vital for both SEO search rankings and reducing client connection time windows. Long TTFB or Handshake latency can reveal firewall throttles or poor CDN routes.
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/[0.03]">
                    <span className="text-text-muted text-[10px] uppercase font-bold tracking-wider">Evaluation Speed</span>
                    <Badge variant={(performance.responseTime || 350) < 500 ? "success" : "warning"} className="text-[7.5px] py-0.5">
                      {(performance.responseTime || 350) < 500 ? "OPTIMAL RESPONSE" : "LATENCY DETECTED"}
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ==================== 10. TECHNOLOGIES TAB ==================== */}
          {activeTab === "tech" && techStack && techStack.length > 0 && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-white/[0.05] pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Observed Technology Stack</h2>
                <p className="text-[10px] text-text-dim mt-0.5 font-sans">Observed system headers footprints. Hiding detailed versions reduces vulnerability profiling options.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
                {/* Stack Grid */}
                <Card className="p-5 bg-surface/30 border border-white/[0.04] md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Cpu className="h-4.5 w-4.5 text-accent" /> Technology Components ({techStack.length})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                    {techStack.map((tech, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTech(tech)}
                        className="bg-bg/40 border border-white/[0.04] hover:border-white/[0.12] p-3 rounded-xl text-left space-y-1.5 transition-all group flex flex-col justify-between min-h-[80px]"
                      >
                        <span className="text-[8px] text-text-muted block uppercase tracking-wider font-bold">{tech.category}</span>
                        <div className="flex justify-between items-center gap-2 w-full">
                          <span className="font-bold text-text block truncate text-xs">{tech.name}</span>
                          <ChevronRight className="h-3 w-3 text-text-dim group-hover:translate-x-0.5 transition-transform shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Infrastructure Details */}
                {infrastructure && (
                  <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 flex items-center gap-2">
                      <Server className="h-4.5 w-4.5 text-accent" /> Server Hosting
                    </h3>

                    <div className="space-y-3 font-mono text-[11px]">
                      <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                        <span className="text-text-dim uppercase text-[8px] block">Web Server</span>
                        <span className="font-bold text-text truncate max-w-[120px]">{infrastructure.cdn || infrastructure.reverseProxy || "Nginx"}</span>
                      </div>
                      {infrastructure.hosting && (
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span className="text-text-dim uppercase text-[8px] block">Cloud Host</span>
                          <span className="font-bold text-text truncate max-w-[120px]">{infrastructure.hosting}</span>
                        </div>
                      )}
                      {infrastructure.asn && (
                        <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                          <span className="text-text-dim uppercase text-[8px] block">ASN Network</span>
                          <span className="font-bold text-text select-all">{infrastructure.asn}</span>
                        </div>
                      )}
                      {infrastructure.isp && (
                        <div className="flex justify-between">
                          <span className="text-text-dim uppercase text-[8px] block">ISP Provider</span>
                          <span className="font-bold text-text truncate max-w-[120px]" title={infrastructure.isp}>{infrastructure.isp}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ==================== 11. RECOMMENDATIONS TAB ==================== */}
          {activeTab === "recommendations" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-white/[0.05] pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Failed Checks &amp; AI Recommendations</h2>
                <p className="text-[10px] text-text-dim mt-0.5 font-sans">Actionable mitigation steps, web server configuration formatting, and AI diagnostics analysis.</p>
              </div>

              {/* Filtering for Failed Checks */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-surface/20 border border-white/[0.04] p-3 rounded-2xl">
                <div className="relative w-full sm:max-w-xs flex items-center">
                  <Search className="absolute left-3 text-text-muted h-3.5 w-3.5" />
                  <input
                    type="text"
                    placeholder="Search failed checks..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-bg/50 border border-white/[0.05] focus:border-accent/40 rounded-xl text-xs text-text outline-none transition-all font-mono"
                  />
                </div>

                <div className="flex flex-wrap gap-2 w-full sm:w-auto text-[10.5px]">
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="bg-bg/50 border border-white/[0.05] text-text-dim rounded-xl px-3 py-2 font-mono outline-none cursor-pointer focus:border-accent/40 w-full sm:w-auto"
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

              {/* Failed checklist cards */}
              <div className="space-y-4 font-mono text-xs">
                {filteredFindings.filter(f => f.status !== "passed").length === 0 ? (
                  <div className="text-center py-8 text-success font-bold font-mono text-xs space-y-2 border border-white/[0.03] rounded-2xl bg-surface/25 p-5">
                    <CheckCircle2 className="h-10 w-10 text-success mx-auto animate-pulse" />
                    <p>ALL CHECKS PASSED: NO SECURITY DEFICIENCIES DETECTED</p>
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

                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant={badgeVariant} className="text-[8px] py-0.5 tracking-wider uppercase font-mono">{finding.severity}</Badge>
                            {isOpen ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                          </div>
                        </div>

                        {isOpen && (
                          <div className="p-5 border-t border-white/[0.03] space-y-4 bg-bg/25 text-xs font-sans text-left">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider block font-mono">Description Check</span>
                                <p className="text-text-dim leading-relaxed font-sans">{finding.description}</p>
                              </div>
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-warning uppercase tracking-wider block font-mono">Security Vulnerability Risk</span>
                                <p className="text-text-dim leading-relaxed font-sans">{finding.impact}</p>
                              </div>
                            </div>

                            {finding.evidence && (
                              <div className="space-y-1.5 font-mono">
                                <span className="text-[8px] font-black text-accent-light uppercase tracking-wider block">Audited Evidence</span>
                                <pre className="bg-bg border border-white/[0.05] p-3 rounded-lg text-[9.5px] text-accent-light break-all select-all font-mono select-text whitespace-pre-wrap">{finding.evidence}</pre>
                              </div>
                            )}

                            {finding.recommendation && (
                              <div className="p-4 bg-indigo-500/[0.01] border border-indigo-500/10 rounded-xl space-y-1.5 font-mono">
                                <span className="text-[8.5px] font-black text-accent uppercase tracking-wider block">Remediation Action Required</span>
                                <code className="text-text select-all block text-[9.5px] break-all select-text">{finding.recommendation}</code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Webserver Directives Config Tabs */}
              <Card className="p-5 bg-surface/30 border border-white/[0.04] space-y-4 text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/[0.05] pb-3.5 gap-3">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                    <Code className="h-4.5 w-4.5 text-accent" /> Hardening Header Configs
                  </h3>

                  <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/[0.04] text-[9px] font-mono select-none">
                    {["nginx", "apache", "iis"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setRemediationTab(tab)}
                        className={`px-3 py-1 rounded transition-colors uppercase font-bold tracking-wider ${remediationTab === tab ? "bg-accent text-bg" : "text-text-dim hover:text-text"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative rounded-xl bg-black/50 border border-white/[0.04] p-4 font-mono text-[10px] leading-relaxed text-accent-light overflow-x-auto min-h-[120px]">
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
                    onClick={() => {
                      const codeText = remediationTab === "nginx" ? `add_header Content-Security-Policy "default-src 'self';" always;\nadd_header Strict-Transport-Security "max-age=31536000;" always;\nadd_header X-Frame-Options "SAMEORIGIN" always;` : remediationTab === "apache" ? `Header always set X-Frame-Options "SAMEORIGIN"` : `customHeaders`;
                      handleCopy(codeText);
                      toast.success("Configs template copied to clipboard!");
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.08] hover:border-white/[0.08] text-text-dim hover:text-text transition-all"
                    title="Copy Configuration Snippet"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>

              {/* AI Expert recommendation */}
              {aiAdvice && Array.isArray(aiAdvice) && aiAdvice.length > 0 && (
                <div className="space-y-4">
                  {aiAdvice.map((advice, i) => (
                    <Card key={advice.key || i} className="p-5 bg-gradient-to-r from-accent/5 via-surface/60 to-accent/5 border border-white/[0.05] space-y-3">
                      <div className="flex justify-between items-center border-b border-white/[0.04] pb-2">
                        <h3 className="text-xs font-bold text-accent uppercase tracking-wider font-mono flex items-center gap-2">
                          <Shield className="h-4 w-4 animate-pulse text-accent" /> AI Analyst: {advice.title}
                        </h3>
                        <Badge variant={advice.severity === "critical" || advice.severity === "high" ? "danger" : "warning"} className="text-[8px] uppercase tracking-wider font-mono py-0.5">
                          {advice.severity}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider block font-mono">Analysis Description</span>
                          <p className="text-text-dim leading-relaxed">{advice.description}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] font-bold text-warning uppercase tracking-wider block font-mono">Impact Risk Level</span>
                          <p className="text-text-dim leading-relaxed">{advice.businessImpact}</p>
                        </div>
                      </div>

                      <div className="p-3 bg-bg/50 border border-white/[0.03] rounded-xl text-xs font-mono">
                        <span className="text-[8px] font-black text-accent uppercase tracking-wider block mb-1">Exploitation Scenario</span>
                        <p className="text-text-dim leading-relaxed font-sans">{advice.exploitationRisk}</p>
                        {advice.realWorldExample && (
                          <p className="text-text-muted font-sans mt-2 italic text-[11px] border-t border-white/[0.03] pt-2">Real-world reference: {advice.realWorldExample}</p>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs font-sans">
                        <span className="text-[8px] font-bold text-success uppercase tracking-wider block font-mono">Remediation Guidelines</span>
                        <p className="text-text-dim leading-relaxed whitespace-pre-line">{advice.remediationSteps}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== 12. RAW DATA TAB ==================== */}
          {activeTab === "raw" && (
            <div className="space-y-6 animate-fadeIn text-left">
              <div className="border-b border-white/[0.05] pb-4">
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted font-mono">Raw Scan Payload JSON</h2>
                <p className="text-[10px] text-text-dim mt-0.5 font-sans">Full unstructured REST API JSON response payload object.</p>
              </div>

              <Card className="p-4 bg-black/60 border border-white/[0.04] relative font-mono text-[9.5px] leading-relaxed text-accent-light">
                <button
                  onClick={() => {
                    handleCopy(JSON.stringify(localResult, null, 2));
                    toast.success("Raw JSON payload copied to clipboard!");
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.08] text-text-dim hover:text-text transition-all"
                  title="Copy Raw JSON"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <pre className="max-h-[500px] overflow-y-auto pr-2 scrollbar-thin select-text whitespace-pre-wrap">{JSON.stringify(localResult, null, 2)}</pre>
              </Card>
            </div>
          )}

        </main>

      {/* ==================== MODALS & POPUPS ==================== */}

      {/* Email PDF Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-sm border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Mail className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Email Security Report
                </h3>
              </div>
              <button onClick={() => setEmailModalOpen(false)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div className="space-y-1.5 font-mono text-xs">
                <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block font-sans">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-white/[0.06] focus:border-accent/40 rounded-lg text-xs text-text outline-none transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed font-sans">
                Send security header audit reports for <span className="font-mono font-bold text-text">{domain}</span> (Score: {score}/100, Grade: {grade}) directly to this address.
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

      {/* Share Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-md border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Share2 className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Share Security Report
                </h3>
              </div>
              <button onClick={() => setShareModalOpen(false)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-4">
              {isOwnerOrAdmin ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-bg/50 border border-white/[0.03]">
                  <div>
                    <h4 className="text-xs font-bold text-text">Public URL Sharing</h4>
                    <p className="text-[10px] text-text-dim mt-0.5 font-sans">Enable public URL access to share this report with anyone.</p>
                  </div>
                  <button
                    onClick={handleTogglePublic}
                    className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${localResult.isPublic ? "bg-accent" : "bg-white/10"
                      }`}
                    aria-label="Toggle public access"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${localResult.isPublic ? "translate-x-5" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-bg/40 border border-white/[0.03] text-[10px] text-text-dim">
                  🛡️ Public Sharing status is managed by the audit owner or administrators.
                </div>
              )}

              {(!isOwnerOrAdmin || localResult.isPublic) ? (
                <div className="space-y-1.5 font-mono">
                  <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block font-sans">Public Shareable Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={localResult.shareToken ? `${window.location.origin}/shared/scan/${localResult.shareToken}` : `${window.location.origin}/shared/scan/${localResult._id || localResult.scanId}`}
                      className="flex-grow bg-bg border border-white/[0.06] rounded-lg px-3 py-2 text-[10px] text-accent-light outline-none truncate select-all"
                    />
                    <button
                      onClick={() => handleCopy(localResult.shareToken ? `${window.location.origin}/shared/scan/${localResult.shareToken}` : `${window.location.origin}/shared/scan/${localResult._id || localResult.scanId}`)}
                      className="text-[10px] font-bold border border-white/[0.06] rounded-md px-3 py-2 bg-surface hover:text-accent hover:border-accent/40 transition-all font-sans"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[9.5px] text-text-dim leading-relaxed pt-1.5 font-sans">
                    Anyone with this link will be able to view the posture score, resolved headers checklist, and recommendations without logging in.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-text-dim text-[10.5px] italic">
                  Report is currently private. Enable Public URL Sharing above to generate a shareable link.
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
          <Card className="w-full max-w-sm border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Terminal className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Port Exposure Details
                </h3>
              </div>
              <button onClick={() => setSelectedPort(null)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span className="text-text-dim">Port Number</span>
                <span className="font-bold text-accent">{selectedPort.port}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span className="text-text-dim">Listening Protocol</span>
                <span className="font-bold text-text uppercase">{selectedPort.service}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span className="text-text-dim">Port Status</span>
                <Badge variant={selectedPort.status === "open" ? "danger" : "success"} className="text-[7px] py-0.5 uppercase">
                  {selectedPort.status}
                </Badge>
              </div>

              <div className="pt-2 font-sans text-xs text-text-dim leading-relaxed">
                <span className="font-bold text-text block mb-1">Risk Summary:</span>
                An open port exposes a socket connection directly to the web. Outdated services or unhardened daemons listening on this port can let attackers run unauthorized execution exploits. Close or restrict this port via firewall.
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedPort(null)}>Close Details</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Technology Details Modal */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-sm border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp text-left font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Cpu className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Stack Component Details
                </h3>
              </div>
              <button onClick={() => setSelectedTech(null)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span className="text-text-dim">Component Name</span>
                <span className="font-bold text-accent">{selectedTech.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span className="text-text-dim">Component Category</span>
                <span className="font-bold text-text uppercase">{selectedTech.category || "General Stack"}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.02] pb-1.5">
                <span className="text-text-dim">Version Parameter</span>
                <span className="font-bold text-text">{selectedTech.version || "Not Disclosed (Secure)"}</span>
              </div>

              {selectedTech.version && (
                <div className="p-3 bg-danger/5 border border-danger/10 rounded-xl text-[10.5px] text-text-dim leading-relaxed font-sans space-y-1">
                  <span className="text-danger font-bold block font-mono">Vulnerability Risks Disclosed</span>
                  <span>Exposing version parameters simplifies exploit payload building by attackers. Disable server tokens and configure server headers to hide version details.</span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedTech(null)}>Close Details</Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
