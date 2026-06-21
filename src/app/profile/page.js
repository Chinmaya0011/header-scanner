"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import Loading from "@/components/Loading";
import { Shield, Key, Mail, Award, Clock, FileText, ChevronRight, User } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalScans: 0, averageScore: 0 });
  
  // Password change form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      try {
        // Fetch current user details
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();
        
        if (!meData.loggedIn) {
          router.push("/login");
          return;
        }
        
        setUser(meData.user);

        // Fetch user scans summary
        const scansRes = await fetch("/api/scans?limit=1");
        const scansData = await scansRes.json();
        
        if (scansData.success && scansData.data?.summary) {
          setStats({
            totalScans: scansData.data.pagination.totalScans || 0,
            averageScore: scansData.data.summary.averageScore || 0,
          });
        }
      } catch (err) {
        console.error("Profile load error:", err);
        toast.error("Failed to load operator credentials.");
      } finally {
        setLoading(false);
      }
    }
    
    loadProfileData();
  }, [router, toast]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setPasswordLoading(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update security credentials.");
      }

      toast.success("Security credentials updated successfully.");
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col text-text font-mono">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading message="Fetching secure console operator records..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col text-text font-mono">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fadeInUp">
        
        {/* Page Header */}
        <div className="border-b border-border/40 pb-6">
          <div className="flex items-center gap-2.5">
            <User className="text-accent h-6 w-6" />
            <h1 className="text-2xl font-bold tracking-wider text-text">Operator Profile</h1>
          </div>
          <p className="text-text-dim text-xs mt-1">
            Console credential configuration and authorization details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Profile Metadata Card */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-surface border border-border rounded-xl p-5 shadow-glow relative overflow-hidden">
              {/* Scanline decoration */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/10">
                <div className="h-full w-1/4 bg-accent/40 animate-pulse" />
              </div>
              
              <div className="flex flex-col items-center text-center space-y-4 pb-4 border-b border-border/30">
                <div className="h-16 w-16 rounded-full bg-accent/10 border border-accent/30 text-accent flex items-center justify-center shadow-glow mb-2">
                  <Shield className="h-8 w-8 animate-pulse" />
                </div>
                <div>
                  <h2 className="font-bold text-sm text-text truncate max-w-[180px]" title={user?.email}>
                    {user?.email}
                  </h2>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded border font-bold uppercase tracking-wider inline-block mt-1.5 ${
                    user?.role === "admin" 
                      ? "border-accent/40 bg-accent/10 text-accent shadow-glow" 
                      : "border-success/30 bg-success/10 text-success"
                  }`}>
                    {user?.role} Access
                  </span>
                </div>
              </div>

              <div className="space-y-4 pt-4 text-xs">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-accent/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-dim text-[10px] uppercase font-bold tracking-wider">Registered At</p>
                    <p className="text-text font-semibold mt-0.5">{formatDate(user?.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-accent/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-dim text-[10px] uppercase font-bold tracking-wider">Total Scans Run</p>
                    <p className="text-text font-bold mt-0.5">{stats.totalScans}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Award className="h-4 w-4 text-accent/70 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-text-dim text-[10px] uppercase font-bold tracking-wider">Average Score</p>
                    <p className="text-success font-bold mt-0.5">{stats.averageScore}/100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Form Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-surface border border-border rounded-xl p-6 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-6 border-b border-border/30 pb-3">
                <Key className="text-accent h-4 w-4" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-text">Update Access Key (Password)</h2>
              </div>

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-dim">
                      <Key className="h-4 w-4 text-accent/60" />
                    </span>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current login password"
                      className="w-full pl-11 pr-4 py-2.5 bg-panel border border-border focus:border-accent rounded-lg text-xs text-text font-mono focus:outline-none scan-input"
                      disabled={passwordLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-dim">
                      <Key className="h-4 w-4 text-accent/60" />
                    </span>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-11 pr-4 py-2.5 bg-panel border border-border focus:border-accent rounded-lg text-xs text-text font-mono focus:outline-none scan-input"
                      disabled={passwordLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-dim">
                      <Key className="h-4 w-4 text-accent/60" />
                    </span>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full pl-11 pr-4 py-2.5 bg-panel border border-border focus:border-accent rounded-lg text-xs text-text font-mono focus:outline-none scan-input"
                      disabled={passwordLoading}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-accent/10 border border-accent/40 text-accent font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-accent/25 hover:border-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? "Configuring Credentials..." : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
