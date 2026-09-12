"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { Shield, Mail, Lock } from "lucide-react";
import Button from "@/components/ui/Button";

export default function RegisterForm() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || !confirmPassword) {
      toast.error("Please fill out all credentials.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.error || `Registration failed (HTTP ${res.status})`);
      }

      toast.success("Verification code sent to your email. Check your inbox.");
      router.push(`/verify-otp?email=${encodeURIComponent(cleanEmail)}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 shadow-glow relative overflow-hidden font-sans text-text">
      {/* Visual scan line animation top bar */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/20">
        <div className="h-full w-1/3 bg-accent scan-line" />
      </div>

      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/20 text-accent mb-4 animate-pulse">
          <Shield className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-widest uppercase">
          Create <span className="text-accent font-extrabold">Account</span>
        </h1>
        <p className="text-text-dim text-[10px] uppercase tracking-wider mt-1.5 font-semibold">
          Register console credentials to audit target systems
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">
            Console Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-dim">
              <Mail className="h-4 w-4 text-accent/70" />
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-panel border border-border focus:border-accent rounded-lg text-xs text-text font-mono transition-all scan-input"
              placeholder="e.g. mail@example.com"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">
            Secret Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-dim">
              <Lock className="h-4 w-4 text-accent/70" />
            </span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-panel border border-border focus:border-accent rounded-lg text-xs text-text font-mono transition-all scan-input"
              placeholder="Minimum 6 characters"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-dim">
              <Lock className="h-4 w-4 text-accent/70" />
            </span>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-panel border border-border focus:border-accent rounded-lg text-xs text-text font-mono transition-all scan-input"
              placeholder="Confirm your password"
              disabled={loading}
            />
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={loading || !email.trim() || !password || !confirmPassword}
          className="w-full mt-6"
        >
          Register Console Account
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-text-dim border-t border-border/40 pt-4 font-sans font-semibold">
        Already registered?{" "}
        <Link href="/login" className="text-accent hover:text-accent-light hover:underline font-bold">
          Login Console
        </Link>
      </div>
    </div>
  );
}
