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
  Copy,
  Check,
  Trash2,
  ExternalLink,
  Lock,
  BarChart3,
  Settings,
  Activity,
  Globe,
  Power,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export default function DevelopersPage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Doc Portal State
  const [activeSection, setActiveSection] = useState("credentials");

  // API Key States
  const [apiKeys, setApiKeys] = useState([]);
  const [apiKeyName, setApiKeyName] = useState("");
  const [newKeyGenerated, setNewKeyGenerated] = useState(null);
  const [keysLoading, setKeysLoading] = useState(true);
  const [docsTab, setDocsTab] = useState("curl");

  // Usage Monitor States
  const [usageData, setUsageData] = useState(null);
  const [usageLoading, setUsageLoading] = useState(true);

  // Editing Key State
  const [editingKeyId, setEditingKeyId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    isActive: true,
    webhookUrl: "",
    allowedDomains: "",
    customUserAgent: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const fetchUsageData = async () => {
    setUsageLoading(true);
    try {
      const res = await fetch("/api/auth/api-keys/usage");
      const data = await res.json();
      if (data.success) {
        setUsageData(data.data);
      }
    } catch (err) {
      console.error("Failed to load API usage statistics:", err);
    } finally {
      setUsageLoading(false);
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
        fetchUsageData();
      } else {
        toast.error("Failed to generate key: " + data.error);
      }
    } catch (err) {
      toast.error("Error creating API key.");
    }
  };

  const handleRevokeKey = async (keyId) => {
    try {
      const res = await fetch("/api/auth/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });
      const data = await res.json();
      if (data.success) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
        toast.success("API key revoked successfully.");
        if (editingKeyId === keyId) setEditingKeyId(null);
        fetchUsageData();
      } else {
        toast.error("Failed to revoke key: " + data.error);
      }
    } catch (err) {
      toast.error("Error revoking API key.");
    }
  };

  const handleRegenerateKey = async (keyId) => {
    try {
      const res = await fetch("/api/auth/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateKeyId: keyId }),
      });
      const data = await res.json();
      if (data.success) {
        setApiKeys((prev) => prev.map((k) => k.id === keyId ? data.key : k));
        setNewKeyGenerated(data.key);
        toast.success("API key regenerated successfully!");
        fetchUsageData();
      } else {
        toast.error("Failed to regenerate key: " + data.error);
      }
    } catch (err) {
      toast.error("Error regenerating API key.");
    }
  };

  const handleStartEdit = (key) => {
    if (editingKeyId === key.id) {
      setEditingKeyId(null);
    } else {
      setEditingKeyId(key.id);
      setEditForm({
        name: key.name || "",
        isActive: key.isActive !== false,
        webhookUrl: key.webhookUrl || "",
        allowedDomains: key.allowedDomains || "",
        customUserAgent: key.customUserAgent || "",
      });
    }
  };

  const handleSaveSettings = async (keyId) => {
    setUpdateLoading(true);
    try {
      const res = await fetch("/api/auth/api-keys", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyId,
          name: editForm.name,
          isActive: editForm.isActive,
          webhookUrl: editForm.webhookUrl,
          allowedDomains: editForm.allowedDomains,
          customUserAgent: editForm.customUserAgent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Key configurations updated successfully.");
        setEditingKeyId(null);
        fetchApiKeys();
        fetchUsageData();
      } else {
        toast.error("Update failed: " + data.error);
      }
    } catch (err) {
      toast.error("Error updating key configurations.");
    } finally {
      setUpdateLoading(false);
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
        await fetchUsageData();
      } catch (err) {
        console.error("Developer page load error:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadDeveloperData();
  }, [router]);

  useEffect(() => {
    if (activeSection === "usage-monitor") {
      fetchUsageData();
    }
  }, [activeSection]);

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
      : "http://localhost:3000";

  // Sidebar Menu Items
  const menuGroups = [
    {
      group: "Developer Console",
      items: [
        { id: "credentials", label: "Credentials Manager", icon: Key },
        { id: "usage-monitor", label: "Usage Monitor & Charts", icon: BarChart3 },
      ],
    },
    {
      group: "Getting Started",
      items: [
        { id: "introduction", label: "Introduction", icon: BookOpen },
        { id: "authentication", label: "Authentication", icon: Lock },
        { id: "rate-limits", label: "Limits & Error Codes", icon: AlertCircle },
      ],
    },
    {
      group: "API Reference",
      items: [{ id: "api-reference", label: "POST Scan Endpoint", icon: Terminal }],
    },
  ];

  const latestUsedTime = apiKeys.reduce((latest, key) => {
    if (!key.lastUsed) return latest;
    const time = new Date(key.lastUsed);
    return !latest || time > latest ? time : latest;
  }, null);

  const statsCardsRow = (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      <Card>
        <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider font-sans">Key Status</p>
        <p className="text-xl font-bold font-mono text-text mt-1.5">
          {apiKeys.filter(k => k.isActive).length} <span className="text-xs text-text-dim font-sans font-normal">Active</span>
        </p>
        <p className="text-[8px] text-text-muted mt-1 uppercase">{apiKeys.length} issued total</p>
      </Card>
      
      <Card>
        <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider font-sans">Daily Limit</p>
        <p className="text-xl font-bold font-mono text-accent mt-1.5">
          {usageData?.dailyQuota?.limit || 20}
        </p>
        <p className="text-[8px] text-text-muted mt-1 uppercase">Max quota allowed</p>
      </Card>

      <Card>
        <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider font-sans">Used Requests</p>
        <p className="text-xl font-bold font-mono text-warning mt-1.5">
          {usageData?.dailyQuota?.usage || 0}
        </p>
        <p className="text-[8px] text-text-muted mt-1 uppercase">Usage since 00:00 UTC</p>
      </Card>

      <Card>
        <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider font-sans">Remaining</p>
        <p className="text-xl font-bold font-mono text-success mt-1.5">
          {Math.max(0, (usageData?.dailyQuota?.limit || 20) - (usageData?.dailyQuota?.usage || 0))}
        </p>
        <p className="text-[8px] text-text-muted mt-1 uppercase">Left for today</p>
      </Card>

      <Card className="col-span-2 sm:col-span-1">
        <p className="text-[9px] text-text-dim font-bold uppercase tracking-wider font-sans">Last Used Time</p>
        <p className="text-[10px] font-bold font-mono text-text mt-2.5 truncate" title={latestUsedTime ? new Date(latestUsedTime).toLocaleString() : "Never"}>
          {latestUsedTime ? new Date(latestUsedTime).toLocaleDateString() : "Never"}
        </p>
        <p className="text-[8px] text-text-muted mt-1.5 uppercase">Latest API execution</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg font-sans text-text flex flex-col">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 py-8 w-full">
        <div className="flex flex-col gap-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.05]">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-accent/10 text-accent flex-shrink-0">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text">
                  Developer API Hub
                </h1>
                <p className="text-xs text-text-dim mt-0.5">
                  Automate security scanning, manage credentials, and monitor consumption.
                </p>
              </div>
            </div>
            {usageData?.dailyQuota && (
              <div className="flex items-center gap-3 bg-surface border border-white/[0.05] rounded-xl px-4 py-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Daily Request Quota</span>
                    {!usageData.dailyQuota.apiAccessEnabled && (
                      <span className="bg-danger/25 text-danger border border-danger/30 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">Blocked</span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-bold text-text">
                    {usageData.dailyQuota.usage} / {usageData.dailyQuota.limit} <span className="text-text-muted font-normal">used today</span>
                  </div>
                </div>
                <div className="w-12 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      !usageData.dailyQuota.apiAccessEnabled ? "bg-danger" :
                      usageData.dailyQuota.usage >= usageData.dailyQuota.limit ? "bg-danger" : 
                      usageData.dailyQuota.usage >= usageData.dailyQuota.limit * 0.85 ? "bg-warning" : "bg-accent"
                    }`}
                    style={{ width: `${Math.min(100, (usageData.dailyQuota.usage / usageData.dailyQuota.limit) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Double Column Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Docs Navigation Sidebar */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 self-start">
              <div className="space-y-5 bg-surface border border-white/[0.05] p-4.5 rounded-xl">
                {menuGroups.map((group) => (
                  <div key={group.group} className="space-y-1.5">
                    <p className="text-[9px] text-text-muted font-bold uppercase tracking-wider pl-2.5">
                      {group.group}
                    </p>
                    <nav className="space-y-0.5">
                      {group.items.map((item) => {
                        const IconComponent = item.icon;
                        const isSelected = activeSection === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveSection(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg font-bold uppercase tracking-wider transition-all duration-200 text-left ${
                              isSelected
                                ? "bg-accent/15 text-accent border border-accent/20"
                                : "text-text-dim hover:text-text hover:bg-white/5 border border-transparent"
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

            {/* Right Column: Scrollable Content Panel */}
            <section className="lg:col-span-9 space-y-6">
              {/* Credentials Console page */}
              {activeSection === "credentials" && (
                <div className="space-y-6 animate-fadeInUp">
                  {statsCardsRow}
                  <div className="bg-surface border border-white/[0.05] p-6 rounded-xl space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-text uppercase tracking-wider">
                        API Credentials Manager
                      </h2>
                      <p className="text-xs text-text-dim mt-1">
                        Configure access tokens, setup domain locking, custom user-agents, and asynchronous webhooks.
                      </p>
                    </div>

                    {/* API Key Generation Form */}
                    <form onSubmit={handleCreateKey} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Friendly identifier (e.g. Production CI/CD)"
                        value={apiKeyName}
                        onChange={(e) => setApiKeyName(e.target.value)}
                        className="flex-1 px-3.5 py-2 bg-bg border border-white/[0.05] rounded-lg text-xs font-mono text-text outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-all placeholder:text-text-muted"
                      />
                      <Button type="submit" variant="primary" size="md">
                        Generate Key
                      </Button>
                    </form>

                    {/* Generated Raw Key display (Once) */}
                    {newKeyGenerated && (
                      <div className="bg-success/5 rounded-xl p-5 space-y-3 border border-success/15 animate-fadeInUp">
                        <p className="text-[10px] text-success font-bold uppercase tracking-wider">
                          Copy API Key (Displayed Once!)
                        </p>
                        <div className="flex items-center gap-3">
                          <input
                            type="text"
                            readOnly
                            value={newKeyGenerated.rawKey}
                            className="flex-1 bg-bg rounded-lg px-3 py-2 text-xs font-mono text-success select-all outline-none border border-success/10"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(newKeyGenerated.rawKey);
                              toast.success("API key copied to clipboard!");
                            }}
                            type="button"
                            className="text-[10px] font-bold uppercase tracking-wide bg-success/20 text-success px-4 py-2.5 rounded-lg hover:bg-success/30 transition-colors"
                          >
                            Copy Key
                          </button>
                        </div>
                        <p className="text-[10px] text-text-dim leading-relaxed uppercase">
                          Make sure to copy this key now. You will not be able to view it again once you close this message.
                        </p>
                        <button
                          onClick={() => setNewKeyGenerated(null)}
                          type="button"
                          className="text-[10px] font-bold text-accent hover:underline block pt-1 text-left uppercase"
                        >
                          I have saved this key
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active API Keys list */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] text-text-muted uppercase tracking-wider font-bold pl-1">
                      Active API Credentials
                    </h3>
                    {keysLoading ? (
                      <Card className="text-center py-10 text-xs text-text-dim italic">Loading credentials...</Card>
                    ) : apiKeys.length === 0 ? (
                      <Card className="text-center py-10 text-xs text-text-dim italic">No developer keys generated yet.</Card>
                    ) : (
                      <div className="space-y-3.5">
                        {apiKeys.map((key) => {
                          const isEditing = editingKeyId === key.id;
                          return (
                            <div key={key.id} className="bg-surface border border-white/[0.05] rounded-xl overflow-hidden transition-all duration-200">
                              {/* Key Main Item Row */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 gap-4">
                                <div className="space-y-1 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-text truncate max-w-[200px]">
                                      {key.name}
                                    </span>
                                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                      key.isActive ? 'bg-success/10 text-success border border-success/20' : 'bg-text-muted/10 text-text-muted border border-white/5'
                                    }`}>
                                      {key.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-dim">
                                    <span>Issued: {new Date(key.createdAt).toLocaleDateString()}</span>
                                    <span>Last Used: {key.lastUsed ? new Date(key.lastUsed).toLocaleDateString() : "Never"}</span>
                                    {key.webhookUrl && <span className="text-accent">Webhook Active</span>}
                                    {key.allowedDomains && <span className="text-warning">Domains Restricted</span>}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto justify-end">
                                  <button
                                    onClick={() => handleStartEdit(key)}
                                    type="button"
                                    className={`px-3 py-1.5 rounded-lg transition-all border flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${
                                      isEditing 
                                        ? "bg-accent/10 border-accent/30 text-accent" 
                                        : "bg-transparent border-white/[0.05] text-text-dim hover:text-text hover:bg-white/5"
                                    }`}
                                  >
                                    <Settings className="h-3.5 w-3.5" />
                                    <span>{isEditing ? "Close" : "Configure"}</span>
                                  </button>

                                  <button
                                    onClick={() => handleRegenerateKey(key.id)}
                                    type="button"
                                    className="px-3 py-1.5 text-accent hover:bg-accent/10 border border-white/[0.05] rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                                    title="Generate new key value under same identifier"
                                  >
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    <span>Regen</span>
                                  </button>

                                  <button
                                    onClick={() => handleRevokeKey(key.id)}
                                    type="button"
                                    className="px-3 py-1.5 text-danger hover:bg-danger/10 border border-transparent rounded-lg transition-all flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider"
                                    title="Revoke Key"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Revoke</span>
                                  </button>
                                </div>
                              </div>

                              {/* Expandable Configure Settings Panel */}
                              {isEditing && (
                                <div className="px-5 pb-5 pt-4.5 bg-white/[0.01] border-t border-white/[0.05] space-y-4 animate-fadeInUp">
                                  <h4 className="text-[10px] font-bold text-accent uppercase tracking-wider">
                                    Settings: {key.name}
                                  </h4>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Key Name & Active Switch */}
                                    <div className="space-y-4">
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">
                                          Friendly Name / Description
                                        </label>
                                        <input
                                          type="text"
                                          value={editForm.name}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                          className="w-full px-3 py-2 bg-bg border border-white/[0.05] focus:border-accent/40 rounded-lg text-xs font-mono text-text outline-none transition-all"
                                        />
                                      </div>

                                      <div className="space-y-1.5">
                                        <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">
                                          API Key Status Toggle
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                                            editForm.isActive 
                                              ? "bg-success/10 text-success border-success/20" 
                                              : "bg-danger/10 text-danger border-danger/20"
                                          }`}
                                        >
                                          <span>{editForm.isActive ? "Key is Active" : "Key is Inactive/Disabled"}</span>
                                          <Power className="h-4 w-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Webhook & Domains lock */}
                                    <div className="space-y-4">
                                      <div className="space-y-1.5">
                                        <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">
                                          Domain Lock Constraints
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="e.g. example.com, api.yoursite.org (Optional)"
                                          value={editForm.allowedDomains}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, allowedDomains: e.target.value }))}
                                          className="w-full px-3 py-2 bg-bg border border-white/[0.05] focus:border-accent/40 rounded-lg text-xs font-mono text-text placeholder:text-text-muted/40 outline-none transition-all"
                                        />
                                        <p className="text-[8px] text-text-muted uppercase">
                                          Restrict this key to scan specific domains. Separated by commas.
                                        </p>
                                      </div>

                                      <div className="space-y-1.5">
                                        <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">
                                          Custom User-Agent Header Override
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="HeaderGuard-Scanner/2.0 (Optional)"
                                          value={editForm.customUserAgent}
                                          onChange={(e) => setEditForm(prev => ({ ...prev, customUserAgent: e.target.value }))}
                                          className="w-full px-3 py-2 bg-bg border border-white/[0.05] focus:border-accent/40 rounded-lg text-xs font-mono text-text placeholder:text-text-muted/40 outline-none transition-all"
                                        />
                                        <p className="text-[8px] text-text-muted uppercase">
                                          Override user-agent string used when fetching headers.
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Webhook Callback Field */}
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] text-text-muted font-bold uppercase tracking-wider block">
                                      Webhook Endpoint URL
                                    </label>
                                    <input
                                      type="url"
                                      placeholder="https://api.yourdomain.com/webhooks/headerguard"
                                      value={editForm.webhookUrl}
                                      onChange={(e) => setEditForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                                      className="w-full px-3 py-2 bg-bg border border-white/[0.05] focus:border-accent/40 rounded-lg text-xs font-mono text-text placeholder:text-text-muted/40 outline-none transition-all"
                                    />
                                    <p className="text-[8px] text-text-muted uppercase">
                                      Receive an HTTP POST callback with full results on scan completion.
                                    </p>
                                  </div>

                                  {/* Save and cancel */}
                                  <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.05]">
                                    <button
                                      onClick={() => setEditingKeyId(null)}
                                      type="button"
                                      className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-all"
                                    >
                                      Cancel
                                    </button>
                                    <Button
                                      onClick={() => handleSaveSettings(key.id)}
                                      disabled={updateLoading}
                                      variant="primary"
                                      size="sm"
                                      loading={updateLoading}
                                    >
                                      Update Settings
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Usage Monitor & Logs Page */}
              {activeSection === "usage-monitor" && (
                <div className="space-y-6 animate-fadeInUp">
                  {usageLoading ? (
                    <Card className="text-center py-20 text-text-dim italic text-xs">
                      Loading usage metrics and analytics charts...
                    </Card>
                  ) : !usageData ? (
                    <Card className="text-center py-20 text-text-dim italic text-xs">
                      Failed to fetch usage metrics.
                    </Card>
                  ) : (
                    <>
                      {/* Metrics grid */}
                      {statsCardsRow}

                      {/* Recharts API Analytics Chart */}
                      {mounted && usageData.chartData && (
                        <Card className="p-5">
                          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/[0.05]">
                            <div>
                              <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                                API Request History
                              </h3>
                              <p className="text-[9px] text-text-dim uppercase mt-0.5">
                                Breakdown of successful vs failed scan queries
                              </p>
                            </div>
                          </div>
                          <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={usageData.chartData}
                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                  dataKey="date" 
                                  stroke="rgba(255,255,255,0.4)" 
                                  fontSize={10}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis 
                                  stroke="rgba(255,255,255,0.4)" 
                                  fontSize={10}
                                  tickLine={false}
                                  axisLine={false}
                                  allowDecimals={false}
                                />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: "#16161a", 
                                    borderColor: "rgba(255,255,255,0.08)",
                                    borderRadius: "8px",
                                    fontSize: "11px",
                                    fontFamily: "monospace"
                                  }} 
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="success" 
                                  stroke="#10b981" 
                                  strokeWidth={2}
                                  fillOpacity={1} 
                                  fill="url(#colorSuccess)" 
                                  name="Successful Scans"
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="failed" 
                                  stroke="#ef4444" 
                                  strokeWidth={2}
                                  fillOpacity={1} 
                                  fill="url(#colorFailed)" 
                                  name="Failed Scans"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      )}

                      {/* Keys utilization progress breakdown */}
                      <Card className="p-5">
                        <h3 className="text-xs font-bold text-text uppercase tracking-wider pb-3 border-b border-white/[0.05]">
                          Credentials Consumption Shares
                        </h3>
                        <div className="mt-4 space-y-4.5 text-xs">
                          {usageData.keyBreakdown.length === 0 ? (
                            <p className="italic text-text-muted text-center py-4">No API usage recorded yet for active credentials.</p>
                          ) : (
                            usageData.keyBreakdown.map(key => {
                              const pct = usageData.metrics.total > 0 ? (key.count / usageData.metrics.total) * 100 : 0;
                              return (
                                <div key={key.id} className="space-y-1.5">
                                  <div className="flex justify-between font-mono text-[10px]">
                                    <span className="font-bold text-text truncate max-w-[250px]">{key.name}</span>
                                    <span className="text-text-dim">{key.count} scans ({Math.round(pct)}%)</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full ${key.isActive ? 'bg-accent' : 'bg-text-muted'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </Card>

                      {/* Recent API scan logs */}
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider pl-1">
                          Recent API Scans History log
                        </h3>
                        <div className="rounded-xl border border-white/[0.05] overflow-hidden bg-surface">
                          {usageData.recentScans.length === 0 ? (
                            <div className="p-10 text-center text-text-dim italic text-xs">
                              No recent API request records found.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-white/5 text-[9px] text-text-muted font-bold uppercase tracking-wider border-b border-white/[0.05]">
                                    <th className="px-5 py-3">Domain</th>
                                    <th className="px-5 py-3 text-center">Score</th>
                                    <th className="px-5 py-3 text-center">Grade</th>
                                    <th className="px-5 py-3">Key Used</th>
                                    <th className="px-5 py-3">Timestamp</th>
                                    <th className="px-5 py-3 text-right" />
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                  {usageData.recentScans.map(scan => (
                                    <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                                      <td className="px-5 py-3 font-mono font-semibold text-text truncate max-w-[160px]">
                                        {scan.domain}
                                      </td>
                                      <td className="px-5 py-3 text-center font-mono text-text">
                                        {scan.score}/100
                                      </td>
                                      <td className="px-5 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                          scan.grade.startsWith("A") ? 'bg-success/15 text-success' :
                                          scan.grade.startsWith("B") ? 'bg-accent/15 text-accent' :
                                          scan.grade.startsWith("C") ? 'bg-warning/15 text-warning' :
                                          'bg-danger/15 text-danger'
                                        }`}>
                                          {scan.grade}
                                        </span>
                                      </td>
                                      <td className="px-5 py-3 text-text-dim font-mono max-w-[120px] truncate">
                                        {scan.keyName}
                                      </td>
                                      <td className="px-5 py-3 text-text-muted font-mono text-[10px]">
                                        {new Date(scan.createdAt).toLocaleDateString()} {new Date(scan.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </td>
                                      <td className="px-5 py-3 text-right">
                                        <a 
                                          href={`/scan/${scan.id}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-accent hover:text-accent-light font-bold text-[10px] uppercase inline-flex items-center gap-1.5"
                                        >
                                          <span>View</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Introduction Page */}
              {activeSection === "introduction" && (
                <div className="space-y-6 animate-fadeInUp">
                  <div className="bg-surface border border-white/[0.05] p-6 rounded-xl space-y-4">
                    <h2 className="text-base font-bold text-text tracking-tight uppercase">
                      Developer API Introduction
                    </h2>
                    <p className="text-xs text-text-dim leading-relaxed">
                      The HeaderGuard REST API allows developers to audit web headers, analyze security postures, and extract structured compliance metrics programmatically. Integrate scanning directly into staging releases or CI environments to identify visual vulnerabilities and security header compliance gaps early.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-surface border border-white/[0.05] p-5 rounded-xl">
                      <div className="flex items-center gap-2 mb-3 text-accent font-semibold text-xs uppercase tracking-wider">
                        <Terminal className="h-4.5 w-4.5" />
                        <span>Pipeline Integrations</span>
                      </div>
                      <p className="text-xs text-text-dim leading-relaxed">
                        Add a scanning task inside your GitHub Actions, GitLab CI, or local deployment hooks. Query scan report endpoints and set validation guidelines to block uncompliant deployments.
                      </p>
                    </div>

                    <div className="bg-surface border border-white/[0.05] p-5 rounded-xl">
                      <div className="flex items-center gap-2 mb-3 text-success font-semibold text-xs uppercase tracking-wider">
                        <Shield className="h-4.5 w-4.5" />
                        <span>Security Auditing</span>
                      </div>
                      <p className="text-xs text-text-dim leading-relaxed">
                        Examine HSTS parameters, Content Security Policies, cookie properties, and information disclosures. Save reports automatically to SecOps log aggregates.
                      </p>
                    </div>
                  </div>

                  <div className="bg-surface border border-white/[0.05] rounded-xl p-5 text-xs leading-relaxed space-y-3">
                    <strong className="text-text font-bold uppercase tracking-wider block">Quick Start Guide</strong>
                    <ol className="list-decimal list-inside space-y-2 text-text-dim">
                      <li>Go to the <button onClick={() => setActiveSection("credentials")} className="text-accent hover:underline font-bold uppercase text-[10px]">Credentials Manager</button>.</li>
                      <li>Generate a new API token.</li>
                      <li>Copy the generated raw key and store it securely.</li>
                      <li>Set your requests to target the <button onClick={() => setActiveSection("api-reference")} className="text-accent hover:underline font-bold uppercase text-[10px]">POST Scan Endpoint</button> using your API key.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Authentication Page */}
              {activeSection === "authentication" && (
                <div className="space-y-6 animate-fadeInUp">
                  <div className="bg-surface border border-white/[0.05] p-6 rounded-xl space-y-4">
                    <h2 className="text-base font-bold text-text tracking-tight uppercase">
                      API Authentication
                    </h2>
                    <p className="text-xs text-text-dim leading-relaxed">
                      API requests to HeaderGuard must authenticate using a token passed via the HTTP request headers. Requests lacking a valid key will reject with a <code className="font-mono text-danger bg-danger/10 px-2 py-0.5 rounded text-[11px]">401 Unauthorized</code> error.
                    </p>
                  </div>

                  <div className="bg-surface border border-white/[0.05] rounded-xl p-5 font-mono text-xs text-accent space-y-1 leading-relaxed">
                    <p className="text-text-muted"># Target scanning headers using X-API-Key</p>
                    <p>
                      X-API-Key: <span className="text-success font-semibold">hg_sec_a3f9e...</span>
                    </p>
                  </div>

                  <div className="bg-danger/5 border border-danger/15 rounded-xl p-5 space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-danger font-bold text-[10px] uppercase tracking-wider">
                      <AlertCircle className="h-4 w-4" />
                      <span>Security Best Practices</span>
                    </div>
                    <p className="text-text-dim leading-relaxed">
                      Do not expose your API key in front-end client code or public git vaults. If a key is leaked or compromised, revoke it immediately in the Credentials console page and issue a replacement token.
                    </p>
                  </div>
                </div>
              )}

              {/* Rate Limits Page */}
              {activeSection === "rate-limits" && (
                <div className="space-y-6 animate-fadeInUp">
                  <div className="bg-surface border border-white/[0.05] p-6 rounded-xl space-y-4">
                    <h2 className="text-base font-bold text-text tracking-tight uppercase">
                      API Quota Limits & Error Codes
                    </h2>
                    <p className="text-xs text-text-dim leading-relaxed">
                      To safeguard network resources and ensure reliable performance, the Developer API implements two limits:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-xs text-text-dim">
                      <li><strong className="text-text">Sliding Rate Limit:</strong> Max <strong className="text-text">10 requests per minute</strong> per API key.</li>
                      <li><strong className="text-text">Daily Quota Limit:</strong> Max <strong className="text-text">20 requests per day</strong> by default (adjustable by admin).</li>
                    </ul>
                  </div>

                  {/* HTTP Status codes table */}
                  <div className="rounded-xl overflow-hidden border border-white/[0.05] bg-surface">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-white/5 text-[9px] text-text-muted font-bold uppercase tracking-wider border-b border-white/[0.05]">
                          <th className="px-5 py-3">HTTP Status</th>
                          <th className="px-5 py-3">Error Code</th>
                          <th className="px-5 py-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.05]">
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-5 py-3.5 text-success font-bold font-mono">200 OK</td>
                          <td className="px-5 py-3.5 font-mono text-text-muted">-</td>
                          <td className="px-5 py-3.5 text-text-dim">Scan completed successfully.</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-5 py-3.5 text-warning font-bold font-mono">400 Bad Request</td>
                          <td className="px-5 py-3.5 font-mono text-warning">INVALID_URL / PRIVATE_IP_BLOCKED</td>
                          <td className="px-5 py-3.5 text-text-dim">Invalid formatting, or attempting to scan localhost/private IPs.</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-5 py-3.5 text-danger font-bold font-mono">401 Unauthorized</td>
                          <td className="px-5 py-3.5 font-mono text-danger">UNAUTHORIZED</td>
                          <td className="px-5 py-3.5 text-text-dim">Invalid token or missing X-API-Key request headers.</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-5 py-3.5 text-danger font-bold font-mono">403 Forbidden</td>
                          <td className="px-5 py-3.5 font-mono text-danger">DOMAIN_RESTRICTED / API_ACCESS_DISABLED</td>
                          <td className="px-5 py-3.5 text-text-dim">Domain restriction mismatch, or account API access suspended by administrator.</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="px-5 py-3.5 text-danger font-bold font-mono">429 Too Many Requests</td>
                          <td className="px-5 py-3.5 font-mono text-danger">RATE_LIMIT_EXCEEDED / QUOTA_EXCEEDED</td>
                          <td className="px-5 py-3.5 text-text-dim">Exceeded the sliding rate limit or your absolute daily API requests quota.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* API Reference (POST /api/scan) */}
              {activeSection === "api-reference" && (
                <div className="space-y-6 animate-fadeInUp">
                  <div className="bg-surface border border-white/[0.05] p-6 rounded-xl space-y-4">
                    <h2 className="text-base font-bold text-text tracking-tight uppercase">
                      POST Scan Endpoint
                    </h2>
                    <p className="text-xs text-text-dim leading-relaxed">
                      Trigger a remote security header scan, execute compliance audits, identify header vulnerabilities, and log the scan event.
                    </p>
                  </div>

                  {/* Route Badge */}
                  <div className="flex items-center gap-3 bg-surface border border-white/[0.05] p-4.5 rounded-xl font-mono text-xs">
                    <span className="bg-accent px-2.5 py-1 rounded text-[9px] font-bold text-bg uppercase tracking-wider">
                      POST
                    </span>
                    <span className="text-text font-bold">{originUrl}/api/scan</span>
                  </div>

                  {/* Parameter table */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider pl-1">
                      Request JSON Payload
                    </h3>
                    <div className="rounded-xl border border-white/[0.05] overflow-hidden bg-surface">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-white/5 text-[9px] text-text-muted font-bold uppercase tracking-wider border-b border-white/[0.05]">
                            <th className="px-5 py-3">Field</th>
                            <th className="px-5 py-3">Type</th>
                            <th className="px-5 py-3">Required</th>
                            <th className="px-5 py-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          <tr className="hover:bg-white/[0.01]">
                            <td className="px-5 py-3.5 font-mono font-bold text-accent">url</td>
                            <td className="px-5 py-3.5 font-mono text-text-dim">string</td>
                            <td className="px-5 py-3.5 text-warning font-bold uppercase text-[9px]">Yes</td>
                            <td className="px-5 py-3.5 text-text-dim">The target domain to perform audit against (e.g. "github.com").</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Tabbed Code Snippet */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2 pl-1">
                      <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider">
                        Client Snippet Code Examples
                      </h3>
                      <div className="flex bg-surface border border-white/[0.05] rounded-lg p-0.5">
                        {["curl", "javascript", "python", "go"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setDocsTab(tab)}
                            className={`text-[9px] font-bold px-3 py-1 rounded transition-all uppercase tracking-wider ${
                              docsTab === tab
                                ? "bg-accent/15 text-accent border border-accent/20"
                                : "text-text-dim hover:text-text border border-transparent"
                            }`}
                          >
                            {tab === "javascript" ? "JS" : tab}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-surface border border-white/[0.05] rounded-xl p-5 relative group min-h-[60px]">
                      <CopyDocsButton text={getCodeSnippet(docsTab, originUrl)} />
                      <pre className="text-xs text-accent font-mono break-all whitespace-pre-wrap overflow-x-auto select-all leading-relaxed pt-2">
                        {getCodeSnippet(docsTab, originUrl)}
                      </pre>
                    </div>
                  </div>

                  {/* Schema description details */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-bold text-text-dim uppercase tracking-wider pl-1">
                      Success Response JSON Payload
                    </h3>
                    <div className="bg-surface border border-white/[0.05] rounded-xl overflow-hidden">
                      <div className="p-5 font-mono text-[11px] text-text-dim/80 space-y-3">
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
      "category": "Information Disclosure"
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
      className={`absolute top-3.5 right-3.5 text-[9px] font-semibold border rounded-lg px-2.5 py-1.5 transition-all ${
        copied
          ? "bg-success/15 border-success/30 text-success"
          : "bg-surface border-white/[0.05] text-text-muted hover:text-accent hover:border-accent/30 opacity-0 group-hover:opacity-100 focus:opacity-100"
      }`}
    >
      {copied ? "COPIED" : "COPY CODE"}
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