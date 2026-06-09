"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { MdArrowBack, MdInfoOutline } from "react-icons/md";

// Grade color mapping
function gradeColor(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "#00e676";
  if (grade === "B+" || grade === "B" || grade === "B-") return "#00d4ff";
  if (grade === "C+" || grade === "C" || grade === "C-") return "#ffb74d";
  if (grade === "D+" || grade === "D" || grade === "D-") return "#ff9800";
  return "#ff5252";
}

function gradeClass(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "text-[#00e676]";
  if (grade === "B+" || grade === "B" || grade === "B-") return "text-[#00d4ff]";
  if (grade === "C+" || grade === "C" || grade === "C-") return "text-[#ffb74d]";
  if (grade === "D+" || grade === "D" || grade === "D-") return "text-[#ff9800]";
  return "text-[#ff5252]";
}

const GRADE_SCALE = [
  { grade: "A+", range: "95-100", color: "#00e676", description: "Excellent security posture" },
  { grade: "A", range: "90-94", color: "#00e676", description: "Very strong security" },
  { grade: "A-", range: "85-89", color: "#00e676", description: "Good security with minor gaps" },
  { grade: "B+", range: "80-84", color: "#00d4ff", description: "Above average security" },
  { grade: "B", range: "75-79", color: "#00d4ff", description: "Satisfactory security" },
  { grade: "B-", range: "70-74", color: "#00d4ff", description: "Minimum acceptable" },
  { grade: "C+", range: "65-69", color: "#ffb74d", description: "Needs improvement" },
  { grade: "C", range: "60-64", color: "#ffb74d", description: "Below average security" },
  { grade: "C-", range: "55-59", color: "#ffb74d", description: "Weak security posture" },
  { grade: "D+", range: "50-54", color: "#ff9800", description: "Poor security" },
  { grade: "D", range: "45-49", color: "#ff9800", description: "Very poor security" },
  { grade: "D-", range: "40-44", color: "#ff9800", description: "Critical gaps" },
  { grade: "F", range: "0-39", color: "#ff5252", description: "Severe vulnerabilities" },
];

function ScoreExplanationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get parameters from URL
  const score = searchParams.get("score");
  const grade = searchParams.get("grade");
  const domain = searchParams.get("domain");
  const scanId = searchParams.get("scanId");
  
  const currentScore = score ? parseInt(score) : null;
  const currentGrade = grade || null;
  const color = currentGrade ? gradeColor(currentGrade) : "#ff5252";
  const gradeClassName = currentGrade ? gradeClass(currentGrade) : "text-[#ff5252]";

  const getScoreMessage = () => {
    if (!currentScore) return "No score available";
    if (currentScore >= 85) return "Excellent! Your security headers are well configured.";
    if (currentScore >= 70) return "Good! Just a few improvements needed.";
    if (currentScore >= 55) return "Fair! Several critical headers missing.";
    if (currentScore >= 40) return "Poor! Immediate action required.";
    return "Critical! Your site is at severe risk.";
  };

  return (
    <div className="min-h-screen bg-bg py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header with Back Button */}
        <div className="mb-6">
          <Link
            href={scanId ? `/results/${scanId}` : "/"}
            className="inline-flex items-center gap-2 text-text-dim hover:text-accent transition-colors"
          >
            <MdArrowBack className="text-lg" />
            <span>Back to Results</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-surface rounded-xl border border-border shadow-xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-8 text-center border-b border-border">
            <div className="inline-flex items-center gap-2 bg-accent/10 px-4 py-2 rounded-full mb-4">
              <MdInfoOutline className="text-accent" />
              <span className="text-accent text-sm font-medium">Security Score Guide</span>
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">
              Understanding Your Security Score
            </h1>
            <p className="text-text-dim">
              Learn how we calculate security headers score and what each grade means
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Current Score Display (if provided) */}
            {currentScore !== null && currentGrade && (
              <div className="bg-primary/10 rounded-xl p-6 text-center border border-primary/20">
                <h2 className="text-lg font-semibold text-text mb-4">Your Current Score</h2>
                <div className="flex items-center justify-center gap-6 flex-wrap">
                  <div className="text-center">
                    <div className={`font-mono font-bold text-6xl ${gradeClassName}`} style={{ color }}>
                      {currentGrade}
                    </div>
                    <p className="text-text-dim text-sm mt-1">{currentScore}/100</p>
                  </div>
                  <div className="text-left">
                    <p className="text-text-dim">{getScoreMessage()}</p>
                    {domain && (
                      <p className="text-sm text-text-dim mt-2">
                        Domain: <span className="font-mono text-accent">{domain}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* How it Works */}
            <div>
              <h2 className="text-2xl font-bold text-text mb-4">How the Score is Calculated</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="bg-bg rounded-lg p-4 border border-border">
                  <div className="text-3xl mb-2">📊</div>
                  <h3 className="font-semibold text-text mb-2">1. Header Weights</h3>
                  <p className="text-sm text-text-dim mb-3">Each header has a maximum point value:</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>CSP</span>
                      <span className="text-accent font-mono">25 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>HSTS</span>
                      <span className="text-accent font-mono">20 pts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Other Headers</span>
                      <span className="text-accent font-mono">5-10 pts</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border font-semibold">
                      <span>Total</span>
                      <span className="text-accent font-mono">100 pts</span>
                    </div>
                  </div>
                </div>

                <div className="bg-bg rounded-lg p-4 border border-border">
                  <div className="text-3xl mb-2">⚙️</div>
                  <h3 className="font-semibold text-text mb-2">2. Scoring Rules</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>✅ Properly Configured</span>
                      <span className="text-success">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>⚠️ Weak Configuration</span>
                      <span className="text-warning">30%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>❌ Missing/Invalid</span>
                      <span className="text-danger">0%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-bg rounded-lg p-4 border border-border">
                  <div className="text-3xl mb-2">🧮</div>
                  <h3 className="font-semibold text-text mb-2">3. Final Calculation</h3>
                  <p className="text-sm text-text-dim">
                    Score = (Points Earned / 100) × 100
                  </p>
                  <div className="mt-3 p-2 bg-primary/20 rounded text-xs text-text-dim">
                    Example: 65 points = 65% = C grade
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Weights Table */}
            <div>
              <h2 className="text-2xl font-bold text-text mb-4">Header Weights Details</h2>
              <div className="bg-bg rounded-lg border border-border overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-primary/20 border-b border-border">
                    <tr>
                      <th className="text-left p-3 text-text font-semibold">Security Header</th>
                      <th className="text-center p-3 text-text font-semibold">Max Points</th>
                      <th className="text-left p-3 text-text font-semibold">Criticality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">Content-Security-Policy</td>
                      <td className="p-3 text-center text-accent font-mono">25</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-danger/20 text-danger">Critical</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">Strict-Transport-Security</td>
                      <td className="p-3 text-center text-accent font-mono">20</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-danger/20 text-danger">Critical</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">X-Frame-Options</td>
                      <td className="p-3 text-center text-accent font-mono">10</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">High</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">X-Content-Type-Options</td>
                      <td className="p-3 text-center text-accent font-mono">10</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">Medium</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">Permissions-Policy</td>
                      <td className="p-3 text-center text-accent font-mono">10</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">Medium</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">Cross-Origin-Opener-Policy</td>
                      <td className="p-3 text-center text-accent font-mono">10</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">Medium</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">Cross-Origin-Resource-Policy</td>
                      <td className="p-3 text-center text-accent font-mono">10</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">Medium</span></td>
                    </tr>
                    <tr>
                      <td className="p-3 text-text-dim font-mono text-sm">Referrer-Policy</td>
                      <td className="p-3 text-center text-accent font-mono">5</td>
                      <td className="p-3"><span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400">Low</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Grade Scale */}
            <div>
              <h2 className="text-2xl font-bold text-text mb-4">Grade Scale Reference</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {GRADE_SCALE.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border ${
                      currentGrade === item.grade
                        ? 'border-accent bg-accent/10'
                        : 'border-border bg-bg'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-mono font-bold text-xl`} style={{ color: item.color }}>
                        {item.grade}
                      </span>
                      <span className="text-xs text-text-dim">{item.range}</span>
                    </div>
                    <p className="text-xs text-text-dim">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-warning/10 rounded-xl p-6 border border-warning/20">
              <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                💡 Pro Tips to Improve Your Score
              </h3>
              <ul className="space-y-2 text-sm text-text-dim">
                <li>• <span className="font-semibold text-text">Priority 1:</span> Fix missing critical headers (CSP, HSTS)</li>
                <li>• <span className="font-semibold text-text">Priority 2:</span> Strengthen weak configurations</li>
                <li>• <span className="font-semibold text-text">Priority 3:</span> Add medium severity headers</li>
                <li>• Each fixed header directly increases your score!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScoreExplanationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="text-text-dim">Loading...</div>
      </div>
    }>
      <ScoreExplanationContent />
    </Suspense>
  );
}