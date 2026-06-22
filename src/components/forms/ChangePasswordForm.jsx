"use client";

import { useState } from "react";
import { useToast } from "@/components/common/Toast";
import { Key, CheckCircle, Shield, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ChangePasswordForm() {
  const toast = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill out all fields.");
      return;
    }

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

  return (
    <form onSubmit={handlePasswordChange} className="flex-1 flex flex-col">
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-xs font-semibold text-text-dim mb-1.5 uppercase tracking-wide">
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
              className="w-full pl-9 pr-3 py-2.5 bg-bg border border-border rounded-lg text-xs font-mono text-text focus:outline-none focus:border-accent transition-colors scan-input"
              disabled={passwordLoading}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-dim mb-1.5 uppercase tracking-wide">
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
                className="w-full pl-9 pr-3 py-2.5 bg-bg border border-border rounded-lg text-xs font-mono text-text focus:outline-none focus:border-accent transition-colors scan-input"
                disabled={passwordLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-dim mb-1.5 uppercase tracking-wide">
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
                className="w-full pl-9 pr-3 py-2.5 bg-bg border border-border rounded-lg text-xs font-mono text-text focus:outline-none focus:border-accent transition-colors scan-input"
                disabled={passwordLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 mt-6 pt-4 border-t border-border/60">
        <Button
          type="submit"
          loading={passwordLoading}
          disabled={passwordLoading}
          variant="secondary"
          icon={Shield}
          className="w-full sm:w-auto"
        >
          Update Password
        </Button>

        <p className="text-[10px] text-text-muted leading-relaxed mt-3 font-semibold">
          ⚡ Enforce strong credentials. Minimum 6 characters with distinct case/numeric characters is advised.
        </p>
      </div>
    </form>
  );
}
