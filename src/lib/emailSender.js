import nodemailer from "nodemailer";
import { getUnifiedFindings } from "./analyzer.js";

/**
 * Sends a detailed HTML & Markdown security report directly to the recipient's email address.
 * @param {string} toEmail - The recipient's email address
 * @param {Object} scan - The full scan database document
 * @returns {Promise<Object>} - The nodemailer send response
 */
export async function sendAuditReportEmail(toEmail, scan) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP credentials are not configured in environment variables (.env).");
  }

  const domain = scan.domain || scan.maskedDomain;
  const score = scan.score;
  const grade = scan.grade;

  // Configure transporter (Gmail SMTP service)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  // Extract vulnerable / missing / weak findings
  const unifiedFindings = getUnifiedFindings(scan);
  const vulnerableFindings = unifiedFindings.filter((h) => h.status !== "present" && h.status !== "passed");
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
  doc.text(`Target Host: ${domain}`, 20, 68);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textLightColor);
  doc.text(`Security Grade:`, 20, 78);

  let gColor = dangerColor;
  if (grade.startsWith("A")) gColor = successColor;
  else if (grade.startsWith("B")) gColor = accentColor;
  else if (grade.startsWith("C")) gColor = warningColor;

  doc.setTextColor(gColor);
  doc.setFontSize(16);
  doc.text(grade, 55, 78);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(textLightColor);
  doc.text(`Security Score:`, 110, 78);

  doc.setTextColor(accentColor);
  doc.setFontSize(16);
  doc.text(`${score}/100`, 145, 78);

  // Detailed Headers Checklist
  doc.setTextColor(primaryColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Detailed Response Evaluation", 15, 105);

  let yOffset = 115;
  
  unifiedFindings.forEach((header) => {
    if (yOffset > 265) {
      doc.addPage();
      yOffset = 25;
    }

    doc.setDrawColor("#e2e8f0");
    doc.line(15, yOffset - 4, 195, yOffset - 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.text(header.title || header.name, 15, yOffset);

    let statusText = "Failed";
    let statusColor = dangerColor;
    if (header.status === "present" || header.status === "passed") {
      statusText = "Passed";
      statusColor = successColor;
    } else if (header.status === "weak" || header.status === "warning") {
      statusText = "Warning";
      statusColor = warningColor;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(statusColor);
    doc.text(statusText, 130, yOffset);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(textLightColor);
    doc.text(`Severity: ${(header.severity || "info").toUpperCase()}`, 165, yOffset);

    yOffset += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(textColor);

    const splitDesc = doc.splitTextToSize(header.description || "", 180);
    doc.text(splitDesc, 15, yOffset);
    yOffset += splitDesc.length * 4 + 2;

    if ((header.status !== "present" && header.status !== "passed") && header.recommendation) {
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

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  // HTML Email Template (Simplified)
  const htmlContent = `
    <div style="background-color: #050d05; color: #e2e8f0; font-family: 'Courier New', Courier, monospace; padding: 25px; border: 2px solid #1a3d1a; border-radius: 8px; max-width: 600px; margin: 0 auto;">
      <div style="border-bottom: 2px solid #1a3d1a; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
        <h1 style="color: #00ff41; margin: 0; font-size: 24px; letter-spacing: 2px;">HEADERGUARD SECURITY</h1>
        <p style="color: #b4ffb4; font-size: 11px; margin: 5px 0 0 0;">CONFIDENTIAL SECURITY DISPATCH</p>
      </div>
      
      <p style="font-size: 13px; line-height: 1.6;">A security header audit report was successfully compiled for your domain: 
        <strong style="color: #00ff41; font-size: 15px;">${domain}</strong>.
      </p>

      <div style="background-color: #0f2210; border: 1px solid #1a3d1a; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
        <span style="display: block; font-size: 11px; color: #b4ffb4; margin-bottom: 5px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Audit Rating</span>
        <span style="color: #00ff41; font-size: 22px; font-weight: bold; display: block; margin-bottom: 5px; font-family: monospace;">Score: ${score} / 100</span>
        <span style="color: #00ff41; font-size: 20px; font-weight: bold; display: block; font-family: monospace;">Grade: ${grade}</span>
      </div>

      <div style="margin: 20px 0; border: 1px solid #1a3d1a; border-radius: 6px; padding: 12px 15px; background-color: #0f2210; font-size: 11px; line-height: 1.5; color: #cbd5e1;">
        <strong style="color: #00ff41; display: block; margin-bottom: 6px; text-transform: uppercase; font-family: monospace;">Configuration Metrics</strong>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 2px 0;">Safe/Configured Headers:</td>
            <td style="text-align: right; color: #39ff14; font-weight: bold;">${scan.summary?.present || 0}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Weak Configurations:</td>
            <td style="text-align: right; color: #ccff00; font-weight: bold;">${scan.summary?.weak || 0}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">Missing/Vulnerable:</td>
            <td style="text-align: right; color: #ff3d00; font-weight: bold;">${scan.summary?.missing || 0}</td>
          </tr>
          <tr style="border-top: 1px solid #1a3d1a;">
            <td style="padding: 6px 0 2px 0; font-weight: bold;">Total Inspected:</td>
            <td style="text-align: right; padding: 6px 0 2px 0; color: #00ff41; font-weight: bold;">${unifiedFindings.length || 0}</td>
          </tr>
        </table>
      </div>

      <div style="margin: 25px 0; border: 1px dashed #10b981; border-radius: 6px; padding: 15px; background-color: rgba(16, 185, 129, 0.05); text-align: center;">
        <p style="color: #10b981; font-size: 13px; margin: 0; font-weight: bold;">Full Report Attached</p>
        <p style="color: #94a3b8; font-size: 11px; margin: 5px 0 0 0;">Please see the attached PDF document for the full comprehensive breakdown and remediation steps.</p>
      </div>
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #1a3d1a; text-align: center; font-size: 9px; color: #94a3b8;">
        <p style="margin: 0;">This email was dispatched securely by HeaderGuard HTTP Response Header Scanner.</p>
        <p style="margin: 5px 0 0 0;">&copy; ${new Date().getFullYear()} HeaderGuard System. All rights reserved.</p>
      </div>
    </div>
  `;

  // Compile Markdown Plain-Text version of the report
  const markdownText = `
# HEADERGUARD HTTP SECURITY AUDIT REPORT
========================================
Confidential Security Dispatch
Generated on: ${new Date(scan.createdAt || Date.now()).toUTCString()}

## 1. Audit Overview
-------------------
Domain Scanned: ${domain}
Target URL: ${scan.url || "N/A"}
Response Status: HTTP ${scan.statusCode || "N/A"}
Scanner Duration: ${scan.scanDuration || 0} ms
Audit Score: ${score} / 100
Grade: ${grade}

## 2. Configuration Metrics
--------------------------
Safe/Configured Headers: ${scan.summary?.present || 0}
Weak Configurations: ${scan.summary?.weak || 0}
Missing/Vulnerable: ${scan.summary?.missing || 0}
Total Items Inspected: ${unifiedFindings.length || 0}

Please see the attached PDF document for the full comprehensive breakdown and remediation steps.

========================================
This email was dispatched securely by HeaderGuard HTTP Response Header Scanner.
(C) ${new Date().getFullYear()} HeaderGuard System. All rights reserved.
`;

  const mailOptions = {
    from: `"HeaderGuard Scanner" <${smtpUser}>`,
    to: toEmail,
    subject: `[HeaderGuard] HTTP Security Audit Report for ${domain} (${grade})`,
    text: markdownText,
    html: htmlContent,
    attachments: [
      {
        filename: `HeaderGuard_Report_${domain}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

/**
 * Sends a registration OTP verification code to a newly created user account.
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit OTP code
 */
export async function sendOtpEmail(toEmail, otp) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    throw new Error("SMTP credentials are not configured in environment variables (.env).");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const htmlContent = `
    <div style="background-color: #050d05; color: #e2e8f0; font-family: 'Courier New', Courier, monospace; padding: 25px; border: 2px solid #1a3d1a; border-radius: 8px; max-width: 500px; margin: 0 auto;">
      <div style="border-bottom: 2px solid #1a3d1a; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
        <h1 style="color: #00ff41; margin: 0; font-size: 24px; letter-spacing: 2px;">HEADERGUARD AUTH</h1>
        <p style="color: #b4ffb4; font-size: 11px; margin: 5px 0 0 0;">ACCOUNT VERIFICATION DISPATCH</p>
      </div>
      
      <p style="font-size: 13px; line-height: 1.6; color: #cbd5e1;">Welcome to HeaderGuard. Use the following security code to verify your identity and activate your account:</p>
      
      <div style="background-color: #0f2210; border: 1px solid #1a3d1a; border-radius: 6px; padding: 20px; margin: 20px 0; text-align: center;">
        <span style="display: block; font-size: 28px; font-weight: bold; color: #00ff41; letter-spacing: 5px; font-family: monospace;">${otp}</span>
        <span style="display: block; font-size: 10px; color: #b4ffb4; margin-top: 10px; text-transform: uppercase;">Expires in 10 minutes</span>
      </div>
      
      <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; text-align: center;">If you did not initiate this registration request, please disregard this email.</p>
      
      <div style="margin-top: 30px; padding-top: 15px; border-top: 1px dashed #1a3d1a; text-align: center; font-size: 9px; color: #94a3b8;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} HeaderGuard System. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"HeaderGuard Scanner" <${smtpUser}>`,
    to: toEmail,
    subject: `[HeaderGuard] Verification OTP: ${otp}`,
    text: `Your HeaderGuard verification OTP code is: ${otp}. It expires in 10 minutes.`,
    html: htmlContent,
  };

  return transporter.sendMail(mailOptions);
}
