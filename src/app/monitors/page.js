"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useToast } from "@/components/common/Toast";
import Loading from "@/components/common/Loading";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Activity,
  Plus,
  Trash2,
  Mail,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function MonitorsPage() {
  const router = useRouter();
  const toast = useToast();

  const [currentUser, setCurrentUser] = useState(null);
  const [monitors, setMonitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);

  // Form states
  const [newUrl, setNewUrl] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newAlertEmail, setNewAlertEmail] = useState("");

  const loadPageData = useCallback(async () => {
    try {
      // 1. Verify Authentication
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (!authData.loggedIn) {
        router.push("/login");
        return;
      }
      setCurrentUser(authData.user);
      setNewAlertEmail(authData.user.email); // Default alert email to user's registered email

      // 2. Fetch Monitors list
      const monitorsRes = await fetch("/api/monitors");
      const monitorsData = await monitorsRes.json();
      if (monitorsData.success) {
        setMonitors(monitorsData.monitors || []);
      } else {
        toast.error("Failed to load monitors: " + monitorsData.error);
      }
    } catch (err) {
      console.error("Load monitors page error:", err);
      toast.error("An error occurred loading monitors configuration.");
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const handleCreateMonitor = async (e) => {
    e.preventDefault();
    if (!newUrl.trim() || !newAlertEmail.trim()) {
      toast.error("URL and Alert Email are required.");
      return;
    }

    setBtnLoading(true);
    try {
      const res = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newUrl.trim(),
          frequency: newFrequency,
          alertEmail: newAlertEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully configured monitoring schedule for ${data.monitor.domain}`);
        setNewUrl("");
        setNewFrequency("daily");
        setMonitors(prev => [data.monitor, ...prev]);
      } else {
        toast.error(data.error || "Failed to configure monitor schedule.");
      }
    } catch (err) {
      toast.error("Error connecting to monitors configuration API.");
    } finally {
      setBtnLoading(false);
    }
  };

  const handleDeleteMonitor = async (monitorId) => {
    try {
      const res = await fetch("/api/monitors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitorId }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Website monitor deleted successfully.");
        setMonitors(prev => prev.filter(m => m._id !== monitorId));
      } else {
        toast.error(data.error || "Failed to delete monitor.");
      }
    } catch (err) {
      toast.error("Error communicating with monitor deletion API.");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Never checked";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getGradeBadge = (grade) => {
    if (!grade) return <Badge variant="secondary">Pending</Badge>;
    if (grade.startsWith("A")) return <Badge variant="success">{grade}</Badge>;
    if (grade.startsWith("B")) return <Badge variant="accent">{grade}</Badge>;
    if (grade.startsWith("C")) return <Badge variant="warning">{grade}</Badge>;
    return <Badge variant="danger">{grade}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading message="Loading website monitoring dashboard..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent animate-pulse" />
              <h1 className="text-xl font-bold tracking-wide">Continuous Monitoring</h1>
            </div>
            <p className="text-xs text-text-dim mt-0.5">
              Automated point-in-time scanning schedules and regression alerts
            </p>
          </div>
          <Button
            onClick={loadPageData}
            variant="outline"
            size="sm"
            icon={RefreshCw}
          >
            Refresh List
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Setup Card */}
          <div className="lg:col-span-4">
            <Card className="bg-surface/50 border border-border space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Plus className="h-4.5 w-4.5 text-accent" />
                <h2 className="text-xs font-bold uppercase tracking-wider">Add Website Monitor</h2>
              </div>

              <form onSubmit={handleCreateMonitor} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                    Target Endpoint URL
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input
                      type="text"
                      required
                      placeholder="example.com"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-bg border border-border focus:border-accent rounded-lg text-xs text-text transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                    Scanning Frequency
                  </label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full px-3 py-1.5 bg-bg border border-border focus:border-accent rounded-lg text-xs text-text outline-none"
                  >
                    <option value="daily">Every 24 Hours (Daily)</option>
                    <option value="weekly">Every 7 Days (Weekly)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                    Alert Destination Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                    <input
                      type="email"
                      required
                      placeholder="alerts@domain.com"
                      value={newAlertEmail}
                      onChange={(e) => setNewAlertEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-bg border border-border focus:border-accent rounded-lg text-xs text-text transition-all outline-none"
                    />
                  </div>
                  <p className="text-[8px] text-text-dim leading-relaxed">
                    We will send warnings to this inbox if security scores decline.
                  </p>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  className="w-full text-center"
                  disabled={btnLoading}
                >
                  {btnLoading ? "Configuring..." : "Enable Monitoring"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Right: Active Monitors list */}
          <div className="lg:col-span-8 space-y-4">
            <h2 className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
              Active Monitors ({monitors.length})
            </h2>

            {monitors.length === 0 ? (
              <div className="bg-surface/30 border border-border/80 rounded-xl p-8 text-center text-text-dim text-xs font-semibold">
                <AlertTriangle className="h-8 w-8 text-text-muted mx-auto mb-2" />
                No active continuous monitors found. Use the setup form on the left to configure one!
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {monitors.map((m) => (
                  <Card key={m._id} className="bg-surface/50 border border-border/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4.5">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-text truncate max-w-[250px]">
                          {m.domain}
                        </span>
                        <Badge variant="outline" className="text-[8px] py-0 px-2 uppercase tracking-wide">
                          {m.frequency}
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-text-dim">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last Checked: {formatDate(m.lastRun)}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Mail className="h-3 w-3" />
                          Alerts: {m.alertEmail}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 w-full md:w-auto justify-between md:justify-end border-t border-border/40 md:border-t-0 pt-3 md:pt-0">
                      <div className="text-right">
                        <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold mb-0.5">
                          Last Rating
                        </p>
                        <div className="flex items-center gap-1.5 justify-end">
                          {getGradeBadge(m.lastGrade)}
                          {m.lastScore !== undefined && (
                            <span className="text-[11px] font-mono font-bold text-text-dim">
                              {m.lastScore}/100
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMonitor(m._id)}
                        className="text-danger hover:text-danger-light p-2 bg-danger/5 hover:bg-danger/10 border border-danger/20 hover:border-danger/30 rounded-lg transition-all"
                        title="Remove Monitor"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
