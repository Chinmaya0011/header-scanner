"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  Lock,
  ShieldCheck,
  BadgeCheck,
  AlertTriangle,
  Skull,
  Swords,
} from "lucide-react";
import Navbar from "@/components/Navbar";

function gradeColor(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "var(--success)";
  if (grade === "B+" || grade === "B" || grade === "B-") return "var(--warning)";
  if (grade === "C+" || grade === "C" || grade === "C-") return "#f59e0b";
  if (grade === "D+" || grade === "D" || grade === "D-") return "#f97316";
  return "var(--danger)";
}

function gradeIcon(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return ShieldCheck;
  if (grade === "B+" || grade === "B" || grade === "B-") return BadgeCheck;
  if (grade === "C+" || grade === "C" || grade === "C-") return AlertTriangle;
  if (grade === "D+" || grade === "D" || grade === "D-") return Skull;
  return Swords;
}

const GRADE_SCALE = [
  { grade: "A+", range: "95-100", description: "Excellent security" },
  { grade: "A", range: "90-94", description: "Very strong" },
  { grade: "A-", range: "85-89", description: "Good with minor gaps" },
  { grade: "B+", range: "80-84", description: "Above average" },
  { grade: "B", range: "75-79", description: "Satisfactory" },
  { grade: "B-", range: "70-74", description: "Minimum acceptable" },
  { grade: "C+", range: "65-69", description: "Needs improvement" },
  { grade: "C", range: "60-64", description: "Below average" },
  { grade: "C-", range: "55-59", description: "Weak posture" },
  { grade: "D+", range: "50-54", description: "Poor security" },
  { grade: "D", range: "45-49", description: "Very poor" },
  { grade: "D-", range: "40-44", description: "Critical gaps" },
  { grade: "F", range: "0-39", description: "Severe vulnerabilities" },
];

const HEADER_WEIGHTS = [
  { name: "Content-Security-Policy", points: 25, criticality: "Critical", type: "danger" },
  { name: "Strict-Transport-Security", points: 20, criticality: "Critical", type: "danger" },
  { name: "X-Frame-Options", points: 10, criticality: "Critical", type: "danger" },
  { name: "X-Content-Type-Options", points: 10, criticality: "Medium", type: "warning" },
  { name: "Permissions-Policy", points: 10, criticality: "Medium", type: "warning" },
  { name: "Cross-Origin-Opener-Policy", points: 10, criticality: "Medium", type: "warning" },
  { name: "Cross-Origin-Resource-Policy", points: 10, criticality: "Medium", type: "warning" },
  { name: "Referrer-Policy", points: 5, criticality: "Low", type: "success" },
];

