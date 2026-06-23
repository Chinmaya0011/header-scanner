"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  ArrowLeft, 
  Play, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Shield, 
  Lock, 
  Globe, 
  Mail, 
  Radar, 
  Terminal, 
  Layers, 
  Cpu, 
  Cookie, 
  Sliders, 
  Activity, 
  HardDrive,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  FileCode,
  AlertOctagon,
  EyeOff
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

// Steps Data
const STEPS = [
  {
    title: "1. Enter Your Domain",
    desc: "Input target domain address",
    detailedTitle: "Step 1: Specify Your Domain Address",
    explanation: "To begin, go to the Scanner page and enter your target URL or domain (e.g., example.com). The scanner supports inputs with or without http:// or https://. The input is cleaned and validated automatically before starting the scan.",
    visualType: "input-mockup"
  },
  {
    title: "2. Configure Options",
    desc: "Select scanner modules",
    detailedTitle: "Step 2: Customize Scan Configuration",
    explanation: "Select the specific analysis engines you want to execute. You can toggle all 10 key security assessments, each displaying its estimated execution duration. Enable all modules for a complete posture assessment.",
    visualType: "options-mockup"
  },
  {
    title: "3. Start Scan",
    desc: "Watch real-time analysis",
    detailedTitle: "Step 3: Monitor Live Audit Progress",
    explanation: "Click the Scan button to launch. A live dashboard displays the scanner querying zone files, performing TLS handshakes, and analyzing HTTP responses. Watch the progress bar advance in real-time as each module finishes.",
    visualType: "scanner-mockup"
  },
  {
    title: "4. Review Results",
    desc: "Analyze score and findings",
    detailedTitle: "Step 4: Understand the Results Console",
    explanation: "Once completed, review your global Security Score (0-100) and Letter Grade (A+ to F). Navigate through the tabs to explore issues grouped by category, inspect headers, view certificate chains, and copy zone records.",
    visualType: "results-mockup"
  },
  {
    title: "5. Fix Issues",
    desc: "Follow remediation guides",
    detailedTitle: "Step 5: Apply Detailed Fix Guidelines",
    explanation: "Every security gap detected is mapped to an interactive finding card. Expand a finding to read its description, business impact, configuration examples (e.g., Nginx, Apache, IIS), and links to documentation.",
    visualType: "fix-mockup"
  },
  {
    title: "6. Re-scan",
    desc: "Validate and monitor",
    detailedTitle: "Step 6: Re-test to Verify Hardening",
    explanation: "After applying the recommended configurations, run a new scan on the domain. The platform will re-evaluate your assets and update your security grade, helping you keep your online services secure over time.",
    visualType: "rescan-mockup"
  }
];

