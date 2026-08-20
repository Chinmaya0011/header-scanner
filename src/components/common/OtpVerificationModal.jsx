"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, X, Copy, Check, RefreshCw, KeyRound } from "lucide-react";
import Button from "@/components/ui/Button";

/**
 * OTP Verification Warning Popup Modal for destructive actions
 */
export default function OtpVerificationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Destructive Action",
  description = "This action will permanently delete items from the system database. This cannot be undone.",
  actionName = "Delete Selected Data",
  warningDetails = "",
  loading = false,
}) {
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [typedOtp, setTypedOtp] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Function to generate a random 6-digit numeric OTP
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setTypedOtp("");
    setError("");
  };

  useEffect(() => {
    if (isOpen) {
      generateNewOtp();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isOtpValid = typedOtp.trim() === generatedOtp;

  const handleConfirm = async (e) => {
    e.preventDefault();
    if (!isOtpValid) {
      setError("Entered OTP does not match the verification code.");
      return;
    }
    setError("");
    await onConfirm();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-surface border border-danger/40 rounded-2xl shadow-2xl overflow-hidden font-sans text-text">
        {/* Top Header Banner */}
        <div className="bg-danger/10 border-b border-danger/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-danger font-bold text-sm tracking-wide uppercase">
            <ShieldAlert className="h-5 w-5 animate-pulse text-danger" />
            <span>{title}</span>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-text-muted hover:text-text p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleConfirm} className="p-5 space-y-4">
          {/* Warning Banner */}
          <div className="bg-danger/5 border border-danger/25 p-3.5 rounded-xl flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-danger shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-text leading-relaxed">{description}</p>
              {warningDetails && (
                <div className="p-2 bg-black/40 border border-white/[0.04] rounded text-[11px] font-mono text-danger-light break-all">
                  {warningDetails}
                </div>
              )}
            </div>
          </div>

          {/* OTP Code Generation Box */}
          <div className="bg-bg/80 border border-white/[0.08] p-4 rounded-xl space-y-2 text-center">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-text-dim tracking-wider flex items-center gap-1">
                <KeyRound className="h-3 w-3 text-accent" /> Security Verification OTP
              </span>
              <button
                type="button"
                onClick={generateNewOtp}
                className="text-[10px] text-accent hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="h-2.5 w-2.5" /> Regenerate
              </button>
            </div>

            {/* Generated Code Display */}
            <div className="flex items-center justify-center gap-3 py-2 bg-black/50 border border-accent/30 rounded-lg">
              <span className="font-mono text-2xl font-black tracking-widest text-accent select-all">
                {generatedOtp}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded text-accent hover:bg-accent/10 transition-colors"
                title="Copy OTP"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[9.5px] text-text-muted">
              Type the 6-digit OTP code above into the box below to authorize this deletion.
            </p>
          </div>

          {/* OTP Input Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-text-dim uppercase tracking-wider">
              Enter Verification Code:
            </label>
            <input
              type="text"
              maxLength={6}
              value={typedOtp}
              onChange={(e) => {
                setTypedOtp(e.target.value.replace(/[^0-9]/g, ""));
                setError("");
              }}
              placeholder="e.g. 123456"
              autoFocus
              className={`w-full px-4 py-2.5 bg-bg border rounded-xl text-center font-mono text-lg tracking-widest font-bold text-text outline-none transition-all ${
                isOtpValid
                  ? "border-success focus:ring-2 focus:ring-success/20"
                  : typedOtp.length === 6
                  ? "border-danger focus:ring-2 focus:ring-danger/20"
                  : "border-white/[0.1] focus:border-accent"
              }`}
            />
            {error && (
              <p className="text-[10px] text-danger font-medium mt-1 text-center">{error}</p>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.05]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={!isOtpValid || loading}
              loading={loading}
              className="bg-danger hover:bg-danger/90 text-white font-bold"
            >
              {actionName}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
