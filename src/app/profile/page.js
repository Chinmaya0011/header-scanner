"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import { useToast } from "@/components/common/Toast";
import Loading from "@/components/common/Loading";
import ChangePasswordForm from "@/components/forms/ChangePasswordForm";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  Clock,
  FileText,
  Mail,
  Calendar,
  UserCircle,
  Lock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Trash2,
  X,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const toast = useToast();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalScans: 0, averageScore: 0 });

  // Danger Zone deletion states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmationText !== "DELETE") {
      toast.error("Please enter the confirmation text exactly.");
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: "DELETE" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Account deleted successfully. We have purged your record entries.");
        setIsDeleteModalOpen(false);
        // Direct route redirect back home
        router.push("/login");
      } else {
        toast.error("Deletion failed: " + data.error);
      }
    } catch (err) {
      toast.error("Failed to execute account self-deletion.");
    } finally {
      setIsDeleting(false);
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
          {/* Header with subtle gradient underline */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 relative border-b border-white/[0.05]">
            <div>
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-accent" />
                <h1 className="text-xl font-bold tracking-wide">Account Settings</h1>
              </div>
              <p className="text-xs text-text-dim mt-0.5">
                Manage your credentials and view account history parameters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column - User Details card */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="flex flex-col space-y-4 bg-gradient-to-br from-surface/80 to-surface/40 shadow-lg shadow-black/5 backdrop-blur-sm border-white/[0.05]">
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

                {/* Details list with hover effects */}
                <div className="space-y-4 pt-2">
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
                      <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">Last Update</p>
                      <p className="text-xs text-text font-mono">{formatDate(user?.updatedAt || user?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Credentials Card & Danger Zone */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="flex flex-col space-y-4 border-white/[0.05]">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.05]">
                  <Lock className="h-4.5 w-4.5 text-accent" />
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-text">
                      Security Credentials
                    </h2>
                    <p className="text-[10px] text-text-dim mt-0.5">Rotate account password secret keys</p>
                  </div>
                </div>

                <ChangePasswordForm />
              </Card>

              {/* Danger Zone Panel */}
              <Card className="flex flex-col space-y-4 border-danger/20 bg-danger/[0.02]">
                <div className="flex items-center gap-2 pb-3 border-b border-danger/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-danger animate-pulse" />
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-danger">
                      Danger Zone
                    </h2>
                    <p className="text-[10px] text-danger/80 mt-0.5">Irreversible administrative actions</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-text-dim leading-relaxed">
                    Permanently delete your profile and purge all scanning logs, custom domain locks, continuously configured webhooks, active developer credentials, and compliance history records. This cannot be undone.
                  </p>
                  <div className="flex justify-start">
                    <Button 
                      variant="danger" 
                      onClick={() => {
                        setDeleteConfirmationText("");
                        setIsDeleteModalOpen(true);
                      }}
                      size="sm"
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal Overlay */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-white/[0.05] max-w-md w-full rounded-xl p-6 space-y-5 shadow-2xl relative animate-fadeIn duration-200">
            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5 text-danger">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-text">
                  Confirm Account Erasure
                </h3>
              </div>
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-text-muted hover:text-text transition-colors p-1"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Modal warnings */}
            <div className="space-y-3.5 text-xs text-text-dim">
              <p className="leading-relaxed">
                You are performing a permanent administrative purge of your profile.
              </p>
              <div className="bg-danger/5 border border-danger/10 p-3 rounded-lg text-danger leading-relaxed font-semibold">
                This action is irreversible. All linked scans, monitors, active API keys, rate limit records, and your login session will be deleted immediately.
              </div>
              <p className="leading-relaxed">
                To confirm this choice, please type <strong className="text-text font-mono">DELETE</strong> in the box below:
              </p>
            </div>

            {/* Modal form */}
            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3.5 py-2.5 bg-bg border border-white/[0.05] rounded-lg text-xs font-mono text-text outline-none focus:border-danger/45 focus:ring-1 focus:ring-danger/45 transition-all uppercase placeholder:text-text-muted"
                disabled={isDeleting}
                required
              />

              <div className="flex justify-end gap-3 pt-2.5 border-t border-white/[0.05]">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg text-text-dim hover:text-text hover:bg-white/5 transition-all"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={deleteConfirmationText !== "DELETE"}
                  loading={isDeleting}
                >
                  Confirm Delete
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}