// What We Scan Data
const CATEGORIES = [
  {
    icon: FileCode,
    title: "Security Headers",
    desc: "Audits standard HTTP response headers for transport safety, iframe isolation, and content source rules.",
    checks: "CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CORS",
    impact: "Protects site visitors from Cross-Site Scripting (XSS), clickjacking, and request interception."
  },
  {
    icon: Lock,
    title: "SSL/TLS Configuration",
    desc: "Inspects your certificate chain, protocol versions, supported ciphers, and expiration details.",
    checks: "TLS 1.2/1.3 configurations, weak ciphers, wildcard status, issuer details",
    impact: "Ensures communication channel confidentiality, protecting user credentials from transit eavesdropping."
  },
  {
    icon: Globe,
    title: "DNS Records",
    desc: "Queries your public zone configuration to verify active record endpoints and DNSSEC deployment.",
    checks: "MX records, A/AAAA addresses, CNAME mappings, NS zone authorities, DNSSEC keys",
    impact: "Prevents domain takeovers, verification bypasses, and validates address resolution safety."
  },
  {
    icon: Mail,
    title: "Email Authentication",
    desc: "Validates key anti-spoofing and secure mail transfer configurations at the DNS level.",
    checks: "SPF tags, DKIM selector validity, DMARC policies, MTA-STS, TLS-RPT, BIMI records",
    impact: "Protects your corporate identity from domain spoofing and phishing, ensuring inbox delivery."
  },
  {
    icon: Radar,
    title: "Attack Surface",
    desc: "Maps out public infrastructures and records to determine overall visibility to automated threat scanners.",
    checks: "Public domains, external endpoints, service banners, WAF presence",
    impact: "Helps defensive teams reduce public exposure footprint and manage target configurations."
  },
  {
    icon: Terminal,
    title: "Open Ports",
    desc: "Probes public network interfaces to detect exposed application ports and running system services.",
    checks: "Common active port states (HTTP/HTTPS, SSH, FTP, Database, SMTP, etc.)",
    impact: "Identifies accidental port exposures or legacy ports running outdated, vulnerable services."
  },
  {
    icon: Layers,
    title: "Subdomains",
    desc: "Discovers and queries active sub-records belonging to the root domain to map complete asset lists.",
    checks: "Subdomain host resolutions, CNAME chains, status codes",
    impact: "Flags stale subdomains directing to defunct third-party hosting, which are vulnerable to takeover."
  },
  {
    icon: Cpu,
    title: "Technology Detection",
    desc: "Analyzes system metadata, response footprints, and tags to outline the server tech stack.",
    checks: "Web servers (Nginx, Apache), JavaScript frameworks, CMS engines, WAF layers",
    impact: "Ensures compliance and flags outdated libraries or servers containing known vulnerabilities."
  },
  {
    icon: Cookie,
    title: "Cookie Security",
    desc: "Inspects parameters of cookies transmitted in response headers to ensure safe storage rules.",
    checks: "HttpOnly flags, Secure transmission parameters, SameSite attribute configurations",
    impact: "Prevents client-side scripts from reading sensitive session identifiers, mitigating XSS session theft."
  },
  {
    icon: Sliders,
    title: "Website Configuration",
    desc: "Checks for the configuration and availability of standard crawler and disclosure paths.",
    checks: "robots.txt indexing instructions, security.txt contacts, sitemap resolutions",
    impact: "Supports clean search crawler indexing and facilitates responsible vulnerability reporting."
  },
  {
    icon: Activity,
    title: "HTTP Response",
    desc: "Analyzes raw server response headers, transmission sizes, compression types, and return codes.",
    checks: "Status codes, response sizes, redirect paths, gzip/brotli support",
    impact: "Ensures that users are automatically redirected to HTTPS channels, and validates routes."
  },
  {
    icon: HardDrive,
    title: "Server Information",
    desc: "Checks web server response banners to flag software version disclosures.",
    checks: "Server headers, X-Powered-By banners, system version tags",
    impact: "Hides detailed implementation architecture, forcing attackers to spend more time profiling systems."
  }
];

// Severity Legend
const SEVERITIES = [
  {
    badge: "Critical",
    variant: "danger",
    weight: "20 - 25 pt deduction",
    desc: "Severe gaps that expose the site immediately to exploitation (e.g., missing CSP, missing HSTS, or expired SSL certificate). Remediate immediately."
  },
  {
    badge: "High",
    variant: "danger",
    weight: "10 - 15 pt deduction",
    desc: "Highly unsafe configurations (e.g., missing X-Frame-Options, or disabled SPF/DMARC email security). Plan patches within 24-48 hours."
  },
  {
    badge: "Medium",
    variant: "warning",
    weight: "5 - 10 pt deduction",
    desc: "Important headers or controls missing (e.g., missing Permissions-Policy, missing Referrer-Policy, or weak SSL cipher suites)."
  },
  {
    badge: "Low",
    variant: "info",
    weight: "2 - 5 pt deduction",
    desc: "Minor gaps that improve configuration hygiene (e.g., missing robots.txt, missing security.txt, or disclosure of non-critical server banners)."
  },
  {
    badge: "Informational",
    variant: "info",
    weight: "0 pt deduction",
    desc: "General configuration metadata containing no direct risk, useful for telemetry (e.g., IP geo-location, response size, or tech stack tags)."
  }
];

