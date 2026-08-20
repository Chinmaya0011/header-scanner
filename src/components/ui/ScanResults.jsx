"use client";

import { useState, useEffect } from "react";
import ScanResultsDashboard from "./ScanResultsDashboard";
import { useToast } from "@/components/common/Toast";
import Button from "@/components/ui/Button";
import { Mail, Share2, Copy, Check, X } from "lucide-react";

export default function ScanResults({ result }) {
  const toast = useToast();
  const [localResult, setLocalResult] = useState(result);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (result) {
      setLocalResult(result);
    }
  }, [result]);

  if (!localResult) return null;

  const domain = localResult.domain || localResult.url || "";

  // 1. Rescan action
  const handleRescan = async () => {
    if (!domain) return;
    toast.info(`Initiating fresh security scan for ${domain}...`);
    try {
      const endpoint = localResult?.isPublicScan ? "/api/scan/public" : "/api/scan";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: domain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rescan failed.");
      setLocalResult(data.data || data);
      toast.success("Security posture scan completed successfully!");
    } catch (e) {
      toast.error(e.message || "Failed to complete rescan.");
    }
  };

  // 2. PDF Download
  const handleDownloadPDF = async () => {
    toast.info("Generating PDF report...");
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      const primaryColor = "#090d16";
      const accentColor = "#0ea5e9";

      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor("#ffffff");
      doc.text("HeaderGuard Security Audit Report", 15, 20);

      doc.setFontSize(10);
      doc.setTextColor("#94a3b8");
      doc.text(`Target Domain: ${domain} | Grade: ${localResult.grade || "F"} | Score: ${localResult.score || 0}/100`, 15, 30);

      doc.setTextColor(primaryColor);
      doc.setFontSize(12);
      doc.text("Executive Audit Summary", 15, 55);

      doc.setFontSize(10);
      doc.setTextColor("#334155");
      doc.text(`Scanned Timestamp: ${new Date().toLocaleString()}`, 15, 65);
      doc.text(`HTTP Status Code: ${localResult.statusCode || 200}`, 15, 72);

      doc.save(`HeaderGuard_Audit_${domain || "report"}.pdf`);
      toast.success("PDF report downloaded!");
    } catch (err) {
      toast.error("Failed to generate PDF report.");
    }
  };

  // 3. JSON Export
  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localResult, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `headerguard-scan-${domain || "audit"}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("JSON report exported successfully!");
  };

  // 4. Share action
  const handleShare = () => {
    setShareModalOpen(true);
  };

  // 5. Toggle Public/Private
  const handleTogglePublic = async () => {
    const scanId = localResult._id || localResult.scanId;
    if (!scanId) return;
    try {
      const res = await fetch(`/api/scan/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !localResult.isPublic }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalResult(prev => ({
          ...prev,
          isPublic: data.isPublic,
          shareToken: data.shareToken
        }));
        toast.success(data.isPublic ? "Report is now public!" : "Report is now private.");
      } else {
        throw new Error(data.error || "Failed to update public state.");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update public state.");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!recipientEmail.trim()) return;
    setEmailLoading(true);
    try {
      const scanId = localResult._id || localResult.scanId;
      const res = await fetch(`/api/scan/${scanId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: recipientEmail }),
      });
      if (!res.ok) throw new Error("Failed to send email");
      toast.success(`Audit report sent to ${recipientEmail}`);
      setRecipientEmail("");
      setShareModalOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to send email.");
    } finally {
      setEmailLoading(false);
    }
  };

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/scan/${encodeURIComponent(domain)}` : "";

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    toast.success("Report link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="relative">
      <ScanResultsDashboard
        result={localResult}
        onRescan={handleRescan}
        onDownloadPDF={handleDownloadPDF}
        onDownloadJSON={handleDownloadJSON}
        onShare={handleShare}
        onTogglePublic={handleTogglePublic}
      />

      {/* Share & Export Modal */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="glass-card rounded p-5 border border-border max-w-md w-full relative space-y-4 font-mono">
            <button
              onClick={() => setShareModalOpen(false)}
              className="absolute top-3.5 right-3.5 text-text-dim hover:text-text p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-accent" />
              <h3 className="font-bold text-sm text-text uppercase">Share Security Audit Report</h3>
            </div>

            {/* Copy Public Link */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Public Link</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text select-all focus:outline-none"
                />
                <Button onClick={handleCopyShareLink} variant="accent" size="sm" className="gap-1 font-mono text-xs">
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Email Report Form */}
            <form onSubmit={handleSendEmail} className="space-y-2.5 pt-2 border-t border-border">
              <label className="text-[10px] font-bold text-text-muted uppercase block">Send Report via Email</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="colleague@security.com"
                className="w-full bg-surface border border-border rounded px-2.5 py-1.5 text-xs text-text placeholder:text-text-muted/60 focus:outline-none focus:border-accent"
              />
              <Button type="submit" disabled={emailLoading} variant="secondary" size="sm" className="w-full gap-2 font-mono text-xs">
                <Mail className="w-3.5 h-3.5" />
                {emailLoading ? "Sending..." : "Send Audit Email"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
