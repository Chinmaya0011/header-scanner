// src/app/api/og/scan/[id]/route.js
import { ImageResponse } from "next/og";
import React from "react";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";

export const runtime = "nodejs";

function gradeColor(grade) {
  if (!grade) return "#6b7280";
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "#10b981";
  if (g.startsWith("B")) return "#22d3ee";
  if (g.startsWith("C")) return "#f59e0b";
  if (g.startsWith("D")) return "#f97316";
  return "#ef4444";
}

function gradeBg(grade) {
  if (!grade) return "rgba(107,114,128,0.12)";
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "rgba(16,185,129,0.12)";
  if (g.startsWith("B")) return "rgba(34,211,238,0.12)";
  if (g.startsWith("C")) return "rgba(245,158,11,0.12)";
  if (g.startsWith("D")) return "rgba(249,115,22,0.12)";
  return "rgba(239,68,68,0.12)";
}

function scoreBarColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#22d3ee";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

async function getScanData(id) {
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) return null;
    await connectDB();
    const scan = await Scan.findById(id).lean();
    if (!scan) return null;
    return {
      domain: scan.maskedDomain || scan.domain || "Unknown",
      score: scan.score ?? 0,
      grade: scan.grade || "N/A",
    };
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const { id } = await params;
  const scan = await getScanData(id);

  const domain = scan?.domain ?? "Unknown Domain";
  const score = scan?.score ?? 0;
  const grade = scan?.grade ?? "N/A";

  const gColor = gradeColor(grade);
  const gBg = gradeBg(grade);
  const barColor = scoreBarColor(score);
  const barWidth = Math.round((score / 100) * 480);

  const tags = ["CSP", "HSTS", "X-Frame-Options", "CORS", "Permissions-Policy"];

  return new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: 1200, height: 630, display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #050810 0%, #090d1a 45%, #060b18 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif", position: "relative", overflow: "hidden",
        },
      },
      /* Grid bg */
      React.createElement("div", { style: { display: "flex", position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(20,255,200,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(20,255,200,0.025) 1px, transparent 1px)", backgroundSize: "48px 48px" } }),
      /* Top accent line */
      React.createElement("div", { style: { display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #00c6a0 0%, #00e5b9 50%, #00c6a0 100%)" } }),
      /* Glow */
      React.createElement("div", { style: { display: "flex", position: "absolute", top: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,198,160,0.15) 0%, transparent 70%)" } }),
      /* Main container */
      React.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", height: "100%", padding: "52px 72px", position: "relative" } },
        /* Brand header */
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 40 } },
          React.createElement(
            "div",
            { style: { width: 34, height: 34, borderRadius: 8, background: "rgba(0,198,160,0.15)", border: "1px solid rgba(0,198,160,0.3)", display: "flex", alignItems: "center", justifyContent: "center" } },
            React.createElement("div", { style: { width: 18, height: 18, background: "#00c6a0", opacity: 0.8 } })
          ),
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column" } },
            React.createElement("span", { style: { fontSize: 16, fontWeight: 800, color: "#fff", display: "flex", gap: 0 } }, "Header", React.createElement("span", { style: { color: "#00c6a0" } }, "Guard")),
            React.createElement("span", { style: { fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: 2, textTransform: "uppercase" } }, "Security Scanner")
          )
        ),
        /* Content row */
        React.createElement(
          "div",
          { style: { display: "flex", flex: 1, gap: 48 } },
          /* Left: domain + score */
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" } },
            React.createElement("div", { style: { fontSize: 13, fontWeight: 700, color: "#00c6a0", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 } }, "HTTP Security Audit"),
            React.createElement("div", { style: { fontSize: 46, fontWeight: 900, color: "#ffffff", lineHeight: 1.15, letterSpacing: -1, marginBottom: 16, wordBreak: "break-all", maxWidth: 560 } }, domain),
            React.createElement("div", { style: { fontSize: 15, color: "rgba(255,255,255,0.45)", fontWeight: 500, marginBottom: 36 } }, "Powered by HeaderGuard \u00B7 headerguards.online"),
            React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 8 } },
              React.createElement(
                "div",
                { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement("span", { style: { fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 } }, "Security Score"),
                React.createElement("span", { style: { fontSize: 14, color: barColor, fontWeight: 800, fontFamily: "monospace" } }, score + "/100")
              ),
              React.createElement(
                "div",
                { style: { display: "flex", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden", width: 480 } },
                React.createElement("div", { style: { height: "100%", width: barWidth, borderRadius: 99, background: "linear-gradient(90deg, " + barColor + "99, " + barColor + ")" } })
              )
            )
          ),
          /* Right: Grade card */
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 200 } },
            React.createElement(
              "div",
              { style: { width: 168, height: 168, borderRadius: 24, background: gBg, border: "2px solid " + gColor + "40", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 } },
              React.createElement("span", { style: { fontSize: 86, fontWeight: 900, color: gColor, lineHeight: 1, letterSpacing: -4 } }, grade),
              React.createElement("span", { style: { fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 } }, "Security Grade")
            )
          )
        ),
        /* Bottom tags */
        React.createElement(
          "div",
          { style: { display: "flex", gap: 10, marginTop: 28 } },
          ...tags.map((tag) =>
            React.createElement("div", { key: tag, style: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "5px 12px", fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 } }, tag)
          )
        )
      )
    ),
    { width: 1200, height: 630 }
  );
}