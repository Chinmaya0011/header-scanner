import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { getUserFromRequest } from "@/lib/auth";
import { logActivity } from "@/lib/server/activityLogger";

const execAsync = promisify(exec);

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    const runReportPath = path.join(process.cwd(), "run-report.json");
    const gitleaksReportPath = path.join(process.cwd(), "gitleaks-report.json");

    let runReport = null;
    let gitleaksFindings = [];

    if (fs.existsSync(runReportPath)) {
      try {
        const rawRun = fs.readFileSync(runReportPath, "utf-8").replace(/^\uFEFF/, "").trim();
        runReport = JSON.parse(rawRun);
      } catch (e) {
        console.error("Error reading run-report.json:", e);
      }
    }

    if (fs.existsSync(gitleaksReportPath)) {
      try {
        const rawGit = fs.readFileSync(gitleaksReportPath, "utf-8").replace(/^\uFEFF/, "").trim();
        gitleaksFindings = JSON.parse(rawGit);
      } catch (e) {
        console.error("Error reading gitleaks-report.json:", e);
      }
    }

    if (!runReport && (!gitleaksFindings || gitleaksFindings.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "No secret scan report found. Please execute run.sh or trigger a new scan.",
        },
        { status: 404 }
      );
    }

    // Log viewing event for audit trail
    await logActivity({
      req: request,
      user,
      eventType: "GITLEAKS_REPORT_VIEWED",
      description: `Admin inspected Gitleaks Secret Detection report (${gitleaksFindings.length} findings loaded).`,
      status: "info",
      resourceType: "security_scan",
      metadata: {
        totalFindings: gitleaksFindings.length,
        status: runReport?.status || "SUCCESS"
      }
    });

    return NextResponse.json({
      success: true,
      report: runReport,
      gitleaks: gitleaksFindings,
      updatedAt: runReport?.updatedAt || runReport?.timestamp || new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error serving gitleaks admin scan report:", error);
    return NextResponse.json(
      { success: false, error: "Failed to read Gitleaks report data." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const scriptPath = path.join(process.cwd(), "scripts", "scan-secrets.js");
    let scanError = null;

    try {
      await execAsync(`node "${scriptPath}"`);
    } catch (err) {
      scanError = err.message;
    }

    const runReportPath = path.join(process.cwd(), "run-report.json");
    const gitleaksReportPath = path.join(process.cwd(), "gitleaks-report.json");

    let runReport = null;
    let gitleaksFindings = [];

    if (fs.existsSync(runReportPath)) {
      const rawRun = fs.readFileSync(runReportPath, "utf-8").replace(/^\uFEFF/, "").trim();
      runReport = JSON.parse(rawRun);
    }

    if (fs.existsSync(gitleaksReportPath)) {
      const rawGit = fs.readFileSync(gitleaksReportPath, "utf-8").replace(/^\uFEFF/, "").trim();
      gitleaksFindings = JSON.parse(rawGit);
    }

    // Log trigger scan event for audit trail
    await logActivity({
      req: request,
      user,
      eventType: "GITLEAKS_SCAN_TRIGGERED",
      description: `Admin triggered fresh Gitleaks Secret Scan execution (${gitleaksFindings.length} findings).`,
      status: scanError ? "warning" : "success",
      resourceType: "security_scan",
      metadata: {
        totalFindings: gitleaksFindings.length,
        scanError
      }
    });

    return NextResponse.json({
      success: true,
      message: scanError ? "Gitleaks scan completed with findings or warnings." : "Gitleaks scan completed cleanly.",
      scanError,
      report: runReport,
      gitleaks: gitleaksFindings,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error triggering gitleaks scan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to execute Gitleaks scan." },
      { status: 500 }
    );
  }
}
