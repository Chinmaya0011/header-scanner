import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import connectDB from "@/lib/mongodb";
import Monitor from "@/lib/models/Monitor";
import Scan from "@/lib/models/Scan";
import {
  analyzeHeaders,
  maskDomain,
  normalizeUrl,
  extractDomain,
  generateRecommendations,
  runSecurityAudit,
} from "@/lib/analyzer";

const SCAN_CONFIG = {
  TIMEOUT_MS: 10000,
  USER_AGENT: "HeaderGuard-Monitor/2.0 (+https://github.com/headerguard)",
};

/**
 * Helper to fetch headers over HEAD with GET fallback
 */
async function fetchHeaders(url) {
  let headersObj = {};
  let statusCode = null;
  let methodUsed = "HEAD";
  
  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(SCAN_CONFIG.TIMEOUT_MS),
      headers: {
        "User-Agent": SCAN_CONFIG.USER_AGENT,
        "Accept": "text/html",
      },
    });

    statusCode = headRes.status;
    headRes.headers.forEach((value, key) => {
      headersObj[key.toLowerCase()] = value;
    });
    
    // Fallback to GET if headers are empty or standard security indicators are absent
    const hasCsp = headersObj["content-security-policy"];
    if (!hasCsp && statusCode !== 405) {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(SCAN_CONFIG.TIMEOUT_MS),
        headers: {
          "User-Agent": SCAN_CONFIG.USER_AGENT,
          "Accept": "text/html",
        },
      });
      
      statusCode = getRes.status;
      headersObj = {};
      getRes.headers.forEach((value, key) => {
        headersObj[key.toLowerCase()] = value;
      });
      methodUsed = "GET";
    }
  } catch (error) {
    throw new Error(`Reachability failure: ${error.message}`);
  }
  
  return { headersObj, statusCode, methodUsed };
}

/**
 * Send warning alerts on rating drops
 */
async function sendAlertEmail(toEmail, domain, oldScore, newScore, oldGrade, newGrade, scanId) {
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpUser || !smtpPass) {
    console.error("SMTP credentials not configured.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: smtpUser, pass: smtpPass },
  });

  const mailOptions = {
    from: `"HeaderGuard Alerting" <${smtpUser}>`,
    to: toEmail,
    subject: `[ALERT] Security Header Degradation Detected on ${domain}`,
    html: `
      <div style="font-family: sans-serif; padding: 25px; border: 1px solid #ef4444; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #fef2f2; color: #1e293b;">
        <h2 style="color: #ef4444; margin-top: 0; font-size: 20px; font-family: monospace;">⚠️ Security Regression Warning</h2>
        <p style="font-size: 13px; line-height: 1.5;">Our background monitoring service has identified that the security posture of your website <strong>${domain}</strong> has degraded.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #ffffff; border: 1px solid #fca5a5; border-radius: 6px; overflow: hidden; font-size: 12px;">
          <tr style="background-color: #fee2e2; border-bottom: 1px solid #fca5a5;">
            <th style="padding: 10px; text-align: left; font-weight: bold;">Security Metric</th>
            <th style="padding: 10px; text-align: center; font-weight: bold;">Previous Audit</th>
            <th style="padding: 10px; text-align: center; color: #ef4444; font-weight: bold;">Current Audit</th>
          </tr>
          <tr>
            <td style="padding: 10px; font-weight: bold;">Security Score</td>
            <td style="padding: 10px; text-align: center; font-family: monospace;">${oldScore !== undefined ? oldScore : "N/A"}/100</td>
            <td style="padding: 10px; text-align: center; font-family: monospace; color: #ef4444; font-weight: bold;">${newScore}/100</td>
          </tr>
          <tr style="border-top: 1px solid #f1f5f9;">
            <td style="padding: 10px; font-weight: bold;">Security Grade</td>
            <td style="padding: 10px; text-align: center; font-family: monospace;">${oldGrade || "N/A"}</td>
            <td style="padding: 10px; text-align: center; font-family: monospace; color: #ef4444; font-weight: bold;">${newGrade}</td>
          </tr>
        </table>

        <p style="font-size: 13px; line-height: 1.5;">This degradation typically indicates that a recent software deployment or configuration change at the origin server has removed or weakened security response headers.</p>
        
        <div style="margin-top: 25px; text-align: center;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scan/${scanId}" style="background-color: #ef4444; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
            View Detailed Scan Findings & Fixes
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #fca5a5; margin: 25px 0 15px 0;" />
        <p style="font-size: 9px; color: #991b1b; margin: 0; text-align: center; font-family: monospace;">This dispatch was automatically sent by the HeaderGuard SecOps service.</p>
      </div>
    `
  };

  return transporter.sendMail(mailOptions);
}

