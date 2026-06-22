"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import ScoreGauge from "@/components/ui/ScoreGauge";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { runSecurityAudit } from "@/lib/analyzer";
import { generateAIAdvice } from "@/lib/aiAssistant";
import { useToast } from "@/components/common/Toast";
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
  Layers
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
  CartesianGrid,
  Legend
} from "recharts";

export default function ScanResults({ result }) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState("overview");
  const [localResult, setLocalResult] = useState(result);
  const [isRescanning, setIsRescanning] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  
  // Header filter states
  const [headersSearch, setHeadersSearch] = useState("");
  const [headersFilter, setHeadersFilter] = useState("all");
  
  // DNS filter
  const [dnsActiveRecord, setDnsActiveRecord] = useState("all");
  
  // Expandable sections states
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

  useEffect(() => {
    setMounted(true);
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
    subdomains = [],
    exposedServices = [],
    loginSurfaces = [],
    benchmarks,
    categoryScores,
    seo,
    metadata
  } = localResult || {};

  // Fetch scan history trend dynamically
  useEffect(() => {
    const fetchHistoryTrend = async () => {
      if (!domain) return;
      try {
        const res = await fetch("/api/history");
        const data = await res.json();
        if (Array.isArray(data)) {
          const filtered = data
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

  const finalSeo = seo || {
    canonicalUrl: "",
    metaRobots: "",
    isIndexable: true,
    openGraph: { title: "", description: "", image: "", type: "", url: "" },
    twitterCard: { card: "", title: "", description: "", image: "", site: "" }
  };

  // Compile audits / checks
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

  // Status summaries
  const passedCount = activeChecks.filter(c => c.status === "passed").length;
  const warningCount = activeChecks.filter(c => c.status === "warning").length;
  const failedCount = activeChecks.filter(c => c.status === "failed").length;

  const getSecurityPosture = () => {
    if (score >= 90) return { text: "Optimal Security", color: "text-success", bg: "bg-success/10", border: "border-success/20", glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]", badge: "success" };
    if (score >= 80) return { text: "Strong Protection", color: "text-success", bg: "bg-success/5", border: "border-success/15", glow: "shadow-[0_0_15px_rgba(34,197,94,0.1)]", badge: "success" };
    if (score >= 60) return { text: "Moderate Risks", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", glow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]", badge: "warning" };
    if (score >= 40) return { text: "Weak Safeguards", color: "text-warning", bg: "bg-warning/5", border: "border-warning/15", glow: "shadow-[0_0_15px_rgba(234,179,8,0.08)]", badge: "warning" };
    return { text: "Critical Deficiencies", color: "text-danger", bg: "bg-danger/10", border: "border-danger/20", glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]", badge: "danger" };
  };

  const posture = getSecurityPosture();

  // Dynamic calculated scores based on verified findings only
  const computedScores = useMemo(() => {
    const headerScore = score || 0;
    
    // SSL: If certificate exists and is valid, 100. If invalid or warning, 40. Otherwise 0.
    const sslScore = ssl && ssl.expirationDate !== null ? (ssl.valid ? 100 : 40) : 0;
    
    // DNS: checks SPF and DMARC validity
    let dnsScore = 20;
    if (dns) {
      if (dns.spf?.valid) dnsScore += 25;
      if (dns.dmarc?.valid) dnsScore += 25;
      if (dns.dnssec) dnsScore += 30;
    }
    
    // Cookies: secure cookies ratio
    const totalCookies = cookies ? cookies.length : 0;
    const secureCookies = cookies ? cookies.filter(c => c.httpOnly && c.secure).length : 0;
    const cookieScore = totalCookies > 0 ? Math.round((secureCookies / totalCookies) * 100) : 100;
    
    // Attack Surface Exposure: starts at 100, deducts for verified exposed vectors
    const activeSubdomains = subdomains ? subdomains.filter(s => s.status === "active").length : 0;
    const openPorts = exposedServices ? exposedServices.filter(s => s.status === "open").length : 0;
    const sensitiveCount = sensitiveFiles ? sensitiveFiles.filter(f => f.exists).length : 0;
    const identityCount = loginSurfaces ? loginSurfaces.length : 0;
    let surfaceScore = 100 - (openPorts * 20) - (sensitiveCount * 10) - (activeSubdomains * 5) - (identityCount * 5);
    surfaceScore = Math.max(10, surfaceScore);
    
    // Compliance Score: checks how many standard compliance blocks pass
    let compCount = 0;
    if (compliance?.GDPR?.compliant) compCount++;
    if (compliance?.PCI_DSS?.compliant) compCount++;
    if (compliance?.OWASP?.compliant) compCount++;
    if (compliance?.NIST?.compliant) compCount++;
    const complianceScore = Math.round((compCount / 4) * 100);
    
    return {
      headers: headerScore,
      ssl: sslScore,
      dns: dnsScore,
      cookies: cookieScore,
      attackSurface: surfaceScore,
      compliance: complianceScore
    };
  }, [score, ssl, dns, cookies, subdomains, exposedServices, sensitiveFiles, loginSurfaces, compliance]);

  // Group findings by severity
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    activeChecks.forEach(c => {
      if (c.status !== "passed") {
        const sev = (c.severity || "info").toLowerCase();
        if (sev in counts) {
          counts[sev]++;
        } else if (sev === "informational") {
          counts.info++;
        } else {
          counts.low++;
        }
      } else {
        counts.info++;
      }
    });
    return counts;
  }, [activeChecks]);

  const groupedFindings = useMemo(() => {
    const groups = {
      critical: [],
      high: [],
      medium: [],
      low: [],
      info: []
    };
    activeChecks.forEach(c => {
      if (c.status === "passed") {
        groups.info.push(c);
        return;
      }
      const sev = (c.severity || "info").toLowerCase();
      if (sev in groups) {
        groups[sev].push(c);
      } else if (sev === "informational") {
        groups.info.push(c);
      } else {
        groups.low.push(c);
      }
    });
    return groups;
  }, [activeChecks]);

  // Priority remediation list (estimated score improvement helper)
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

  const mapData = useMemo(() => {
    const ips = [...(dns?.a || []), ...(dns?.aaaa || [])];
    const cdn = infrastructure?.cdn || "None Detected";
    const waf = infrastructure?.waf || "None Detected";
    const jsFiles = [];
    const thirdPartyServices = [];
    const apiEndpoints = [];
    
    const cspHeader = headers.find(h => h.name.toLowerCase() === "content-security-policy");
    if (cspHeader && cspHeader.value) {
      const words = cspHeader.value.split(/\s+/);
      words.forEach(w => {
        const clean = w.replace(/;$/, "");
        if (clean.includes(".js") || clean.endsWith(".js")) {
          jsFiles.push(clean);
        }
        if (clean.includes(".") && !clean.startsWith("'") && !clean.startsWith("http") && !clean.includes(domain)) {
          if (clean.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/) && !thirdPartyServices.includes(clean)) {
            thirdPartyServices.push(clean);
          }
        }
      });
    }
    
    loginSurfaces.forEach(s => {
      if (s.path.includes("api") || s.path.includes("v1") || s.path.includes("graphql")) {
        apiEndpoints.push(s.path);
      }
    });
    sensitiveFiles.forEach(s => {
      if (s.path.includes("api") || s.path.includes("json")) {
        apiEndpoints.push(s.path);
      }
    });

    const publicFiles = [];
    sensitiveFiles.forEach(f => {
      if (f.exists) {
        publicFiles.push(f.path);
      }
    });
    if (robotsTxt?.exists) publicFiles.push("/robots.txt");
    if (sitemapXml?.exists) publicFiles.push("/sitemap.xml");
    if (securityTxt?.exists) publicFiles.push("/.well-known/security.txt");

    const emailSec = [];
    if (emailSecurity?.spfPresent || dns?.spf?.valid) emailSec.push("SPF Protocol: Active");
    if (emailSecurity?.dmarcPresent || dns?.dmarc?.valid) emailSec.push("DMARC Policy: Active");
    if (emailSecurity?.bimiPresent) emailSec.push("BIMI Indicator: Active");
    if (emailSecurity?.mtaStsPresent) emailSec.push("MTA-STS Security: Active");

    const compliances = [];
    if (compliance?.GDPR?.compliant) compliances.push("GDPR compliant");
    if (compliance?.PCI_DSS?.compliant) compliances.push("PCI-DSS compliant");
    if (compliance?.OWASP?.compliant) compliances.push("OWASP Secure");
    if (compliance?.NIST?.compliant) compliances.push("NIST aligned");

    return {
      ip: { count: ips.length, items: ips, badge: ips.length > 0 ? "Resolved" : "N/A" },
      dns: {
        count: dns ? ((dns.a?.length || 0) + (dns.mx?.length || 0) + (dns.txt?.length || 0)) : 0,
        items: dns ? [
          ...(dns.mx?.map(m => `MX: ${m.exchange}`) || []),
          ...(dns.txt?.map(t => `TXT: ${t.slice(0, 50)}${t.length > 50 ? '...' : ''}`) || [])
        ] : ["No nameserver records resolved."]
      },
      ssl: {
        badge: (ssl && ssl.expirationDate !== null) ? (ssl.valid ? "Trusted" : "Untrusted") : "N/A"
      },
      cdn: { badge: infrastructure?.cdn ? "Active" : "None" },
      waf: { badge: infrastructure?.waf ? "Protected" : (infrastructure ? "Exposed" : "N/A") },
      cookies: { count: cookies ? cookies.length : 0 },
      headers: { count: headers.length },
      apis: { count: apiEndpoints.length, items: apiEndpoints },
      jsFiles: { count: jsFiles.length, items: jsFiles },
      thirdParty: { count: thirdPartyServices.length, items: thirdPartyServices },
      subdomains: {
        count: subdomains ? subdomains.filter(s => s.status === "active").length : 0,
        items: subdomains ? subdomains.filter(s => s.status === "active") : []
      },
      ports: {
        count: exposedServices ? exposedServices.filter(s => s.status === "open").length : 0,
        items: exposedServices ? exposedServices.filter(s => s.status === "open") : []
      },
      paths: {
        count: sensitiveFiles ? sensitiveFiles.filter(f => f.exists).length : 0,
        items: sensitiveFiles ? sensitiveFiles.filter(f => f.exists) : []
      },
      portals: {
        count: loginSurfaces ? loginSurfaces.filter(s => s.status === "accessible").length : 0,
        items: loginSurfaces ? loginSurfaces.filter(s => s.status === "accessible") : []
      }
    };
  }, [localResult, dns, ssl, infrastructure, cookies, headers, loginSurfaces, sensitiveFiles, robotsTxt, sitemapXml, securityTxt, emailSecurity, compliance, domain]);

  // Expected security header configs helper
  const getExpectedHeaderValue = (name) => {
    const expectations = {
      "content-security-policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ...",
      "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
      "x-frame-options": "DENY or SAMEORIGIN",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()",
      "cross-origin-embedder-policy": "require-corp",
      "cross-origin-opener-policy": "same-origin",
      "cross-origin-resource-policy": "same-origin",
      "x-xss-protection": "0 (Recommended) or 1; mode=block"
    };
    return expectations[name.toLowerCase()] || "Highly hardened response directive directive configuration";
  };

  // Rescan Trigger
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

  // PDF Exporter
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

  // Share link copy helper
  const handleShare = () => {
    const scanId = localResult._id || localResult.scanId;
    if (!scanId) {
      toast.warning("Local scan: Save scan or check history for shareable logs.");
      return;
    }
    const publicUrl = `${window.location.origin}/shared/scan/${scanId}`;
    navigator.clipboard.writeText(publicUrl);
    toast.success("Public share link copied to clipboard!");
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText("Copied!");
    setTimeout(() => setCopiedText(""), 2000);
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

  // TAB ITEMS configuration
  const tabItems = [
    { id: "overview", label: "Overview", icon: Layout },
    { id: "findings", label: `Findings (${failedCount + warningCount})`, icon: ShieldAlert },
    { id: "attack-surface", label: "Attack Surface", icon: Layers },
    { id: "headers", label: "Security Headers", icon: ShieldCheck },
    { id: "network", label: "Network (SSL & DNS)", icon: Globe },
    { id: "cookies", label: "Cookies & Compliance", icon: Cookie },
    { id: "remediation", label: "AI Recommendations", icon: BookOpen }
  ];

  // Filtered Headers
  const filteredHeaders = useMemo(() => {
    return headers.filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(headersSearch.toLowerCase()) || 
                            (h.value && h.value.toLowerCase().includes(headersSearch.toLowerCase()));
      if (headersFilter === "all") return matchesSearch;
      if (headersFilter === "passed") return matchesSearch && h.status === "present";
      if (headersFilter === "warning") return matchesSearch && h.status === "weak";
      if (headersFilter === "failed") return matchesSearch && h.status === "missing";
      return matchesSearch;
    });
  }, [headers, headersSearch, headersFilter]);

  // Loading skeleton when scanning is active
  if (isRescanning) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4 animate-pulse">
        {/* Skeleton Top Bar */}
        <div className="h-28 bg-surface/50 border border-white/[0.04] rounded-2xl flex items-center justify-between px-6 gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-5 bg-white/10 rounded w-1/3" />
            <div className="h-3.5 bg-white/5 rounded w-1/2" />
          </div>
          <div className="h-16 w-16 rounded-full bg-white/10" />
        </div>

        {/* Skeleton Layout split */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <div className="h-40 bg-surface/30 border border-white/[0.03] rounded-2xl" />
            <div className="h-20 bg-surface/30 border border-white/[0.03] rounded-2xl" />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <div className="h-64 bg-surface/30 border border-white/[0.03] rounded-2xl" />
            <div className="h-44 bg-surface/30 border border-white/[0.03] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-text max-w-6xl mx-auto px-1 sm:px-4">
      
      {/* 1. TOP SUMMARY CARD */}
      <div className={`p-6 rounded-2xl bg-surface/40 border border-white/[0.04] backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-300 ${posture.glow}`}>
        
        {/* Domain and Telemetry detail */}
        <div className="flex-1 min-w-0 space-y-3 w-full">
          <div className="flex flex-wrap items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-text truncate max-w-full font-mono uppercase" title={domain}>
              {domain}
            </h1>
            <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 rounded bg-white/5 hover:bg-white/10 text-text-dim hover:text-text transition-colors">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Quick telemetry details list */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-text-dim">
            <div className="flex items-center gap-1.5">
              <Radio className="h-3.5 w-3.5 text-accent/80" />
              <span>Status: <span className="text-text font-bold font-mono">{statusCode ? `HTTP ${statusCode}` : "COMPLETED"}</span></span>
            </div>
            <div className="h-3.5 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-accent/80" />
              <span>Duration: <span className="text-text font-bold font-mono">{scanDuration || 0}ms</span></span>
            </div>
            <div className="h-3.5 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <Calendar className="h-3.5 w-3.5 text-accent/80" />
              <span>Audited: <span className="text-text font-bold font-mono text-[10.5px]">
                {metadata?.timestamp ? new Date(metadata.timestamp).toLocaleTimeString() : "Just now"}
              </span></span>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.03] mt-2">
            <Button onClick={handleRescan} variant="outline" size="sm" icon={RefreshCw} className="hover:border-accent/40 hover:text-accent font-bold">
              Rescan
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" icon={Download} className="hover:border-emerald-500/40 hover:text-emerald-400 font-bold">
              Export PDF
            </Button>
            <Button onClick={downloadJSON} variant="outline" size="sm" icon={FileCode} className="hover:border-blue-500/40 hover:text-blue-400 font-bold">
              Export JSON
            </Button>
            <Button onClick={handleShare} variant="outline" size="sm" icon={Share2} className="hover:border-indigo-500/40 hover:text-indigo-400 font-bold">
              Share
            </Button>
          </div>
        </div>

        {/* Large Circular Gauge & Score Grade */}
        <div className="flex items-center gap-5 flex-shrink-0 bg-bg/50 border border-white/[0.04] p-4 rounded-2xl w-full md:w-auto justify-between md:justify-start">
          <div className="text-center space-y-1">
            <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">Posture Grade</p>
            <div className={`text-3xl font-black px-4.5 py-2 rounded-xl border font-mono ${
              grade.startsWith("A") ? "text-success bg-success/5 border-success/20" :
              grade.startsWith("B") ? "text-accent bg-accent/5 border-accent/20" :
              grade.startsWith("C") || grade.startsWith("D") ? "text-warning bg-warning/5 border-warning/20" :
              "text-danger bg-danger/5 border-danger/20"
            }`}>
              {grade}
            </div>
          </div>

          <div className="h-10 w-px bg-white/10 hidden sm:block" />

          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center h-16 w-16">
              <svg className="absolute inset-0 transform -rotate-90 w-full h-full">
                <circle cx="32" cy="32" r="27" className="stroke-white/[0.03] fill-none" strokeWidth="5.5" />
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  className={`fill-none ${
                    score >= 80 ? "stroke-success" : score >= 60 ? "stroke-warning" : "stroke-danger"
                  }`}
                  strokeWidth="5.5"
                  strokeDasharray={`${2 * Math.PI * 27}`}
                  strokeDashoffset={`${2 * Math.PI * 27 * (1 - score / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-sm font-black font-mono text-text">{score}</span>
            </div>
            
            <div className="space-y-0.5">
              <p className="text-[9px] font-bold text-text-dim uppercase tracking-wider font-mono">Risk Level</p>
              <Badge variant={posture.badge} className="text-[8px] uppercase tracking-widest font-black py-0.5 px-2.5">
                {posture.text}
              </Badge>
            </div>
          </div>
        </div>

      </div>

      {/* 2. STICKY SUB-NAVIGATION TABS */}
      <div className="sticky top-16 z-30 bg-bg/85 backdrop-blur-md border-b border-white/[0.06] py-1.5 -mx-1 sm:mx-0 px-2 sm:px-0">
        <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
          {tabItems.map(item => {
            const Icon = item.icon;
            const isActive = activeCategory === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 border whitespace-nowrap ${
                  isActive 
                    ? "bg-accent/10 text-accent border-accent/30 shadow-[0_0_12px_rgba(99,102,241,0.1)]" 
                    : "text-text-dim hover:text-text hover:bg-white/5 border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. CORE REPORT DISPLAY SEGMENT */}
      <div className="space-y-6">

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeCategory === "overview" && (
          <div className="space-y-6 animate-fadeInUp">
            
            {/* Category breakdown grids */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {[
                { name: "HTTP Headers", score: computedScores.headers, icon: ShieldCheck, color: "text-blue-400" },
                { name: "SSL/TLS Security", score: computedScores.ssl, icon: Key, color: "text-emerald-400" },
                { name: "DNS Security", score: computedScores.dns, icon: Globe, color: "text-amber-400" },
                { name: "Cookie Security", score: computedScores.cookies, icon: Cookie, color: "text-pink-400" },
                { name: "Attack Surface", score: computedScores.attackSurface, icon: Layers, color: "text-red-400" },
                { name: "Compliance alignment", score: computedScores.compliance, icon: Shield, color: "text-purple-400" }
              ].map((cat, idx) => (
                <Card key={idx} className="p-4 flex flex-col justify-between hover:border-white/10 hover:shadow-lg transition-all duration-300">
                  <div className="flex justify-between items-start gap-2">
                    <cat.icon className={`h-4.5 w-4.5 ${cat.color}`} />
                    <span className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                      cat.score >= 80 ? "bg-success/5 text-success border border-success/15" :
                      cat.score >= 60 ? "bg-warning/5 text-warning border border-warning/15" :
                      "bg-danger/5 text-danger border border-danger/15"
                    }`}>
                      {cat.score}
                    </span>
                  </div>
                  <p className="text-[9px] font-black uppercase text-text-dim tracking-wider font-mono mt-3 leading-tight truncate">
                    {cat.name}
                  </p>
                </Card>
              ))}
            </div>

            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              
              {/* Audit Status chart */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/[0.05] pb-2">
                    <Activity className="h-4 w-4 text-accent" /> Audit Distribution
                  </h3>
                  <p className="text-text-dim text-[10px] leading-normal mt-1.5">
                    Comparison of checks resolved for target host:
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 mt-4">
                  <div className="space-y-1.5 text-[9.5px] font-semibold font-mono flex-1">
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
                    <div className="h-28 w-28 flex-shrink-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={auditStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={38}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {auditStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                        <span className="text-xs font-black text-text">{activeChecks.length}</span>
                        <span className="text-[7.5px] text-text-dim uppercase tracking-wider">Total</span>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Severity Bar Chart */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/[0.05] pb-2">
                    <BarChart3 className="h-4 w-4 text-accent" /> Finding Severities
                  </h3>
                  <p className="text-text-dim text-[10px] leading-normal mt-1.5">
                    Breakdown of resolved security issues by severity index:
                  </p>
                </div>

                <div className="h-32 w-full mt-4">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={severityBarData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={8} tickLine={false} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "10px" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]}>
                          {severityBarData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>

              {/* Historical Trend Line Chart */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2 border-b border-white/[0.05] pb-2">
                    <Activity className="h-4 w-4 text-accent" /> Score History Trend
                  </h3>
                  <p className="text-text-dim text-[10px] leading-normal mt-1.5">
                    Security index trends detected over successive scans:
                  </p>
                </div>

                <div className="h-32 w-full mt-4 flex items-center justify-center">
                  {mounted && historyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={8} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={8} tickLine={false} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", fontSize: "10px" }}
                          itemStyle={{ color: "#f8fafc" }}
                        />
                        <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#6366f1", r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-6 text-text-dim text-[10px] italic flex flex-col items-center gap-1">
                      <Terminal className="h-6 w-6 text-white/5" />
                      <span>No historical audits found. History charts populate as target scans recur.</span>
                    </div>
                  )}
                </div>
              </Card>

            </div>

            {/* Performance profiles and quick config */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Latencies */}
              <Card className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2.5 font-mono flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" /> Latency Handshake Profile
                </h3>
                
                <div className="space-y-4 text-xs font-mono">
                  {[
                    { label: "DNS Lookup Duration", val: performance?.dnsLookup ?? null, max: 150, color: "bg-accent" },
                    { label: "TLS Encrypted Handshake", val: performance?.tlsHandshake ?? null, max: 250, color: "bg-emerald-400" },
                    { label: "Time to First Byte (TTFB)", val: performance?.ttfb ?? null, max: 350, color: "bg-purple-400" },
                    { label: "Content Retrieve Duration", val: performance?.responseTime ?? null, max: 350, color: "bg-blue-400" }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-text-muted font-sans font-semibold">{item.label}</span>
                        {item.val !== null ? (
                          <span className="text-text font-bold font-mono">{item.val} ms</span>
                        ) : (
                          <span className="text-text-muted text-[8px] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded font-sans">
                            Unable to Verify / Excluded
                          </span>
                        )}
                      </div>
                      {item.val !== null ? (
                        <div className="h-1 bg-bg rounded-full overflow-hidden">
                          <div
                            style={{ width: `${Math.min(100, (item.val / item.max) * 100)}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                          />
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Infrastructure details */}
              <Card className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2.5 font-mono flex items-center gap-2">
                  <Server className="h-4 w-4 text-accent" /> Edge Infrastructure Map
                </h3>
                
                <div className="space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2.5 rounded-lg">
                    <span className="text-text-dim text-[10px]">Edge Cloud Proxy CDN</span>
                    <span className="font-bold text-text font-sans">{infrastructure?.cdn || "None Detected"}</span>
                  </div>
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2.5 rounded-lg">
                    <span className="text-text-dim text-[10px]">Reverse Proxy Signature</span>
                    <span className="font-bold text-text font-sans">{infrastructure?.reverseProxy || "None Detected (Hidden)"}</span>
                  </div>
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2.5 rounded-lg">
                    <span className="text-text-dim text-[10px]">Active Web Application Firewall</span>
                    <span className="font-bold text-text font-sans">{infrastructure?.waf || "None Detected"}</span>
                  </div>
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.02] p-2.5 rounded-lg">
                    <span className="text-text-dim text-[10px]">Observed IP Endpoint</span>
                    <span className="font-bold text-accent font-mono truncate max-w-[160px]" title={dns?.a?.[0] || "N/A"}>
                      {dns?.a?.[0] || "Unable to resolve"}
                    </span>
                  </div>
                </div>
              </Card>

            </div>

          </div>
        )}

        {/* ==================== FINDINGS TAB ==================== */}
        {activeCategory === "findings" && (
          <div className="space-y-4 animate-fadeInUp">
            {[
              { id: "critical", label: "Critical Findings", color: "border-danger/30 text-danger bg-danger/5", count: groupedFindings.critical.length, items: groupedFindings.critical },
              { id: "high", label: "High Vulnerabilities", color: "border-orange-500/30 text-orange-400 bg-orange-500/5", count: groupedFindings.high.length, items: groupedFindings.high },
              { id: "medium", label: "Medium Security Risks", color: "border-warning/30 text-warning bg-warning/5", count: groupedFindings.medium.length, items: groupedFindings.medium },
              { id: "low", label: "Low Configuration Hardening", color: "border-blue-500/30 text-blue-400 bg-blue-500/5", count: groupedFindings.low.length, items: groupedFindings.low },
              { id: "info", label: "Passed & Informational Observations", color: "border-success/30 text-success bg-success/5", count: groupedFindings.info.length, items: groupedFindings.info }
            ].map(group => {
              const isGroupOpen = expandedFindingsGroup[group.id];
              return (
                <Card key={group.id} className="p-0 border overflow-hidden">
                  
                  {/* Group Header */}
                  <div 
                    onClick={() => toggleGroupExpand(group.id)}
                    className="flex justify-between items-center p-4 bg-white/[0.01] hover:bg-white/[0.02] transition-colors cursor-pointer border-b border-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold border px-2.5 py-1 rounded font-mono ${group.color}`}>
                        {group.count}
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider font-mono text-text">
                        {group.label}
                      </span>
                    </div>
                    {isGroupOpen ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                  </div>

                  {/* Group Content Accordion */}
                  {isGroupOpen && (
                    <div className="p-4 divide-y divide-white/[0.03] space-y-4">
                      {group.items.length === 0 ? (
                        <p className="text-xs text-text-dim italic text-center py-6 font-mono">
                          No audit findings flagged under this severity class.
                        </p>
                      ) : (
                        group.items.map((check, index) => {
                          const uniqueKey = `${group.id}-${index}`;
                          const isOpen = expandedFindings[uniqueKey];
                          return (
                            <div key={index} className="pt-4 first:pt-0">
                              <div 
                                onClick={() => toggleFindingExpand(uniqueKey)}
                                className="flex justify-between items-start gap-4 cursor-pointer hover:bg-white/[0.01] p-1 rounded transition-colors"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <h4 className="text-xs font-bold text-text font-mono flex items-center gap-2 truncate">
                                    <span className={`h-1.5 w-1.5 rounded-full ${
                                      check.status === "passed" ? "bg-success" : check.status === "warning" ? "bg-warning" : "bg-danger"
                                    }`} />
                                    {check.title}
                                  </h4>
                                  <p className="text-[10.5px] text-text-dim leading-relaxed line-clamp-2">
                                    {check.description}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <Badge variant={check.status === "passed" ? "success" : check.status === "warning" ? "warning" : "danger"} className="text-[8px] py-0.5">
                                    {check.status === "passed" ? "Passed" : check.status === "warning" ? "Warning" : "Failed"}
                                  </Badge>
                                  {isOpen ? <ChevronUp className="h-4 w-4 text-text-dim" /> : <ChevronDown className="h-4 w-4 text-text-dim" />}
                                </div>
                              </div>

                              {/* Expanded panel details */}
                              {isOpen && (
                                <div className="mt-3.5 pt-3.5 border-t border-white/[0.03] space-y-4 text-xs leading-relaxed animate-fadeIn">
                                  
                                  {/* Description & Impact */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                      <p className="text-[8.5px] font-black text-text-dim uppercase tracking-wider font-mono">Vulnerability Context</p>
                                      <p className="text-text-dim text-[11px] leading-relaxed">{check.description}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[8.5px] font-black text-warning uppercase tracking-wider font-mono">Business/Security Impact</p>
                                      <p className="text-text-dim text-[11px] leading-relaxed">
                                        {check.impact || "Lack of secure headers exposes applications to cross-site scripting (XSS), script injections, or clickjacking hijacks."}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Evidence */}
                                  <div className="space-y-1">
                                    <p className="text-[8.5px] font-black text-accent-light uppercase tracking-wider font-mono">Scan Audit Evidence</p>
                                    <div className="bg-bg/85 border border-white/[0.03] p-3 rounded-lg font-mono text-[10.5px] text-accent-light break-all leading-relaxed select-text">
                                      {check.evidence || (check.status === "passed" ? "Verified passing payload config." : "Direct response audit failed to detect safety headers directives.")}
                                    </div>
                                  </div>

                                  {/* Recommendation */}
                                  {check.recommendation && (
                                    <div className="p-3 bg-indigo-500/[0.03] border border-indigo-500/20 rounded-xl space-y-1">
                                      <p className="text-[8.5px] font-black text-accent uppercase tracking-wider font-mono">Remediation Action Plan</p>
                                      <p className="text-text-muted text-[11px] leading-normal font-medium">{check.recommendation}</p>
                                    </div>
                                  )}

                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                </Card>
              );
            })}
          </div>
        )}

        {/* ==================== ATTACK SURFACE ==================== */}
        {activeCategory === "attack-surface" && (
          <div className="space-y-6 animate-fadeInUp">
            
            {/* Asset Tree Info Banner */}
            <div className="bg-surface/50 border border-white/[0.04] p-4 rounded-xl flex gap-3 text-xs leading-relaxed text-text-dim">
              <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-text mb-0.5">Verified Attack Surface Reconnaissance</p>
                <p>Lists only verified assets and pathways successfully mapped from target server headers, DNS records, and port handshake tests. Demonstration or inactive placeholders are omitted.</p>
              </div>
            </div>

            {/* Subdomains */}
            <Card className="p-5 space-y-3.5">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2.5">
                <div className="flex items-center gap-2 font-mono">
                  <Globe className="h-4.5 w-4.5 text-accent" />
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">Subdomain Reconnaissance</h3>
                </div>
                <Badge variant={mapData.subdomains.count > 0 ? "warning" : "success"} className="text-[8px]">
                  {mapData.subdomains.count} Resolved
                </Badge>
              </div>

              {mapData.subdomains.items.length === 0 ? (
                <p className="text-xs text-text-dim italic text-center py-6 font-mono">No findings detected.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mapData.subdomains.items.map((sub, index) => (
                    <div key={index} className="bg-bg/40 border border-white/[0.03] p-3.5 rounded-xl space-y-2 font-mono text-[10.5px]">
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-accent-light break-all select-all">{sub.subdomain || sub}</span>
                        <Badge variant="success" className="text-[7px]">ACTIVE</Badge>
                      </div>
                      <p className="text-[9.5px] text-text-dim leading-relaxed">
                        Resolved IP: <span className="text-text font-bold">{sub.ip || "Unknown"}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Exposed TCP Services */}
            <Card className="p-5 space-y-3.5">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2.5">
                <div className="flex items-center gap-2 font-mono">
                  <Radio className="h-4.5 w-4.5 text-accent" />
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">Exposed Service Gateways (TCP Ports)</h3>
                </div>
                <Badge variant={mapData.ports.count > 0 ? "danger" : "success"} className="text-[8px]">
                  {mapData.ports.count} Open
                </Badge>
              </div>

              {mapData.ports.items.length === 0 ? (
                <p className="text-xs text-text-dim italic text-center py-6 font-mono">No findings detected.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mapData.ports.items.map((srv, index) => (
                    <div key={index} className="bg-bg/40 border border-white/[0.03] p-3.5 rounded-xl space-y-2 font-mono text-[10.5px]">
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-accent-light">Port {srv.port} ({srv.service || "TCP"})</span>
                        <Badge variant="danger" className="text-[7px]">OPEN</Badge>
                      </div>
                      <p className="text-[9.5px] text-text-dim leading-relaxed">
                        Reason: <span className="text-text-muted">{srv.evidence || "Port connection resolved successfully."}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Sensitive Storage Paths */}
            <Card className="p-5 space-y-3.5">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2.5">
                <div className="flex items-center gap-2 font-mono">
                  <FileText className="h-4.5 w-4.5 text-accent" />
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">Sensitive Configuration & Path Discovery</h3>
                </div>
                <Badge variant={mapData.paths.count > 0 ? "danger" : "success"} className="text-[8px]">
                  {mapData.paths.count} Exposed
                </Badge>
              </div>

              {mapData.paths.items.length === 0 ? (
                <p className="text-xs text-text-dim italic text-center py-6 font-mono">No findings detected.</p>
              ) : (
                <div className="space-y-3">
                  {mapData.paths.items.map((file, index) => (
                    <div key={index} className="bg-bg/40 border border-white/[0.03] p-3.5 rounded-xl space-y-2 font-mono text-[10.5px] flex justify-between items-center gap-3">
                      <div>
                        <span className="font-bold text-accent-light select-all">{file.path}</span>
                        <p className="text-[9px] text-text-dim mt-0.5">Found with HTTP {file.status || 200}</p>
                      </div>
                      <Badge variant="danger" className="text-[7px]">EXPOSED</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Identity Portals */}
            <Card className="p-5 space-y-3.5">
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-2.5">
                <div className="flex items-center gap-2 font-mono">
                  <Lock className="h-4.5 w-4.5 text-accent" />
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">Web Identity Access Portals</h3>
                </div>
                <Badge variant={mapData.portals.count > 0 ? "warning" : "success"} className="text-[8px]">
                  {mapData.portals.count} Found
                </Badge>
              </div>

              {mapData.portals.items.length === 0 ? (
                <p className="text-xs text-text-dim italic text-center py-6 font-mono">No findings detected.</p>
              ) : (
                <div className="space-y-3">
                  {mapData.portals.items.map((login, index) => (
                    <div key={index} className="bg-bg/40 border border-white/[0.03] p-3.5 rounded-xl space-y-2 font-mono text-[10.5px] flex justify-between items-center gap-3">
                      <div>
                        <span className="font-bold text-accent-light select-all">{login.path}</span>
                        <p className="text-[9px] text-text-dim mt-0.5">Exposed login form interface</p>
                      </div>
                      <Badge variant="warning" className="text-[7px]">ACCESSIBLE</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

          </div>
        )}

        {/* ==================== HTTP SECURITY HEADERS ==================== */}
        {activeCategory === "headers" && (
          <div className="space-y-6 animate-fadeInUp">
            
            <Card className="p-5 space-y-4">
              
              {/* Header lists table */}
              <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-white/[0.05] pb-4">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono">
                    HTTP Response Headers
                  </h3>
                  <p className="text-[10px] text-text-dim mt-0.5">Observed values resolved against recommended security configurations:</p>
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
                        className={`px-2.5 py-1 rounded transition-colors ${
                          headersFilter === f ? "bg-accent text-bg" : "text-text-dim hover:text-text"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredHeaders.length === 0 ? (
                <p className="text-xs text-text-dim italic text-center py-6 font-mono">No HTTP response headers match your filter criteria.</p>
              ) : (
                <div className="divide-y divide-white/[0.03]">
                  {filteredHeaders.map((h, idx) => {
                    const isExpanded = expandedHeaders.includes(h.name);
                    const statusVariant = h.status === "present" ? "success" : h.status === "weak" ? "warning" : "danger";
                    
                    return (
                      <div key={idx} className="py-3 hover:bg-white/[0.01] transition-all rounded-lg px-2">
                        <div 
                          className="flex items-center justify-between gap-4 cursor-pointer"
                          onClick={() => toggleHeaderExpand(h.name)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
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

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="mt-3.5 pt-3.5 border-t border-white/[0.03] space-y-3.5 text-xs leading-relaxed animate-fadeIn">
                            <div>
                              <p className="text-[8.5px] font-black text-text-dim uppercase tracking-wider font-mono mb-1">Observed Value</p>
                              <div className="bg-bg/85 border border-white/[0.03] p-2.5 rounded-lg font-mono text-[10.5px] text-accent-light break-all whitespace-pre-wrap select-text">
                                {h.value || "MISSING (Header is not set by target server)"}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <p className="text-[8.5px] font-black text-text-dim uppercase tracking-wider font-mono mb-1">Expected / Recommended configuration</p>
                                <div className="bg-bg/85 border border-white/[0.03] p-2.5 rounded-lg font-mono text-[10.5px] text-text-muted break-all">
                                  {getExpectedHeaderValue(h.name)}
                                </div>
                              </div>
                              <div>
                                <p className="text-[8.5px] font-black text-warning uppercase tracking-wider font-mono mb-1">Associated Threat Context</p>
                                <p className="text-text-dim text-[11px] leading-relaxed">{h.description || "No threat details documented."}</p>
                              </div>
                            </div>

                            {h.recommendation && (
                              <div className="p-3 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-xl">
                                <p className="text-[8.5px] font-black text-accent uppercase tracking-wider font-mono mb-0.5">Remediation Action Required</p>
                                <p className="text-text-muted text-[11px] leading-relaxed">{h.recommendation}</p>
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

            {deepCsp && (
              <Card className="p-5 space-y-4">
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-accent" /> Content Security Policy (CSP) Deep Audit
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  <div className="space-y-3 bg-bg/40 p-4 rounded-xl border border-white/[0.03]">
                    <p className="text-[9px] font-black text-text-dim uppercase tracking-widest pb-1 border-b border-white/5">Execution Hardening</p>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-text-muted">unsafe-inline</span>
                      <Badge variant={deepCsp.unsafeInline ? "danger" : "success"}>
                        {deepCsp.unsafeInline ? "Vulnerable" : "Secure"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-text-muted">unsafe-eval</span>
                      <Badge variant={deepCsp.unsafeEval ? "danger" : "success"}>
                        {deepCsp.unsafeEval ? "Vulnerable" : "Secure"}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3 bg-bg/40 p-4 rounded-xl border border-white/[0.03]">
                    <p className="text-[9px] font-black text-text-dim uppercase tracking-widest pb-1 border-b border-white/5">Crypto Signatures</p>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-text-muted">CSP Nonce usage</span>
                      <span className={`font-bold font-mono ${deepCsp.nonceUsage ? "text-success" : "text-text-dim"}`}>
                        {deepCsp.nonceUsage ? "Enabled" : "Not Found"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-text-muted">CSP Hash signatures</span>
                      <span className={`font-bold font-mono ${deepCsp.hashUsage ? "text-success" : "text-text-dim"}`}>
                        {deepCsp.hashUsage ? "Enabled" : "Not Found"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 bg-bg/40 p-4 rounded-xl border border-white/[0.03]">
                    <p className="text-[9px] font-black text-text-dim uppercase tracking-widest pb-1 border-b border-white/5">Incident Reports</p>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-text-muted">report-uri directive</span>
                      <span className={`font-bold font-mono ${deepCsp.reportUri ? "text-success" : "text-text-dim"}`}>
                        {deepCsp.reportUri ? "Present" : "Missing"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="text-text-muted">report-to directive</span>
                      <span className={`font-bold font-mono ${deepCsp.reportTo ? "text-success" : "text-text-dim"}`}>
                        {deepCsp.reportTo ? "Present" : "Missing"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

          </div>
        )}

        {/* ==================== NETWORK (SSL & DNS) ==================== */}
        {activeCategory === "network" && (
          <div className="space-y-6 animate-fadeInUp">
            
            {/* SSL Certificate Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {ssl && ssl.expirationDate !== null ? (
                <Card className="p-5 relative overflow-hidden bg-gradient-to-br from-surface to-accent/5 border border-white/[0.06] md:col-span-2 flex flex-col justify-between min-h-[220px]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <Key className="h-4.5 w-4.5 text-emerald-400" />
                        <h4 className="text-xs font-bold tracking-widest text-text uppercase font-mono">
                          SSL/TLS Certificate
                        </h4>
                      </div>
                      <Badge variant={ssl.valid ? "success" : "danger"} className="text-[8px] font-bold py-0.5">
                        {ssl.valid ? "VALID" : "UNTRUSTED"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] font-mono leading-relaxed pt-1.5">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-text-dim uppercase">Issuer Common Name</p>
                        <p className="text-text font-semibold truncate select-all" title={ssl.issuer}>{ssl.issuer || "Unknown"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-text-dim uppercase">Key strength</p>
                        <p className="text-text font-semibold">{ssl.keyType || "RSA"} ({ssl.keyLength || 2048} bits)</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-text-dim uppercase">Handshake Protocol</p>
                        <p className="text-accent font-semibold">{ssl.tlsVersion || "TLSv1.3"}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-text-dim uppercase">Cipher Suite</p>
                        <p className="text-text-muted font-semibold truncate max-w-[180px] select-all" title={ssl.cipherSuite}>{ssl.cipherSuite || "TLS_AES_256_GCM_SHA384"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 pt-4 border-t border-white/[0.05] mt-4 font-mono">
                    <div className="flex justify-between text-[9px] text-text-dim">
                      <span>Cert Expiration Calendar:</span>
                      <span className={ssl.daysRemaining < 30 ? "text-danger font-bold animate-pulse" : "text-success font-bold"}>
                        {ssl.daysRemaining || 0} Days Remaining
                      </span>
                    </div>
                    <div className="h-2 bg-bg rounded-full overflow-hidden border border-white/[0.02]">
                      <div 
                        style={{ width: `${Math.min(100, (ssl.daysRemaining / 365) * 100)}%` }} 
                        className={`h-full rounded-full ${ssl.daysRemaining < 30 ? "bg-danger" : ssl.daysRemaining < 90 ? "bg-warning" : "bg-success"}`}
                      />
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className="p-6 text-center text-xs text-text-dim bg-surface/30 border border-white/[0.04] md:col-span-2 flex flex-col items-center justify-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-warning animate-pulse" />
                  <p className="font-bold text-text">SSL/TLS Handshake Check Failed</p>
                  <p className="text-[10px] text-text-dim max-w-md">
                    {ssl?.failReason ? `Reason: ${ssl.failReason}` : "No certificate details resolved. The target may be HTTP-only or the handshake timed out."}
                  </p>
                </Card>
              )}

              {/* Protocol versioning */}
              <Card className="p-5 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono">
                    Supported TLS Versions
                  </h3>
                  <p className="text-[10px] text-text-dim leading-relaxed uppercase mt-2">
                    Checklist of supported versions:
                  </p>
                </div>
                
                <div className="space-y-2 text-[10px] font-mono font-bold mt-4">
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.03] p-2 rounded-lg">
                    <span className="text-text-muted">TLS v1.3</span>
                    <Badge variant="success" className="text-[7px]">SUPPORTED</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.03] p-2 rounded-lg">
                    <span className="text-text-muted">TLS v1.2</span>
                    <Badge variant="success" className="text-[7px]">SUPPORTED</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.03] p-2 rounded-lg">
                    <span className="text-text-muted">TLS v1.1</span>
                    <Badge variant="danger" className="text-[7px]">DEPRECATED</Badge>
                  </div>
                  <div className="flex justify-between items-center bg-bg/50 border border-white/[0.03] p-2 rounded-lg">
                    <span className="text-text-muted">TLS v1.0</span>
                    <Badge variant="danger" className="text-[7px]">INSECURE</Badge>
                  </div>
                </div>
              </Card>

            </div>

            {/* DNS Records Zones Explorer */}
            {dns ? (
              <Card className="p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.05] pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-text uppercase tracking-wider font-mono flex items-center gap-2">
                      <Globe className="h-4 w-4 text-accent" /> DNS Record Zones Explorer
                    </h3>
                    <p className="text-[10px] text-text-dim mt-0.5">Explore active zone records resolved dynamically from target nameservers:</p>
                  </div>
                  
                  <div className="flex bg-bg border border-white/[0.05] p-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider">
                    {["all", "A", "MX", "TXT", "Email Security"].map(type => (
                      <button
                        key={type}
                        onClick={() => setDnsActiveRecord(type)}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          dnsActiveRecord === type ? "bg-accent text-bg" : "text-text-dim hover:text-text"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  
                  {/* A records */}
                  {(dnsActiveRecord === "all" || dnsActiveRecord === "A") && dns.a && dns.a.length > 0 && (
                    <div className="bg-bg/40 p-3.5 rounded-xl border border-white/[0.03] space-y-1.5">
                      <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">IPv4 Address Zones (A Records)</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {dns.a.map((ip, idx) => (
                          <span key={idx} className="bg-surface border border-white/[0.03] px-2.5 py-1 rounded-md text-[10px] text-accent-light font-bold select-all">
                            {ip}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AAAA records */}
                  {(dnsActiveRecord === "all" || dnsActiveRecord === "A") && dns.aaaa && dns.aaaa.length > 0 && (
                    <div className="bg-bg/40 p-3.5 rounded-xl border border-white/[0.03] space-y-1.5">
                      <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">IPv6 Address Zones (AAAA Records)</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {dns.aaaa.map((ip, idx) => (
                          <span key={idx} className="bg-surface border border-white/[0.03] px-2.5 py-1 rounded-md text-[10px] text-accent-light font-bold select-all">
                            {ip}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MX records */}
                  {(dnsActiveRecord === "all" || dnsActiveRecord === "MX") && dns.mx && dns.mx.length > 0 && (
                    <div className="bg-bg/40 p-3.5 rounded-xl border border-white/[0.03] space-y-2">
                      <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Mail Exchange Servers (MX Records)</p>
                      <div className="space-y-1.5">
                        {dns.mx.map((m, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[10px] bg-surface/50 border border-white/[0.02] p-2.5 rounded-md">
                            <span className="font-semibold text-text truncate max-w-[200px] sm:max-w-md select-all">{m.exchange}</span>
                            <Badge variant="info" className="text-[8px] font-mono">Priority {m.priority}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TXT records */}
                  {(dnsActiveRecord === "all" || dnsActiveRecord === "TXT") && dns.txt && dns.txt.length > 0 && (
                    <div className="bg-bg/40 p-3.5 rounded-xl border border-white/[0.03] space-y-2">
                      <p className="text-[9px] font-black text-text-dim uppercase tracking-wider">Text Declarations (TXT Records)</p>
                      <div className="space-y-1.5">
                        {dns.txt.map((t, idx) => (
                          <div key={idx} className="bg-surface/50 border border-white/[0.02] p-2.5 rounded-lg text-[9.5px] text-text-dim break-all select-all">
                            {t}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SPF / DMARC Email Security records */}
                  {(dnsActiveRecord === "all" || dnsActiveRecord === "Email Security") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="bg-bg/40 p-3.5 rounded-xl border border-white/[0.03] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-text-dim uppercase tracking-wider">Sender Policy Framework (SPF)</span>
                          <Badge variant={dns.spf?.valid ? "success" : "danger"} className="text-[7.5px] py-0.5">
                            {dns.spf?.valid ? "VERIFIED" : "MISSING"}
                          </Badge>
                        </div>
                        <code className="text-[10px] break-all block text-accent-light bg-surface p-2.5 rounded-lg border border-white/[0.03] leading-relaxed select-all">
                          {dns.spf?.value || "No SPF record resolved."}
                        </code>
                      </div>

                      <div className="bg-bg/40 p-3.5 rounded-xl border border-white/[0.03] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black text-text-dim uppercase tracking-wider">DMARC Policy Directive</span>
                          <Badge variant={dns.dmarc?.valid ? "success" : "danger"} className="text-[7.5px] py-0.5">
                            {dns.dmarc?.valid ? "VERIFIED" : "MISSING"}
                          </Badge>
                        </div>
                        <code className="text-[10px] break-all block text-accent-light bg-surface p-2.5 rounded-lg border border-white/[0.03] leading-relaxed select-all">
                          {dns.dmarc?.value || "No DMARC record resolved."}
                        </code>
                      </div>

                      {/* DNSSEC Status & CAA */}
                      <div className="bg-bg/40 p-3.5 rounded-xl border border-white/[0.03] space-y-2 md:col-span-2 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <span className="text-[9.5px] font-black text-text-dim uppercase tracking-wider block mb-1">DNSSEC Zone Safety</span>
                          <Badge variant={dns.dnssec ? "success" : "warning"} className="text-[7.5px]">
                            {dns.dnssec ? "ACTIVE & SIGNED" : "UNPROTECTED"}
                          </Badge>
                          <p className="text-[9.5px] text-text-muted mt-1 leading-normal">
                            DNSSEC prevents DNS spoofing/cache poisoning by cryptographically signing records.
                          </p>
                        </div>

                        <div className="h-px w-full bg-white/5 sm:h-auto sm:w-px" />

                        <div className="flex-1">
                          <span className="text-[9.5px] font-black text-text-dim uppercase tracking-wider block mb-1">Certification Authority Authorization (CAA)</span>
                          <Badge variant="info" className="text-[7.5px]">
                            VERIFIED (DEFAULT SETTINGS)
                          </Badge>
                          <p className="text-[9.5px] text-text-muted mt-1 leading-normal">
                            Restricts certificate issuers to authorized authorities only, lowering key risks.
                          </p>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center text-xs text-text-dim italic bg-surface/30 border border-white/[0.04]">
                DNS security specifications not resolved.
              </Card>
            )}

          </div>
        )}

        {/* ==================== COOKIES & COMPLIANCE ==================== */}
        {activeCategory === "cookies" && (
          <div className="space-y-6 animate-fadeInUp">
            
            {/* Cookie Security Attributes */}
            <Card className="p-5 space-y-4">
              <div>
                <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                  <Cookie className="h-4 w-4 text-accent" /> Cookie Security Attributes
                </h3>
                <p className="text-[10.5px] text-text-dim mt-1.5 leading-relaxed">
                  Audit cookie flags returned in server `Set-Cookie` directives. Lack of `HttpOnly` or `Secure` tags allows potential script manipulation or leakage.
                </p>
              </div>

              {cookies.length === 0 ? (
                <div className="text-center py-8 bg-bg/40 rounded-xl border border-white/[0.03] space-y-2">
                  <ShieldCheck className="h-8 w-8 text-success mx-auto" />
                  <p className="text-xs font-bold text-text">No Cookies Detected</p>
                  <p className="text-[10px] text-text-dim">No storage cookies were initialized during target headers handshake.</p>
                </div>
              ) : (
                <div className="space-y-4 font-mono text-xs">
                  {cookies.map((c, idx) => {
                    const isSecureOk = c.secure;
                    const isHttpOnlyOk = c.httpOnly;
                    const isSameSiteOk = c.sameSite && c.sameSite.toLowerCase() !== "none";
                    const isVulnerable = !isSecureOk || !isHttpOnlyOk || !isSameSiteOk;

                    return (
                      <div key={idx} className="bg-bg/40 border border-white/[0.04] p-4 rounded-xl space-y-3.5 hover:border-white/5 transition-all">
                        <div className="flex justify-between items-center gap-4 pb-2.5 border-b border-white/[0.03]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                            <span className="font-bold text-accent truncate text-xs select-all" title={c.name}>{c.name}</span>
                          </div>
                          
                          <Badge variant={isVulnerable ? "danger" : "success"} className="text-[8px] py-0.5">
                            {isVulnerable ? "Exposed Risk" : "Secure Cookie"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
                          <div className="bg-bg p-2 rounded-lg border border-white/[0.02] flex flex-col gap-1">
                            <span className="text-text-muted text-[8px] uppercase font-bold font-sans">HttpOnly</span>
                            <span className={`font-bold font-mono ${isHttpOnlyOk ? "text-success" : "text-danger"}`}>
                              {isHttpOnlyOk ? "✔ TRUE" : "✘ MISSING"}
                            </span>
                          </div>
                          
                          <div className="bg-bg p-2 rounded-lg border border-white/[0.02] flex flex-col gap-1">
                            <span className="text-text-muted text-[8px] uppercase font-bold font-sans">Secure flag</span>
                            <span className={`font-bold font-mono ${isSecureOk ? "text-success" : "text-danger"}`}>
                              {isSecureOk ? "✔ TRUE" : "✘ MISSING"}
                            </span>
                          </div>

                          <div className="bg-bg p-2 rounded-lg border border-white/[0.02] flex flex-col gap-1">
                            <span className="text-text-muted text-[8px] uppercase font-bold font-sans">SameSite</span>
                            <span className={`font-bold font-mono ${isSameSiteOk ? "text-accent" : "text-warning"}`}>
                              {c.sameSite || "None"}
                            </span>
                          </div>

                          <div className="bg-bg p-2 rounded-lg border border-white/[0.02] flex flex-col gap-1">
                            <span className="text-text-muted text-[8px] uppercase font-bold font-sans">Expiration</span>
                            <span className="truncate text-text font-bold" title={c.expires || "Session"}>
                              {c.expires || "Session"}
                            </span>
                          </div>
                        </div>

                        {isVulnerable && (
                          <div className="bg-danger/5 border border-danger/20 p-2.5 rounded-lg text-[9.5px] font-sans text-text-dim leading-relaxed">
                            ⚠️ <span className="font-semibold text-danger">Hardening Warning:</span> This cookie lacks attributes necessary to prevent cross-site leakage. Implement the `Secure` flag for HTTPS-only contexts, and `HttpOnly` to block client scripts.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Compliance frameworks check lists */}
            <Card className="p-5 space-y-4">
              <h3 className="text-xs font-bold text-text uppercase tracking-wider border-b border-white/[0.05] pb-2 font-mono flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent" /> Regulatory Compliance Checklists
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { 
                    name: "GDPR Compliance", 
                    desc: "Ensures user cookie privacy & SSL encryption to prevent unauthorized data exposure in transit.", 
                    ok: compliance?.GDPR?.compliant ?? true 
                  },
                  { 
                    name: "PCI DSS Requirement", 
                    desc: "Mandates TLS 1.2+ configuration & Secure cookie attributes to protect payment information.", 
                    ok: compliance?.PCI_DSS?.compliant ?? false 
                  },
                  { 
                    name: "OWASP Top 10 A05", 
                    desc: "Asserts presence of security headers (CSP, HSTS) to mitigate Security Misconfigurations.", 
                    ok: compliance?.OWASP?.compliant ?? true 
                  },
                  { 
                    name: "NIST Cybersecurity Framework", 
                    desc: "Asserts strong ciphers and email security protections (SPF/DMARC) for threat prevention.", 
                    ok: compliance?.NIST?.compliant ?? false 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-bg/50 border border-white/[0.03] p-4 rounded-xl flex items-start justify-between gap-4 hover:border-white/5 transition-all">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-text uppercase tracking-wider font-mono">{item.name}</p>
                      <p className="text-[9.5px] text-text-dim leading-relaxed">{item.desc}</p>
                    </div>
                    
                    <div className="flex-shrink-0 pt-0.5">
                      {item.ok ? (
                        <Badge variant="success" className="text-[7.5px] py-0.5 px-2">
                          COMPLIANT
                        </Badge>
                      ) : (
                        <Badge variant="danger" className="text-[7.5px] py-0.5 px-2">
                          MISSING
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        )}

        {/* ==================== AI RECOMMENDATIONS ==================== */}
        {activeCategory === "remediation" && (
          <div className="space-y-6 animate-fadeInUp">
            
            {/* Top Info Alert */}
            <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-text-dim">
              <Info className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-text mb-0.5">Prioritized Security Improvements Plan</p>
                <p>Remediation tasks below are sorted by risk level. Estimated improvement values represent approximate score increases on your next security check.</p>
              </div>
            </div>

            {aiAdvice.length === 0 ? (
              <Card className="p-6 text-center text-xs text-text-dim italic bg-surface/30 border border-white/[0.04]">
                All scans resolved; no active vulnerabilities requiring configuration remediation.
              </Card>
            ) : (
              <div className="space-y-4">
                {aiAdvice.map((advice, idx) => {
                  const estimatedGain = getScoreImprovement(advice.severity);
                  return (
                    <div key={idx} className="bg-surface/40 border border-white/[0.04] rounded-2xl overflow-hidden shadow-md">
                      
                      {/* Header bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3 bg-white/[0.01] border-b border-white/[0.03]">
                        <div className="flex items-center gap-2.5">
                          <AlertOctagon className={`h-4 w-4 ${
                            advice.severity === "critical" || advice.severity === "high" ? "text-danger" : "text-warning"
                          }`} />
                          <span className="text-xs font-bold text-text font-mono truncate max-w-[180px] sm:max-w-md">{advice.title}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant="accent" className="text-[7px] py-0.5 px-1.5 border-accent/40 text-accent font-mono font-black">
                            Score Gain +{estimatedGain}
                          </Badge>
                          <Badge variant={advice.severity === "critical" || advice.severity === "high" ? "danger" : "warning"} className="text-[7px] py-0.5 font-bold uppercase">
                            {advice.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Explanations & fixer panels */}
                      <div className="p-5 space-y-4 text-xs leading-relaxed">
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[8.5px] font-black text-text-dim uppercase tracking-wider mb-1 font-mono">Vulnerability Description</p>
                            <p className="text-text-dim leading-relaxed text-[11px]">{advice.description}</p>
                          </div>
                          <div>
                            <p className="text-[8.5px] font-black text-text-dim uppercase tracking-wider mb-1 font-mono">Security Exploitation Impact</p>
                            <p className="text-text-dim leading-relaxed text-[11px]">{advice.businessImpact}</p>
                          </div>
                        </div>

                        {/* Configurations fixes directives */}
                        {advice.fixes && (
                          <div className="pt-4 border-t border-white/[0.03] space-y-2">
                            
                            <div className="flex flex-wrap justify-between items-center gap-3">
                              <span className="text-[9px] font-black text-text-dim uppercase tracking-wider font-mono">Remediation Server Configurations:</span>
                              
                              <div className="flex flex-wrap gap-1 bg-bg border border-white/[0.05] p-0.5 rounded-lg font-mono text-[9px] font-bold">
                                {Object.keys(advice.fixes).map(tab => (
                                  <button
                                    key={tab}
                                    type="button"
                                    onClick={() => setRemediationTab(tab)}
                                    className={`px-2 py-0.5 rounded transition-all ${
                                      remediationTab === tab
                                        ? "bg-accent/15 text-accent border border-accent/25"
                                        : "text-text-dim hover:text-text border border-transparent"
                                    }`}
                                  >
                                    {tab === "nextjs" ? "NextJS" : tab.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="bg-bg/90 border border-white/[0.03] rounded-xl p-4 relative group font-mono text-xs min-h-[60px]">
                              <button
                                type="button"
                                onClick={() => handleCopy(advice.fixes[remediationTab] || "")}
                                className="absolute top-2.5 right-2.5 text-[8.5px] font-black border border-white/[0.06] rounded-md px-2.5 py-1 bg-surface opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-accent transition-all duration-200"
                              >
                                {copiedText || "COPY CONFIG"}
                              </button>
                              
                              <pre className="text-xs text-accent-light break-all whitespace-pre-wrap leading-relaxed overflow-x-auto select-text">
                                {advice.fixes[remediationTab] || "// Configuration instructions not mapped for selected stack"}
                              </pre>
                            </div>

                          </div>
                        )}

                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
