"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Shield, Mail, Clock, ChevronRight, Activity, Globe, Copy, Check, ChevronDown, Code } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import ScanResults from "@/components/ui/ScanResults";
import TerminalConsole from "@/components/ui/TerminalConsole";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function ScannerForm() {
  const toast = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Domain Verification States
  const [verificationDomain, setVerificationDomain] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [verificationFileUrl, setVerificationFileUrl] = useState("");
  const [showVerification, setShowVerification] = useState(false);
  const [confirmingVerification, setConfirmingVerification] = useState(false);

  // Email report states
  const [currentUser, setCurrentUser] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // EASM Dashboard visual states
  const [activeFaq, setActiveFaq] = useState(null);
  const [apiTab, setApiTab] = useState("curl");
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("https://headerguard.io");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const apiSnippets = {
    curl: `curl -X POST "${origin}/api/scan" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "example.com"}'`,
    node: `fetch("${origin}/api/scan", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "example.com" })
})
.then(res => res.json())
.then(data => console.log(data));`,
    python: `import requests

res = requests.post(
    "${origin}/api/scan",
    json={"url": "example.com"}
)
print(res.json())`
  };

  const handleCopyCode = () => {
    const code = apiSnippets[apiTab];
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fetch authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Auth me fetch error in scanner form:", err);
      }
    }
    checkAuth();
  }, []);

  // Read target URL from query parameters on mount and execute auto-scan if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlParam = searchParams.get("url");
      if (urlParam) {
        const cleanUrl = urlParam.trim();
        setUrl(cleanUrl);
        
        const executeAutoScan = async () => {
          setLoading(true);
          setResult(null);
          try {
            const res = await fetch("/api/scan", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: cleanUrl }),
            });
            const data = await res.json();
            if (res.ok) {
              setResult(data.data || data);
              toast.success("Security posture scan completed successfully!");
            } else {
              toast.error(data.error || "Scan failed.");
            }
          } catch {
            toast.error("Failed to run auto-scan due to network error.");
          } finally {
            setLoading(false);
          }
        };
        executeAutoScan();
      }
    }
  }, []);

  // Fetch recent scan history
  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/history?limit=5");
        const data = await res.json();
        if (data.success) {
          setHistory(data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch scan history:", err);
      }
    }
    // Only fetch history when results are idle
    if (!result) {
      fetchHistory();
    }
  }, [result]);

  const handleSendEmail = async (e) => {
    e.preventDefault();
    const scanId = result?._id || result?.scanId;
    if (!scanId) return;

    setEmailLoading(true);

    try {
      const res = await fetch(`/api/scan/${scanId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email report.");
      }

      toast.success("Security audit report successfully shared to inbox!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleScan = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setResult(null);
    setShowVerification(false);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === "UNVERIFIED_DOMAIN") {
          toast.warning("Domain ownership verification required.");
          setVerificationDomain(data.domain);
          await initiateVerification(data.domain);
          return;
        }
        toast.error(data.error || "Scan failed. Please verify the URL and try again.");
        return;
      }

      setResult(data.data || data);
      toast.success("Security posture scan completed successfully!");
    } catch {
      toast.error("Network connectivity error. Please verify your connection.");
    } finally {
      setLoading(false);
    }
  };

  const initiateVerification = async (targetDomain) => {
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "initiate", domain: targetDomain })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerificationToken(data.token);
        setVerificationFileUrl(data.fileLocation);
        setShowVerification(true);
      } else {
        toast.error(data.error || "Failed to initiate domain verification.");
      }
    } catch {
      toast.error("Failed to connect to verification API.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    setConfirmingVerification(true);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", domain: verificationDomain })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Domain verified successfully!");
        setShowVerification(false);
        // Automatically run scan on verified domain
        setLoading(true);
        const scanRes = await fetch("/api/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: verificationDomain }),
        });
        const scanData = await scanRes.json();
        if (scanRes.ok) {
          setResult(scanData.data || scanData);
          toast.success("Security posture scan completed successfully!");
        } else {
          toast.error(scanData.error || "Scan failed.");
        }
      } else {
        toast.error(data.error || "Verification failed. Ensure the file is accessible.");
      }
    } catch {
      toast.error("Network error during domain verification.");
    } finally {
      setConfirmingVerification(false);
      setLoading(false);
    }
  };

  const handleLoadScan = async (scanId) => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/scan/${scanId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      if (!data.success || !data.data) {
        throw new Error(data.error || "No scan data found");
      }
      setResult(data.data);
      toast.success("Scan history loaded successfully.");
    } catch (err) {
      toast.error(`Failed to retrieve scan: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* DOMAIN VERIFICATION CARD */}
      {showVerification && (
        <div className="max-w-xl mx-auto w-full py-10 animate-fadeIn">
          <Card className="p-6 border border-white/[0.08] bg-surface/30 backdrop-blur-md space-y-6">
            <div className="space-y-2 text-center pb-4 border-b border-white/[0.04]">
              <Shield className="h-10 w-10 text-accent mx-auto animate-pulse" />
              <h2 className="text-xl font-bold uppercase tracking-wide font-mono">Domain Verification Required</h2>
              <p className="text-xs text-text-dim">
                Prove ownership of <span className="text-text font-bold font-mono">{verificationDomain}</span> before running security audits.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase text-accent tracking-widest font-mono">Verification Instructions</h3>
              
              <div className="space-y-3 font-mono text-xs leading-relaxed text-text-dim">
                <div className="flex items-start gap-2 bg-bg/50 p-3 rounded-lg border border-white/[0.02]">
                  <span className="h-5 w-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-accent mt-0.5">1</span>
                  <div>
                    <p className="font-bold text-text font-sans">Create Verification File</p>
                    <p className="text-[10px] mt-0.5">Create a plain text file named:</p>
                    <code className="text-accent-light text-[10px] block mt-1 bg-black/40 px-2 py-1 rounded">headerguard-verification.txt</code>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-bg/50 p-3 rounded-lg border border-white/[0.02]">
                  <span className="h-5 w-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-accent mt-0.5">2</span>
                  <div className="w-full">
                    <p className="font-bold text-text font-sans">Add Token Content</p>
                    <p className="text-[10px] mt-0.5">Add the following token content exactly inside the file:</p>
                    <div className="flex items-center justify-between gap-3 mt-1.5 bg-black/40 px-2.5 py-1 rounded w-full">
                      <code className="text-accent-light text-[10px] select-all break-all">{verificationToken}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(verificationToken);
                          toast.success("Token copied to clipboard!");
                        }}
                        className="text-[8px] font-bold text-accent hover:text-accent-light uppercase shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 bg-bg/50 p-3 rounded-lg border border-white/[0.02]">
                  <span className="h-5 w-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-accent mt-0.5">3</span>
                  <div>
                    <p className="font-bold text-text font-sans">Host the File</p>
                    <p className="text-[10px] mt-0.5">Upload and host the file on your web server at the following exact URL path:</p>
                    <a
                      href={verificationFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:underline text-[9.5px] font-bold break-all block mt-1.5"
                    >
                      {verificationFileUrl}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/[0.04]">
              <Button
                type="button"
                onClick={() => {
                  setShowVerification(false);
                  setVerificationDomain("");
                  setVerificationToken("");
                }}
                variant="outline"
                className="flex-1 font-bold uppercase tracking-wider text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmVerification}
                disabled={confirmingVerification}
                variant="primary"
                className="flex-1 font-bold uppercase tracking-wider text-xs bg-accent text-bg hover:bg-accent-light"
              >
                {confirmingVerification ? "Confirming..." : "Confirm Verification"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 1. IDLE STATE: No Scan Result Active */}
      {!result && !loading && !showVerification && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Centered Hero Header */}
          <div className="text-center mb-10 space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-[9px] font-black uppercase tracking-widest border border-accent/20">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              EASM Scanning Engine Active
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase">
              Audit Website <span className="text-accent">Postures</span>
            </h1>
            
            <p className="text-text-dim text-[11px] leading-relaxed uppercase tracking-wider">
              Examine server headers, resolve SSL/TLS ciphers, query DNS security zones, and verify PCI/GDPR compliance in real-time.
            </p>
          </div>

          {/* Centered Large Audit input */}
          <form onSubmit={handleScan} className="max-w-3xl mx-auto w-full relative">
            <div className="flex flex-col sm:flex-row gap-0 rounded-xl overflow-hidden border border-white/[0.06] bg-surface/40 backdrop-blur-md focus-within:border-accent/50 focus-within:shadow-[0_0_25px_rgba(99,102,241,0.15)] transition-all duration-300">
              <div className="flex flex-1 items-center">
                <div className="pl-4 text-accent/70 flex items-center">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                  }}
                  placeholder="Enter target host domain or URL (e.g. cloudflare.com)"
                  className="w-full bg-transparent px-3.5 py-4 text-text placeholder:text-text-muted font-mono text-xs sm:text-sm focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Target domain or URL to scan"
                />
              </div>
              
              <Button
                type="submit"
                disabled={!url.trim()}
                variant="primary"
                className="rounded-none py-4 px-8 border-0 bg-accent text-bg hover:bg-accent-light hover:shadow-glow font-bold uppercase tracking-wider transition-all duration-300 flex-shrink-0"
                icon={Shield}
              >
                Audit Endpoint
              </Button>
            </div>
          </form>

          {/* Two Column details panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mt-6">
            
            {/* Left: Terminal console feed */}
            <div className="lg:col-span-5 w-full">
              <TerminalConsole />
            </div>

            {/* Right: Recent Audited Endpoints list table */}
            <div className="lg:col-span-7 w-full">
              <Card className="p-5 bg-surface/30 border border-white/[0.03] backdrop-blur-md shadow-xl w-full flex flex-col justify-between min-h-[305px]">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-text font-mono flex items-center gap-2 border-b border-white/[0.05] pb-2.5 mb-3.5">
                    <Clock className="h-4 w-4 text-accent" /> Recent Audited Endpoints
                  </h3>
                  
                  {history.length === 0 ? (
                    <div className="text-center py-10 text-text-dim text-[11px] italic">
                      No previous security scans found in records history.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.02] font-mono text-xs">
                      {history.map((scan) => {
                        let gradeGlow = "text-success border-success/30 bg-success/5";
                        if (scan.grade.startsWith("F")) gradeGlow = "text-danger border-danger/30 bg-danger/5";
                        else if (scan.grade.startsWith("C") || scan.grade.startsWith("D")) gradeGlow = "text-warning border-warning/30 bg-warning/5";

                        return (
                          <div
                            key={scan._id}
                            onClick={() => handleLoadScan(scan._id)}
                            className="py-2.5 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-lg cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <Globe className="h-3.5 w-3.5 text-accent-light flex-shrink-0" />
                              <span className="font-bold text-text truncate max-w-[150px] sm:max-w-xs">{scan.domain}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <span className={`text-[9px] font-bold border px-2 py-0.5 rounded font-sans uppercase tracking-wider ${gradeGlow}`}>
                                {scan.grade} ({scan.score})
                              </span>
                              <ChevronRight className="h-4 w-4 text-text-dim group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.04] mt-4 flex justify-between items-center text-[10px] font-sans text-text-dim">
                  <span>Target logs sync: <span className="text-success font-bold">ONLINE</span></span>
                  <Link href="/history" className="hover:text-accent font-bold uppercase tracking-wider flex items-center gap-1 text-[9px]">
                    View scan history <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            </div>

          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.04] my-10" />

          {/* Minimal EASM Intelligence Center */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-text font-mono flex items-center gap-2">
                  <Activity className="h-4 w-4 text-accent" /> Security Intelligence Hub
                </h2>
                <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5">
                  Developer pipelines &amp; threat mitigation checklists
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 cols): Audited Threat Coverage */}
              <div className="lg:col-span-5 w-full">
                <Card className="p-5 bg-surface/30 border border-white/[0.03] backdrop-blur-md shadow-xl flex flex-col justify-between h-full">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-accent font-mono mb-4 flex items-center gap-2 pb-2 border-b border-white/[0.04]">
                      Audited Threat Vectors
                    </h3>
                    <div className="space-y-3.5">
                      {[
                        { title: "CSP / XSS Defenses", desc: "Validates frame security & script source integrity" },
                        { title: "HSTS MitM Prevention", desc: "Forces secure HTTPS transport & preloading status" },
                        { title: "SSL/TLS Cipher Suite", desc: "Checks TLS protocol versioning and key exchange strength" },
                        { title: "DNS Zone Config", desc: "Inspects SPF, DKIM, and DMARC record deployment" },
                        { title: "Server Exposure", desc: "Identifies leaked software versions or configuration leaks" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className="h-4.5 w-4.5 rounded-full bg-success/10 border border-success/30 flex items-center justify-center text-success flex-shrink-0 mt-0.5">
                            <span className="text-[8px] font-bold">✓</span>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-text font-mono tracking-tight leading-tight">{item.title}</p>
                            <p className="text-[9.5px] text-text-dim leading-normal mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Middle Column (7 cols): Developer API Center & Compact FAQ Side-by-Side */}
              <div className="lg:col-span-7 w-full flex flex-col gap-6">
                
                {/* Developer API Console */}
                <Card className="p-5 bg-surface/30 border border-white/[0.03] backdrop-blur-md shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-4 pb-2 border-b border-white/[0.04]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-accent font-mono flex items-center gap-2">
                        <Code className="h-4 w-4" /> API Integration
                      </h3>
                      
                      <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/[0.04] text-[9.5px] font-mono">
                        {["curl", "node", "python"].map((tab) => (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setApiTab(tab)}
                            className={`px-2.5 py-1 rounded transition-colors uppercase font-bold tracking-wider ${
                              apiTab === tab
                                ? "bg-accent text-bg"
                                : "text-text-dim hover:text-text"
                            }`}
                          >
                            {tab === "node" ? "node" : tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative rounded-lg bg-black/50 border border-white/[0.05] p-3.5 font-mono text-[10px] leading-relaxed text-accent-light overflow-x-auto min-h-[92px]">
                      <pre className="whitespace-pre">{apiSnippets[apiTab]}</pre>
                      
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] text-text-dim hover:text-text transition-all"
                        title="Copy Integration Code"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5 text-success" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </Card>

                {/* FAQ Accordion Section */}
                <Card className="p-5 bg-surface/30 border border-white/[0.03] backdrop-blur-md shadow-xl">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-accent font-mono mb-4 pb-2 border-b border-white/[0.04]">
                    Frequently Answered Questions
                  </h3>

                  <div className="space-y-2">
                    {[
                      {
                        q: "What is External Attack Surface Management (EASM)?",
                        a: "EASM refers to the continuous discovery, analysis, monitoring, and remediation of any public-facing enterprise digital assets that contain potential vulnerabilities."
                      },
                      {
                        q: "Why are HTTP Security Headers essential?",
                        a: "HTTP headers allow site owners to instruct the client browser on how to restrict document loading, frame interactions, and cryptography rules, neutralizing standard client-side attack vectors."
                      },
                      {
                        q: "How is the Security Grade calculated?",
                        a: "Our scanner computes scores (0-100) dynamically by checking against industry-accepted header implementations, DNS configs, and TLS handshake metrics, deducting points for severity levels."
                      }
                    ].map((faq, idx) => {
                      const isOpen = activeFaq === idx;
                      return (
                        <div
                          key={idx}
                          className="border border-white/[0.03] rounded-lg bg-black/10 overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={() => setActiveFaq(isOpen ? null : idx)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                          >
                            <span className="text-[10.5px] font-bold text-text uppercase tracking-tight font-mono">
                              {faq.q}
                            </span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 text-text-dim transition-transform duration-300 ${
                                isOpen ? "rotate-180 text-accent" : ""
                              }`}
                            />
                          </button>
                          
                          <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${
                              isOpen ? "max-h-24 opacity-100 border-t border-white/[0.02]" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="p-4 text-[10px] text-text-dim leading-relaxed">
                              {faq.a}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

              </div>
            </div>
          </div>

        </div>
      )}

      {/* 2. SCANNING/LOADING STATE */}
      {loading && (
        <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto w-full py-10">
          
          {/* Scanner Header Compact Form */}
          <div className="flex gap-0 rounded-xl overflow-hidden border border-white/[0.04] bg-surface/20 opacity-50 pointer-events-none">
            <div className="flex flex-1 items-center px-4.5 py-4">
              <Search className="h-4.5 w-4.5 text-text-dim mr-3.5" />
              <span className="font-mono text-xs sm:text-sm text-text">{url || "Auditing host endpoint..."}</span>
            </div>
            <div className="bg-accent px-8 py-4 text-bg font-bold text-xs uppercase tracking-wider">
              Auditing...
            </div>
          </div>

          <Card className="flex flex-col items-center gap-6 p-10 border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.37)] relative overflow-hidden bg-surface/30 backdrop-blur-md rounded-2xl">
            {/* Moving scanline */}
            <div className="absolute top-0 left-0 w-full h-[2.5px] bg-accent/15 pointer-events-none">
              <div className="h-full w-1/3 bg-accent/80 scan-line" />
            </div>
            
            <div className="relative w-16 h-16 mt-2 flex items-center justify-center">
              {/* Pulsing radar lines */}
              <div className="absolute inset-0 rounded-full border border-accent/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-white/[0.02] border-t-accent animate-spin" />
              <div className="absolute inset-4 rounded-full border border-white/[0.02] border-b-accent animate-[spin_1.5s_linear_infinite_reverse]" />
              <Shield className="absolute text-accent h-5 w-5 animate-pulse" />
            </div>
            
            <div className="text-center space-y-1.5 font-sans">
              <p className="text-text font-black text-xs uppercase tracking-widest font-mono">EASM AUDIT PIPELINE ACTIVE</p>
              <p className="text-text-dim text-[9.5px] uppercase tracking-wider font-bold">Querying SSL, DNS records, cookie signatures, and port exposure...</p>
            </div>
          </Card>
        </div>
      )}

      {/* 3. RESULT ACTIVE STATE: Show Compact Input Form + Full-Width Results Dashboard */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeInUp w-full">
          
          {/* Compact Input Form for target changes */}
          <form onSubmit={handleScan} className="w-full relative">
            <div className="flex flex-col sm:flex-row gap-0 rounded-xl overflow-hidden border border-white/[0.06] bg-surface/40 backdrop-blur-md focus-within:border-accent/50 focus-within:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300">
              <div className="flex flex-grow items-center">
                <div className="pl-4 text-accent/70 flex items-center">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                  }}
                  placeholder="Scan another domain endpoint (e.g. github.com)"
                  className="w-full bg-transparent px-3.5 py-3 text-text placeholder:text-text-muted font-mono text-xs sm:text-sm focus:outline-none"
                  disabled={loading}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Target domain or URL to scan"
                />
              </div>
              
              <Button
                type="submit"
                disabled={loading || !url.trim()}
                variant="primary"
                className="rounded-none py-3 px-8 border-0 bg-accent text-bg hover:bg-accent-light hover:shadow-glow font-bold uppercase tracking-wider transition-all duration-300 flex-shrink-0"
                icon={Shield}
              >
                Scan Target
              </Button>
            </div>
          </form>

          {/* Session actions bar */}
          <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 border border-white/[0.04] bg-surface/40 backdrop-blur-md rounded-xl">
            <div className="space-y-0.5">
              <h2 className="text-xs font-black text-text font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Audit Scan Resolved
              </h2>
              <p className="text-[10px] text-text-dim font-semibold">Security posture snapshots successfully saved to history database.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setResult(null);
                  setUrl("");
                }}
                variant="outline"
                size="sm"
              >
                Reset Scanner
              </Button>
              
              {currentUser ? (
                <Button
                  onClick={handleSendEmail}
                  disabled={emailLoading}
                  variant="secondary"
                  size="sm"
                  icon={Mail}
                  title={`Email report to ${currentUser.email}`}
                >
                  {emailLoading ? "Sending..." : "Email Report"}
                </Button>
              ) : (
                <Link href="/login" passHref>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Mail}
                    title="Log in to email this report"
                  >
                    Log in to Email
                  </Button>
                </Link>
              )}
            </div>
          </Card>

          {/* Full dynamic visualizer dashboard */}
          <ScanResults result={result} />
        </div>
      )}

    </div>
  );
}