/**
 * GET /api/cron
 * Run website monitor audits
 */
export async function GET(request) {
  // Validate CRON token authorization to protect against spamming scans
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get("secret") || request.headers.get("x-cron-secret");
  const configuredSecret = process.env.CRON_SECRET;

  if (configuredSecret && cronSecret !== configuredSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized." }, { status: 401 });
  }

  try {
    await connectDB();
    const now = new Date();
    
    // Deduct due times
    const oneDayAgo = new Date(now.getTime() - 23 * 60 * 60 * 1000); // 23h buffer
    const sevenDaysAgo = new Date(now.getTime() - 6.8 * 24 * 60 * 60 * 1000); // 6.8d buffer

    const dueMonitors = await Monitor.find({
      active: true,
      $or: [
        { lastRun: null },
        { frequency: "daily", lastRun: { $lt: oneDayAgo } },
        { frequency: "weekly", lastRun: { $lt: sevenDaysAgo } }
      ]
    });

    console.log(`[Cron Monitor] Found ${dueMonitors.length} monitor schedules due for scanning.`);
    
    const results = {
      totalDue: dueMonitors.length,
      scanned: 0,
      alertsSent: 0,
      failures: 0,
      details: []
    };

    for (const monitor of dueMonitors) {
      try {
        console.log(`[Cron Monitor] Scanning: ${monitor.url}`);
        const fetchResult = await fetchHeaders(monitor.url);
        
        const analysis = analyzeHeaders(fetchResult.headersObj);
        const recommendations = generateRecommendations(analysis);
        const securityAudit = runSecurityAudit(fetchResult.headersObj, monitor.url, fetchResult.statusCode);
        
        // Save scan history record
        const scan = await Scan.create({
          url: monitor.url,
          domain: monitor.domain,
          maskedDomain: maskDomain(monitor.domain),
          score: analysis.score,
          grade: analysis.grade,
          headers: analysis.headers,
          vulnerabilities: securityAudit.vulnerabilities,
          statusCode: fetchResult.statusCode,
          scanDuration: 100, // mock duration
          summary: analysis.summary,
          owner: monitor.user,
          recommendations: recommendations.map(rec => ({
            header: rec.name,
            severity: rec.severity,
            recommendation: rec.recommendation,
            expectedFormat: rec.expectedFormat,
            reference: rec.reference,
          })),
          compliance: securityAudit.compliance,
        });

        // Check if grade/score has degraded
        let alertTriggered = false;
        if (monitor.lastScore !== undefined && analysis.score < monitor.lastScore) {
          alertTriggered = true;
          await sendAlertEmail(
            monitor.alertEmail,
            monitor.domain,
            monitor.lastScore,
            analysis.score,
            monitor.lastGrade,
            analysis.grade,
            scan._id.toString()
          );
          results.alertsSent++;
        }

        // Update monitor status
        monitor.lastRun = new Date();
        monitor.lastScore = analysis.score;
        monitor.lastGrade = analysis.grade;
        await monitor.save();

        results.scanned++;
        results.details.push({
          url: monitor.url,
          score: analysis.score,
          grade: analysis.grade,
          alertTriggered
        });
      } catch (scanErr) {
        console.error(`[Cron Monitor] Failed to run check for URL ${monitor.url}:`, scanErr);
        results.failures++;
        results.details.push({
          url: monitor.url,
          status: "FAILED",
          error: scanErr.message
        });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Cron route runtime failure:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
