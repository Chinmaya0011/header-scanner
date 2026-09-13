"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/common/Toast";
import { ShieldCheck, Mail, KeyRound, RotateCw, ArrowLeft, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

export default function VerifyOtpForm({ initialEmail = "" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { login } = useAuth();

  const queryEmail = searchParams ? searchParams.get("email") || "" : "";
  const [email, setEmail] = useState(initialEmail || queryEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Sync email if query param changes
  useEffect(() => {
    if (!email && queryEmail) {
      setEmail(queryEmail);
    }
  }, [queryEmail, email]);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    if (!cleanEmail) {
      toast.error("Please provide your registered account email.");
      return;
    }

    if (!cleanOtp) {
      toast.error("Please enter the 6-digit verification code.");
      return;
    }

    if (cleanOtp.length !== 6) {
      toast.error("Verification code must be exactly 6 digits.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp }),
      });

      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.error || `Verification failed (HTTP ${res.status})`);
      }

      toast.success("Account verified successfully! Welcome to HeaderGuard.");

      if (data.user) {
        login({ ...data.user, token: data.token });
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      toast.error("Please enter your email to receive a new verification code.");
      return;
    }

    setResending(true);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      let data = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      }

      if (!res.ok) {
        throw new Error(data.error || `Failed to resend code (HTTP ${res.status})`);
      }

      toast.success(data.message || "A fresh verification code has been sent to your email.");
      setCountdown(60);
      setCanResend(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResending(false);
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
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-widest uppercase">
          Verify <span className="text-accent font-extrabold">Identity</span>
        </h1>
        <p className="text-text-dim text-[10px] uppercase tracking-wider mt-1.5 font-semibold">
          Enter the 6-digit OTP code sent to your email
        </p>
      </div>

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider mb-2">
            Target Account Email
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
              placeholder="e.g. user@example.com"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-[10px] font-bold text-text-dim uppercase tracking-wider">
              Verification Code (OTP)
            </label>
            {canResend ? (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending || !email.trim()}
                className="text-[10px] text-accent hover:text-accent-light font-bold flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <RotateCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                Resend Code
              </button>
            ) : (
              <span className="text-[10px] text-text-muted font-mono font-semibold">
                Resend in {countdown}s
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-text-dim">
              <KeyRound className="h-4 w-4 text-accent/70" />
            </span>
            <input
              type="text"
              required
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full pl-11 pr-4 py-2.5 bg-panel border border-border focus:border-accent rounded-lg text-sm text-text font-mono tracking-[0.25em] transition-all scan-input text-center font-bold"
              placeholder="••••••"
              maxLength={6}
              autoComplete="one-time-code"
              disabled={loading}
            />
          </div>
          <p className="text-[10px] text-text-dim mt-2 leading-relaxed">
            Please check your inbox and spam folder for your 6-digit confirmation code.
          </p>
        </div>

        <Button
          type="submit"
          loading={loading}
          disabled={loading || !otp.trim() || !email.trim()}
          className="w-full mt-6"
        >
          Verify & Activate Session
        </Button>
      </form>

      <div className="mt-6 flex items-center justify-between text-xs text-text-dim border-t border-border/40 pt-4 font-sans font-semibold">
        <Link href="/login" className="text-accent hover:text-accent-light hover:underline font-bold flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Login
        </Link>
        <Link href="/register" className="text-text-muted hover:text-text hover:underline">
          Register New Account
        </Link>
      </div>
    </div>
  );
}
