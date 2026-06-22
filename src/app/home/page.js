"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
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
  UserCheck,
  UserCog,
  CheckCircle,
  AlertTriangle,
  FileText,
  FileCheck2,
  Globe,
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
    { name: "Passed", value: 8, color: "#10b981" },
    { name: "Warnings", value: 2, color: "#f59e0b" },
    { name: "Failed", value: 1, color: "#ef4444" },
  ];

  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative mx-auto max-w-5xl px-4 sm:px-6 py-16 sm:py-24 text-center space-y-8 select-none z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider mb-2 border border-accent/20">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          Web Security Scanner 2.0
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight uppercase max-w-4xl mx-auto">
          Analyze Website <span className="text-accent">Security Headers</span> in Seconds
        </h1>

        <p className="text-text-dim text-xs sm:text-sm max-w-xl mx-auto leading-relaxed uppercase tracking-wider">
          Scan any website for missing security headers, SSL/TLS issues, CSP problems, cookie risks, and other basic web security misconfigurations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <Link href="/scanner" passHref>
            <Button size="lg" variant="primary" icon={Shield}>
              Start Free Scan
            </Button>
          </Link>
          <a href="#demo" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full" icon={ArrowRight}>
              View Demo Dashboard
            </Button>
          </a>
        </div>
      </section>

      {/* App Preview Section */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 pb-20">
        <div className="text-center mb-6">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Interface Preview</span>
        </div>
        <Card glow className="bg-surface/60 border border-white/[0.05] p-6 max-w-4xl mx-auto rounded-2xl">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start">
            <div className="flex-shrink-0 bg-bg/50 p-4 rounded-xl border border-white/[0.03]">
              <ScoreGauge score={85} grade="A-" domain="example-store.com" />
            </div>

            <div className="flex-1 w-full space-y-4 text-center md:text-left">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 justify-center md:justify-start">
                  <span className="font-mono font-bold text-text text-base">example-store.com</span>
                  <div className="inline-flex justify-center">
                    <Badge variant="success">Strong Protection</Badge>
                  </div>
                </div>
                <p className="text-text-dim text-[10px] uppercase mt-1">HTTP Response Headers Audit Status</p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-4 py-3 bg-bg/40 rounded-xl border border-white/[0.03]">
                <div className="text-center">
                  <p className="text-base font-bold font-mono text-success">8</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Passed</p>
                </div>
                <div className="text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-white/5" />
                  <p className="text-base font-bold font-mono text-warning">2</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Weak</p>
                </div>
                <div className="text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-white/5" />
                  <p className="text-base font-bold font-mono text-danger">1</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Failed</p>
                </div>
                <div className="text-center relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-px bg-white/5" />
                  <p className="text-base font-bold font-mono text-accent">72%</p>
                  <p className="text-[8px] text-text-dim uppercase tracking-wider">Coverage</p>
                </div>
              </div>

              {/* Chart & Mini Logs Row Preview */}
              {mounted && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <div className="bg-bg/30 border border-white/[0.04] rounded-xl p-3 flex-1 flex items-center justify-between">
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-[10px] text-text-dim uppercase">Findings Distribution</p>
                      <p className="text-[9px] text-text-muted">CSP & cookie indicators</p>
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
                    <p className="font-bold text-[9px] text-text-dim uppercase">Active Protections</p>
                    <div className="flex items-center gap-1.5 text-success font-semibold">
                      <CheckCircle className="h-3 w-3" />
                      <span>Strict HSTS Policy (Passed)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-warning font-semibold">
                      <AlertTriangle className="h-3 w-3" />
                      <span>CSP unsafe-inline (Warning)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-16 border-t border-white/[0.03]">
        <div className="text-center space-y-2.5 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">Robust Scanning Engine Capabilities</h2>
          <p className="text-xs text-text-dim uppercase tracking-wide">Defense-in-depth audits mapped to professional standards</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={Shield}
            title="Headers Evaluation"
            desc="Inspects response tags like HSTS, CSP, X-Frame-Options, and Referrer-Policies."
          />
          <FeatureCard
            icon={Lock}
            title="CSP & HSTS Strictness"
            desc="Audits cryptographic nonces, max-age variables, subdomains, and preload flags."
          />
          <FeatureCard
            icon={Globe}
            title="SSL/TLS Status"
            desc="Validates protocol safety schemes, HTTPS redirection rules, and encryption transit."
          />
          <FeatureCard
            icon={Database}
            title="Cookies & CORS Rules"
            desc="Inspects cookie settings (HttpOnly, Secure, SameSite) and wildcard CORS credential flags."
          />
          <FeatureCard
            icon={Code}
            title="Developer REST API"
            desc="Enables pipelines, allowed domain lists, and custom User-Agent scanning."
          />
          <FeatureCard
            icon={LineChart}
            title="Admin Stats Console"
            desc="Manage daily limits per user, revoke compromised keys, and view request analytics."
          />
          <FeatureCard
            icon={FileCheck2}
            title="Actionable Audits"
            desc="Detailed why-it-matters explanations and specific server configs."
          />
          <FeatureCard
            icon={Activity}
            title="Recharts Visuals"
            desc="Clear data visualization mapping category findings and severity distributions."
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-surface/30 border-y border-white/[0.03] py-16 select-none">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2.5 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">How HeaderGuard Works</h2>
            <p className="text-xs text-text-dim uppercase tracking-wide">Three simple steps to establish a secure perimeter</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <StepCard
              step="1"
              title="Enter Domain URL"
              desc="Enter any website host domain (e.g. example.com) inside our audit input selector."
            />
            <StepCard
              step="2"
              title="Run Security Scan"
              desc="Our server queries the host, parses HTTP response attributes, and evaluates vulnerabilities."
            />
            <StepCard
              step="3"
              title="Review Report Details"
              desc="Analyze security scores, regulatory compliance grades, and get ready-to-copy code fixes."
            />
          </div>
        </div>
      </section>

      {/* Why Use This Section */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 space-y-4 text-center md:text-left">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">Why audit headers?</h2>
            <p className="text-xs text-text-dim leading-relaxed uppercase tracking-wider">
              HTTP headers are your first defense line. Lacking proper directives exposes visitors to XSS script insertions, protocol downgrades, and data leakage.
            </p>
          </div>

          <div className="md:col-span-7 space-y-3.5">
            <BenefitItem text="Quickly identify missing critical protection headers like CSP and HSTS." />
            <BenefitItem text="Retrieve beginner-friendly documentation mapping severity risk factors." />
            <BenefitItem text="Build logs history to review score upgrades after fixing vulnerabilities." />
            <BenefitItem text="Use secure developer API key credentials to automate CI/CD pipeline scans." />
            <BenefitItem text="Administrator dashboards enable daily request quotas control per user profile." />
          </div>
        </div>
      </section>

      {/* Demo Experience Section */}
      <section id="demo" className="bg-surface/30 border-t border-white/[0.03] py-16 scroll-mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center space-y-2.5 mb-12">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider">Demo Experience Console</h2>
            <p className="text-xs text-text-dim uppercase tracking-wide">Test pre-configured profiles without signing up</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* User Demo Card */}
            <Card hoverable className="p-6 space-y-4 bg-surface border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text">Login as User</h3>
                  <p className="text-[10px] text-text-dim uppercase font-semibold">User Dashboard View</p>
                </div>
              </div>
              <p className="text-xs text-text-dim leading-relaxed">
                Test the client dashboard. Inspect daily limits consumption indicators, view active developer API credentials, copy code setups, and browse recent scan history logs.
              </p>
              <div className="pt-2">
                <Link href="/demo/user" className="block w-full">
                  <Button variant="secondary" className="w-full text-center" icon={ArrowRight}>
                    Open User Demo
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Admin Demo Card */}
            <Card hoverable className="p-6 space-y-4 bg-surface border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warning/10 rounded-lg text-warning">
                  <UserCog className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text">Login as Admin</h3>
                  <p className="text-[10px] text-text-dim uppercase font-semibold">Admin Panel Console</p>
                </div>
              </div>
              <p className="text-xs text-text-dim leading-relaxed">
                Review system-wide analytics. View aggregated API usage trends, identify users exceeding limit parameters, toggle API access, and revoke client credentials in real-time.
              </p>
              <div className="pt-2">
                <Link href="/demo/admin" className="block w-full">
                  <Button variant="primary" className="w-full text-center hover:shadow-glow-warning" icon={ArrowRight}>
                    Open Admin Demo
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="mx-auto max-w-5xl w-full px-4 sm:px-6 py-16 text-center space-y-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wider">Start scanning website security today</h2>
        <p className="text-xs text-text-dim uppercase tracking-wider max-w-md mx-auto">
          Audit HTTP response flags to locate security cracks and protect users. Free scans, instant scores.
        </p>
        <div className="pt-2">
          <Link href="/scanner" passHref>
            <Button size="lg" variant="primary" icon={Shield}>
              Open Scanner Console
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/[0.04] bg-surface py-8 text-xs text-text-dim select-none">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="font-bold text-text uppercase">HeaderGuard Audit Console</span>
          </div>
          
          <div className="flex gap-4 text-[10px] uppercase font-bold">
            <Link href="/scanner" className="hover:text-text">Scanner</Link>
            <span>·</span>
            <Link href="/developers" className="hover:text-text">Developer API</Link>
            <span>·</span>
            <Link href="/demo/admin" className="hover:text-text">Admin Demo</Link>
          </div>

          <p className="text-[10px]">
            &copy; {new Date().getFullYear()} HeaderGuard. Secure Transit Policy.
          </p>
        </div>
      </footer>
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
