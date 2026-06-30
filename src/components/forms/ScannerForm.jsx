"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Shield, Mail, Clock, ChevronRight, Activity, Globe, Copy, Check, ChevronDown, Code, AlertTriangle, Cpu, Terminal, Compass } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import ScanResults from "@/components/ui/ScanResults";
import TerminalConsole from "@/components/ui/TerminalConsole";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Loading from "@/components/common/Loading";

function extractDomainSimple(inputUrl) {
  if (!inputUrl) return "";
  let host = inputUrl.trim().toLowerCase();
  if (!/^https?:\/\//i.test(host)) {
    host = "http://" + host;
  }
  try {
    const parsed = new URL(host);
    let hostname = parsed.hostname;
    if (hostname.startsWith("www.")) {
      hostname = hostname.substring(4);
    }
    return hostname;
  } catch (e) {
    return host;
  }
}

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
  const [verifications, setVerifications] = useState([]);

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
            const targetDomain = extractDomainSimple(cleanUrl);
            
            const [verifyRes, authRes] = await Promise.all([
              fetch("/api/verify").catch(() => null),
              fetch("/api/auth/me").catch(() => null)
            ]);

            let isVerified = false;
            if (verifyRes && verifyRes.ok) {
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                const list = verifyData.verifications || [];
                isVerified = list.some(
                  (v) => v.domain.toLowerCase() === targetDomain && v.verified
                );
              }
            }

            let loggedIn = false;
            if (authRes && authRes.ok) {
              const authData = await authRes.json();
              loggedIn = authData.loggedIn;
            }

            let endpoint = loggedIn ? "/api/scan" : "/api/scan/public";

            let res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: cleanUrl }),
            });
            let data = await res.json();

            if (!res.ok && endpoint === "/api/scan") {
              endpoint = "/api/scan/public";
              res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: cleanUrl }),
              });
              data = await res.json();
            }

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
    if (!result) {
      fetchHistory();
    }
  }, [result]);

  // Fetch verifications
  useEffect(() => {
    async function fetchVerifications() {
      try {
        const res = await fetch("/api/verify");
        const data = await res.json();
        if (data.success) {
          setVerifications(data.verifications || []);
        }
      } catch (err) {
        console.log("Failed to fetch verifications in scanner form:", err);
      }
    }
    fetchVerifications();
  }, [result, showVerification]);

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
      const targetDomain = extractDomainSimple(cleanUrl);
      const isVerified = verifications.some(
        (v) => v.domain.toLowerCase() === targetDomain && v.verified
      );

      let endpoint = currentUser ? "/api/scan" : "/api/scan/public";

      let res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl }),
      });

      let data = await res.json();

      if (!res.ok && endpoint === "/api/scan") {
        endpoint = "/api/scan/public";
        res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: cleanUrl }),
        });
        data = await res.json();
      }

      if (!res.ok) {
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

  const pendingVerifications = verifications.filter(v => !v.verified);

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* Alert Banner for pending domain verifications */}
      {!result && !showVerification && pendingVerifications.length > 0 && (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4.5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn shadow-lg shadow-amber-950/10 backdrop-blur-md">
          <div className="flex items-center gap-3.5 text-left">
            <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-light">Action Required: Verify Domain Ownership</p>
              <p className="text-[10px] text-text-dim mt-0.5 max-w-xl">
                You have {pendingVerifications.length} domain(s) waiting for verification file upload. Verify ownership to scan administrative assets and subdomains.
              </p>
            </div>
          </div>
          <Link href="/dashboard" passHref>
            <Button variant="secondary" size="sm" className="text-[10px] tracking-wider shrink-0 bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20">
              Complete Verification
            </Button>
          </Link>
        </div>
      )}

      {/* Domain Verification Screen */}
      {showVerification && (
        <div className="max-w-xl mx-auto w-full py-6 animate-fadeIn">
          <Card className="p-6 sm:p-8 border border-white/[0.06] bg-surface/80 backdrop-blur-xl shadow-2xl rounded-3xl space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-accent/10 to-transparent opacity-40 pointer-events-none rounded-full blur-2xl" />
            <div className="space-y-3 text-center pb-5 border-b border-white/[0.04]">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent animate-pulse">
                <Shield className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-wider font-mono text-text">Verify Domain Ownership</h2>
              <p className="text-xs text-text-dim max-w-md mx-auto">
                Host a verification token file on <span className="text-accent font-bold font-mono select-all">{verificationDomain}</span> to confirm ownership before executing advanced audits.
              </p>
            </div>

            <div className="space-y-4 text-left">
              <h3 className="text-[10px] font-black uppercase text-accent tracking-widest font-mono">Verification Checklist</h3>
              
              <div className="space-y-3 font-mono text-[11px] leading-relaxed text-text-dim">
                <div className="flex gap-3 bg-white/[0.02] border border-white/[0.03] p-3.5 rounded-2xl">
                  <div className="h-5 w-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-accent-light">1</div>
                  <div>
                    <p className="font-bold text-text font-sans">Create Text File</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Create a file named exactly:</p>
                    <code className="text-accent-light text-[10px] block mt-1 bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/[0.03] select-all">headerguard-verification.txt</code>
                  </div>
                </div>

                <div className="flex gap-3 bg-white/[0.02] border border-white/[0.03] p-3.5 rounded-2xl">
                  <div className="h-5 w-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-accent-light">2</div>
                  <div className="w-full min-w-0">
                    <p className="font-bold text-text font-sans">Insert Token</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Copy and paste this token string into the file:</p>
                    <div className="flex items-center justify-between gap-3 mt-1.5 bg-black/40 px-3 py-2 rounded-lg border border-white/[0.03] w-full">
                      <code className="text-accent-light text-[9.5px] select-all break-all pr-2 font-bold">{verificationToken}</code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(verificationToken);
                          toast.success("Token copied to clipboard!");
                        }}
                        className="text-[9px] font-extrabold text-accent hover:text-accent-light uppercase tracking-wider shrink-0 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 bg-white/[0.02] border border-white/[0.03] p-3.5 rounded-2xl">
                  <div className="h-5 w-5 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 text-accent-light">3</div>
                  <div className="min-w-0 w-full">
                    <p className="font-bold text-text font-sans">Host the File publicly</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Upload the file to your web server root at:</p>
                    <a
                      href={verificationFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent-light text-[10px] font-semibold break-all block mt-1.5 underline"
                    >
                      {verificationFileUrl}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3.5 pt-4 border-t border-white/[0.04]">
              <Button
                type="button"
                onClick={() => {
                  setShowVerification(false);
                  setVerificationDomain("");
                  setVerificationToken("");
                }}
                variant="outline"
                className="flex-1 font-extrabold text-[10px] tracking-wider py-3"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmVerification}
                disabled={confirmingVerification}
                variant="primary"
                className="flex-1 font-extrabold text-[10px] tracking-wider py-3"
              >
                {confirmingVerification ? "Validating File..." : "Verify Ownership"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* 1. IDLE/EMPTY STATE */}
      {!result && !loading && !showVerification && (
        <div className="space-y-10 animate-fadeIn text-center">
          
          {/* Header & Subtitle */}
          <div className="max-w-2xl mx-auto space-y-4 mt-6">
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-accent/8 border border-accent/15 text-accent text-[9.5px] font-black uppercase tracking-wider shadow-inner select-none">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Security Scanner Engine Online
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none uppercase text-text bg-gradient-to-r from-text via-text to-text-dim bg-clip-text">
              Website Attack Surface <span className="text-accent">Audit</span>
            </h1>
            
            <p className="text-text-dim text-[11.5px] leading-relaxed uppercase tracking-wider max-w-xl mx-auto">
              Scan HTTP response headers, assess DNS zones, review SSL configurations, and audit external exposure points in real-time.
            </p>
          </div>

          {/* Audit input box */}
          <form onSubmit={handleScan} className="max-w-3xl mx-auto w-full relative">
            <div className="relative flex flex-col sm:flex-row gap-3 p-2 bg-surface/65 border border-white/[0.05] rounded-2xl sm:rounded-2xl backdrop-blur-xl shadow-2xl shadow-black/80 focus-within:border-accent/40 focus-within:shadow-[0_0_40px_rgba(99,102,241,0.15)] transition-all duration-300">
              <div className="flex flex-1 items-center min-w-0">
                <div className="pl-3.5 text-accent/70 shrink-0 select-none">
                  <Globe className="h-5 w-5 text-accent" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter target host domain or URL (e.g. cloudflare.com)"
                  className="w-full bg-transparent px-3 py-3 text-text placeholder:text-text-muted/50 font-mono text-xs sm:text-sm focus:outline-none"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label="Target domain or URL to scan"
                />
              </div>
              
              <Button
                type="submit"
                disabled={!url.trim()}
                variant="primary"
                className="py-3 px-8 rounded-xl bg-accent text-bg hover:bg-accent-light font-extrabold text-[10px] tracking-wider shrink-0 flex items-center justify-center gap-2 hover:shadow-glow shadow-md shadow-accent/20"
                icon={Shield}
              >
                Scan Target
              </Button>
            </div>

            {/* Quick suggested domains */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4.5 text-[9.5px] uppercase font-black text-text-dim select-none font-mono">
              <span className="text-text-muted">Fast Scan suggestions:</span>
              {["github.com", "cloudflare.com", "google.com"].map((domain) => (
                <button
                  key={domain}
                  type="button"
                  onClick={() => setUrl(domain)}
                  className="px-2.5 py-1 bg-surface/30 hover:bg-accent/8 border border-white/[0.04] hover:border-accent/20 rounded-lg text-text-dim hover:text-accent transition-all duration-200"
                >
                  {domain}
                </button>
              ))}
            </div>
          </form>

          {/* Grid Layout: Console and Recent Runs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch text-left">
            
            {/* Terminal simulation */}
            <div className="lg:col-span-5 flex flex-col">
              <TerminalConsole />
            </div>

            {/* Recent Scans Table */}
            <div className="lg:col-span-7 flex flex-col">
              <Card className="p-5 sm:p-6 bg-surface/30 border border-white/[0.04] backdrop-blur-md shadow-xl flex flex-col justify-between flex-grow rounded-2xl min-h-[305px]">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-text font-mono flex items-center gap-2 border-b border-white/[0.05] pb-3 mb-3">
                    <Clock className="h-4 w-4 text-accent" /> Recent Scan Reports
                  </h3>
                  
                  {history.length === 0 ? (
                    <div className="text-center py-14 text-text-dim text-[11px] italic font-mono uppercase tracking-wider">
                      No previous security logs recorded.
                    </div>
                  ) : (
                    <div className="divide-y divide-white/[0.02] font-mono text-xs">
                      {history.map((scan) => {
                        let gradeGlow = "text-success border-success/20 bg-success/5";
                        if (scan.grade.startsWith("F")) gradeGlow = "text-danger border-danger/20 bg-danger/5";
                        else if (scan.grade.startsWith("C") || scan.grade.startsWith("D")) gradeGlow = "text-warning border-warning/20 bg-warning/5";

                        return (
                          <div
                            key={scan._id}
                            onClick={() => handleLoadScan(scan._id)}
                            className="py-3 flex items-center justify-between gap-4 hover:bg-white/[0.02] px-2 rounded-xl cursor-pointer transition-all group"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <Globe className="h-3.5 w-3.5 text-accent-light/80 shrink-0" />
                              <span className="font-bold text-text truncate max-w-[150px] sm:max-w-xs">{scan.domain}</span>
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0">
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

                <div className="pt-3.5 border-t border-white/[0.04] mt-4 flex justify-between items-center text-[9.5px] font-sans text-text-dim font-mono uppercase">
                  <span>Engine: <span className="text-success font-black">ACTIVE</span></span>
                  <Link href="/history" className="hover:text-accent font-black tracking-wider flex items-center gap-0.5">
                    History Library <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            </div>

          </div>

          <div className="border-t border-white/[0.04] my-10" />

          {/* EASM Info panels */}
          <div className="space-y-6 text-left">
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-text-muted font-mono flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent animate-pulse" /> Security Threat Mitigation Coverage
              </h2>
              <p className="text-[10px] text-text-dim uppercase tracking-wider mt-0.5 font-mono font-bold">
                Standards compliance &amp; automated vulnerability profiling coverage
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Cover vectors list */}
              <div className="lg:col-span-5 flex">
                <Card className="p-5 sm:p-6 bg-surface/30 border border-white/[0.04] backdrop-blur-md shadow-xl flex flex-col justify-between flex-grow rounded-2xl">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-accent font-mono mb-4 flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
                      <Compass className="h-4 w-4" /> Audited Security Domains
                    </h3>
                    <div className="space-y-4">
                      {[
                        { title: "CSP / Clickjacking Defenses", desc: "Checks header security directives & frame protection." },
                        { title: "MitM Transport Encryption", desc: "Forces secure SSL/TLS tunnel redirects & HSTS preload checks." },
                        { title: "SSL Certificate Ciphers", desc: "Inspects cert validity schedules and cipher suite compatibility." },
                        { title: "DNS SPF/DKIM/DMARC", desc: "Validates anti-spoofing and mail server relay authorizations." },
                        { title: "Attack Surface Exposure", desc: "Identifies exposed environment variables and sensitive paths." }
                      ].map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                          <div className="h-5 w-5 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0 mt-0.5">
                            <span className="text-[9px] font-black">✓</span>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-text font-mono tracking-tight leading-tight uppercase">{item.title}</p>
                            <p className="text-[10px] text-text-dim leading-normal mt-0.5 font-sans">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* API and FAQ Column */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                
                {/* Developer API panel */}
                <Card className="p-5 sm:p-6 bg-surface/30 border border-white/[0.04] backdrop-blur-md shadow-xl rounded-2xl">
                  <div className="flex items-center justify-between gap-4 mb-4 pb-2.5 border-b border-white/[0.04]">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-accent font-mono flex items-center gap-2">
                      <Code className="h-4 w-4" /> REST API Console
                    </h3>
                    
                    <div className="flex bg-black/40 rounded-lg p-0.5 border border-white/[0.04] text-[9.5px] font-mono">
                      {["curl", "node", "python"].map((tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setApiTab(tab)}
                          className={`px-3 py-1 rounded-md transition-colors uppercase font-bold tracking-wider ${
                            apiTab === tab
                              ? "bg-accent text-bg"
                              : "text-text-dim hover:text-text"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative rounded-xl bg-black/50 border border-white/[0.05] p-4 font-mono text-[10px] leading-relaxed text-accent-light overflow-x-auto min-h-[92px]">
                    <pre className="whitespace-pre">{apiSnippets[apiTab]}</pre>
                    
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.08] hover:border-white/[0.1] text-text-dim hover:text-text transition-all"
                      title="Copy Code"
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </Card>

                {/* FAQ section */}
                <Card className="p-5 sm:p-6 bg-surface/30 border border-white/[0.04] backdrop-blur-md shadow-xl rounded-2xl">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-accent font-mono mb-4 pb-2.5 border-b border-white/[0.04]">
                    EASM Frequently Asked Questions
                  </h3>

                  <div className="space-y-2">
                    {[
                      {
                        q: "What is External Attack Surface Management?",
                        a: "EASM is the continuous mapping, profiling, and discovery of public digital footprint assets (IP addresses, subdomains, SSL certificates, exposed APIs) to evaluate potential vulnerability risk exposures."
                      },
                      {
                        q: "Why check security headers?",
                        a: "HTTP security headers instruct consumer browsers to enforce strict client-side sandboxing, preventing framing hijack, cross-origin scripting injection, and credential leak risks."
                      },
                      {
                        q: "How does the ownership validation model operate?",
                        a: "By uploading a static text file containing a generated authentication token under the domain's web root, owners authorize our scanner to perform comprehensive ports mapping and directory discovery."
                      }
                    ].map((faq, idx) => {
                      const isOpen = activeFaq === idx;
                      return (
                        <div
                          key={idx}
                          className="border border-white/[0.03] rounded-xl bg-black/10 overflow-hidden transition-all duration-200"
                        >
                          <button
                            type="button"
                            onClick={() => setActiveFaq(isOpen ? null : idx)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
                          >
                            <span className="text-[10px] font-black text-text uppercase tracking-tight font-mono">
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
                              isOpen ? "max-h-28 opacity-100 border-t border-white/[0.02]" : "max-h-0 opacity-0"
                            }`}
                          >
                            <div className="p-4 text-[10.5px] text-text-dim leading-relaxed font-sans">
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

      {/* 2. LOADING STATE */}
      {loading && (
        <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto w-full py-10">
          
          {/* Header Compact bar */}
          <div className="flex rounded-2xl overflow-hidden border border-white/[0.05] bg-surface/30 backdrop-blur-md opacity-60 pointer-events-none items-center shadow-lg">
            <div className="flex flex-1 items-center px-4.5 py-4 min-w-0">
              <Search className="h-4.5 w-4.5 text-accent mr-3 shrink-0" />
              <span className="font-mono text-xs text-text truncate pr-2">{url || "Auditing target host..."}</span>
            </div>
            <div className="bg-accent px-6 py-4 text-bg font-extrabold text-[10px] tracking-wider uppercase shrink-0">
              ANALYZING...
            </div>
          </div>

          <Card className="flex flex-col items-center gap-6 p-12 border border-white/[0.06] shadow-2xl relative overflow-hidden bg-surface/40 backdrop-blur-xl rounded-3xl min-h-[350px] justify-center">
            {/* Animated glowing scanning bar */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-accent/25 pointer-events-none overflow-hidden">
              <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-accent to-transparent scan-line" />
            </div>
            
            <div className="space-y-8 w-full flex flex-col items-center">
              <Loading message="EASM AUDIT IN PROGRESS" />
              
              {/* Dynamic steps simulation */}
              <div className="w-full max-w-xs space-y-2.5 font-mono text-[9px] uppercase tracking-wider text-text-dim">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-accent" /> DNS Zone Lookup</span>
                  <span className="text-success font-bold">Checking...</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-accent" /> Headers Analysis</span>
                  <span className="text-text-muted">Pending</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/[0.02]">
                  <span className="flex items-center gap-2"><Cpu className="h-3.5 w-3.5 text-accent" /> SSL Cipher Evaluation</span>
                  <span className="text-text-muted">Pending</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2"><Terminal className="h-3.5 w-3.5 text-accent" /> Ports Mapping Check</span>
                  <span className="text-text-muted">Pending</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 3. RESULT ACTIVE STATE */}
      {result && !loading && (
        <div className="space-y-6 animate-fadeInUp w-full text-left">
          
          {/* Top Compact Input Bar */}
          <form onSubmit={handleScan} className="w-full relative">
            <div className="flex flex-col sm:flex-row rounded-2xl overflow-hidden border border-white/[0.06] bg-surface/50 backdrop-blur-xl focus-within:border-accent/40 focus-within:shadow-[0_0_25px_rgba(99,102,241,0.12)] transition-all duration-300">
              <div className="flex flex-grow items-center min-w-0">
                <div className="pl-4 text-accent/80 flex items-center shrink-0">
                  <Search className="h-4.5 w-4.5" />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Scan another domain endpoint (e.g. github.com)"
                  className="w-full bg-transparent px-3.5 py-3 text-text placeholder:text-text-dim/50 font-mono text-xs sm:text-sm focus:outline-none"
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
                className="rounded-none py-3.5 px-8 border-0 bg-accent text-bg hover:bg-accent-light font-extrabold text-[10px] tracking-wider transition-all duration-300 shrink-0"
                icon={Shield}
              >
                Scan Target
              </Button>
            </div>
          </form>

          {/* Session Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 border border-white/[0.04] bg-surface/40 backdrop-blur-md rounded-2xl shadow-lg">
            <div className="space-y-0.5 text-left">
              <h2 className="text-xs font-black text-text font-mono uppercase tracking-wider flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> {result.isPublicScan ? "Temporary Public Session" : "Logged Scan Snapshot"}
              </h2>
              <p className="text-[10px] text-text-dim">
                {result.isPublicScan 
                  ? "Scan resolved as a guest user. Data is not preserved in history databases."
                  : "Postures successfully indexed and saved to historical records database."}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setResult(null);
                  setUrl("");
                }}
                variant="outline"
                size="sm"
                className="text-[10px] py-2 px-3.5 tracking-wider font-extrabold"
              >
                Clear Results
              </Button>
              
              {currentUser ? (
                <Button
                  onClick={handleSendEmail}
                  disabled={emailLoading}
                  variant="secondary"
                  size="sm"
                  icon={Mail}
                  title={`Email report to ${currentUser.email}`}
                  className="text-[10px] py-2 px-3.5 tracking-wider font-extrabold"
                >
                  {emailLoading ? "Sending..." : "Email PDF"}
                </Button>
              ) : (
                <Link href="/login" passHref>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Mail}
                    title="Log in to share this report via email"
                    className="text-[10px] py-2 px-3.5 tracking-wider font-extrabold"
                  >
                    Login to Email
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Public Scan Prompt ownership verification banner */}
          {result.isPublicScan && (
            <div className="border border-accent/25 bg-accent/5 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn backdrop-blur-sm shadow-md">
              <div className="flex items-start sm:items-center gap-3 text-left">
                <div className="h-10 w-10 bg-accent/15 border border-accent/25 rounded-xl flex items-center justify-center text-accent shrink-0 animate-pulse">
                  <Shield className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-text-light">Unlock Premium Attack Surface Monitoring</p>
                  <p className="text-[10px] text-text-dim mt-0.5 font-sans leading-relaxed max-w-xl">
                    {currentUser 
                      ? "Verify ownership of this domain to unlock administrative scans: port scanning, subdomain monitoring, technology footprint discovery, and config leak audits."
                      : "Create a free profile and verify your domain assets to unlock continuous EASM monitoring, ports tracking, and detailed cookie compliance reports."
                    }
                  </p>
                </div>
              </div>
              <div>
                {currentUser ? (
                  <Button
                    type="button"
                    onClick={async () => {
                      const domainName = extractDomainSimple(result.url || url);
                      setVerificationDomain(domainName);
                      await initiateVerification(domainName);
                    }}
                    variant="primary"
                    size="sm"
                    className="text-[9.5px] shrink-0 font-extrabold tracking-wider bg-accent text-bg hover:bg-accent-light"
                  >
                    Verify Ownership
                  </Button>
                ) : (
                  <Link href="/register" passHref>
                    <Button variant="primary" size="sm" className="text-[9.5px] shrink-0 font-extrabold tracking-wider bg-accent text-bg hover:bg-accent-light">
                      Register Profile
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Results dashboard visual content */}
          <ScanResults result={result} />
        </div>
      )}

    </div>
  );
}