// FAQs Data
const FAQS = [
  {
    q: "What is a domain security scan?",
    a: "A domain scan audits the public network-facing configurations of a website. It checks security headers, SSL certificates, DNS records, and email settings by querying public endpoints. It does not perform invasive attacks or require database access."
  },
  {
    q: "Is the scan safe to run on production environments?",
    a: "Yes, completely. The scan processes only standard public requests and records (like HTTP HEAD/GET requests and DNS lookups). It uses non-invasive methods and causes no operational impact, performance degradation, or security alarm triggers."
  },
  {
    q: "How long does a scan take?",
    a: "A standard scan takes between 5 to 15 seconds to run. The execution duration depends on the number of selected modules, network latency of the target domain, and DNS propagation."
  },
  {
    q: "Why does the scanner require domain ownership verification?",
    a: "To ensure that deep security audits and exposure reporting are performed only by authorized administrators. Verification is simple and involves hosting a temporary token file at http://<domain>/headerguard-verification.txt."
  },
  {
    q: "How often should I scan my domains?",
    a: "We recommend running scans after any server migration, SSL renewal, or header configuration change. Active monitors can also be scheduled on our dashboard to track and alert you of posture drifts automatically."
  },
  {
    q: "What does the Security Score mean?",
    a: "The score (0 to 100) measures how closely a domain follows industry-standard security practices. Points are deducted based on missing security headers and configuration errors, weighted by severity. This score corresponds to a letter grade (A+ through F)."
  },
  {
    q: "Why are some tabs or findings marked 'Not Detected'?",
    a: "If a specific parameter (like tracking pixels, open ports, or subdomains) was not found on your target server, the platform displays 'Not Detected' instead of showing mock placeholder data. This ensures strict audit integrity."
  }
];

