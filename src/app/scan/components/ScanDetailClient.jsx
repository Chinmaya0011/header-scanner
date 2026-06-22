"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import ScanResults from "@/components/ui/ScanResults";
import Loading from "@/components/common/Loading";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useToast } from "@/components/common/Toast";
import { ArrowLeft, Clock, AlertTriangle, Mail, Download } from "lucide-react";

export default function ScanDetailClient({ scan: initialScan, id }) {
  const router = useRouter();
  const toast = useToast();
  const [scan, setScan] = useState(initialScan);
  const [loading, setLoading] = useState(!initialScan);
  const [error, setError] = useState(null);

  // PDF & Sharing States
  const [pdfLoading, setPdfLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  // Check auth status on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.loggedIn) {
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Auth status query failed:", err);
      }
    }
    checkAuth();
  }, []);

  // Fetch scan on demand if not passed via server component props
  useEffect(() => {
    if (scan) return;
    if (!id) {
      setError("No scan ID provided");
      setLoading(false);
      return;
    }

    async function fetchScan() {
      try {
        const response = await fetch(`/api/scan/${id}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || `HTTP ${response.status}`);
        }
        if (!data.success || !data.data) {
          throw new Error(data.error || "No scan data found");
        }
        
        setScan(data.data);
      } catch (err) {
        console.error("Scan fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchScan();
  }, [id, scan]);

  const handleDownloadPDF = async () => {
    if (!scan) return;
    setPdfLoading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primaryColor = "#0f172a"; 
      const accentColor = "#6366f1"; 
      const successColor = "#22c55e"; 
      const warningColor = "#eab308"; 
      const dangerColor = "#ef4444"; 
      const textColor = "#334155"; 
      const textLightColor = "#64748b"; 

      // Header Banner
      doc.setFillColor(primaryColor);
      doc.rect(0, 0, 210, 40, "F");

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor("#ffffff");
      doc.text("HeaderGuard Security Report", 15, 20);

      const scanDateStr = scan.createdAt || scan.metadata?.timestamp || new Date().toISOString();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#cbd5e1");
      doc.text(`Scanned: ${new Date(scanDateStr).toLocaleString()}`, 15, 30);

      // Body Overview
      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Scan Overview", 15, 55);

      // Stats box
      doc.setDrawColor("#e2e8f0");
      doc.setFillColor("#f8fafc");
      doc.roundedRect(15, 60, 180, 30, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor);
      doc.text(`Target Host: ${scan.domain}`, 20, 68);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(textLightColor);
      doc.text(`Security Grade:`, 20, 78);
      
      let gColor = dangerColor;
      if (scan.grade.startsWith("A")) gColor = successColor;
      else if (scan.grade.startsWith("B")) gColor = accentColor;
      else if (scan.grade.startsWith("C")) gColor = warningColor;

      doc.setTextColor(gColor);
      doc.setFontSize(16);
      doc.text(scan.grade, 55, 78);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(textLightColor);
      doc.text(`Security Score:`, 110, 78);
      
      doc.setTextColor(accentColor);
      doc.setFontSize(16);
      doc.text(`${scan.score}/100`, 145, 78);

      // Detailed Headers Checklist
      doc.setTextColor(primaryColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Detailed Response Headers Evaluation", 15, 105);

      let yOffset = 115;
      
      scan.headers.forEach((header) => {
        if (yOffset > 265) {
          doc.addPage();
          yOffset = 25;
        }

        doc.setDrawColor("#e2e8f0");
        doc.line(15, yOffset - 4, 195, yOffset - 4);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(primaryColor);
        doc.text(header.name, 15, yOffset);

        let statusText = "Missing";
        let statusColor = dangerColor;
        if (header.status === "present") {
          statusText = "Present";
          statusColor = successColor;
        } else if (header.status === "weak") {
          statusText = "Weak Configuration";
          statusColor = warningColor;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(statusColor);
        doc.text(statusText, 130, yOffset);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(textLightColor);
        doc.text(`Severity: ${header.severity.toUpperCase()}`, 165, yOffset);

        yOffset += 6;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(textColor);
        
        const splitDesc = doc.splitTextToSize(header.description || "", 180);
        doc.text(splitDesc, 15, yOffset);
        yOffset += splitDesc.length * 4 + 2;

        if (header.status !== "present" && header.recommendation) {
          const recText = doc.splitTextToSize(header.recommendation, 140);
          const blockHeight = Math.max(10, recText.length * 4 + 4);
          
          if (yOffset + blockHeight > 275) {
            doc.addPage();
            yOffset = 25;
          }

          doc.setFillColor("#fffbeb");
          doc.setDrawColor("#fef3c7");
          doc.roundedRect(15, yOffset - 2, 180, blockHeight, 1.5, 1.5, "FD");
          
          doc.setFont("helvetica", "bold");
          doc.setFontSize(7.5);
          doc.setTextColor("#b45309"); 
          doc.text("REMEDIATION:", 18, yOffset + 2);
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor("#78350f");
          doc.text(recText, 45, yOffset + 2);
          
          yOffset += blockHeight + 6;
        } else {
          yOffset += 4;
        }
      });

      doc.save(`HeaderGuard_Report_${scan.domain}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleSendEmailSubmit = async (e) => {
    e.preventDefault();

    const trimmedRecipient = recipientEmail.trim();
    if (!trimmedRecipient) {
      toast.error("Email address is required.");
      return;
    }

    setEmailLoading(true);

    try {
      const res = await fetch(`/api/scan/${scan?._id || id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: trimmedRecipient }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send email report.");
      }

      toast.success(`Security audit report successfully shared with ${trimmedRecipient}!`);
      setShowEmailModal(false);
    } catch (err) {
      toast.error(err.message || "Failed to send email report.");
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loading message="Loading audit metrics..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex flex-col font-sans">
        <Navbar />
        <main className="mx-auto max-w-3xl w-full px-4 sm:px-6 py-20 flex justify-center">
          <Card className="border border-danger/30 bg-danger/5 text-center max-w-md w-full p-8">
            <AlertTriangle className="h-12 w-12 text-danger mx-auto mb-3 animate-pulse" />
            <h2 className="text-lg font-bold text-text mb-2">Audit Load Failed</h2>
            <p className="text-text-dim text-xs leading-relaxed mb-6 font-mono">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} variant="secondary" size="sm">
                Reload Console
              </Button>
              <Link href="/history" passHref>
                <Button variant="outline" size="sm">
                  View History
                </Button>
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!scan) return null;

  const scanDate = scan.createdAt || scan.metadata?.timestamp || new Date().toISOString();

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link href="/history" passHref>
              <Button variant="outline" size="sm" icon={ArrowLeft}>
                Back to History
              </Button>
            </Link>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5 text-text-dim text-xs font-semibold">
              <Clock className="h-4 w-4 text-accent/70" />
              <span>
                Scanned{" "}
                {new Date(scanDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
              variant="outline"
              size="sm"
              icon={Download}
            >
              {pdfLoading ? "Exporting..." : "Export PDF"}
            </Button>
            {currentUser ? (
              <Button
                onClick={() => {
                  setRecipientEmail(currentUser?.email || "");
                  setShowEmailModal(true);
                }}
                variant="secondary"
                size="sm"
                icon={Mail}
                title={`Email report to ${currentUser.email}`}
              >
                Email Report
              </Button>
            ) : (
              <Link href="/login" passHref>
                <Button
                  variant="outline"
                  size="sm"
                  icon={Mail}
                  title="Log in to email this report"
                >
                  Log in to Email
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Share Settings (Only for Owner or Admin) */}
        {currentUser && (currentUser.role === "admin" || (scan.owner && scan.owner.toString() === currentUser._id.toString())) && (
          <Card className="border border-border/80 bg-surface/50 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                  Public Report Sharing
                </h3>
                <p className="text-[11px] text-text-dim mt-0.5 font-semibold">
                  Enable public URL access to share this security grade with external clients or developers.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-text-dim">
                  {scan.isPublic ? "Publicly Accessible" : "Private"}
                </span>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/scan/${scan._id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ isPublic: !scan.isPublic }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setScan(prev => ({
                          ...prev,
                          isPublic: data.isPublic,
                          shareToken: data.shareToken
                        }));
                      }
                    } catch (err) {
                      console.error("Toggle share failed:", err);
                    }
                  }}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-300 ${
                    scan.isPublic ? "bg-accent" : "bg-border/60"
                  }`}
                  aria-label="Toggle public access"
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                      scan.isPublic ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {scan.isPublic && scan.shareToken && (
              <div className="mt-3.5 pt-3 border-t border-border/40 animate-fadeInUp flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/shared/scan/${scan.shareToken}`}
                  className="flex-1 bg-bg border border-border rounded-lg px-3 py-1.5 text-[11px] font-mono text-text truncate select-all outline-none"
                />
                <CopyButton text={`${window.location.origin}/shared/scan/${scan.shareToken}`} />
              </div>
            )}
          </Card>
        )}

        <ScanResults result={scan} />

        {/* Custom Email Share Modal Dialog */}
        {showEmailModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
            style={{ backgroundColor: 'rgba(3, 7, 18, 0.85)' }}
          >
            <Card className="w-full max-w-sm border border-border bg-panel shadow-2xl p-6 space-y-4 animate-fadeInUp">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <Mail className="text-accent h-4.5 w-4.5" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-text">
                    Email Security Report
                  </h3>
                </div>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-text-dim hover:text-text p-1 transition-colors text-lg"
                  type="button"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSendEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-text-muted font-bold uppercase tracking-wider block">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="client@company.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-bg border border-border focus:border-accent rounded-lg text-xs text-text outline-none transition-all"
                  />
                </div>

                <p className="text-[10px] text-text-dim leading-relaxed">
                  We will send a security header assessment report for <span className="font-mono font-bold text-text">{scan.domain}</span> (Grade: {scan.grade}) to this address.
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmailModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={emailLoading}
                  >
                    {emailLoading ? "Sending..." : "Send Report"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className={`text-[10px] font-semibold border rounded-md px-3 py-1.5 transition-all flex-shrink-0 ${
        copied
          ? "bg-success/20 border-success/30 text-success"
          : "bg-surface border-border text-text hover:text-accent hover:border-accent/40"
      }`}
    >
      {copied ? "Copied!" : "Copy Link"}
    </button>
  );
}