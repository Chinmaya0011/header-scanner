"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useToast } from "@/components/common/Toast";
import Loading from "@/components/common/Loading";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Key,
  BookOpen,
  Terminal,
  Cpu,
  Shield,
  Clock,
  AlertCircle,
  Code,
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Lock,
} from "lucide-react";

export default function DevelopersPage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Doc Portal State
  const [activeSection, setActiveSection] = useState("introduction");

  // API Key States
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeyName, setApiKeyName] = useState("");
  const [newKeyGenerated, setNewKeyGenerated] = useState(null);
  const [keysLoading, setKeysLoading] = useState(true);
  const [docsTab, setDocsTab] = useState("curl");

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/auth/api-keys");
      const data = await res.json();
      if (data.success) {
        setApiKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setKeysLoading(false);
    }
  };

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!apiKeyName.trim()) return;
    try {
      const res = await fetch("/api/auth/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: apiKeyName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setApiKeys((prev) => [data.key, ...prev]);
        setNewKeyGenerated(data.key);
        setApiKeyName("");
        toast.success("API key successfully generated.");
      } else {
        toast.error("Failed to generate key: " + data.error);
      }
    } catch (err) {
      toast.error("Error creating API key.");
    }
  };

  const handleRevokeKey = async (keyId) => {
    if (!confirm("Are you sure you want to permanently revoke this API key?")) return;
    try {
      const res = await fetch("/api/auth/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data.success) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
        toast.success("API key revoked.");
      } else {
        toast.error("Failed to revoke key: " + data.error);
      }
    } catch (err) {
      toast.error("Error revoking API key.");
    }
  };

  useEffect(() => {
    async function loadDeveloperData() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) throw new Error("Failed to fetch user session");

        const meData = await meRes.json();
        if (!meData.loggedIn) {
          router.push("/login");
          return;
        }
        setUser(meData.user);
        await fetchApiKeys();
      } catch (err) {
        console.error("Developer page load error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadDeveloperData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading message="Establishing secure API console session..." />
        </main>
      </div>
    );
  }

  const originUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://header-scanner-e3s2.vercel.app";

  // Sidebar Menu Items
  const menuGroups = [
    {
      group: "Getting Started",
      items: [
        { id: "introduction", label: "Introduction", icon: BookOpen },
        { id: "authentication", label: "Authentication", icon: Lock },
        { id: "rate-limits", label: "Rate Limits & Errors", icon: AlertCircle },
      ],
    },
    {
      group: "API Reference",
      items: [{ id: "api-reference", label: "POST Scan Endpoint", icon: Terminal }],
    },
    {
      group: "Developer Console",
      items: [{ id: "credentials", label: "Credentials Manager", icon: Key }],
    },
  ];

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-8">
          {/* Header Banner */}
          <div className="flex items-center gap-3 border-b border-border/80 pb-5">
            <div className="p-2 rounded-lg bg-accent/15 text-accent border border-accent/20">
              <Cpu className="h-6 w-6 text-accent animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wider text-text">
                Developer API Hub
              </h1>
              <p className="text-xs text-text-dim mt-0.5">
                Automate your security posture assessments and configure CI/CD quality gates
              </p>
            </div>
          </div>

          {/* Double Column Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Docs Navigation Sidebar */}
            <aside className="lg:col-span-3 space-y-6">
              <div className="bg-surface/50 border border-border rounded-xl p-4.5 space-y-5">
                {menuGroups.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider pl-2.5">
                      {group.group}
                    </p>
                    <nav className="space-y-1">
                      {group.items.map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-semibold transition-all duration-200 border text-left ${
                              isSelected
                                ? "bg-accent/10 border-accent/30 text-accent font-bold"
                                : "border-transparent text-text-dim hover:text-text hover:bg-panel/30"
                            }`}
                          >
                            <IconComponent className="h-4 w-4 flex-shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </div>
                ))}
              </div>
            </aside>

            {/* Right Column: Active Content Panel */}
            <section className="lg:col-span-9 bg-surface/30 border border-border/80 rounded-xl p-6.5 min-h-[450px]">
              {/* Introduction Page */}
              {activeSection === "introduction" && (
                <div className="space-y-5 animate-fadeInUp">
                  <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-wider">
                      Developer API Introduction
                    </h2>
                    <p className="text-xs text-text-dim mt-1.5 leading-relaxed">
                      The HeaderGuard REST API enables you to programmatic scan domains, verify security compliance headers, and fetch structural reports. Integrate security auditing directly into staging releases, regression checks, or CI pipelines to catch vulnerabilities before code reaches production.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    <Card className="border border-border p-4.5 bg-bg/25">
                      <div className="flex items-center gap-2 mb-2 text-accent font-bold text-xs uppercase tracking-wider">
                        <Terminal className="h-4 w-4" />
                        <span>Build Pipeline Integration</span>
                      </div>
                      <p className="text-[11px] text-text-dim leading-relaxed">
                        Add a scanning step in your Github Actions, GitLab CI, or Jenkins pipelines. Query scan score trends on deployment and fail builds if compliance audits drop below a baseline criteria.
                      </p>
                    </Card>

                    <Card className="border border-border p-4.5 bg-bg/25">
                      <div className="flex items-center gap-2 mb-2 text-success font-bold text-xs uppercase tracking-wider">
                        <Shield className="h-4 w-4" />
                        <span>Extended Audits Integration</span>
                      </div>
                      <p className="text-[11px] text-text-dim leading-relaxed">
                        Audit cookie security properties, CORS configurations, and tech stack server banners programmatically to generate report JSONs for external clients or internal SecOps logs.
                      </p>
                    </Card>
                  </div>

                  <div className="bg-panel/20 border border-border/80 rounded-xl p-4 text-xs leading-relaxed space-y-2">
                    <strong className="text-text font-bold block mb-1">Standard Dev Portal Setup</strong>
                    <ol className="list-decimal list-inside space-y-1 text-text-dim text-[11px]">
                      <li>Navigate to the <button onClick={() => setActiveSection("credentials")} className="text-accent hover:underline font-bold">Credentials Manager</button> tab.</li>
                      <li>Generate a description key.</li>
                      <li>Store the raw API key securely.</li>
                      <li>Send request headers containing <code className="font-mono text-accent">X-API-Key: YOUR_KEY</code>.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Authentication Page */}
              {activeSection === "authentication" && (
                <div className="space-y-5 animate-fadeInUp">
                  <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-wider">
                      Authentication
                    </h2>
                    <p className="text-xs text-text-dim mt-1.5 leading-relaxed">
                      API requests to HeaderGuard must include a valid credentials key sent in the HTTP request headers. Unauthorized requests will fail with a <code className="font-mono text-danger">401 Unauthorized</code> status.
                    </p>
                  </div>

                  <div className="bg-bg/95 border border-border rounded-lg p-4 font-mono text-xs text-accent-light space-y-1 leading-relaxed">
                    <p className="text-text-muted"># Pass authentication token via X-API-Key</p>
                    <p>
                      X-API-Key: <span className="text-success font-bold">hg_sec_a3f9e...</span>
                    </p>
                  </div>

                  <div className="bg-danger/5 border border-danger/20 rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-danger font-bold text-[10px] uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4" />
                      <span>Security Warning</span>
                    </div>
                    <p className="text-text-dim text-[11px] leading-relaxed">
                      Do not commit your API keys to version control (Git repositories). Ensure they are stored safely in build env variables or secure cloud vaults. If a key is leaked, revoke it immediately in the credentials tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Rate Limits Page */}
              {activeSection === "rate-limits" && (
                <div className="space-y-5 animate-fadeInUp">
                  <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-wider">
                      Rate Limits & HTTP Response Status
                    </h2>
                    <p className="text-xs text-text-dim mt-1.5 leading-relaxed">
                      To prevent platform abuse and ensure stable scanning resources, the developer API imposes a standard rate limit of <strong className="text-text">10 requests per minute</strong> per credential token.
                    </p>
                  </div>

                  {/* HTTP Status codes table */}
                  <div className="border border-border/80 rounded-xl overflow-hidden bg-bg/25">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-panel/40 border-b border-border/80 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                          <th className="px-4 py-2.5">HTTP Status</th>
                          <th className="px-4 py-2.5">Description</th>
                          <th className="px-4 py-2.5">Response JSON Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-mono text-text-dim">
                        <tr className="hover:bg-panel/10">
                          <td className="px-4 py-3 text-success font-bold">200 OK</td>
                          <td className="px-4 py-3 font-sans">Scan completed successfully.</td>
                          <td className="px-4 py-3">N/A</td>
                        </tr>
                        <tr className="hover:bg-panel/10">
                          <td className="px-4 py-3 text-warning font-bold">400 Bad Request</td>
                          <td className="px-4 py-3 font-sans">Invalid URL format or missing payload.</td>
                          <td className="px-4 py-3 text-warning">INVALID_URL</td>
                        </tr>
                        <tr className="hover:bg-panel/10">
                          <td className="px-4 py-3 text-danger font-bold">401 Unauthorized</td>
                          <td className="px-4 py-3 font-sans">Missing or invalid X-API-Key token.</td>
                          <td className="px-4 py-3 text-danger">UNAUTHORIZED</td>
                        </tr>
                        <tr className="hover:bg-panel/10">
                          <td className="px-4 py-3 text-danger font-bold">429 Too Many Requests</td>
                          <td className="px-4 py-3 font-sans">Exceeded maximum requests rate boundary.</td>
                          <td className="px-4 py-3 text-danger">RATE_LIMIT_EXCEEDED</td>
                        </tr>
                        <tr className="hover:bg-panel/10">
                          <td className="px-4 py-3 text-text-muted font-bold">502 Bad Gateway</td>
                          <td className="px-4 py-3 font-sans">Failed to establish connection with target site.</td>
                          <td className="px-4 py-3">CONNECTION_FAILED</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* API Reference (POST /api/scan) */}
              {activeSection === "api-reference" && (
                <div className="space-y-6 animate-fadeInUp">
                  <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-wider">
                      Audit Security Headers
                    </h2>
                    <p className="text-xs text-text-dim mt-1.5 leading-relaxed">
                      Triggers a security header scan for the target domain URL, logs the results under your user session history, and evaluates compliance frameworks.
                    </p>
                  </div>

                  {/* Route Badge */}
                  <div className="flex items-center gap-3 bg-panel/30 border border-border/80 p-3 rounded-lg font-mono text-xs">
                    <span className="bg-accent px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider">
                      POST
                    </span>
                    <span className="text-text font-semibold">{originUrl}/api/scan</span>
                  </div>

                  {/* Parameter table */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">
                      Request Parameters (JSON Body)
                    </h3>
                    <div className="border border-border/80 rounded-xl overflow-hidden bg-bg/25">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-panel/40 border-b border-border/80 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                            <th className="px-4 py-2.5">Field</th>
                            <th className="px-4 py-2.5">Type</th>
                            <th className="px-4 py-2.5">Required</th>
                            <th className="px-4 py-2.5">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40 text-text-dim">
                          <tr className="hover:bg-panel/10">
                            <td className="px-4 py-3 font-mono font-semibold text-accent">url</td>
                            <td className="px-4 py-3 font-mono">string</td>
                            <td className="px-4 py-3 text-warning font-bold uppercase text-[9px]">Yes</td>
                            <td className="px-4 py-3 font-sans">The destination address or URL to scan (e.g. "example.com").</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabbed Code Snippet */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">
                        Request Snippet Examples
                      </h3>
                      <div className="flex bg-surface border border-border/80 rounded-md p-0.5">
                        {["curl", "javascript", "python", "go"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setDocsTab(tab)}
                            className={`text-[9px] font-bold px-2 py-0.5 rounded transition-all uppercase tracking-wider ${
                              docsTab === tab
                                ? "bg-accent text-white"
                                : "text-text-dim hover:text-text hover:bg-panel/30"
                            }`}
                          >
                            {tab === "javascript" ? "JS" : tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-bg/95 border border-border rounded-lg p-4 relative group min-h-[60px]">
                      <CopyDocsButton text={getCodeSnippet(docsTab, originUrl)} />
                      <pre className="text-[11px] text-accent font-mono break-all whitespace-pre-wrap overflow-x-auto select-all leading-relaxed">
                        {getCodeSnippet(docsTab, originUrl)}
                      </pre>
                    </div>
                  </div>

                  {/* Schema description details */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-text-dim uppercase tracking-wider">
                      API Response Details
                    </h3>
                    <div className="border border-border bg-bg/25 rounded-xl overflow-hidden">
                      <div className="p-3.5 border-t border-border/40 font-mono text-[9px] text-text-dim/80 space-y-2">
                        <p className="text-[10px] font-bold text-accent">POST /api/scan Response (JSON):</p>
                        <pre className="text-text-muted whitespace-pre-wrap leading-relaxed">
                          {`{
  "success": true,
  "scanId": "6a38c158cd150841c5aba33e",
  "url": "https://example.com",
  "score": 85,
  "grade": "A-",
  "headers": [
    { 
      "name": "Content-Security-Policy", 
      "status": "present", 
      "severity": "critical",
      "value": "default-src 'self'"
    }
  ],
  "vulnerabilities": [
    {
      "id": "vulnerability-server-banner-leak",
      "name": "Verbose Server Version Banner Disclosure",
      "severity": "low",
      "category": "Information Disclosure",
      "description": "The Server header contains detailed version information.",
      "recommendation": "Configure ServerTokens Prod in Apache or server_tokens off in Nginx."
    }
  ],
  "compliance": { 
    "GDPR": { "compliant": true, "recommendation": "Compliant" } 
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Credentials Console page */}
              {activeSection === "credentials" && (
                <div className="space-y-6 animate-fadeInUp">
                  <div>
                    <h2 className="text-lg font-bold text-text uppercase tracking-wider">
                      Developer Credentials Manager
                    </h2>
                    <p className="text-xs text-text-dim mt-1.5 leading-relaxed">
                      Issue client access key identifiers to invoke security header audits over curl/scripts or build integrations.
                    </p>
                  </div>

                  {/* API Key Generation Form */}
                  <Card className="border border-border/80 bg-panel/20 p-5 space-y-4">
                    <form onSubmit={handleCreateKey} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Key identifier description (e.g. GitLab-CI)"
                        value={apiKeyName}
                        onChange={(e) => setApiKeyName(e.target.value)}
                        className="flex-1 px-3 py-2 bg-bg border border-border focus:border-accent rounded-lg text-xs font-mono text-text outline-none"
                      />
                      <Button type="submit" variant="secondary" size="sm">
                        Issue Key
                      </Button>
                    </form>

                    {/* Generated Raw Key display (Once) */}
                    {newKeyGenerated && (
                      <div className="bg-success/5 border border-success/30 rounded-xl p-4 space-y-2 animate-fadeInUp">
                        <p className="text-[9px] text-success font-bold uppercase tracking-wider">
                          Copy API Key (Displayed Once!)
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={newKeyGenerated.rawKey}
                            className="flex-1 bg-bg border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-success select-all outline-none"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(newKeyGenerated.rawKey);
                              toast.success("API key copied to clipboard!");
                            }}
                            type="button"
                            className="text-[9px] font-bold bg-success/20 text-success rounded px-3 py-1.5 border border-success/30 hover:bg-success/35 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <p className="text-[9px] text-text-dim leading-relaxed">
                          Make sure to store this key securely. You will not be able to retrieve it again.
                        </p>
                        <button
                          onClick={() => setNewKeyGenerated(null)}
                          type="button"
                          className="text-[9px] font-bold text-accent hover:underline block pt-1 text-left"
                        >
                          I have saved this key
                        </button>
                      </div>
                    )}

                    {/* Active API Keys list table */}
                    <div className="space-y-3.5 pt-2">
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">
                        Active Credentials
                      </p>
                      {keysLoading ? (
                        <p className="text-xs text-text-dim italic">Loading keys...</p>
                      ) : apiKeys.length === 0 ? (
                        <p className="text-xs text-text-dim italic">No developer keys generated yet.</p>
                      ) : (
                        <div className="border border-border/80 rounded-xl overflow-hidden bg-bg/30 text-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-panel/40 border-b border-border/80 text-[10px] text-text-muted font-bold uppercase tracking-wider">
                                <th className="px-4 py-2.5">Key Name</th>
                                <th className="px-4 py-2.5 font-mono">Issued At</th>
                                <th className="px-4 py-2.5 font-mono">Last Used</th>
                                <th className="px-4 py-2.5 text-right" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 text-text-dim">
                              {apiKeys.map((key) => (
                                <tr key={key.id} className="hover:bg-panel/10">
                                  <td className="px-4 py-3.5 font-bold text-text truncate max-w-[120px]">
                                    {key.name}
                                  </td>
                                  <td className="px-4 py-3.5 font-mono text-[10px]">
                                    {new Date(key.createdAt).toLocaleDateString()}
                                  </td>
                                  <td className="px-4 py-3.5 font-mono text-[10px] text-accent">
                                    {key.lastUsed
                                      ? new Date(key.lastUsed).toLocaleDateString()
                                      : "Never"}
                                  </td>
                                  <td className="px-4 py-3.5 text-right">
                                    <button
                                      onClick={() => handleRevokeKey(key.id)}
                                      type="button"
                                      className="p-1.5 text-danger hover:bg-danger/10 rounded border border-transparent hover:border-danger/20 transition-all flex items-center gap-1 text-[10px] ml-auto uppercase font-bold"
                                      title="Revoke Key"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                      <span>Revoke</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function CopyDocsButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`absolute top-2.5 right-2.5 text-[8px] font-bold border rounded px-2.5 py-1.5 transition-all ${
        copied
          ? "bg-success/20 border-success/30 text-success"
          : "bg-surface border-border text-text-muted hover:text-accent hover:border-accent/40 opacity-0 group-hover:opacity-100 focus:opacity-100"
      }`}
    >
      {copied ? "COPIED" : "COPY"}
    </button>
  );
}

function getCodeSnippet(lang, origin) {
  switch (lang) {
    case "javascript":
      return `fetch('${origin}/api/scan', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({ url: 'example.com' })
})
  .then(res => res.json())
  .then(data => console.log(data));`;
    case "python":
      return `import requests

url = "${origin}/api/scan"
headers = {
    "Content-Type": "application/json",
    "X-API-Key": "YOUR_API_KEY"
}
payload = { "url": "example.com" }

response = requests.post(url, json=payload, headers=headers)
print(response.json())`;
    case "go":
      return `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
)

func main() {
    payload := map[string]string{"url": "example.com"}
    jsonVal, _ := json.Marshal(payload)

    req, _ := http.NewRequest("POST", "${origin}/api/scan", bytes.NewBuffer(jsonVal))
    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("X-API-Key", "YOUR_API_KEY")

    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
    fmt.Println("Status:", resp.Status)
}`;
    default:
      return `curl -X POST ${origin}/api/scan \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"url": "example.com"}'`;
  }
}
