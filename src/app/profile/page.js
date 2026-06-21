"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import Loading from "@/components/Loading";
import {
  Shield,
  Key,
  Award,
  Clock,
  FileText,
  User,
  Mail,
  Calendar,
  Activity,
  CheckCircle,
  XCircle,
  UserCircle,
  Lock,
  RefreshCw,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalScans: 0, averageScore: 0 });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) throw new Error("Failed to fetch user data");
        
        const meData = await meRes.json();
        if (!meData.loggedIn) {
          router.push("/login");
          return;
        }

        setUser(meData.user);

        try {
          const scansRes = await fetch("/api/scans?limit=1");
          if (scansRes.ok) {
            const scansData = await scansRes.json();
            if (scansData.success && scansData.data?.summary) {
              setStats({
                totalScans: scansData.data.pagination?.totalScans || 0,
                averageScore: scansData.data.summary?.averageScore || 0,
              });
            }
          }
        } catch {
          // Keep default stats
        }
      } catch (err) {
        toast.error("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [router, toast]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
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

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update password.");
      }

      toast.success("Password updated successfully.");
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
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-mono text-text">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading message="Loading profile..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col font-mono text-text">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-wide">Profile</h1>
            <p className="text-xs text-text-dim">Manage your account settings</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full border border-accent/30 bg-accent/5 text-accent">
            {user?.role || 'User'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Profile Info - Fixed Height */}
          <div className="lg:col-span-4">
            <div className="bg-surface border border-border rounded-xl p-6 h-[500px] flex flex-col">
              {/* Avatar - Fixed */}
              <div className="flex flex-col items-center text-center flex-shrink-0">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-accent/10 border-2 border-accent/30 flex items-center justify-center">
                    <UserCircle className="h-12 w-12 text-accent" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-2 border-bg flex items-center justify-center">
                    {user?.emailVerified ? (
                      <div className="h-full w-full rounded-full bg-success flex items-center justify-center">
                        <CheckCircle className="h-3.5 w-3.5 text-bg" />
                      </div>
                    ) : (
                      <div className="h-full w-full rounded-full bg-danger flex items-center justify-center">
                        <XCircle className="h-3.5 w-3.5 text-bg" />
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="mt-4 text-base font-bold text-text">
                  {user?.email?.split('@')[0] || 'User'}
                </h2>
                <p className="text-xs text-text-dim truncate max-w-[200px]">
                  {user?.email}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-medium flex items-center gap-1 ${
                    user?.emailVerified
                      ? 'border-success/30 bg-success/5 text-success'
                      : 'border-danger/30 bg-danger/5 text-danger'
                  }`}>
                    {user?.emailVerified ? (
                      <CheckCircle className="h-2.5 w-2.5" />
                    ) : (
                      <XCircle className="h-2.5 w-2.5" />
                    )}
                    {user?.emailVerified ? "Verified" : "Unverified"}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-4 flex-shrink-0" />

              {/* Stats - Fixed */}
              <div className="grid grid-cols-2 gap-3 flex-shrink-0">
                <div className="bg-bg/50 rounded-lg p-3 text-center">
                  <FileText className="h-4 w-4 text-accent mx-auto mb-1" />
                  <p className="text-sm font-bold text-text">{stats.totalScans}</p>
                  <p className="text-[9px] text-text-dim uppercase tracking-wider">Scans</p>
                </div>
                <div className="bg-bg/50 rounded-lg p-3 text-center">
                  <Award className="h-4 w-4 text-success mx-auto mb-1" />
                  <p className="text-sm font-bold text-success">
                    {stats.averageScore || 'N/A'}
                  </p>
                  <p className="text-[9px] text-text-dim uppercase tracking-wider">Avg Score</p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border my-4 flex-shrink-0" />

              {/* User Details - Scrollable */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-text-dim flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-text-dim uppercase tracking-wider">Email</p>
                      <p className="text-xs text-text truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-text-dim flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-text-dim uppercase tracking-wider">Joined</p>
                      <p className="text-xs text-text">{formatDate(user?.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-text-dim flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-text-dim uppercase tracking-wider">Last Active</p>
                      <p className="text-xs text-text">{formatDate(user?.updatedAt || user?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Password Update - Fixed Height */}
          <div className="lg:col-span-8">
            <div className="bg-surface border border-border rounded-xl p-6 h-[500px] flex flex-col">
              <div className="flex items-center gap-2 pb-3 border-b border-border flex-shrink-0">
                <Lock className="h-4 w-4 text-accent" />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-text">
                    Security
                  </h2>
                  <p className="text-[10px] text-text-dim">Update your password</p>
                </div>
              </div>

              <form onSubmit={handlePasswordChange} className="flex-1 flex flex-col mt-4">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-medium text-text-dim mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
                        disabled={passwordLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-text-dim mb-1">
                        New Password
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
                          disabled={passwordLoading}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-text-dim mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-dim" />
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full pl-9 pr-3 py-2 bg-bg border border-border rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
                          disabled={passwordLoading}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0 mt-4 pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-accent/10 border border-accent text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {passwordLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4" />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-text-dim leading-relaxed mt-3">
                    ⚡ Use a strong password with at least 6 characters.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}