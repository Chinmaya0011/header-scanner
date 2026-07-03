"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ScoreGauge from "@/components/ui/ScoreGauge";
import {
  Shield,
  Zap,
  Code,
  LineChart,
  Terminal,
  Activity,
  ArrowRight,
  Database,
  Lock,
  CheckCircle,
  AlertTriangle,
  Globe,
  Star,
  Cpu,
  Layers,
  Compass
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const mockPieData = [
    { name: "Passed", value: 9, color: "#10b981" },
    { name: "Warnings", value: 1, color: "#f59e0b" },
    { name: "Failed", value: 1, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-accent/5 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 py-20 sm:py-28 text-center space-y-8 select-none z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider mb-2 border border-accent/20">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Enterprise Security Posture Scanner 2.5
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none uppercase max-w-4xl mx-auto text-text bg-gradient-to-b from-text via-text to-text-dim/80 bg-clip-text">
          Audit Website <span className="text-accent">Security Perimeter</span> in Real-Time
        </h1>

        <p className="text-text-dim text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed uppercase tracking-wider">
          Instantly evaluate HTTP security headers, inspect SSL/TLS certificates, validate DNS zones, and pinpoint external digital exposure points — free and zero configuration required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/scanner" passHref>
            <Button size="lg" variant="primary" icon={Shield}>
              Launch Security Scanner
            </Button>
          </Link>
          <Link href="/register" passHref>
            <Button size="lg" variant="outline" icon={ArrowRight}>
              Create Free Profile
            </Button>
          </Link>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 pb-24">
        <div className="text-center mb-6">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Engine Output Demonstration</span>
        </div>
        <Card glow className="bg-surface/60 border border-white/[0.05] p-6 max-w-4xl mx-auto rounded-2xl shadow-2xl backdrop-blur-md">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            <div className="flex-shrink-0 bg-bg/50 p-4 rounded-xl border border-white/[0.03]">
              <ScoreGauge score={92} grade="A" domain="secure-transit.org" />
            </div>

            <div className="flex-1 w-full space-y-4 text-center md:text-left">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center md:justify-start">
                  <span className="font-mono font-bold text-text text-base">secure-transit.org</span>
                  <div className="inline-flex justify-center">
                    <Badge variant="success">Strong Audit Grade</Badge>
                  </div>
                </div>
                <p className="text-text-dim text-[10px] uppercase mt-1">Unified Security Compliance Verification Result</p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-4 py-3 bg-bg/40 rounded-xl border border-white/[0.03]">
                <div className="text-center">
                  <p className="text-base font-bold font-mono text-success">9</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Passed</p>
                </div>
                <div className="text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-white/5" />
                  <p className="text-base font-bold font-mono text-warning">1</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Weak</p>
                </div>
                <div className="text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-white/5" />
                  <p className="text-base font-bold font-mono text-danger">1</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Failed</p>
                </div>
                <div className="text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-white/5" />
                  <p className="text-base font-bold font-mono text-accent">81%</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Defense Index</p>
                </div>
              </div>

              {/* Chart & Mini Logs Row Preview */}
              {mounted && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <div className="bg-bg/30 border border-white/[0.04] rounded-xl p-3 flex-1 flex items-center justify-between">
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-[10px] text-text-dim uppercase">Threat Profile Distribution</p>
                      <p className="text-[9px] text-text-muted">CSP, HSTS & TLS Indicators</p>
                    </div>
                    <div className="w-16 h-16">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={mockPieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={15}
                            outerRadius={25}
                            dataKey="value"
                          >
                            {mockPieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-bg/30 border border-white/[0.04] rounded-xl p-3 flex-1 space-y-1.5 text-[10px]">
                    <p className="font-bold text-[9px] text-text-dim uppercase">Mitigated Protection Vectors</p>
                    <div className="flex items-center gap-1.5 text-success font-semibold">
                      <CheckCircle className="h-3 w-3" />
                      <span>Content-Security-Policy (Valid)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-success font-semibold">
                      <CheckCircle className="h-3 w-3" />
                      <span>Strict-Transport-Security (HSTS Preloaded)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Core Scanning Engine Features */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-20 border-t border-white/[0.03]">
        <div className="text-center space-y-2.5 mb-14">
          <div className="inline-flex items-center gap-1.5 text-accent">
            <Star className="w-4 h-4 fill-accent" />
            <span className="text-[9px] font-extrabold uppercase tracking-widest font-mono">Platform Capabilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">Attack Surface Management</h2>
          <p className="text-xs text-text-dim uppercase tracking-wide">Proactive exposure mapping and defense assessments</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={Shield}
            title="HTTP Headers Audit"
            desc="Inspects critical defense parameters including CSP nonces, HSTS max-age, and iframe sandboxing."
          />
          <FeatureCard
            icon={Layers}
            title="SSL/TLS Certificates"
            desc="Validates cryptographic protocol security suites, certificate expiry dates, and trust chains."
          />
          <FeatureCard
            icon={Globe}
            title="DNS Domain Security"
            desc="Queries spoofing defenses, analyzing SPF, DKIM, and DMARC TXT record compliance status."
          />
          <FeatureCard
            icon={Database}
            title="Cookies & CORS Policy"
            desc="Examines HttpOnly, Secure, and SameSite cookie flags alongside wildcard CORS credential settings."
          />
          <FeatureCard
            icon={Code}
            title="Developer REST API"
            desc="Triggers scanning programmatically via REST API with custom User-Agent rules and allowed domain keys."
          />
          <FeatureCard
            icon={LineChart}
            title="Usage Metrics Panel"
            desc="Monitor request limits consumption, analyze historical scanner metrics, and manage user API tokens."
          />
          <FeatureCard
            icon={Terminal}
            title="Exposed Ports Scanner"
            desc="Performs lightweight external service checks and flags sensitive paths or environment leaks."
          />
          <FeatureCard
            icon={Activity}
            title="Real-Time WebSocket Pipeline"
            desc="Streams instant scanning status updates, checkpoints, and notifications directly to the frontend console."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-surface/30 border-y border-white/[0.03] py-20 select-none">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2.5 mb-14">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">How HeaderGuard Operates</h2>
            <p className="text-xs text-text-dim uppercase tracking-wide">Three steps to inspect and harden your website perimeters</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <StepCard
              step="1"
              title="Submit Domain Target"
              desc="Enter any website URL or domain host within our real-time audit console."
            />
            <StepCard
              step="2"
              title="Run Security Audits"
              desc="Our server queries the endpoint, executes port discovery, audits headers, and validates TLS suites."
            />
            <StepCard
              step="3"
              title="Deploy Server Fixes"
              desc="Review detailed scores, download regulatory compliance reports, and copy recommended configuration updates."
            />
          </div>
        </div>
      </section>

      {/* Why Auditing Matters */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-4 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider">Why Audit HTTP Headers?</h2>
            <p className="text-xs text-text-dim leading-relaxed uppercase tracking-wider">
              HTTP security headers act as your first line of defense against client-side exploitation. Improperly configured headers expose visitors to clickjacking, cross-site script injections (XSS), protocol downgrades, and data sniffing.
            </p>
          </div>

          <div className="md:col-span-7 space-y-3.5">
            <BenefitItem text="Locate and resolve missing critical headers like CSP, HSTS, and X-Frame-Options." />
            <BenefitItem text="Examine regulatory framework compliance alignment for GDPR and PCI-DSS." />
            <BenefitItem text="Gain access to copying server config snippets for Nginx, Apache, Next.js, and Cloudflare." />
            <BenefitItem text="Integrate programmatically into staging environments using secure developer API keys." />
            <BenefitItem text="Establish real-time scanning pipelines with instant WebSocket notification logs." />
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="mx-auto max-w-4xl w-full px-4 sm:px-6 py-20 text-center space-y-6">
        <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wider">Secure Your Digital Perimeters Today</h2>
        <p className="text-xs text-text-dim uppercase tracking-wider max-w-lg mx-auto leading-relaxed">
          Audit website header configurations, verify certificate safety, and hardens vulnerabilities. Instant reports, zero configuration required.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/scanner" passHref>
            <Button size="lg" variant="primary" icon={Shield}>
              Start A Free Scan
            </Button>
          </Link>
          <Link href="/register" passHref>
            <Button size="lg" variant="outline" icon={ArrowRight}>
              Register Profile
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }) {
  return (
    <Card className="bg-surface/40 p-5 space-y-2.5 hover:border-white/10 transition-all duration-300">
      <div className="p-1.5 rounded bg-accent/10 text-accent self-start inline-flex">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-text">{title}</h3>
      <p className="text-[11px] text-text-dim leading-relaxed">{desc}</p>
    </Card>
  );
}

function StepCard({ step, title, desc }) {
  return (
    <Card className="bg-surface/50 p-6 space-y-2 border-white/[0.03]">
      <div className="h-8 w-8 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-xs font-bold font-mono mx-auto">
        {step}
      </div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-text">{title}</h3>
      <p className="text-[11px] text-text-dim leading-relaxed max-w-xs mx-auto">{desc}</p>
    </Card>
  );
}

function BenefitItem({ text }) {
  return (
    <div className="flex items-start gap-2.5 text-xs text-text-dim">
      <div className="p-0.5 rounded bg-success/15 text-success mt-0.5 flex-shrink-0">
        <CheckCircle className="h-3.5 w-3.5" />
      </div>
      <p className="leading-relaxed font-semibold uppercase tracking-wider text-[10px]">{text}</p>
    </div>
  );
}
