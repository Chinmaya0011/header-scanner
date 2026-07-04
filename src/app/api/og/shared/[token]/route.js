// src/app/api/og/shared/[token]/route.js
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

function gradeGlow(grade) {
  if (!grade) return "rgba(107,114,128,0.08)";
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "rgba(16,185,129,0.18)";
  if (g.startsWith("B")) return "rgba(34,211,238,0.18)";
  if (g.startsWith("C")) return "rgba(245,158,11,0.18)";
  if (g.startsWith("D")) return "rgba(249,115,22,0.18)";
  return "rgba(239,68,68,0.18)";
}

function scoreBarColor(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#22d3ee";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

function scoreLabel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
}

async function getScanData(token) {
  try {
    await connectDB();
    const scan = await Scan.findOne({ shareToken: token, isPublic: true }).lean();
    if (!scan) return null;
    return {
      domain: scan.maskedDomain || scan.domain || "Unknown",
      score: scan.score ?? 0,
      grade: scan.grade || "N/A",
      createdAt: scan.createdAt
        ? new Date(scan.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null,
    };
  } catch {
    return null;
  }
}

export async function GET(request, { params }) {
  const { token } = await params;
  const scan = await getScanData(token);

  const domain = scan?.domain ?? "Unknown Domain";
  const score = scan?.score ?? 0;
  const grade = scan?.grade ?? "N/A";
  const scanDate = scan?.createdAt ?? null;

  const gColor = gradeColor(grade);
  const gBg = gradeBg(grade);
  const gGlow = gradeGlow(grade);
  const barColor = scoreBarColor(score);
  const barWidth = Math.round((score / 100) * 500);
  const label = scoreLabel(score);

  const tags = ["CSP", "HSTS", "X-Frame-Options", "CORS", "Permissions-Policy"];

  const imageResponse = new ImageResponse(
    React.createElement(
      "div",
      {
        style: {
          width: 1200, height: 630, display: "flex", flexDirection: "column",
          background: "linear-gradient(135deg, #050810 0%, #090d1a 45%, #060b18 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif", position: "relative", overflow: "hidden",
        },
      },
      /* Subtle grid background */
      React.createElement("div", {
        style: {
          display: "flex", position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(20,255,200,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(20,255,200,0.022) 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        },
      }),
      /* Top accent gradient line — purple tint to differentiate from private scan */
      React.createElement("div", {
        style: {
          display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg, transparent 0%, #7c3aed 20%, #00c6a0 50%, #7c3aed 80%, transparent 100%)",
        },
      }),
      /* Top-right glow blob */
      React.createElement("div", {
        style: {
          display: "flex", position: "absolute", top: -100, right: -100, width: 420, height: 420,
          borderRadius: "50%", background: `radial-gradient(circle, ${gGlow} 0%, transparent 68%)`,
        },
      }),
      /* Bottom-left subtle glow */
      React.createElement("div", {
        style: {
          display: "flex", position: "absolute", bottom: -60, left: -60, width: 280, height: 280,
          borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)",
        },
      }),
      /* Main content container */
      React.createElement(
        "div",
        { style: { display: "flex", flexDirection: "column", height: "100%", padding: "48px 68px", position: "relative" } },

        /* ── Brand header row ── */
        React.createElement(
          "div",
          { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 } },
          /* Logo + name */
          React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 12 } },
            /* Shield icon */
            React.createElement(
              "div",
              {
                style: {
                  width: 40, height: 40, borderRadius: 10,
                  background: "rgba(0,198,160,0.15)", border: "1.5px solid rgba(0,198,160,0.35)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                },
              },
              React.createElement("div", {
                style: {
                  width: 20, height: 22,
                  background: "linear-gradient(160deg, #00e5b9 0%, #00c6a0 100%)",
                  clipPath: "polygon(50% 0%, 100% 25%, 100% 60%, 50% 100%, 0% 60%, 0% 25%)",
                },
              })
            ),
            React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column" } },
              React.createElement(
                "span",
                { style: { fontSize: 18, fontWeight: 900, color: "#fff", display: "flex", letterSpacing: -0.5 } },
                "Header",
                React.createElement("span", { style: { color: "#00c6a0" } }, "Guard")
              ),
              React.createElement("span", {
                style: { fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 },
              }, "Security Scanner")
            )
          ),
          /* Right badges: "Shared Report" + date */
          React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 10 } },
            /* 🔗 Shared Report badge — distinct visual differentiator */
            React.createElement(
              "div",
              {
                style: {
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.35)",
                  borderRadius: 8, padding: "6px 14px",
                  fontSize: 10, color: "#a78bfa", fontWeight: 800,
                  letterSpacing: 2, textTransform: "uppercase",
                },
              },
              React.createElement("div", {
                style: {
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#7c3aed", boxShadow: "0 0 6px #7c3aed99",
                },
              }),
              "Shared Report"
            ),
            /* Scan date */
            scanDate
              ? React.createElement(
                  "div",
                  {
                    style: {
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8, padding: "6px 14px", fontSize: 11,
                      color: "rgba(255,255,255,0.35)", fontWeight: 600, letterSpacing: 0.5,
                    },
                  },
                  scanDate
                )
              : null
          )
        ),

        /* ── Main content row ── */
        React.createElement(
          "div",
          { style: { display: "flex", flex: 1, gap: 52, alignItems: "center" } },

          /* Left: domain + score bar */
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 0 } },
            React.createElement("div", {
              style: {
                fontSize: 11, fontWeight: 800, color: "#00c6a0", letterSpacing: 4,
                textTransform: "uppercase", marginBottom: 14,
              },
            }, "HTTP Security Audit Report"),
            React.createElement("div", {
              style: {
                fontSize: domain.length > 30 ? 36 : domain.length > 20 ? 42 : 50,
                fontWeight: 900, color: "#ffffff", lineHeight: 1.1,
                letterSpacing: -1.5, marginBottom: 10, wordBreak: "break-all", maxWidth: 580,
              },
            }, domain),
            React.createElement("div", {
              style: { fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500, marginBottom: 40 },
            }, "headerguards.online \u00B7 Instant Security Analysis"),

            /* Score bar section */
            React.createElement(
              "div",
              { style: { display: "flex", flexDirection: "column", gap: 10 } },
              React.createElement(
                "div",
                { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
                React.createElement(
                  "div",
                  { style: { display: "flex", alignItems: "center", gap: 8 } },
                  React.createElement("span", {
                    style: { fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 },
                  }, "Security Score"),
                  React.createElement("span", {
                    style: {
                      fontSize: 9, fontWeight: 700, color: barColor,
                      background: barColor + "18", border: "1px solid " + barColor + "40",
                      borderRadius: 4, padding: "2px 7px", letterSpacing: 1, textTransform: "uppercase",
                    },
                  }, label)
                ),
                React.createElement("span", {
                  style: { fontSize: 15, color: barColor, fontWeight: 900, fontFamily: "monospace", letterSpacing: -0.5 },
                }, score + "/100")
              ),
              /* Track */
              React.createElement(
                "div",
                { style: { display: "flex", height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 99, overflow: "hidden", width: 500 } },
                React.createElement("div", {
                  style: {
                    height: "100%", width: barWidth, borderRadius: 99,
                    background: "linear-gradient(90deg, " + barColor + "88, " + barColor + ")",
                    boxShadow: "0 0 12px " + barColor + "55",
                  },
                })
              )
            )
          ),

          /* Right: Grade card */
          React.createElement(
            "div",
            { style: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minWidth: 190 } },
            React.createElement(
              "div",
              {
                style: {
                  width: 172, height: 172, borderRadius: 28,
                  background: gBg, border: "2px solid " + gColor + "45",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 6, boxShadow: "0 0 40px " + gColor + "20, inset 0 0 30px " + gColor + "06",
                },
              },
              React.createElement("span", {
                style: { fontSize: 90, fontWeight: 900, color: gColor, lineHeight: 1, letterSpacing: -5, textShadow: "0 0 30px " + gColor + "60" },
              }, grade),
              React.createElement("span", {
                style: { fontSize: 9, color: "rgba(255,255,255,0.28)", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 },
              }, "Security Grade")
            )
          )
        ),

        /* ── Bottom: tags row ── */
        React.createElement(
          "div",
          { style: { display: "flex", gap: 8, marginTop: 24, alignItems: "center" } },
          ...tags.map((tag) =>
            React.createElement("div", {
              key: tag,
              style: {
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 6, padding: "5px 12px", fontSize: 10,
                color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700,
              },
            }, tag)
          ),
          React.createElement("div", {
            style: { marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.2)", fontWeight: 500, letterSpacing: 0.5 },
          }, "headerguards.online")
        )
      )
    ),
    { width: 1200, height: 630 }
  );

  // Set cache headers so social crawlers can cache and display the image
  imageResponse.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=3600");
  imageResponse.headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  return imageResponse;
}