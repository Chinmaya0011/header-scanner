"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { runSecurityAudit } from "@/lib/analyzer";
import { generateAIAdvice } from "@/lib/aiAssistant";
import { useToast } from "@/components/common/Toast";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
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
  History,
  User,
  ExternalLink as LinkIcon
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export default function ScanResults({ result }) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("company-surface");
  const [localResult, setLocalResult] = useState(result);
  const [isRescanning, setIsRescanning] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Custom states for local GitHub scans
  const [githubOrgInput, setGithubOrgInput] = useState("");
  const [githubScanLoading, setGithubScanLoading] = useState(false);
  const [githubScanResult, setGithubScanResult] = useState(null);

  // Email report states
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Share states
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Dynamic asset interactive details states (modals)
  const [selectedPort, setSelectedPort] = useState(null);
  const [selectedTech, setSelectedTech] = useState(null);
  const [selectedIp, setSelectedIp] = useState(null);
  const [sslDetailOpen, setSslDetailOpen] = useState(false);

  // Search & Filter controls
  const [globalSearch, setGlobalSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("severity");

  // Tab controls & expanded cards
  const [headersSearch, setHeadersSearch] = useState("");
  const [headersFilter, setHeadersFilter] = useState("all");
  const [dnsActiveRecord, setDnsActiveRecord] = useState("all");
  const [expandedHeaders, setExpandedHeaders] = useState([]);
  const [expandedFindings, setExpandedFindings] = useState({});
  const [expandedFindingsGroup, setExpandedFindingsGroup] = useState({
    critical: true,
    high: true,
    medium: false,
    low: false,
    info: false
  });
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

  // Fetch history trend for score chart
  useEffect(() => {
    const fetchHistoryTrend = async () => {
      if (!domain) return;
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const filtered = data.data
            .filter(s => s.domain && s.domain.toLowerCase() === domain.toLowerCase())
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map(s => ({
              date: new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
              score: s.score
            }));
          setHistoryData(filtered);
        }
      } catch (e) {
        console.warn("Silent history fetch fail:", e);
      }
    };
    fetchHistoryTrend();
  }, [domain, localResult]);

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

  const passedCount = activeChecks.filter(c => c.status === "passed").length;
  const warningCount = activeChecks.filter(c => c.status === "warning" || c.status === "info").length;
  const failedCount = activeChecks.filter(c => c.status === "failed").length;

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

  // Group findings by severity
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    activeChecks.forEach(c => {
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
  }, [activeChecks]);

  const groupedFindings = useMemo(() => {
    const groups = { critical: [], high: [], medium: [], low: [], info: [] };
    activeChecks.forEach(c => {
      if (c.status === "passed") {
        groups.info.push(c);
        return;
      }
      const sev = (c.severity || "info").toLowerCase();
      if (sev in groups) groups[sev].push(c);
      else if (sev === "informational") groups.info.push(c);
      else groups.low.push(c);
    });
    return groups;
  }, [activeChecks]);

  // Filter & Search checks
  const filteredFindings = useMemo(() => {
    let list = activeChecks;

    // Search filter
    if (globalSearch.trim() !== "") {
      const q = globalSearch.toLowerCase();
      list = list.filter(c => 
        (c.title || c.name || "").toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.recommendation || "").toLowerCase().includes(q) ||
        (c.evidence || "").toLowerCase().includes(q)
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      list = list.filter(c => {
        const sev = (c.severity || "info").toLowerCase();
        if (severityFilter === "info") {
          return sev === "info" || sev === "informational" || c.status === "passed";
        }
        return sev === severityFilter && c.status !== "passed";
      });
    }

    // Sort order
    const sorted = [...list];
    if (sortOrder === "severity") {
      const weight = { critical: 5, high: 4, medium: 3, low: 2, info: 1, informational: 1 };
      sorted.sort((a, b) => {
        const aWeight = a.status === "passed" ? 0 : (weight[a.severity?.toLowerCase()] || 1);
        const bWeight = b.status === "passed" ? 0 : (weight[b.severity?.toLowerCase()] || 1);
        return bWeight - aWeight;
      });
    } else if (sortOrder === "alphabetical") {
      sorted.sort((a, b) => (a.title || a.name || "").localeCompare(b.title || b.name || ""));
    } else if (sortOrder === "category") {
      sorted.sort((a, b) => (a.category || "").localeCompare(b.category || ""));
    }

    return sorted;
  }, [activeChecks, globalSearch, severityFilter, sortOrder]);

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

  const exposedSecretsCount = useMemo(() => {
    return secretsList.filter(s => s.exists && s.isSensitive).length;
  }, [secretsList]);

  // AI recommendations sorting helper
  const getScoreImprovement = (severity) => {
    switch (severity) {
      case "critical": return 15;
      case "high": return 10;
      case "medium": return 5;
      case "low": return 2;
      default: return 0;
    }
  };

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

  // Dynamic Timeline events resolver - strictly based on present telemetry metrics
  const scanTimeline = useMemo(() => {
    if (!localResult) return [];
    const events = [];
    const start = localResult.createdAt || localResult.metadata?.timestamp || new Date().toISOString();
    let baseTime = new Date(start).getTime();

    events.push({
      title: "Security scan requested",
      timestamp: new Date(baseTime).toLocaleTimeString(),
      desc: `Audit request initialized for target domain ${domain}`,
      status: "completed",
      icon: Shield
    });

    if (dns && performance?.dnsLookup !== null) {
      baseTime += performance.dnsLookup || 35;
      events.push({
        title: "DNS zones lookup resolved",
        timestamp: new Date(baseTime).toLocaleTimeString(),
        desc: `Resolved ${dns.a?.length || 0} IPv4 address zones & ${dns.mx?.length || 0} mail exchanger endpoints in ${performance.dnsLookup}ms`,
        status: "completed",
        icon: Globe
      });
    }

    if (ssl && performance?.tlsHandshake !== null) {
      baseTime += performance.tlsHandshake || 95;
      events.push({
        title: "SSL/TLS connection handshake completed",
        timestamp: new Date(baseTime).toLocaleTimeString(),
        desc: `Negotiated ${ssl.tlsVersion || "TLSv1.3"} cipher session using key length ${ssl.keyLength || 2048} bits in ${performance.tlsHandshake}ms`,
        status: ssl.valid ? "completed" : "warning",
        icon: Key
      });
    }

    if (headers && headers.length > 0 && performance?.responseTime !== null) {
      baseTime += performance.responseTime || 140;
      events.push({
        title: "HTTP response headers parsed",
        timestamp: new Date(baseTime).toLocaleTimeString(),
        desc: `Successfully received response headers. Audited ${headers.length} header attributes in ${performance.responseTime}ms`,
        status: "completed",
        icon: FileCode
      });
    }

    if (exposedServices && exposedServices.length > 0) {
      events.push({
        title: "External port validation completed",
        timestamp: new Date(baseTime + 40).toLocaleTimeString(),
        desc: `Audited common gateway interfaces. Discovered ${exposedServices.filter(s => s.status === "open").length} open service TCP ports`,
        status: exposedServices.filter(s => s.status === "open").length > 0 ? "danger" : "completed",
        icon: Radio
      });
    }

    if (sensitiveFiles && sensitiveFiles.length > 0) {
      events.push({
        title: "Directory configuration scan resolved",
        timestamp: new Date(baseTime + 70).toLocaleTimeString(),
        desc: `Checked credential paths, sitemaps, and robots.txt. Flagged ${sensitiveFiles.filter(f => f.exists).length} exposed directories`,
        status: sensitiveFiles.filter(f => f.exists).length > 0 ? "danger" : "completed",
        icon: FileText
      });
    }

    events.push({
      title: "Posture assessment compiled",
      timestamp: new Date(baseTime + 110).toLocaleTimeString(),
      desc: `Scoring normalizations completed. Final rating compiled as Grade ${grade} (${score}/100)`,
      status: score >= 80 ? "completed" : score >= 60 ? "warning" : "danger",
      icon: Activity
    });

    return events;
  }, [localResult, dns, ssl, headers, exposedServices, sensitiveFiles, performance, domain, grade, score]);

  // Actions handlers
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
      setActiveCategory("overview");
    } catch (e) {
      toast.error(e.message || "Failed to complete rescan.");
    } finally {
      setIsRescanning(false);
    }
  };

  // Subdomain rescan action triggers full dashboard reload with the subdomain
  const handleScanSubdomain = async (subdomainName) => {
    if (!subdomainName) return;
    setIsRescanning(true);
    toast.info(`Running full EASM scan for subdomain: ${subdomainName}...`);
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
      setActiveCategory("overview");
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
      (localResult.owner && localResult.owner.toString() === currentUser._id.toString())
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

  const handleGithubScan = async (e) => {
    e.preventDefault();
    if (!githubOrgInput.trim()) return;
    setGithubScanLoading(true);
    setGithubScanResult(null);
    try {
      const res = await fetch("/api/scan/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: githubOrgInput.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setGithubScanResult(data.data);
        toast.success("GitHub public security review completed!");
      } else {
        toast.error(data.error || "Failed to audit GitHub exposure.");
      }
    } catch (err) {
      toast.error("Network error while scanning GitHub repositories.");
    } finally {
      setGithubScanLoading(false);
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

  const toggleGroupExpand = (group) => {
    setExpandedFindingsGroup(prev => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  // Recharts Chart Colors & Harmonies
  const auditStatusData = [
    { name: "Passed Checklists", value: passedCount, color: "#10b981" },
    { name: "Hardening Warnings", value: warningCount, color: "#f59e0b" },
    { name: "Critical Failures", value: failedCount, color: "#ef4444" }
  ];

  const severityBarData = [
    { name: "Critical", value: severityCounts.critical, fill: "#ef4444" },
    { name: "High", value: severityCounts.high, fill: "#f97316" },
    { name: "Medium", value: severityCounts.medium, fill: "#f59e0b" },
    { name: "Low", value: severityCounts.low, fill: "#3b82f6" },
    { name: "Info", value: severityCounts.info, fill: "#06b6d4" }
  ];

  // Dynamic Tabs resolution strictly hiding tabs where backend metrics are missing/empty
  const tabItems = useMemo(() => {
    return [
      { id: "company-surface", label: "Company Surface", icon: Layout },
      { id: "domain-scanner", label: "Domain Scanner", icon: ShieldCheck },
      { id: "email-security", label: "Email Security", icon: Mail },
      { id: "github-exposure", label: "GitHub Exposure", icon: Code },
      { id: "website-privacy", label: "Website Privacy", icon: Cookie }
    ];
  }, []);

  if (isRescanning) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 animate-pulse">
        <div className="h-32 bg-surface/50 border border-white/[0.04] rounded-2xl flex items-center justify-between px-6 gap-4">
          <div className="space-y-3 flex-grow">
            <div className="h-6 bg-white/10 rounded w-1/4" />
            <div className="h-4 bg-white/5 rounded w-1/2" />
          </div>
          <div className="h-16 w-16 rounded-full bg-white/10" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="h-56 bg-surface/30 border border-white/[0.03] rounded-2xl" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="h-72 bg-surface/30 border border-white/[0.03] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-text max-w-6xl mx-auto px-1 sm:px-4">

      {/* STICKY SUMMARY HEADER */}
      <div className="sticky top-0 z-40 w-full bg-bg/95 backdrop-blur-md border border-white/[0.06] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-5 transition-all duration-300 shadow-xl">
        <div className="flex-grow w-full md:w-auto min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-text truncate max-w-full font-mono uppercase">
              {domain}
            </h1>
            <button
              onClick={() => handleCopy(domain)}
              className="p-1 rounded hover:bg-white/5 text-text-dim hover:text-text transition-colors"
              title="Copy Domain Address"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-white/5 text-text-dim hover:text-text transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-text-dim font-mono">
            {statusCode !== undefined && (
              <div className="flex items-center gap-1.5">
                <Radio className="h-3.5 w-3.5 text-accent-light" />
                <span>Status: <span className="text-text font-bold">HTTP {statusCode}</span></span>
              </div>
            )}
            {scanDuration !== undefined && (
              <>
                <div className="h-3 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent-light" />
                  <span>Duration: <span className="text-text font-bold">{scanDuration}ms</span></span>
                </div>
              </>
            )}
            {metadata?.timestamp && (
              <>
                <div className="h-3 w-px bg-white/10 hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-accent-light" />
                  <span>Audited: <span className="text-text font-bold">{new Date(metadata.timestamp).toLocaleTimeString()}</span></span>
                </div>
              </>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-white/[0.04]">
            <Button onClick={handleRescan} variant="outline" size="sm" icon={RefreshCw} className="hover:border-accent/40 hover:text-accent font-bold py-1 text-[10px]">
              Re-scan
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" icon={Download} className="hover:border-success/40 hover:text-success font-bold py-1 text-[10px]">
              Export PDF
            </Button>
            <Button onClick={downloadJSON} variant="outline" size="sm" icon={FileCode} className="hover:border-blue-500/40 hover:text-blue-400 font-bold py-1 text-[10px]">
              Export JSON
            </Button>
            <Button onClick={handleShare} variant="outline" size="sm" icon={Share2} className="hover:border-indigo-500/40 hover:text-indigo-400 font-bold py-1 text-[10px]">
              Share
            </Button>
            {currentUser && (
              <Button onClick={() => { setRecipientEmail(currentUser.email); setEmailModalOpen(true); }} variant="outline" size="sm" icon={Mail} className="hover:border-purple-500/40 hover:text-purple-400 font-bold py-1 text-[10px]">
                Email PDF
              </Button>
            )}
            <Button onClick={() => setActiveCategory("raw-data")} variant="outline" size="sm" icon={Code} className="hover:border-amber-500/40 hover:text-amber-400 font-bold py-1 text-[10px]">
              Raw Response
            </Button>
          </div>
        </div>

        {/* Header Circular gauge and risk level */}
        <div className="flex items-center gap-4 flex-shrink-0 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl w-full md:w-auto justify-between md:justify-start">
          <div className="text-center space-y-0.5">
            <p className="text-[8px] font-bold text-text-dim uppercase tracking-wider font-mono">Posture Grade</p>
            <div className={`text-2xl font-black px-3 py-1.5 rounded-lg border font-mono ${
              grade.startsWith("A") ? "text-success bg-success/5 border-success/20" :
              grade.startsWith("B") ? "text-accent bg-accent/5 border-accent/20" :
              grade.startsWith("C") || grade.startsWith("D") ? "text-warning bg-warning/5 border-warning/20" :
              "text-danger bg-danger/5 border-danger/20"
            }`}>
              {grade}
            </div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center h-12 w-12">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                <circle cx="24" cy="24" r="20" className="stroke-white/[0.03] fill-none" strokeWidth="4" />
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  className={`fill-none ${
                    score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-danger"
                  }`}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - score / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-[11px] font-black font-mono text-text">{score}</span>
            </div>
            
            <div className="space-y-0.5">
              <p className="text-[8px] font-bold text-text-dim uppercase tracking-wider font-mono">Risk Level</p>
              <Badge variant={posture.badge} className="text-[7px] uppercase tracking-widest font-black py-0.5 px-2">
                {posture.text}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* NAVIGATION SIDEBAR & CONTENT PANEL */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-[260px] lg:sticky lg:top-36 flex-shrink-0 z-20">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto no-scrollbar pb-2 lg:pb-0 border-b lg:border-b-0 border-white/[0.04] lg:space-y-1 bg-surface/30 p-2 lg:p-3 rounded-2xl border border-white/[0.04]">
            <p className="hidden lg:block text-[9px] font-black text-text-muted uppercase tracking-widest px-2 mb-2 font-mono font-sans">Dashboard Navigation</p>
            {tabItems.map(item => {
              const Icon = item.icon;
              const isActive = activeCategory === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveCategory(item.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[11px] font-semibold tracking-wider transition-all duration-200 border whitespace-nowrap lg:w-full text-left ${
                    isActive 
                      ? "bg-accent/10 text-accent border-accent/20 shadow-[0_0_12px_rgba(99,102,241,0.1)]" 
                      : "text-text-dim hover:text-text hover:bg-white/5 border-transparent"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-grow">{item.label}</span>
                  {item.count !== undefined && (
                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${isActive ? "bg-accent/20 text-accent" : "bg-white/5 text-text-dim"}`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content Pane */}
        <main className="flex-grow w-full min-w-0 space-y-6">

          {/* ==================== 1. COMPANY SURFACE TAB (OVERVIEW) ==================== */}
          {activeCategory === "company-surface" && (
            <div className="space-y-6 animate-fadeInUp text-left">
              {/* Executive Score & Severity Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-5 bg-surface/30 flex flex-col justify-between min-h-[140px]">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-wider font-mono">Posture Assessment</p>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-black font-mono text-accent">{score}</span>
                    <span className="text-text-muted text-xs font-mono">/ 100</span>
                  </div>
                  <Badge variant={posture.badge} className="w-max mt-2 text-[8px] uppercase tracking-wider py-0.5 px-2 font-black">
                    {posture.text}
                  </Badge>
                </Card>

                <Card className="p-5 bg-surface/30 flex flex-col justify-between min-h-[140px]">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-wider font-mono">Compliance Score</p>
                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-4xl font-black font-mono text-purple-400">{computedScores.compliance}%</span>
                  </div>
                  <span className="text-[9px] text-text-muted font-bold font-mono">OWASP, GDPR, PCI-DSS, NIST</span>
                </Card>

                <Card className="p-5 bg-surface/30 flex flex-col justify-between min-h-[140px]">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-wider font-mono">Risk Grade</p>
                  <div className="mt-4">
                    <span className={`text-4xl font-black px-3 py-1 rounded-lg border font-mono ${
                      grade.startsWith("A") ? "text-success bg-success/5 border-success/20" :
                      grade.startsWith("B") ? "text-accent bg-accent/5 border-accent/20" :
                      grade.startsWith("C") || grade.startsWith("D") ? "text-warning bg-warning/5 border-warning/20" :
                      "text-danger bg-danger/5 border-danger/20"
                    }`}>
                      {grade}
                    </span>
                  </div>
                  <span className="text-[9px] text-text-muted font-bold font-mono mt-2 block">Standard Assessment Grade</span>
                </Card>

                <Card className="p-5 bg-surface/30 space-y-2">
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-wider font-mono">Findings Summary</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2">
                    <div className="flex justify-between items-center bg-danger/5 border border-danger/10 px-2 py-1 rounded">
                      <span className="text-danger font-bold">Critical</span>
                      <span className="font-bold text-text">{severityCounts.critical}</span>
                    </div>
                    <div className="flex justify-between items-center bg-orange-500/5 border border-orange-500/10 px-2 py-1 rounded">
                      <span className="text-orange-400 font-bold">High</span>
                      <span className="font-bold text-text">{severityCounts.high}</span>
                    </div>
                    <div className="flex justify-between items-center bg-warning/5 border border-warning/10 px-2 py-1 rounded">
                      <span className="text-warning font-bold">Medium</span>
                      <span className="font-bold text-text">{severityCounts.medium}</span>
                    </div>
                    <div className="flex justify-between items-center bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded">
                      <span className="text-blue-400 font-bold">Low</span>
                      <span className="font-bold text-text">{severityCounts.low}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Graphical Visualizations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="p-4 flex flex-col justify-between bg-surface/30">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/[0.05] pb-2">
                      <Activity className="h-4 w-4 text-accent" /> Audit Distribution
                    </h3>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-4">
                    <div className="space-y-1 text-[9.5px] font-semibold font-mono flex-1">
                      {auditStatusData.map((d, i) => (
                        <div key={i} className="flex justify-between items-center p-1.5 rounded bg-bg/50 border border-white/[0.02]">
                          <span className="flex items-center gap-1.5" style={{ color: d.color }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                            {d.name.split(" ")[0]}
                          </span>
                          <span className="font-bold text-text">{d.value}</span>
                        </div>
                      ))}
                    </div>
                    {mounted && (
                      <div className="h-20 w-20 flex-shrink-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={auditStatusData}
                              cx="50%"
                              cy="50%"
                              innerRadius={20}
                              outerRadius={28}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {auditStatusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-4 flex flex-col justify-between bg-surface/30">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/[0.05] pb-2">
                      <BarChart3 className="h-4 w-4 text-accent" /> Vulnerabilities Breakdown
                    </h3>
                  </div>
                  <div className="h-24 w-full mt-4">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={severityBarData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={8} tickLine={false} allowDecimals={false} />
                          <Tooltip 
                            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "9px" }}
                            itemStyle={{ color: "#f8fafc" }}
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]}>
                            {severityBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>
                
                <Card className="p-4 flex flex-col justify-between bg-surface/30">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/[0.05] pb-2">
                      <History className="h-4 w-4 text-accent" /> History Trend
                    </h3>
                  </div>
                  <div className="h-24 w-full mt-4 flex items-center justify-center">
                    {mounted && historyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={8} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={8} tickLine={false} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "9px" }}
                            itemStyle={{ color: "#f8fafc" }}
                          />
                          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 2.5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-4 text-text-muted text-[10px] font-mono">
                        No successive scans recorded.
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Infrastructure Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {infrastructure && (
                  <Card className="p-4 bg-surface/30 space-y-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <Server className="h-4 w-4 text-accent" /> Edge Infrastructure Map
                    </h3>
                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2 rounded-lg">
                        <span className="text-text-dim text-[10px]">Cloud Proxy / CDN</span>
                        <span className="font-bold text-text">{infrastructure.cdn || "Not Detected"}</span>
                      </div>
                      <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2 rounded-lg">
                        <span className="text-text-dim text-[10px]">Web App Firewall (WAF)</span>
                        <span className="font-bold text-text">{infrastructure.waf || "Not Detected"}</span>
                      </div>
                      <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2 rounded-lg">
                        <span className="text-text-dim text-[10px]">Reverse Proxy Signature</span>
                        <span className="font-bold text-text truncate max-w-[180px]">{infrastructure.reverseProxy || "Not Detected"}</span>
                      </div>
                      {dns?.a?.[0] && (
                        <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2 rounded-lg">
                          <span className="text-text-dim text-[10px]">Resolved A Record IP</span>
                          <button
                            onClick={() => setSelectedIp(dns.a[0])}
                            className="font-bold text-accent hover:underline text-[10.5px]"
                          >
                            {dns.a[0]}
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Open services & ports */}
                {exposedServices && exposedServices.length > 0 && (
                  <Card className="p-4 bg-surface/30 space-y-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <Radio className="h-4 w-4 text-accent" /> Exposed Service Gateways
                    </h3>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {exposedServices.map((srv, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedPort(srv)}
                          className="flex items-center gap-2 bg-bg/50 hover:bg-bg border border-white/[0.04] px-3 py-1.5 rounded-lg text-[10.5px] font-mono transition-all text-left"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-danger animate-pulse" />
                          <span className="font-bold text-text">{srv.port} ({srv.service})</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              {/* Subdomains & Tech stack mapping lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {subdomains && subdomains.length > 0 && (
                  <Card className="p-4 bg-surface/30 space-y-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <Globe className="h-4 w-4 text-accent" /> Active Subdomains ({subdomains.length})
                    </h3>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {subdomains.map((sub, idx) => {
                        const subName = sub.subdomain || sub;
                        return (
                          <div key={idx} className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg text-[11px] font-mono">
                            <button
                              onClick={() => handleScanSubdomain(subName)}
                              className="font-bold text-accent hover:text-accent-light underline truncate max-w-[200px]"
                            >
                              {subName}
                            </button>
                            {sub.ip && (
                              <button onClick={() => setSelectedIp(sub.ip)} className="text-[10px] text-text-dim font-bold hover:underline">{sub.ip}</button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                )}

                {techStack && techStack.length > 0 && (
                  <Card className="p-4 bg-surface/30 space-y-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-accent" /> Observed Software Stack ({techStack.length})
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {techStack.map((tech, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedTech(tech)}
                          className="bg-bg/40 border border-white/[0.03] hover:border-white/[0.08] p-2.5 rounded-lg text-left font-mono space-y-0.5"
                        >
                          <span className="text-[8px] text-text-muted block uppercase">{tech.category}</span>
                          <span className="font-bold text-text block truncate text-[11px]">{tech.name}</span>
                          {tech.version && <span className="text-[9px] text-accent block">v{tech.version}</span>}
                        </button>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ==================== 2. DOMAIN SCANNER TAB ==================== */}
          {activeCategory === "domain-scanner" && (
            <div className="space-y-6 animate-fadeInUp text-left">
              {/* response headers list */}
              {headers && headers.length > 0 && (
                <Card className="p-4 space-y-4 bg-surface/30">
                  <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-white/[0.04] pb-4">
                    <div>
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">HTTP Response Security Headers</h3>
                      <p className="text-[10px] text-text-dim mt-0.5">Verification checks matching deployed transport/XSS safety headers.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-dim" />
                        <input
                          type="text"
                          value={headersSearch}
                          onChange={(e) => setHeadersSearch(e.target.value)}
                          placeholder="Search headers..."
                          className="pl-8 pr-3 py-1.5 bg-bg border border-white/[0.05] focus:border-accent/40 rounded-lg text-[10px] font-semibold text-text placeholder:text-text-muted outline-none w-40 sm:w-48 transition-all"
                        />
                      </div>
                      <div className="flex bg-bg border border-white/[0.05] p-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                        {["all", "passed", "warning", "failed"].map(f => (
                          <button
                            key={f}
                            onClick={() => setHeadersFilter(f)}
                            className={`px-2 py-0.5 rounded transition-colors ${
                              headersFilter === f ? "bg-accent text-bg" : "text-text-dim hover:text-text"
                            }`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-white/[0.02]">
                    {headers
                      .filter(h => {
                        const matchesSearch = h.name.toLowerCase().includes(headersSearch.toLowerCase()) || 
                                              (h.value && h.value.toLowerCase().includes(headersSearch.toLowerCase()));
                        if (headersFilter === "all") return matchesSearch;
                        if (headersFilter === "passed") return matchesSearch && h.status === "present";
                        if (headersFilter === "warning") return matchesSearch && h.status === "weak";
                        if (headersFilter === "failed") return matchesSearch && h.status === "missing";
                        return matchesSearch;
                      })
                      .map((h, idx) => {
                        const isExpanded = expandedHeaders.includes(h.name);
                        const statusVariant = h.status === "present" ? "success" : h.status === "weak" ? "warning" : "danger";
                        return (
                          <div key={idx} className="py-3 hover:bg-white/[0.01] transition-all rounded-lg px-2">
                            <div className="flex items-center justify-between gap-4 cursor-pointer" onClick={() => toggleHeaderExpand(h.name)}>
                              <div className="flex items-center gap-2 min-w-0">
                                <code className="text-xs font-bold text-accent pr-2 border-r border-white/5 font-mono truncate max-w-[200px] sm:max-w-md">{h.name}</code>
                                <Badge variant={statusVariant} className="text-[7px] py-0.5">
                                  {h.status === "present" ? "Passed" : h.status === "weak" ? "Warning" : "Failed"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[9px] text-text-dim font-bold uppercase tracking-wider font-mono">
                                  Severity: <span className={h.severity === "high" || h.severity === "critical" ? "text-danger" : h.severity === "medium" ? "text-warning" : "text-success"}>{h.severity}</span>
                                </span>
                                {isExpanded ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-white/[0.02] space-y-3 text-xs leading-relaxed animate-fadeIn">
                                <div>
                                  <div className="flex justify-between items-center mb-1">
                                    <p className="text-[8.5px] font-black text-text-dim uppercase tracking-wider font-mono">Observed Value</p>
                                    {h.value && (
                                      <button onClick={() => handleCopy(h.value)} className="text-[8px] font-bold text-accent hover:text-accent-light uppercase tracking-wider">
                                        Copy Value
                                      </button>
                                    )}
                                  </div>
                                  <div className="bg-bg border border-white/[0.04] p-2.5 rounded-lg font-mono text-[10.5px] text-accent-light break-all select-text">
                                    {h.value || "MISSING (Header is not set by target server)"}
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-[8.5px] font-black text-text-dim uppercase tracking-wider font-mono mb-1">Associated Threat Context</p>
                                    <p className="text-text-dim text-[11px] leading-relaxed">{h.description || "No threat details documented."}</p>
                                  </div>
                                  {h.recommendation && (
                                    <div className="p-3 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl">
                                      <p className="text-[8.5px] font-black text-accent uppercase tracking-wider font-mono mb-0.5">Remediation Action Required</p>
                                      <p className="text-text-dim text-[11px] leading-relaxed">{h.recommendation}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </Card>
              )}

              {/* SSL/TLS Parameters Summary */}
              {ssl && ssl.expirationDate !== null && (
                <Card className="p-4 bg-surface/30 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/[0.05] pb-3">
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                      <Key className="h-4 w-4 text-accent" /> SSL/TLS Certificate Details
                    </h3>
                    <button onClick={() => setSslDetailOpen(true)} className="text-[9px] font-bold text-accent hover:underline uppercase tracking-wider font-mono">
                      Inspect Certificate
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                    <div className="bg-bg/40 p-3 rounded-lg">
                      <span className="text-[8px] text-text-muted block uppercase">Issuer</span>
                      <span className="font-bold text-text truncate block mt-0.5">{ssl.issuer || "Unknown"}</span>
                    </div>
                    <div className="bg-bg/40 p-3 rounded-lg">
                      <span className="text-[8px] text-text-muted block uppercase">Key Type / Length</span>
                      <span className="font-bold text-text block mt-0.5">{ssl.keyType || "RSA"} ({ssl.keyLength || "2048"} bits)</span>
                    </div>
                    <div className="bg-bg/40 p-3 rounded-lg">
                      <span className="text-[8px] text-text-muted block uppercase">Handshake Time</span>
                      <span className="font-bold text-accent block mt-0.5">{ssl.handshakeMs ? `${ssl.handshakeMs} ms` : "N/A"}</span>
                    </div>
                    <div className="bg-bg/40 p-3 rounded-lg">
                      <span className="text-[8px] text-text-muted block uppercase">Remaining Days</span>
                      <span className={`font-bold block mt-0.5 ${ssl.daysRemaining < 30 ? "text-danger" : "text-success"}`}>
                        {ssl.daysRemaining ?? "N/A"} Days
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* DNS records explorer */}
              {dns && (
                <Card className="p-4 bg-surface/30 space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-3 font-mono flex items-center gap-2">
                    <Globe className="h-4 w-4 text-accent" /> DNS Records Explorer
                  </h3>
                  <div className="space-y-3 font-mono text-xs">
                    {dns.a && dns.a.length > 0 && (
                      <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                        <span className="text-[9px] font-black text-text-dim block uppercase mb-1">A Records</span>
                        <div className="flex flex-wrap gap-2">
                          {dns.a.map((ip, idx) => (
                            <span key={idx} className="bg-surface border border-white/[0.04] px-2 py-0.5 rounded text-[10px] text-accent-light font-bold select-all">{ip}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {dns.aaaa && dns.aaaa.length > 0 && (
                      <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                        <span className="text-[9px] font-black text-text-dim block uppercase mb-1">AAAA Records</span>
                        <div className="flex flex-wrap gap-2">
                          {dns.aaaa.map((ip, idx) => (
                            <span key={idx} className="bg-surface border border-white/[0.04] px-2 py-0.5 rounded text-[10px] text-accent-light font-bold select-all">{ip}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {dns.mx && dns.mx.length > 0 && (
                      <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                        <span className="text-[9px] font-black text-text-dim block uppercase mb-1.5">MX Records</span>
                        <div className="space-y-1">
                          {dns.mx.map((m, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10px] bg-surface/50 p-1.5 rounded">
                              <span className="text-text select-all">{m}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {dns.txt && dns.txt.length > 0 && (
                      <div className="bg-bg/40 p-3 rounded-xl border border-white/[0.02]">
                        <span className="text-[9px] font-black text-text-dim block uppercase mb-1.5">TXT Records</span>
                        <div className="space-y-1">
                          {dns.txt.map((t, idx) => (
                            <div key={idx} className="bg-surface/50 p-1.5 rounded text-[10px] text-text-dim select-all break-all">{t}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* robots.txt, sitemaps, security.txt */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
                {robotsTxt && (
                  <Card className="p-4 bg-surface/30 space-y-2 flex flex-col justify-between min-h-[140px]">
                    <span className="text-[9px] text-text-muted uppercase font-bold">robots.txt</span>
                    <span className="font-bold text-text text-[11px]">{robotsTxt.exists ? "Resolved" : "Not Detected"}</span>
                    {robotsTxt.exists && (
                      <div className="text-[10px] text-text-dim space-y-0.5">
                        <p>Disallowed Paths: {robotsTxt.exposedPathsCount ?? 0}</p>
                        <p className={robotsTxt.sensitiveExposed ? "text-danger font-bold animate-pulse" : "text-success"}>
                          {robotsTxt.sensitiveExposed ? "⚠️ Sensitive Directories Listed" : "✓ No Sensitive Paths Listed"}
                        </p>
                      </div>
                    )}
                  </Card>
                )}

                {sitemapXml && (
                  <Card className="p-4 bg-surface/30 space-y-2 flex flex-col justify-between min-h-[140px]">
                    <span className="text-[9px] text-text-muted uppercase font-bold">sitemap.xml</span>
                    <span className="font-bold text-text text-[11px]">{sitemapXml.exists ? `${sitemapXml.urlCount ?? 0} URLs Indexed` : "Not Detected"}</span>
                    {sitemapXml.exists && sitemapXml.lastModified && (
                      <span className="text-[10px] text-text-dim">Modified: {new Date(sitemapXml.lastModified).toLocaleDateString()}</span>
                    )}
                  </Card>
                )}

                {securityTxt && (
                  <Card className="p-4 bg-surface/30 space-y-2 flex flex-col justify-between min-h-[140px]">
                    <span className="text-[9px] text-text-muted uppercase font-bold">security.txt</span>
                    <span className="font-bold text-text text-[11px]">{securityTxt.exists ? "Resolved" : "Not Detected"}</span>
                    {securityTxt.exists && (
                      <div className="text-[10px] text-text-dim space-y-0.5">
                        {securityTxt.contact && <p className="truncate">Contact: {securityTxt.contact}</p>}
                        {securityTxt.expires && <p className="truncate">Expires: {securityTxt.expires}</p>}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* ==================== 3. EMAIL SECURITY TAB ==================== */}
          {activeCategory === "email-security" && (
            <div className="space-y-6 animate-fadeInUp text-left font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <Card className="p-5 bg-surface/30 flex flex-col justify-between min-h-[160px]">
                  <div>
                    <h4 className="text-[10px] font-black text-text-dim uppercase tracking-wider font-mono">Email Security Rating</h4>
                    <p className="text-[9px] text-text-muted uppercase mt-0.5">DNS Security Parameters</p>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-black font-mono text-accent">{emailSecurity?.score || 0}%</span>
                  </div>
                  <Badge variant={emailSecurity?.score >= 80 ? "success" : emailSecurity?.score >= 50 ? "warning" : "danger"} className="text-[8px] w-max font-black py-0.5 px-2">
                    {emailSecurity?.score >= 80 ? "Optimal Protection" : emailSecurity?.score >= 50 ? "Moderate Policy" : "Spoofing Risk"}
                  </Badge>
                </Card>

                <Card className="p-5 bg-surface/30 md:col-span-2 space-y-3.5">
                  <h4 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-accent" /> Security Protocol Status
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-[10.5px]">
                    <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-text-dim text-[10px]">SPF</span>
                      <Badge variant={emailSecurity?.spfPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity?.spfPresent ? "PASSED" : "MISSING"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-text-dim text-[10px]">DMARC</span>
                      <Badge variant={emailSecurity?.dmarcPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity?.dmarcPresent ? "PASSED" : "MISSING"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-text-dim text-[10px]">DKIM</span>
                      <Badge variant={emailSecurity?.dkimPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity?.dkimPresent ? "PASSED" : "MISSING"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-text-dim text-[10px]">MTA-STS</span>
                      <Badge variant={emailSecurity?.mtaStsPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity?.mtaStsPresent ? "PASSED" : "MISSING"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-text-dim text-[10px]">TLS-RPT</span>
                      <Badge variant={emailSecurity?.tlsRptPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity?.tlsRptPresent ? "PASSED" : "MISSING"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-text-dim text-[10px]">BIMI</span>
                      <Badge variant={emailSecurity?.bimiPresent ? "success" : "danger"} className="text-[7.5px] py-0.5">
                        {emailSecurity?.bimiPresent ? "PASSED" : "MISSING"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Detailed Email Authentication Check findings adapter */}
              <Card className="p-4 space-y-4 bg-surface/30 font-mono text-xs">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-3 font-sans">
                  Email Authentication Findings Checklist
                </h3>
                <div className="space-y-3 leading-relaxed">
                  {/* SPF Audit Card */}
                  <div className="border border-white/[0.03] rounded-xl bg-bg/40 p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-text text-[11px]">Sender Policy Framework (SPF) Validation</h4>
                      <Badge variant={emailSecurity?.spfPresent ? "success" : "danger"} className="text-[7px]">
                        {emailSecurity?.spfPresent ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    <p className="text-text-dim font-sans text-[11.5px]">
                      {emailSecurity?.spfPresent 
                        ? `A valid SPF record was resolved at your root DNS TXT records. Content: "${dns?.spf?.value || "v=spf1 ..."}".`
                        : "No valid SPF TXT record was resolved at the root domain. Spoofers can send phishing emails pretending to come from your domain."}
                    </p>
                    {!emailSecurity?.spfPresent && (
                      <div className="p-2.5 bg-danger/5 border border-danger/10 rounded-lg text-[10.5px]">
                        <p className="text-danger font-bold font-sans">Remediation Action Required:</p>
                        <p className="text-text-dim font-sans mt-0.5">Publish a DNS TXT record at the root domain detailing your authorized sending mail servers. For example: `v=spf1 include:_spf.google.com ~all`.</p>
                      </div>
                    )}
                  </div>

                  {/* DMARC Audit Card */}
                  <div className="border border-white/[0.03] rounded-xl bg-bg/40 p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-text text-[11px]">DMARC Authentication Alignment Policy</h4>
                      <Badge variant={emailSecurity?.dmarcPresent ? "success" : "danger"} className="text-[7px]">
                        {emailSecurity?.dmarcPresent ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    <p className="text-text-dim font-sans text-[11.5px]">
                      {emailSecurity?.dmarcPresent 
                        ? `DMARC alignment is configured. Resolved DMARC TXT record: "${dns?.dmarc?.value || "v=dmarc1 ..."}"`
                        : "Missing DMARC policy record. Mail clients cannot verify if emails that fail SPF/DKIM validation should be quarantined, rejected, or accepted."}
                    </p>
                    {!emailSecurity?.dmarcPresent && (
                      <div className="p-2.5 bg-danger/5 border border-danger/10 rounded-lg text-[10.5px]">
                        <p className="text-danger font-bold font-sans">Remediation Action Required:</p>
                        <p className="text-text-dim font-sans mt-0.5">Configure a DMARC policy. Publish a TXT record under the subdomain `_dmarc.${domain}` with value `v=DMARC1; p=quarantine;` (quarantine) or `v=DMARC1; p=reject;` (strong reject).</p>
                      </div>
                    )}
                  </div>

                  {/* MTA-STS Card */}
                  <div className="border border-white/[0.03] rounded-xl bg-bg/40 p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-text text-[11px]">MTA Strict Transport Security (MTA-STS)</h4>
                      <Badge variant={emailSecurity?.mtaStsPresent ? "success" : "danger"} className="text-[7px]">
                        {emailSecurity?.mtaStsPresent ? "PASSED" : "FAILED"}
                      </Badge>
                    </div>
                    <p className="text-text-dim font-sans text-[11.5px]">
                      {emailSecurity?.mtaStsPresent 
                        ? `MTA-STS resolved successfully: "${dns?.mtaSts?.value || "v=sts1; ..."}"`
                        : "MTA-STS is not enabled on this domain. SMTP servers cannot enforce secure TLS connections when relaying mail, exposing emails to Man-in-the-Middle sniffer tools."}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* ==================== 4. GITHUB EXPOSURE Scanner TAB ==================== */}
          {activeCategory === "github-exposure" && (
            <div className="space-y-6 animate-fadeInUp text-left font-sans">
              <Card className="p-5 bg-surface/30 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">Public GitHub Exposure Audit</h3>
                  <p className="text-[10px] text-text-dim mt-0.5">Perform a public repository check to detect exposed API keys, environment files, and configuration issues.</p>
                </div>

                <form onSubmit={handleGithubScan} className="flex gap-2">
                  <input
                    type="text"
                    value={githubOrgInput}
                    onChange={(e) => setGithubOrgInput(e.target.value)}
                    placeholder="Enter GitHub Username or Org Name (e.g. google)"
                    className="flex-grow px-3 py-2 bg-bg border border-white/[0.06] focus:border-accent/40 rounded-lg text-xs text-text outline-none transition-all font-mono"
                  />
                  <Button
                    type="submit"
                    disabled={githubScanLoading || !githubOrgInput.trim()}
                    variant="primary"
                    size="sm"
                    className="bg-accent text-bg hover:bg-accent-light font-bold"
                  >
                    {githubScanLoading ? "Auditing..." : "Audit Profile"}
                  </Button>
                </form>
              </Card>

              {githubScanLoading && (
                <div className="text-center py-10 space-y-3 font-mono">
                  <div className="h-8 w-8 rounded-full border-2 border-white/5 border-t-accent animate-spin mx-auto" />
                  <p className="text-text-dim text-[10.5px] uppercase">Retrieving and parsing public repositories...</p>
                </div>
              )}

              {/* GitHub scan results display */}
              {githubScanResult && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Account overview card */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="p-4 bg-surface/30 font-mono text-xs">
                      <span className="text-[8px] text-text-muted block uppercase">Owner Username</span>
                      <span className="font-bold text-text block mt-1 select-all">{githubScanResult.username}</span>
                    </Card>
                    <Card className="p-4 bg-surface/30 font-mono text-xs">
                      <span className="text-[8px] text-text-muted block uppercase">Account Type</span>
                      <span className="font-bold text-text block mt-1 uppercase">{githubScanResult.type}</span>
                    </Card>
                    <Card className="p-4 bg-surface/30 font-mono text-xs">
                      <span className="text-[8px] text-text-muted block uppercase">Public Repositories</span>
                      <span className="font-bold text-accent block mt-1">{githubScanResult.publicReposCount} Checked</span>
                    </Card>
                  </div>

                  {/* Findings */}
                  <Card className="p-4 bg-surface/30 space-y-4">
                    <h4 className="text-xs font-bold text-text uppercase tracking-wider font-mono border-b border-white/[0.05] pb-2 flex items-center gap-2">
                      <AlertOctagon className="h-4 w-4 text-accent" /> Exposure Checklist &amp; Findings
                    </h4>

                    {githubScanResult.findings.length === 0 ? (
                      <div className="text-center py-6 text-success font-bold font-mono text-xs space-y-2">
                        <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
                        <p>POSTURE SECURE: NO CRITICAL GITHUB EXPOSURES DISCOVERED</p>
                        <p className="text-text-dim text-[9.5px] font-sans font-normal">We analyzed public repositories and found no environment variables, exposed credentials, or config leaks.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 font-mono text-xs">
                        {githubScanResult.findings.map((finding, idx) => {
                          const fKey = `github-finding-${idx}`;
                          const isOpen = expandedFindings[fKey];
                          const badgeVariant = finding.severity === "critical" || finding.severity === "high" ? "danger" : finding.severity === "medium" ? "warning" : "info";
                          
                          return (
                            <div key={idx} className="border border-white/[0.03] rounded-xl bg-bg/40 overflow-hidden text-left">
                              <div
                                onClick={() => toggleFindingExpand(fKey)}
                                className="flex justify-between items-center p-3 cursor-pointer hover:bg-white/[0.02] gap-4"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className={`h-1.5 w-1.5 rounded-full ${finding.severity === "critical" || finding.severity === "high" ? "bg-danger" : "bg-warning"}`} />
                                  <span className="font-bold text-text text-[11px] truncate">{finding.title}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant={badgeVariant} className="text-[7px] py-0.5 uppercase">{finding.severity}</Badge>
                                  {isOpen ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                                </div>
                              </div>

                              {isOpen && (
                                <div className="p-4 border-t border-white/[0.02] space-y-3.5 leading-relaxed text-xs">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-bold text-text-dim uppercase tracking-wider block">Description</span>
                                      <p className="text-text-dim font-sans">{finding.description}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-bold text-warning uppercase tracking-wider block">Security Risk Impact</span>
                                      <p className="text-text-dim font-sans">{finding.businessImpact}</p>
                                    </div>
                                  </div>
                                  
                                  {finding.evidence && (
                                    <div className="space-y-1">
                                      <span className="text-[8px] font-black text-accent-light uppercase tracking-wider block">Audited Evidence</span>
                                      <pre className="bg-bg border border-white/[0.04] p-3 rounded-lg text-[10px] text-accent-light break-all select-text whitespace-pre-wrap">{finding.evidence}</pre>
                                    </div>
                                  )}

                                  {finding.remediation && (
                                    <div className="p-3 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl space-y-1">
                                      <span className="text-[8.5px] font-black text-accent uppercase tracking-wider block">Remediation Action Required</span>
                                      <p className="text-text-dim font-sans">{finding.remediation}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ==================== 5. WEBSITE PRIVACY & COMPLIANCE TAB ==================== */}
          {activeCategory === "website-privacy" && (
            <div className="space-y-6 animate-fadeInUp text-left font-sans">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                {/* Privacy Policy */}
                <Card className="p-4 bg-surface/30 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[8px] text-text-muted uppercase font-bold">Privacy Policy Link</span>
                    <span className="font-bold text-text text-[11px] block mt-1">
                      {privacy?.privacyPolicyPresent ? "Detected" : "Not Found"}
                    </span>
                  </div>
                  {privacy?.privacyPolicyPresent && privacy?.privacyPolicyUrl && (
                    <a
                      href={privacy.privacyPolicyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline truncate text-[9.5px] font-bold block select-all mt-2"
                    >
                      {privacy.privacyPolicyUrl}
                    </a>
                  )}
                  <Badge variant={privacy?.privacyPolicyPresent ? "success" : "danger"} className="text-[7.5px] py-0.5 w-max">
                    {privacy?.privacyPolicyPresent ? "COMPLIANT" : "RISK DETECTED"}
                  </Badge>
                </Card>

                {/* Cookie Consent banner */}
                <Card className="p-4 bg-surface/30 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[8px] text-text-muted uppercase font-bold">Cookie Consent Banner</span>
                    <span className="font-bold text-text text-[11px] block mt-1">
                      {privacy?.cookieBannerPresent ? "Detected" : "Not Detected"}
                    </span>
                  </div>
                  <p className="text-[9.5px] text-text-dim font-sans font-semibold">
                    Checks standard banner IDs/consent text structures.
                  </p>
                  <Badge variant={privacy?.cookieBannerPresent ? "success" : "warning"} className="text-[7.5px] py-0.5 w-max mt-2">
                    {privacy?.cookieBannerPresent ? "ACTIVE CONSENT" : "POLICY ADVISORY"}
                  </Badge>
                </Card>

                {/* Tracking Pixels */}
                <Card className="p-4 bg-surface/30 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-[8px] text-text-muted uppercase font-bold">Tracking Pixels</span>
                    <span className="font-bold text-text text-[11px] block mt-1">
                      {privacy?.trackingPixels && privacy.trackingPixels.length > 0 ? `${privacy.trackingPixels.length} Detected` : "None Detected"}
                    </span>
                  </div>
                  {privacy?.trackingPixels && privacy.trackingPixels.length > 0 && (
                    <span className="text-[9.5px] text-danger font-bold leading-normal truncate">
                      {privacy.trackingPixels.join(", ")}
                    </span>
                  )}
                  <Badge variant={privacy?.trackingPixels && privacy.trackingPixels.length > 0 ? "warning" : "success"} className="text-[7.5px] py-0.5 w-max">
                    {privacy?.trackingPixels && privacy.trackingPixels.length > 0 ? "TRACKERS EXPOSED" : "NO SNIFFERS"}
                  </Badge>
                </Card>
              </div>

              {/* Cookies flags detailed audit list */}
              {cookies && cookies.length > 0 && (
                <Card className="p-4 bg-surface/30 space-y-4">
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-3 font-mono flex items-center gap-2">
                    <Cookie className="h-4 w-4 text-accent" /> Cookies Flag Security Audit ({cookies.length})
                  </h3>
                  <div className="space-y-3 font-mono text-[10.5px]">
                    {cookies.map((cookie, index) => {
                      const isSecureFlagMissing = !cookie.secure;
                      const isHttpOnlyMissing = !cookie.httpOnly;
                      
                      return (
                        <div key={index} className="bg-bg/40 border border-white/[0.02] p-3.5 rounded-xl space-y-2.5 leading-relaxed text-left">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-accent font-bold select-all block text-xs">{cookie.name}</span>
                              <span className="text-[9.5px] text-text-muted">Domain: {cookie.domain || domain} | Path: {cookie.path || "/"}</span>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Badge variant={cookie.httpOnly ? "success" : "danger"} className="text-[7px] py-0.5">HttpOnly</Badge>
                              <Badge variant={cookie.secure ? "success" : "danger"} className="text-[7px] py-0.5">Secure</Badge>
                            </div>
                          </div>

                          {(isSecureFlagMissing || isHttpOnlyMissing) && (
                            <div className="bg-danger/5 border border-danger/10 rounded-lg p-2 text-[10px]">
                              <p className="text-danger font-bold font-sans">Cookie Flags Vulnerability Risk:</p>
                              <p className="text-text-dim font-sans mt-0.5">
                                {isHttpOnlyMissing && "Missing HttpOnly flag: Cookie can be extracted programmatically via XSS scripts. "}
                                {isSecureFlagMissing && "Missing Secure flag: Cookie is transmitted over plaintext transport channels, inviting sniffing intercepts."}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Analytics tools and third-party scripts */}
              {privacy && (privacy.thirdPartyScripts?.length > 0 || privacy.analyticsTools?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {privacy.analyticsTools?.length > 0 && (
                    <Card className="p-4 bg-surface/30 space-y-3">
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono">
                        Analytics Platforms Detected
                      </h3>
                      <div className="space-y-2 font-mono text-xs">
                        {privacy.analyticsTools.map((tool, idx) => (
                          <div key={idx} className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg flex justify-between items-center">
                            <span className="font-bold text-text">{tool}</span>
                            <Badge variant="info" className="text-[7.5px]">ACTIVE</Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {privacy.externalDomains?.length > 0 && (
                    <Card className="p-4 bg-surface/30 space-y-3">
                      <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono">
                        External Domain Links Loaded
                      </h3>
                      <div className="space-y-2 font-mono text-[10px] max-h-56 overflow-y-auto pr-1">
                        {privacy.externalDomains.map((extDomain, idx) => (
                          <div key={idx} className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg select-all">
                            {extDomain}
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ==================== INTERACTIVE FEATURES MODALS ==================== */}

      {/* 1. PORT INFORMATION DIALOG MODAL */}
      {selectedPort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-md border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Radio className="text-danger h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  Port {selectedPort.port} ({selectedPort.service || "TCP"}) Guidelines
                </h3>
              </div>
              <button onClick={() => setSelectedPort(null)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-left">
              <div className="bg-bg/60 p-3 rounded-lg border border-white/[0.03] space-y-1">
                <span className="text-[8px] font-black text-text-dim uppercase font-mono">Audit Evidence</span>
                <p className="font-mono text-[10px] text-accent-light break-all select-text">{selectedPort.evidence || "TCP handshake resolved successfully."}</p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-text">Standard Threat Assessment:</p>
                <p className="text-text-dim">
                  {selectedPort.port === 80 ? "HTTP unencrypted traffic. Transmitting login secrets or cookies across port 80 allows credentials interception via sniffing." :
                   selectedPort.port === 443 ? "HTTPS secure channel. Ensure no outdated SSL ciphers (RC4, 3DES) or deprecated TLS versions (v1.0/v1.1) are enabled." :
                   selectedPort.port === 22 ? "SSH administrative access. Open SSH ports are heavily targeted by password brute-force scan tools." :
                   selectedPort.port === 3306 || selectedPort.port === 5432 ? "Direct database port exposure. Allows external login brute-force attacks and vulnerability scanning." :
                   "Public port exposure. Exposing network services publicly invites target service mapping and version vulnerability exploits."}
                </p>
              </div>

              <div className="space-y-2 p-3 bg-danger/5 border border-danger/15 rounded-xl">
                <p className="font-bold text-danger">Hardening Recommendations:</p>
                <ul className="list-disc list-inside space-y-1 text-text-dim">
                  {selectedPort.port === 80 ? (
                    <>
                      <li>Redirect all Port 80 requests to Port 443 immediately.</li>
                      <li>Use permanent redirection (HTTP 301) to force browser caching of redirects.</li>
                    </>
                  ) : selectedPort.port === 443 ? (
                    <>
                      <li>Enforce TLS v1.2 & v1.3 handshakes only.</li>
                      <li>Deploy HTTP Strict Transport Security (HSTS) response directives.</li>
                    </>
                  ) : selectedPort.port === 22 ? (
                    <>
                      <li>Change default SSH Port 22 to a non-standard custom port.</li>
                      <li>Enforce Key-Based authentication and disable password logins.</li>
                      <li>Apply firewall restrictions to whitelist trusted administrative IPs.</li>
                    </>
                  ) : (
                    <>
                      <li>Configure database binds to localhost/private adapters only.</li>
                      <li>Use a virtual private network (VPN) or tunnel to access databases.</li>
                      <li>Implement strict IP whitelisting rules at network boundaries.</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="flex justify-end pt-2 border-t border-white/[0.04]">
                <Button variant="outline" size="sm" onClick={() => setSelectedPort(null)}>Close Guidelines</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 2. TECHNOLOGY DETAIL DIALOG MODAL */}
      {selectedTech && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-md border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Cpu className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                  Stack Detail: {selectedTech.name}
                </h3>
              </div>
              <button onClick={() => setSelectedTech(null)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-left font-sans">
              <div className="grid grid-cols-2 gap-3 font-mono text-[10.5px]">
                <div className="bg-bg/40 border border-white/[0.02] p-2 rounded">
                  <span className="text-[8px] text-text-muted block">Category</span>
                  <span className="font-bold text-text">{selectedTech.category || "System Layer"}</span>
                </div>
                <div className="bg-bg/40 border border-white/[0.02] p-2 rounded">
                  <span className="text-[8px] text-text-muted block">Observed Version</span>
                  <span className="font-bold text-accent">{selectedTech.version || "Not Disclosed (Secure)"}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-text">Security Guidelines:</p>
                <p className="text-text-dim leading-relaxed">
                  {selectedTech.name.toLowerCase().includes("next") ? (
                    "Next.js framework utilizes server-rendered routes. Ensure poweredByHeader configuration is disabled in next.config.js to mitigate server path fingerprinting."
                  ) : selectedTech.name.toLowerCase().includes("nginx") ? (
                    "Configure 'server_tokens off;' to hide Nginx core version signatures. Version disclosures let attackers search public CVE databases for target-matching exploits."
                  ) : selectedTech.name.toLowerCase().includes("apache") ? (
                    "Deploy SSLEngine and configure ServerTokens ProductOnly alongside ServerSignature Off to disable server stacks fingerprinting in HTTP headers."
                  ) : (
                    "Ensure software packages are upgraded to active production versions. Regularly scan dependencies for vulnerabilities using tools like audit/npm-audit."
                  )}
                </p>
              </div>

              {selectedTech.version && (
                <div className="p-3 bg-warning/5 border border-warning/15 rounded-xl text-text-dim space-y-1">
                  <p className="font-bold text-warning flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" /> Version Exposure Warning:
                  </p>
                  <p className="text-[9.5px]">
                    Exposing version parameter ({selectedTech.version}) speeds up exploit payload building by attackers. Harden header directives to hide version properties.
                  </p>
                </div>
              )}

              <div className="flex justify-end pt-2 border-t border-white/[0.04]">
                <Button variant="outline" size="sm" onClick={() => setSelectedTech(null)}>Close Details</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 3. IP ADDRESS DETAILS DIALOG MODAL */}
      {selectedIp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-md border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Globe className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  WHOIS/GeoIP: {selectedIp}
                </h3>
              </div>
              <button onClick={() => setSelectedIp(null)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-4 text-xs leading-relaxed text-left font-mono">
              {infrastructure ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                    <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-[8px] text-text-muted block">Hosting ASN</span>
                      <span className="font-bold text-text truncate block">{infrastructure.asn || "Not Disclosed"}</span>
                    </div>
                    <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-[8px] text-text-muted block">ISP Network</span>
                      <span className="font-bold text-text truncate block">{infrastructure.isp || "Not Disclosed"}</span>
                    </div>
                    <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-[8px] text-text-muted block">Hosting Provider</span>
                      <span className="font-bold text-text truncate block">{infrastructure.hosting || "Not Disclosed"}</span>
                    </div>
                    <div className="bg-bg/40 border border-white/[0.02] p-2.5 rounded-lg">
                      <span className="text-[8px] text-text-muted block">Geographic Zone</span>
                      <span className="font-bold text-accent truncate block">{infrastructure.country ? `${infrastructure.country} (${infrastructure.region || "Global"})` : "Not Disclosed"}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-text-dim italic text-center py-4">Infrastructure WHOIS mapping did not resolve for this node.</p>
              )}

              <div className="flex justify-end pt-2 border-t border-white/[0.04]">
                <Button variant="outline" size="sm" onClick={() => setSelectedIp(null)}>Close WHOIS</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 4. SSL CERTIFICATE DETAILS DIALOG MODAL */}
      {sslDetailOpen && ssl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-lg border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Key className="text-emerald-400 h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text font-mono">
                  SSL/TLS Certificate Audit Log
                </h3>
              </div>
              <button onClick={() => setSslDetailOpen(false)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>

            <div className="space-y-4 text-xs text-left font-mono max-h-[400px] overflow-y-auto pr-1">
              <div className="space-y-2">
                <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2 rounded">
                  <span className="text-text-dim text-[10px]">Trusted Status</span>
                  <Badge variant={ssl.valid ? "success" : "danger"}>{ssl.valid ? "TRUSTED CA" : "UNTRUSTED"}</Badge>
                </div>
                <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2 rounded">
                  <span className="text-text-dim text-[10px]">Active TLS Protocol</span>
                  <span className="font-bold text-text">{ssl.tlsVersion || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2 rounded">
                  <span className="text-text-dim text-[10px]">Issuer Common Name</span>
                  <span className="font-bold text-text truncate max-w-[220px]" title={ssl.issuer}>{ssl.issuer || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2 rounded">
                  <span className="text-text-dim text-[10px]">Expiration Timestamp</span>
                  <span className="font-bold text-text">{ssl.expirationDate ? new Date(ssl.expirationDate).toLocaleString() : "N/A"}</span>
                </div>
                <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2 rounded">
                  <span className="text-text-dim text-[10px]">Wildcard Support</span>
                  <span className="font-bold text-text">{ssl.wildcard ? "TRUE" : "FALSE"}</span>
                </div>
                <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2 rounded">
                  <span className="text-text-dim text-[10px]">HSTS Preload Status</span>
                  <span className={`font-bold ${ssl.hstsPreload ? "text-success" : "text-text-dim"}`}>{ssl.hstsPreload ? "PRELOADED" : "NO"}</span>
                </div>
              </div>

              {ssl.sans && ssl.sans.length > 0 && (
                <div className="bg-bg/40 border border-white/[0.03] p-3 rounded-lg space-y-1.5">
                  <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Subject Alternative Names (SANs)</p>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {ssl.sans.map((san, i) => (
                      <span key={i} className="bg-surface border border-white/[0.03] px-2 py-0.5 rounded text-[9.5px] select-all font-bold">
                        {san}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/[0.04]">
              <Button variant="outline" size="sm" onClick={() => setSslDetailOpen(false)}>Close Inspector</Button>
            </div>
          </Card>
        </div>
      )}

      {/* 5. EMAIL REPORT DIALOG MODAL */}
      {emailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-sm border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Mail className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                  Email Security Report
                </h3>
              </div>
              <button onClick={() => setEmailModalOpen(false)} className="text-text-dim hover:text-text text-lg">×</button>
            </div>
            
            <form onSubmit={handleSendEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-bg border border-white/[0.06] focus:border-accent rounded-lg text-xs text-text outline-none transition-all font-mono"
                />
              </div>
              <p className="text-[10px] text-text-dim leading-relaxed">
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

      {/* 6. SHARE REPORT DIALOG MODAL */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn" style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}>
          <Card className="w-full max-w-md border border-white/[0.08] bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Share2 className="text-accent h-4.5 w-4.5" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
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
                    <p className="text-[10px] text-text-dim mt-0.5">Enable public URL access to share this report with anyone.</p>
                  </div>
                  <button
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
                      className="flex-grow bg-bg border border-white/[0.06] rounded-lg px-3 py-2 text-[10.5px] text-accent-light outline-none truncate select-all"
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

    </div>
  );
}
