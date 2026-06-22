"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { Shield, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function LoginForm() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError("Please fill out all credentials.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setSuccess(true);
      toast.success("Access granted. Redirecting to dashboard...");
      
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
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
          Access <span className="text-accent font-extrabold">HeaderGuard</span>
        </h1>
        <p className="text-text-dim text-[10px] uppercase tracking-wider mt-1.5 font-semibold">
          Console authentication session
        </p>
      </div>

      {error && (
        <div className="flex gap-2.5 items-start p-3.5 bg-danger/5 border border-danger/20 text-danger text-xs rounded-lg mb-6 font-mono">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed font-sans">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex gap-2.5 items-start p-3.5 bg-success/5 border border-success/20 text-success text-xs rounded-lg mb-6 font-mono">
          <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed font-sans">Access authorized. Spawning session dashboard...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="e.g. admin@example.com"
              disabled={loading || success}
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
              placeholder="••••••••"
              disabled={loading || success}
            />
          </div>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={loading || success || !email.trim() || !password}
          className="w-full mt-6"
        >
          Verify & Authenticate
        </Button>
      </form>

      <div className="mt-6 text-center text-xs text-text-dim border-t border-border/40 pt-4 font-sans font-semibold">
        Need a dashboard account?{" "}
        <Link href="/register" className="text-accent hover:text-accent-light hover:underline font-bold">
          Register Console
        </Link>
      </div>
    </div>
  );
}
