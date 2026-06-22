"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useToast } from "@/components/common/Toast";
import Loading from "@/components/common/Loading";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import {
  Clock,
  FileText,
  Mail,
  Calendar,
  UserCircle,
  Lock,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalScans: 0, averageScore: 0 });

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
  }, [router]);

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
      <div className="min-h-screen bg-bg flex flex-col font-sans text-text">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading message="Fetching user details..." />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <Navbar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="flex flex-col gap-8">
          {/* Header with gradient underline */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 relative">
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-accent/40 via-accent/20 to-transparent" />
            <div>
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-accent" />
                <h1 className="text-xl font-bold tracking-wide">Account Settings</h1>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Manage your credentials and view account history parameters
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column - User Details card */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="flex flex-col space-y-4 bg-gradient-to-br from-surface/80 to-surface/40 shadow-lg shadow-black/5 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center text-accent text-sm font-bold font-mono shadow-inner">
                    {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-text truncate max-w-[200px] font-mono">
                      {user?.email}
                    </h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse shadow-sm shadow-success/30" />
                      <span className="text-[9px] text-text-dim capitalize font-semibold tracking-wider">
                        {user?.role || "user"} access
                      </span>
                    </div>
                  </div>
                </div>

                {/* Micro Stats grid with glass effect */}
                <div className="grid grid-cols-2 gap-4 py-3 px-2 bg-white/5 rounded-xl backdrop-blur-sm">
                  <div className="text-center">
                    <p className="text-lg font-bold font-mono text-accent">
                      {stats.totalScans || "0"}
                    </p>
                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-semibold">Total Scans</p>
                  </div>
                  <div className="text-center relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-px bg-gradient-to-b from-transparent via-text-dim/20 to-transparent" />
                    <p className="text-lg font-bold font-mono text-success">
                      {stats.averageScore || "0"}
                    </p>
                    <p className="text-[9px] text-text-dim uppercase tracking-wider font-semibold">Avg Score</p>
                  </div>
                </div>

                {/* Decorative divider with dots */}
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-text-dim/10 to-transparent" />
                  <div className="flex gap-1">
                    <span className="h-1 w-1 rounded-full bg-accent/30" />
                    <span className="h-1 w-1 rounded-full bg-accent/20" />
                    <span className="h-1 w-1 rounded-full bg-accent/10" />
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-text-dim/10 to-transparent" />
                </div>

                {/* Details list with hover effects */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200">
                    <Mail className="h-4.5 w-4.5 text-text-dim mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Primary Email</p>
                      <p className="text-xs text-text font-mono truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200">
                    <Calendar className="h-4.5 w-4.5 text-text-dim mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Registered</p>
                      <p className="text-xs text-text font-mono">{formatDate(user?.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors duration-200">
                    <Clock className="h-4.5 w-4.5 text-text-dim mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Last Verification</p>
                      <p className="text-xs text-text font-mono">{formatDate(user?.updatedAt || user?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Credentials Card */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="flex flex-col space-y-4 bg-gradient-to-br from-surface/80 to-surface/40 shadow-lg shadow-black/5 backdrop-blur-sm">
                <div className="flex items-center gap-2 pb-3 relative">
                  <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-accent/30 via-accent/10 to-transparent" />
                  <Lock className="h-4.5 w-4.5 text-accent" />
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                      Security Credentials
                    </h2>
                    <p className="text-[10px] text-text-dim mt-0.5">Rotate account secret key/password</p>
                  </div>
                </div>

                <ChangePasswordForm />
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}