function ScoreExplanationContent() {
  const searchParams = useSearchParams();
  const score = searchParams.get("score");
  const grade = searchParams.get("grade");
  const domain = searchParams.get("domain");
  const scanId = searchParams.get("scanId");

  const currentScore = score ? parseInt(score) : null;
  const currentGrade = grade || null;
  const color = currentGrade ? gradeColor(currentGrade) : "var(--danger)";
  const GradeIcon = currentGrade ? gradeIcon(currentGrade) : Shield;

  const getScoreMessage = () => {
    if (!currentScore) return "No score available";
    if (currentScore >= 85) return "Excellent security posture";
    if (currentScore >= 70) return "Good security, minor gaps remain";
    if (currentScore >= 55) return "Fair — several headers missing";
    if (currentScore >= 40) return "Poor — immediate action needed";
    return "Critical — severe security risks detected";
  };

  return (
    <div className="min-h-screen bg-bg font-mono text-text">
      <Navbar />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-10">
        {/* Back */}
        <Link
          href={scanId ? `/scan/${scanId}` : "/"}
          className="inline-flex items-center gap-2 text-text-dim hover:text-text transition-colors text-xs font-medium group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Results</span>
        </Link>

        {/* ===== HERO ===== */}
        <section>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
              Security Score Guide
            </h1>
            <span className="text-[10px] text-accent border border-accent/30 bg-accent/5 px-2 py-0.5 rounded-full">
              v2.0 scoring
            </span>
          </div>
          <p className="text-xs text-text-dim mt-1.5 max-w-xl">
            How your headers turn into points, and points turn into a grade.
          </p>
        </section>

        {/* ===== CURRENT SCORE — asymmetric split ===== */}
        {currentScore !== null && currentGrade && (
          <section className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-0 border border-border rounded-2xl overflow-hidden">
            {/* left: big grade block, no circle gauge — bold flat panel */}
            <div
              className="relative flex flex-col items-start justify-between p-6 sm:p-8"
              style={{ background: `linear-gradient(135deg, ${color}14, transparent)` }}
            >
              <div className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-widest">
                <GradeIcon className="h-3.5 w-3.5" style={{ color }} />
                Current Grade
              </div>

              <div className="my-4">
                <span className="text-7xl sm:text-8xl font-black leading-none" style={{ color }}>
                  {currentGrade}
                </span>
              </div>

              <div className="w-full">
                <div className="flex items-end justify-between mb-1.5">
                  <span className="text-2xl font-bold text-text">{currentScore}</span>
                  <span className="text-[10px] text-text-dim">/ 100 pts</span>
                </div>
                <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${currentScore}%`, backgroundColor: color }}
                  />
                </div>
                <p className="text-[10px] text-text-dim mt-2">{getScoreMessage()}</p>
              </div>
            </div>

            {/* right: domain + status counts + breakdown, stacked tightly */}
            <div className="p-6 sm:p-8 border-t lg:border-t-0 lg:border-l border-border space-y-5">
              {domain && (
                <div>
                  <p className="text-[9px] text-text-dim uppercase tracking-widest mb-1">Scanned Domain</p>
                  <p className="text-base font-mono text-accent font-semibold truncate">{domain}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Present", sub: "valid config", icon: CheckCircle, tone: "success" },
                  { label: "Weak", sub: "fix needed", icon: AlertCircle, tone: "warning" },
                  { label: "Missing", sub: "critical", icon: XCircle, tone: "danger" },
                ].map(({ label, sub, icon: Icon, tone }) => (
                  <div key={label} className="text-center">
                    <Icon className={`h-5 w-5 mx-auto mb-1 text-${tone}`} />
                    <p className="text-xs font-semibold text-text">{label}</p>
                    <p className="text-[9px] text-text-dim">{sub}</p>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <p className="text-[9px] text-text-dim uppercase tracking-widest mb-2">Top Weighted Headers</p>
                <div className="space-y-1.5">
                  {[["CSP", 25], ["HSTS", 20], ["X-Frame", 10]].map(([label, pts]) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="text-[10px] text-text-dim w-16">{label}</span>
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pts}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-accent w-8 text-right">{pts}pt</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ===== HOW IT WORKS — numbered horizontal flow, not cards ===== */}
        <section>
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4">How Scoring Works</h2>
          <div className="grid sm:grid-cols-3 gap-0 border border-border rounded-2xl overflow-hidden">
            {[
              {
                n: "01",
                title: "Header Weights",
                body: "Every security header carries a fixed max point value, weighted by how critical it is.",
              },
              {
                n: "02",
                title: "Config Evaluation",
                body: "Each header is checked: present & valid scores full points, weak config scores partial, missing scores zero.",
              },
              {
                n: "03",
                title: "Final Aggregation",
                body: "All header scores are summed out of 100, then mapped onto the A+ through F grade scale.",
              },
            ].map((step, i) => (
              <div
                key={step.n}
                className={`p-5 sm:p-6 ${i !== 0 ? "border-t sm:border-t-0 sm:border-l border-border" : ""}`}
              >
                <span className="text-3xl font-black text-border">{step.n}</span>
                <h3 className="text-sm font-bold text-text mt-2 mb-1.5">{step.title}</h3>
                <p className="text-[11px] text-text-dim leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>

          {/* scoring rule legend, inline strip instead of separate card */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-success/5 border border-success/30 text-success font-medium">
              <CheckCircle className="h-3 w-3" /> Present & valid → 100%
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-warning/5 border border-warning/30 text-warning font-medium">
              <AlertTriangle className="h-3 w-3" /> Weak config → 30%
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-danger/5 border border-danger/30 text-danger font-medium">
              <XCircle className="h-3 w-3" /> Missing → 0%
            </span>
          </div>
        </section>

        {/* ===== HEADER WEIGHTS TABLE — cleaner, with inline bar ===== */}
        <section>
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4 flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-accent" /> Header Weights
          </h2>
          <div className="border border-border rounded-2xl overflow-hidden">
            {HEADER_WEIGHTS.map((h, i) => (
              <div
                key={h.name}
                className={`flex items-center gap-4 px-4 sm:px-5 py-3 ${
                  i !== 0 ? "border-t border-border" : ""
                } hover:bg-surface/60 transition-colors`}
              >
                <span className="font-mono text-[11px] text-text w-full sm:w-56 truncate">{h.name}</span>
                <div className="hidden sm:block flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div className={`h-full bg-${h.type} rounded-full`} style={{ width: `${(h.points / 25) * 100}%` }} />
                </div>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border border-${h.type}/30 bg-${h.type}/10 text-${h.type} flex-shrink-0`}
                >
                  {h.criticality}
                </span>
                <span className="text-xs font-bold text-accent w-10 text-right flex-shrink-0">{h.points}pt</span>
              </div>
            ))}
          </div>
        </section>

        {/* ===== GRADE SCALE — compact strip, not grid of boxes ===== */}
        <section>
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4">Grade Scale</h2>
          <div className="border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {GRADE_SCALE.map((item) => {
              const c = gradeColor(item.grade);
              const Icon = gradeIcon(item.grade);
              const isCurrent = currentGrade === item.grade;
              return (
                <div
                  key={item.grade}
                  className={`flex items-center gap-4 px-4 sm:px-5 py-2.5 transition-colors ${
                    isCurrent ? "bg-accent/5" : ""
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" style={{ color: c }} />
                  <span className="text-lg font-bold w-10 flex-shrink-0" style={{ color: c }}>
                    {item.grade}
                  </span>
                  <span className="text-[10px] text-text-dim w-16 flex-shrink-0">{item.range}</span>
                  <span className="text-[11px] text-text flex-1">{item.description}</span>
                  {isCurrent && (
                    <span className="text-[9px] font-bold text-accent border border-accent/40 px-2 py-0.5 rounded-full flex-shrink-0">
                      YOUR GRADE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ===== PRO TIPS — left-rule list instead of card grid ===== */}
        <section className="pb-4">
          <h2 className="text-xs font-bold text-text-dim uppercase tracking-widest mb-4">Improving Your Score</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              ["Priority 1", "Fix missing critical headers first — CSP and HSTS carry the most weight.", "danger"],
              ["Priority 2", "Strengthen weak configurations rather than leaving partial credit on the table.", "warning"],
              ["Priority 3", "Add medium-severity headers like Permissions-Policy and COOP.", "accent"],
              ["Quick Win", "Every fixed header moves your score and grade immediately.", "success"],
            ].map(([title, desc, type]) => (
              <div key={title} className={`pl-4 border-l-2 border-${type}`}>
                <p className={`text-[10px] font-bold uppercase tracking-wide text-${type} mb-1`}>{title}</p>
                <p className="text-[11px] text-text-dim leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function ScoreExplanationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-text-dim text-xs">Loading...</p>
          </div>
        </div>
      }
    >
      <ScoreExplanationContent />
    </Suspense>
  );
}