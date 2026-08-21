"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Lock,
  Layers,
  Search,
  Zap,
  Check,
  AlertTriangle,
  Play,
  FileCode,
  Globe,
  Radio
} from "lucide-react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { useToast } from "@/components/common/Toast";

export default function ApiSecurityConfigPage() {
  const router = useRouter();
  const toast = useToast();

  const [targetUrl, setTargetUrl] = useState("");
  const [authType, setAuthType] = useState("bearer"); // "bearer" | "apikey" | "none"
  const [primaryToken, setPrimaryToken] = useState("");
  const [secondaryToken, setSecondaryToken] = useState("");
  const [apiKeyHeader, setApiKeyHeader] = useState("X-API-Key");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [scanMode, setScanMode] = useState("safe_active"); // "passive" | "safe_active" | "advanced_active"
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Discovery source checkboxes
  const [discoverySources, setDiscoverySources] = useState({
    openapi: true,
    jsBundles: true,
    crawler: true,
    sitemap: true,
  });

  const [loading, setLoading] = useState(false);

  const handleStartScan = async (e) => {
    e.preventDefault();
    if (!targetUrl.trim()) {
      toast.error("Please enter a target URL.");
      return;
    }

    if (!isConfirmed) {
      toast.error("You must confirm that you have authorization to test this target.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/api-security/scans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl: targetUrl.trim(),
          authType,
          primaryToken,
          secondaryToken,
          apiKeyHeader,
          apiKeyValue,
          scanMode,
          isConfirmed,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("API Security scan initiated.");
        router.push(`/api-security/scans/${data.scanId}`);
      } else {
        toast.error(data.error || "Failed to start API security scan.");
      }
    } catch (err) {
      toast.error("Connection error initiating scan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans pb-16">
      {/* Top Banner Header */}
      <div className="bg-surface/50 border-b border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-accent" />
              <h1 className="text-xl font-bold text-text uppercase tracking-wide">
                API Security Scanner
              </h1>
              <Badge variant="accent" className="text-[10px]">
                OWASP API TOP 10
              </Badge>
            </div>
            <p className="text-xs text-text-dim mt-1">
              Discover endpoints, inspect schemas, and evaluate API authorization boundaries.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        <form onSubmit={handleStartScan} className="space-y-6">
          
          {/* Target URL Card */}
          <Card className="p-6 space-y-4 border border-border">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
              <Globe className="h-4 w-4" /> Target Specification
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-text-dim">
                Target Website / Base API URL
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/api"
                required
                className="w-full px-4 py-2.5 bg-bg border border-border focus:border-accent rounded-xl text-sm font-mono text-text outline-none transition-all"
              />
            </div>
          </Card>

          {/* Authentication & Authorization Card */}
          <Card className="p-6 space-y-5 border border-border">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                <Key className="h-4 w-4" /> Authentication Configuration
              </div>
              <Badge variant="secondary" className="text-[9px]">CREDENTIAL MASKING ENABLED</Badge>
            </div>

            {/* Auth Type Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-dim">
                Authentication Scheme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "bearer", label: "Bearer Token" },
                  { id: "apikey", label: "API Key Header" },
                  { id: "none", label: "None / Public" },
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAuthType(type.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      authType === type.id
                        ? "bg-accent/15 border-accent text-accent"
                        : "bg-surface border-border text-text-dim hover:text-text"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth Inputs */}
            {authType === "bearer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-dim">
                    Primary Identity Token (Identity A)
                  </label>
                  <input
                    type="password"
                    value={primaryToken}
                    onChange={(e) => setPrimaryToken(e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full px-3.5 py-2 bg-bg border border-border focus:border-accent rounded-xl text-xs font-mono text-text outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-dim">
                    Secondary Identity Token (Identity B - Optional for BOLA/BFLA)
                  </label>
                  <input
                    type="password"
                    value={secondaryToken}
                    onChange={(e) => setSecondaryToken(e.target.value)}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full px-3.5 py-2 bg-bg border border-border focus:border-accent rounded-xl text-xs font-mono text-text outline-none"
                  />
                </div>
              </div>
            )}

            {authType === "apikey" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-dim">
                    Header Name
                  </label>
                  <input
                    type="text"
                    value={apiKeyHeader}
                    onChange={(e) => setApiKeyHeader(e.target.value)}
                    placeholder="X-API-Key"
                    className="w-full px-3.5 py-2 bg-bg border border-border focus:border-accent rounded-xl text-xs font-mono text-text outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-dim">
                    API Key Value
                  </label>
                  <input
                    type="password"
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-3.5 py-2 bg-bg border border-border focus:border-accent rounded-xl text-xs font-mono text-text outline-none"
                  />
                </div>
              </div>
            )}
          </Card>

          {/* Discovery Sources & Scan Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3.5 border border-border">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                <Layers className="h-4 w-4" /> Discovery Sources
              </div>
              <div className="space-y-2 text-xs font-medium text-text-dim">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discoverySources.openapi}
                    onChange={(e) => setDiscoverySources(prev => ({ ...prev, openapi: e.target.checked }))}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>OpenAPI / Swagger Specs (/openapi.json)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discoverySources.jsBundles}
                    onChange={(e) => setDiscoverySources(prev => ({ ...prev, jsBundles: e.target.checked }))}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>JavaScript Static Bundles Analysis</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={discoverySources.crawler}
                    onChange={(e) => setDiscoverySources(prev => ({ ...prev, crawler: e.target.checked }))}
                    className="rounded border-border text-accent focus:ring-accent"
                  />
                  <span>Passive Website Sitemap & Robots.txt</span>
                </label>
              </div>
            </Card>

            <Card className="p-5 space-y-3.5 border border-border">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                <Radio className="h-4 w-4" /> Scan Execution Mode
              </div>
              <div className="space-y-2 text-xs">
                {[
                  { id: "passive", title: "Passive Discovery", desc: "Extract routes and analyze headers without payload testing." },
                  { id: "safe_active", title: "Safe Active (Recommended)", desc: "Perform controlled BOLA, Auth, Property, and Misconfig tests." },
                  { id: "advanced_active", title: "Advanced Active", desc: "Includes deep rate limit & business flow probes." },
                ].map((mode) => (
                  <label key={mode.id} className="flex items-start gap-2.5 cursor-pointer p-1.5 rounded hover:bg-white/5">
                    <input
                      type="radio"
                      name="scanMode"
                      checked={scanMode === mode.id}
                      onChange={() => setScanMode(mode.id)}
                      className="mt-0.5 text-accent focus:ring-accent"
                    />
                    <div>
                      <p className="font-bold text-text">{mode.title}</p>
                      <p className="text-[10px] text-text-dim">{mode.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </Card>
          </div>

          {/* Authorization Requirement Warning Banner */}
          <div className="bg-warning/10 border border-warning/30 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-warning font-bold text-xs uppercase tracking-wide">
              <AlertTriangle className="h-4 w-4" /> Authorization Notice
            </div>
            <p className="text-xs text-text-dim leading-relaxed">
              Only scan APIs that you own or have explicit authorization to test. Unauthorized security testing may violate applicable cyber laws.
            </p>
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-text">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className="rounded border-warning text-accent focus:ring-accent h-4 w-4"
              />
              <span>I confirm that I am authorized to test this target URL.</span>
            </label>
          </div>

          {/* Start Button */}
          <div className="flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={!isConfirmed || loading}
              loading={loading}
              icon={Play}
              className="bg-accent hover:bg-accent/90 text-bg font-bold tracking-wide uppercase px-8"
            >
              Start API Scan
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