export default function GuidePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [faqOpen, setFaqOpen] = useState(Array(FAQS.length).fill(false));

  // Stepper Simulated Scan States
  const [simProgress, setSimProgress] = useState(0);
  const [simState, setSimState] = useState("Idle");
  const [simLogs, setSimLogs] = useState([]);
  const [simRunning, setSimRunning] = useState(false);

  // Stepper Option States
  const [selectedOptions, setSelectedOptions] = useState({
    headers: true,
    ssl: true,
    dns: true,
    email: true,
    ports: false,
    tech: true,
    cookies: true
  });

  const toggleOption = (key) => {
    setSelectedOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Run Simulated Scan
  const startSimulatedScan = () => {
    if (simRunning) return;
    setSimRunning(true);
    setSimProgress(0);
    setSimLogs([]);
    setSimState("Initializing Scanner...");

    const milestones = [
      { progress: 15, state: "Resolving DNS Records (MX, A, TXT)...", log: "[INFO] Querying root DNS zone assets..." },
      { progress: 35, state: "Inspecting SSL/TLS certificate chains...", log: "[OK] Certificate chain is valid. OCSP checks resolved." },
      { progress: 60, state: "Fetching and auditing HTTP Security Headers...", log: "[WARN] Missing Content-Security-Policy (CSP) header." },
      { progress: 80, state: "Analyzing Website Privacy & cookie flags...", log: "[OK] Cookie security flags (HttpOnly, Secure) are present." },
      { progress: 95, state: "Analyzing Email Security parameters...", log: "[INFO] SPF record resolved. BIMI details missing." },
      { progress: 100, state: "Scan Completed!", log: "[SUCCESS] Audit compiled. Posture Score: 85 (A-)" }
    ];

    let currentMilestone = 0;
    const interval = setInterval(() => {
      setSimProgress(prev => {
        const target = milestones[currentMilestone].progress;
        if (prev >= target) {
          if (milestones[currentMilestone].log) {
            setSimLogs(l => [...l, milestones[currentMilestone].log]);
          }
          setSimState(milestones[currentMilestone].state);
          currentMilestone += 1;
        }
        
        if (prev >= 100) {
          clearInterval(interval);
          setSimRunning(false);
          return 100;
        }
        return prev + 2;
      });
    }, 80);
  };

  // Run simulated scan automatically if step 3 becomes active
  useEffect(() => {
    if (activeStep === 2) {
      startSimulatedScan();
    } else {
      setSimRunning(false);
      setSimProgress(0);
      setSimState("Idle");
      setSimLogs([]);
    }
  }, [activeStep]);

  const handleToggleFaq = (index) => {
    setFaqOpen(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <Navbar />

      <main className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-12 space-y-20">
        
        {/* ===== HERO SECTION ===== */}
        <section className="text-center space-y-6 max-w-3xl mx-auto py-6 animate-fadeInUp">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/20 bg-accent/5 text-accent text-[10px] font-bold uppercase tracking-wider">
            <Shield className="h-3 w-3 animate-pulse" /> Onboarding Platform Guide
          </div>
          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-wide leading-tight">
            How Domain <span className="text-accent">Scanning</span> Works
          </h1>
          <p className="text-sm sm:text-base text-text-dim max-w-2xl mx-auto leading-relaxed">
            Assess and monitor your assets using our non-invasive, authorized scanner. Query security headers, configure TLS records, audit exposures, and verify cookie configurations in seconds.
          </p>
          <div className="pt-2 flex justify-center gap-4">
            <Link href="/scanner">
              <Button variant="primary" icon={Play} className="px-6 py-3 font-mono text-xs">
                Start Your First Scan
              </Button>
            </Link>
          </div>
        </section>

        {/* ===== STEP-BY-STEP STEPPER ===== */}
        <section className="space-y-8">
          <div className="border-b border-white/[0.04] pb-4">
            <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
              Scan Lifecycle Stepper
            </h2>
            <p className="text-xl font-bold mt-1 text-text">
              Follow the 6 Steps of Domain Scanning
            </p>
          </div>

          {/* Stepper Timeline Progress bar */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {STEPS.map((step, idx) => (
              <button
                key={step.title}
                onClick={() => setActiveStep(idx)}
                className={`text-left p-3.5 rounded-xl border transition-all duration-200 ${
                  activeStep === idx 
                    ? "bg-accent/10 border-accent text-text shadow-glow-sm" 
                    : "bg-surface/50 border-white/[0.04] text-text-dim hover:bg-surface hover:border-white/[0.08]"
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1 font-mono">
                  Step {idx + 1}
                </div>
                <div className="text-xs font-bold truncate">{step.title.split(". ")[1]}</div>
                <div className="text-[9px] text-text-muted truncate mt-0.5">{step.desc}</div>
              </button>
            ))}
          </div>

          {/* Current Step Detailed Card */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-stretch">
            {/* Explanatory Text */}
            <Card className="flex flex-col justify-between border-white/[0.08] bg-surface/30 backdrop-blur-md p-6 sm:p-8 space-y-6">
              <div className="space-y-4">
                <Badge variant="accent" className="font-mono">
                  Onboarding Phase {activeStep + 1} / 6
                </Badge>
                <h3 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
                  {STEPS[activeStep].detailedTitle}
                </h3>
                <p className="text-sm text-text-dim leading-relaxed">
                  {STEPS[activeStep].explanation}
                </p>
              </div>

              {/* Navigation Controls inside Stepper */}
              <div className="flex items-center justify-between border-t border-white/[0.04] pt-6">
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={ArrowLeft}
                  disabled={activeStep === 0}
                  onClick={() => setActiveStep(prev => prev - 1)}
                  className="font-mono"
                >
                  Previous
                </Button>
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <span 
                      key={i} 
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                        activeStep === i ? "bg-accent w-3" : "bg-white/10"
                      }`} 
                    />
                  ))}
                </div>
                <Button 
                  variant={activeStep === STEPS.length - 1 ? "secondary" : "primary"}
                  size="sm" 
                  disabled={activeStep === STEPS.length - 1}
                  onClick={() => setActiveStep(prev => prev + 1)}
                  className="font-mono group"
                >
                  <span className="flex items-center gap-1">
                    Next <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </Button>
              </div>
            </Card>

            {/* Interactive Visual Mockups for each step */}
            <Card className="border-white/[0.08] bg-surface/10 backdrop-blur-sm p-6 flex flex-col justify-center overflow-hidden min-h-[300px]">
              
              {/* STEP 1 VISUAL MOCKUP: Entering domain */}
              {STEPS[activeStep].visualType === "input-mockup" && (
                <div className="space-y-4 w-full">
                  <div className="text-[10px] uppercase font-bold text-accent tracking-widest font-mono">Domain Address Input</div>
                  <div className="relative bg-bg border border-white/10 rounded-xl p-3 flex items-center gap-3">
                    <Globe className="text-accent h-4 w-4 shrink-0" />
                    <input 
                      type="text" 
                      value="example.com" 
                      disabled
                      className="bg-transparent text-xs w-full outline-none text-text font-mono"
                    />
                    <Badge variant="success">Validated</Badge>
                  </div>
                  <div className="text-[10px] text-text-dim leading-relaxed bg-bg/50 p-3 rounded-lg border border-white/[0.02]">
                    <p className="font-bold text-text mb-0.5">Input rules applied:</p>
                    <ul className="list-disc pl-4 space-y-1 text-text-muted">
                      <li>Cleans URL prefix (<code className="text-accent">https://</code>, <code className="text-accent">www.</code>)</li>
                      <li>Verifies format matches standard DNS syntax</li>
                      <li>Blocks local or private addresses (e.g. 192.168.x.x) for safety</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* STEP 2 VISUAL MOCKUP: Configuring scan options */}
              {STEPS[activeStep].visualType === "options-mockup" && (
                <div className="space-y-3 w-full">
                  <div className="text-[10px] uppercase font-bold text-accent tracking-widest font-mono">Customize Scanners</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    {[
                      { key: "headers", label: "Security Headers", time: "~1.5s" },
                      { key: "ssl", label: "SSL/TLS Chain", time: "~2.0s" },
                      { key: "dns", label: "DNS Zones", time: "~1.0s" },
                      { key: "email", label: "Email Security", time: "~1.2s" },
                      { key: "ports", label: "Open Ports", time: "~4.5s" },
                      { key: "tech", label: "Tech Detection", time: "~1.5s" },
                      { key: "cookies", label: "Cookie Flags", time: "~1.0s" }
                    ].map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => toggleOption(opt.key)}
                        className={`flex items-center justify-between p-2 rounded border transition-colors text-left ${
                          selectedOptions[opt.key]
                            ? "bg-accent/5 border-accent/40 text-text"
                            : "bg-bg/40 border-white/[0.04] text-text-dim"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        <span className="text-[8px] text-text-muted shrink-0">{opt.time}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-text-muted mt-2 text-center">Click mock cards above to toggle selection</p>
                </div>
              )}

              {/* STEP 3 VISUAL MOCKUP: Simulated Scanner */}
              {STEPS[activeStep].visualType === "scanner-mockup" && (
                <div className="space-y-4 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-accent tracking-widest font-mono">Scan Telemetry</span>
                    <button
                      onClick={startSimulatedScan}
                      disabled={simRunning}
                      className="text-[9px] font-bold text-accent hover:text-accent-light uppercase flex items-center gap-1 disabled:opacity-50"
                    >
                      <RotateCw className={`h-2.5 w-2.5 ${simRunning ? "animate-spin" : ""}`} /> Restart Sim
                    </button>
                  </div>
                  
                  {/* Progress panel */}
                  <div className="bg-bg/85 border border-white/[0.06] rounded-xl p-4 space-y-3 font-mono">
                    <div className="flex justify-between items-baseline text-[10px]">
                      <span className="text-text-dim truncate">{simState}</span>
                      <span className="text-accent font-bold">{simProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                      <div className="h-full bg-accent transition-all duration-100" style={{ width: `${simProgress}%` }} />
                    </div>
                    
                    {/* Simulated terminal console */}
                    <div className="h-28 overflow-y-auto bg-black/40 p-2.5 rounded text-[9px] text-text-muted space-y-1">
                      {simLogs.map((log, i) => (
                        <div key={i} className="truncate">{log}</div>
                      ))}
                      {simRunning && <div className="text-accent animate-pulse">Scanning target interfaces...</div>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4 VISUAL MOCKUP: Review results layout */}
              {STEPS[activeStep].visualType === "results-mockup" && (
                <div className="space-y-4 w-full">
                  <div className="text-[10px] uppercase font-bold text-accent tracking-widest font-mono">Post-Scan Dashboard Mock</div>
                  <div className="bg-surface border border-white/10 rounded-xl p-4 flex gap-4 items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-[9px] text-text-dim uppercase tracking-wider">Overall Posture</div>
                      <div className="text-4xl font-extrabold text-success">A-</div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-mono text-text-dim">
                        <span>Risk level:</span>
                        <span className="text-success font-bold uppercase">Low Risk</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-text-dim">
                        <span>Checks passed:</span>
                        <span className="text-text font-bold">18/22</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-text-dim">
                        <span>Scan duration:</span>
                        <span className="text-text">5.4s</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button className="text-[10px] px-3 py-1.5 rounded bg-accent/10 border border-accent/30 text-accent font-bold uppercase font-mono hover:bg-accent/20 transition-all">
                      Export PDF Report
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5 VISUAL MOCKUP: Applying fixes */}
              {STEPS[activeStep].visualType === "fix-mockup" && (
                <div className="space-y-3 w-full">
                  <div className="text-[10px] uppercase font-bold text-accent tracking-widest font-mono">Actionable Recommendation</div>
                  <div className="bg-bg/80 border border-white/5 rounded-xl p-3 space-y-2 text-[10px] font-mono">
                    <div className="flex items-center gap-1.5 text-danger">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span className="font-bold">HSTS Missing (Max Age &lt; 1 Year)</span>
                    </div>
                    <p className="text-[9px] text-text-dim font-sans leading-relaxed">
                      Implement HTTP Strict Transport Security with a max-age attribute of at least 31536000 seconds.
                    </p>
                    <div className="bg-black/40 p-2 rounded text-[8px] text-accent-light break-all">
                      add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6 VISUAL MOCKUP: Re-scan flow */}
              {STEPS[activeStep].visualType === "rescan-mockup" && (
                <div className="text-center space-y-4 py-4 w-full">
                  <div className="relative inline-block mx-auto">
                    <div className="absolute inset-0 bg-accent/25 rounded-full blur-xl animate-pulse" />
                    <div className="relative h-14 w-14 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center">
                      <ShieldCheck className="text-accent h-7 w-7" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-text">Keep Posture Updated</div>
                    <p className="text-[10px] text-text-dim max-w-xs mx-auto leading-relaxed">
                      Perform routine audits to catch new vulnerabilities and verify correct configuration of transport headers.
                    </p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </section>

        {/* ===== WHAT WE SCAN GRID ===== */}
        <section className="space-y-8">
          <div className="border-b border-white/[0.04] pb-4">
            <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
              Scan Coverage Inventory
            </h2>
            <p className="text-xl font-bold mt-1 text-text">
              What We Scan & Audit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Card key={cat.title} hoverable className="flex flex-col justify-between border-white/[0.04] bg-surface/20">
                  <div className="space-y-3.5">
                    <div className="h-9 w-9 rounded-lg bg-accent/5 border border-accent/20 flex items-center justify-center">
                      <Icon className="text-accent h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wide">{cat.title}</h3>
                      <p className="text-xs text-text-dim mt-1.5 leading-relaxed">{cat.desc}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/[0.02] space-y-2 text-[10px] font-mono">
                    <div>
                      <span className="text-accent font-semibold block">Checks:</span>
                      <span className="text-text-dim text-[9px] leading-relaxed">{cat.checks}</span>
                    </div>
                    <div>
                      <span className="text-success font-semibold block">Impact:</span>
                      <span className="text-text-dim text-[9px] leading-relaxed">{cat.impact}</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ===== UNDERSTANDING SEVERITY LEVELS ===== */}
        <section className="space-y-8">
          <div className="border-b border-white/[0.04] pb-4">
            <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
              Audit Legend
            </h2>
            <p className="text-xl font-bold mt-1 text-text">
              Understanding Severity Levels
            </p>
          </div>

          <div className="border border-white/[0.05] rounded-2xl bg-surface/20 divide-y divide-white/[0.04] overflow-hidden">
            {SEVERITIES.map(sev => (
              <div key={sev.badge} className="p-5 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6 hover:bg-surface/50 transition-colors">
                <div className="sm:w-40 shrink-0">
                  <Badge variant={sev.variant} className="w-full justify-center py-1 font-mono text-center">
                    {sev.badge}
                  </Badge>
                  <div className="text-[9px] text-text-muted mt-1 font-mono text-center sm:text-left">
                    {sev.weight}
                  </div>
                </div>
                <div className="text-xs leading-relaxed text-text-dim font-sans">
                  {sev.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== BEST PRACTICES SECTION ===== */}
        <section className="space-y-8">
          <div className="border-b border-white/[0.04] pb-4">
            <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
              Remediation Guidelines
            </h2>
            <p className="text-xl font-bold mt-1 text-text">
              Recommended Posture Hardening
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Enforce Secure Channels",
                items: [
                  "Enable HTTPS everywhere, disabling HTTP listener ports completely.",
                  "Configure HTTP Strict Transport Security (HSTS) header with a 1-year max-age directives.",
                  "Enforce secure TLS cipher configurations, disabling deprecated SSL v3 and TLS 1.0/1.1."
                ]
              },
              {
                title: "Implement Content Rules",
                items: [
                  "Configure a strong Content Security Policy (CSP) restriction block.",
                  "Restrict page framing via X-Frame-Options or frame-ancestors directives to block clickjacking.",
                  "Apply Permissions-Policy definitions to prevent camera or geolocation access from sub-iframes."
                ]
              },
              {
                title: "Email & Domain Health",
                items: [
                  "Publish strong SPF DNS records mapping all authorized outbound email sources.",
                  "Configure DMARC records with reject or quarantine policies.",
                  "Minimize public domain exposure footprints, closing databases and administrative ports."
                ]
              }
            ].map(col => (
              <Card key={col.title} className="border-white/[0.04] bg-surface/20 space-y-4">
                <h3 className="text-xs font-black uppercase text-accent tracking-widest font-mono border-b border-white/[0.04] pb-2">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-text-dim leading-relaxed">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* ===== FAQS ACCORDION ===== */}
        <section className="space-y-8">
          <div className="border-b border-white/[0.04] pb-4">
            <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest">
              Information Desk
            </h2>
            <p className="text-xl font-bold mt-1 text-text">
              Frequently Asked Questions
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((faq, idx) => (
              <Card 
                key={idx} 
                className="border-white/[0.04] bg-surface/10 p-0 overflow-hidden transition-all"
              >
                <button
                  onClick={() => handleToggleFaq(idx)}
                  className="w-full flex items-center justify-between p-4.5 text-left text-xs font-bold uppercase tracking-wide hover:bg-surface/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="h-4.5 w-4.5 text-accent shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  {faqOpen[idx] ? (
                    <ChevronUp className="h-4 w-4 text-accent shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-text-dim shrink-0" />
                  )}
                </button>
                
                {faqOpen[idx] && (
                  <div className="p-5 border-t border-white/[0.02] bg-bg/20 text-xs text-text-dim leading-relaxed animate-fadeInUp">
                    {faq.a}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* ===== FOOTER CTA PANEL ===== */}
        <section className="border border-white/[0.05] bg-gradient-to-r from-accent/5 via-surface/60 to-accent/5 rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto">
          <ShieldCheck className="h-10 w-10 text-accent mx-auto" />
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide">
            Ready to Audit Your Domain Posture?
          </h2>
          <p className="text-xs sm:text-sm text-text-dim max-w-xl mx-auto leading-relaxed">
            Verify and monitor your web endpoints for security risks. Instantly identify missing headers, outdated SSL implementations, and DNS misconfigurations.
          </p>
          <div className="pt-2">
            <Link href="/scanner">
              <Button variant="primary" icon={Play} className="px-6 py-3 font-mono text-xs">
                Launch Security Console
              </Button>
            </Link>
          </div>
        </section>

      </main>
    </div>
  );
}
