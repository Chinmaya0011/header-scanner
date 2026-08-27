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
    const filePath = path.join(process.cwd(), "semgrep-report.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "semgrep-report.json not found on server" },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "").trim();
    const data = JSON.parse(fileContent);
    const totalFindings = Array.isArray(data.results) ? data.results.length : 0;

    // Log viewing event for audit trail
    await logActivity({
      req: request,
      user,
      eventType: "SEMGREP_SAST_VIEWED",
      description: `Admin inspected Semgrep SAST Security Scan report (${totalFindings} findings loaded).`,
      status: "info",
      resourceType: "security_scan",
      metadata: {
        totalFindings
      }
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error reading semgrep-report.json:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse security scan report" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    const scriptPath = path.join(process.cwd(), "scripts", "run-semgrep.js");
    let scanError = null;

    try {
      await execAsync(`node "${scriptPath}"`);
    } catch (err) {
      scanError = err.message;
    }

    const filePath = path.join(process.cwd(), "semgrep-report.json");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { success: false, error: "semgrep-report.json was not generated." },
        { status: 500 }
      );
    }

    const fileContent = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "").trim();
    const data = JSON.parse(fileContent);
    const totalFindings = Array.isArray(data.results) ? data.results.length : 0;

    // Log trigger scan event for audit trail
    await logActivity({
      req: request,
      user,
      eventType: "SEMGREP_SAST_TRIGGERED",
      description: `Admin triggered fresh Semgrep SAST Code Security Scan execution (${totalFindings} findings).`,
      status: scanError ? "warning" : "success",
      resourceType: "security_scan",
      metadata: {
        totalFindings,
        scanError
      }
    });

    return NextResponse.json({
      success: true,
      message: scanError ? "Semgrep scan completed with warnings." : "Semgrep scan completed successfully.",
      scanError,
      data,
    });
  } catch (error) {
    console.error("Error triggering semgrep scan:", error);
    return NextResponse.json(
      { success: false, error: "Failed to execute Semgrep scan." },
      { status: 500 }
    );
  }
}
