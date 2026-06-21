"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { Shield, Mail, Lock, AlertCircle, Info } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check if already logged in
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setSuccess(true);
      toast.success("Access granted. Redirecting to dashboard...");
      
      // Force page reload / navigation to dashboard
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
    <div className="min-h-screen bg-bg flex flex-col font-mono">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-xl p-8 shadow-glow relative overflow-hidden animate-fadeInUp">
          {/* Scanning line animation top bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-accent/20">
            <div className="h-full w-1/3 bg-accent animate-pulse" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 border border-accent/30 text-accent mb-4 animate-pulse">
              <Shield className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-text tracking-widest uppercase">
              Access <span className="text-accent font-extrabold">HeaderGuard</span>
            </h1>
            <p className="text-text-dim text-[10px] uppercase tracking-wider mt-1">
              Secure authentication for header console
            </p>
          </div>

          {error && (
            <div className="flex gap-2.5 items-start p-3.5 bg-danger/5 border border-danger/25 text-danger text-xs rounded-lg mb-6">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex gap-2.5 items-start p-3.5 bg-success/5 border border-success/25 text-success text-xs rounded-lg mb-6">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">Access granted. Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
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
                  placeholder="e.g., admin@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">
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
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full mt-6 py-2.5 bg-accent/10 border border-accent/40 text-accent font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-accent/25 hover:border-accent transition-all duration-200 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Login Console"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-text-dim border-t border-border/40 pt-4">
            Need an account?{" "}
            <Link href="/register" className="text-accent hover:underline font-bold">
              Register Console
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
