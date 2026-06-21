import nodemailer from "nodemailer";

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

  // Extract vulnerable / missing / weak headers
  const vulnerableHeaders = scan.headers.filter((h) => h.status !== "present");
  
  // Compile Action Items HTML block
  let actionItemsHTML = "";
  if (vulnerableHeaders.length > 0) {
    actionItemsHTML = `
      <div style="margin: 25px 0; border: 1px dashed #dc2626; border-radius: 6px; padding: 15px; background-color: rgba(220, 38, 38, 0.03);">
        <h3 style="color: #ef4444; font-size: 13px; font-weight: bold; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; font-family: monospace;">Vulnerable Headers & Action Items</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; color: #cbd5e1; text-align: left;">
            <thead>
              <tr style="border-bottom: 1px solid #1a3d1a; color: #00ff41; font-family: monospace;">
                <th style="padding: 6px; font-weight: bold; text-transform: uppercase;">Header Name</th>
                <th style="padding: 6px; font-weight: bold; text-transform: uppercase; text-align: center;">Status</th>
                <th style="padding: 6px; font-weight: bold; text-transform: uppercase; text-align: center;">Severity</th>
                <th style="padding: 6px; font-weight: bold; text-transform: uppercase; text-align: right;">Implementation & Fix</th>
              </tr>
            </thead>
            <tbody>
              ${vulnerableHeaders
                .map(
                  (h) => `
                <tr style="border-bottom: 1px solid rgba(30, 45, 69, 0.5);">
                  <td style="padding: 8px 6px; font-family: monospace; color: #e2e8f0; font-weight: bold;">${h.name}</td>
                  <td style="padding: 8px 6px; text-align: center;">
                    <span style="color: ${h.status === "missing" ? "#ef4444" : "#d97706"}; font-weight: bold; text-transform: uppercase; font-size: 10px;">${h.status}</span>
                  </td>
                  <td style="padding: 8px 6px; text-align: center;">
                    <span style="color: ${h.severity === "critical" || h.severity === "high" ? "#ef4444" : "#d97706"}; font-weight: bold; text-transform: uppercase; font-size: 9px;">${h.severity}</span>
                  </td>
                  <td style="padding: 8px 6px; text-align: right; color: #94a3b8; font-style: italic;">
                    ${h.recommendation || "Implement this security header."}
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    actionItemsHTML = `
      <div style="margin: 25px 0; border: 1px solid #16a34a; border-radius: 6px; padding: 15px; text-align: center; background-color: rgba(22, 163, 74, 0.03);">
        <h3 style="color: #22c55e; font-size: 13px; margin: 0; text-transform: uppercase; font-family: monospace;">✔ Perfect Security Posture</h3>
        <p style="color: #b4ffb4; font-size: 11px; margin: 5px 0 0 0;">All 8 essential HTTP security response headers are properly configured.</p>
      </div>
    `;
  }

  // Compile full Detailed Headers Breakdown HTML block
  const headersBreakdownHTML = `
    <div style="margin: 25px 0; border: 1px solid #1a3d1a; border-radius: 6px; padding: 15px; background-color: #0a1a0a;">
      <h3 style="color: #00ff41; font-size: 13px; font-weight: bold; margin-top: 0; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; font-family: monospace; border-bottom: 1px solid #1a3d1a; padding-bottom: 8px;">Detailed Header Breakdown</h3>
      <div>
        ${scan.headers
          .map((h, i) => {
            let badgeColor = "#ef4444"; // red for missing
            let badgeBg = "rgba(239, 68, 68, 0.1)";
            if (h.status === "present") {
              badgeColor = "#22c55e"; // green
              badgeBg = "rgba(34, 197, 94, 0.1)";
            } else if (h.status === "weak") {
              badgeColor = "#f59e0b"; // orange
              badgeBg = "rgba(245, 158, 11, 0.1)";
            }

            return `
              <div style="border-bottom: 1px solid #1a3d1a; padding: 12px 0; ${
                i === scan.headers.length - 1 ? "border-bottom: none; padding-bottom: 0;" : ""
              } ${i === 0 ? "padding-top: 0;" : ""}">
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px;">
                  <tr>
                    <td style="text-align: left; vertical-align: middle;">
                      <strong style="color: #e2e8f0; font-family: monospace; font-size: 12px;">${h.name}</strong>
                    </td>
                    <td style="text-align: right; vertical-align: middle;">
                      <span style="color: ${badgeColor}; background-color: ${badgeBg}; border: 1px solid ${badgeColor}; border-radius: 4px; padding: 2px 8px; font-size: 9px; font-weight: bold; text-transform: uppercase; font-family: monospace; display: inline-block;">${
              h.status
            }</span>
                    </td>
                  </tr>
                </table>
                <p style="margin: 4px 0; font-size: 11px; color: #cbd5e1; font-family: sans-serif; line-height: 1.4;">${
                  h.description || "No description provided."
                }</p>
                ${
                  h.status === "present"
                    ? `<p style="margin: 6px 0 0 0; font-size: 10px; font-family: monospace; color: #39ff14; background-color: rgba(57, 255, 20, 0.05); padding: 6px; border: 1px solid rgba(57, 255, 20, 0.2); border-radius: 4px; word-break: break-all;"><strong>Value:</strong> ${h.value}</p>`
                    : `<p style="margin: 6px 0 0 0; font-size: 10px; font-family: monospace; color: #ff3d00; background-color: rgba(255, 61, 0, 0.05); padding: 6px; border: 1px solid rgba(255, 61, 0, 0.2); border-radius: 4px; font-style: italic;"><strong>Fix:</strong> ${
                        h.recommendation || "Implement this security header."
                      }</p>`
                }
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;

  // HTML Email Template
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
            <td style="text-align: right; padding: 6px 0 2px 0; color: #00ff41; font-weight: bold;">${scan.headers?.length || 0}</td>
          </tr>
        </table>
      </div>

      ${actionItemsHTML}

      ${headersBreakdownHTML}
      
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
Total Headers Inspected: ${scan.headers?.length || 0}

## 3. Vulnerable Headers & Action Items
--------------------------------------
${
  vulnerableHeaders.length > 0
    ? vulnerableHeaders
        .map(
          (h) => `
* Header: ${h.name}
  Status: ${h.status.toUpperCase()}
  Severity: ${h.severity.toUpperCase()}
  Recommendation: ${h.recommendation || "Implement this security header."}
  Description: ${h.description || "No description provided."}
`
        )
        .join("\n")
    : "Perfect Security Posture. All 8 essential HTTP security response headers are properly configured."
}

## 4. Full Header Analysis Breakdown
-----------------------------------
${scan.headers
  .map(
    (h) => `
* ${h.name}
  Status: ${h.status.toUpperCase()}
  Severity: ${h.severity.toUpperCase()}
  Description: ${h.description || "No description provided."}
  ${h.status === "present" ? `Value: ${h.value}` : `Fix: ${h.recommendation || "Not configured"}`}
`
  )
  .join("\n")}

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
