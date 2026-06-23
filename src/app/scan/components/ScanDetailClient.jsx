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
  const [verifications, setVerifications] = useState([]);

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

  // Fetch verifications
  useEffect(() => {
    async function fetchVerifications() {
      try {
        const res = await fetch("/api/verify");
        const data = await res.json();
        if (data.success) {
          setVerifications(data.verifications || []);
        }
      } catch (err) {
        console.log("Failed to fetch verifications on detail page:", err);
      }
    }
    fetchVerifications();
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

  const pendingVerifications = verifications.filter(v => !v.verified);

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 space-y-4">
        {/* Sleek Breadcrumb / Back Navigation */}
        <div className="flex items-center gap-2 text-xs text-text-dim">
          <Link href="/history" className="hover:text-accent font-semibold transition-colors flex items-center gap-1.5 font-mono uppercase">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Scan History
          </Link>
          <span className="text-white/10">/</span>
          <span className="font-mono text-text-muted select-all truncate max-w-[200px]">{scan.domain}</span>
        </div>

        {/* Pending Verifications Reminder Banner */}
        {pendingVerifications.length > 0 && (
          <Card className="border border-warning/30 bg-warning/5 p-4 rounded-xl flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-warning h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-text">Domain Verification Required</p>
                <p className="text-[10px] text-text-dim mt-0.5">
                  You have {pendingVerifications.length} domain(s) waiting for verification file upload. Complete verification in the Console to manage scanning rights.
                </p>
              </div>
            </div>
            <Link href="/dashboard" passHref>
              <Button variant="secondary" size="sm" className="text-[10px] shrink-0">
                Go to Console
              </Button>
            </Link>
          </Card>
        )}

        <ScanResults result={scan} />
      </main>
    </div>
  );
}