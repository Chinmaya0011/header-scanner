"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  Award,
  Info,
  CheckCircle,
  AlertCircle,
  XCircle,
  Zap,
  TrendingUp,
  Lock,
  ShieldCheck,
  Star,
  Target,
  BarChart,
  Settings,
  Circle,
  ChevronRight
} from "lucide-react";
import Navbar from "@/components/Navbar";

// Grade color mapping
function gradeColor(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "#22c55e";
  if (grade === "B+" || grade === "B" || grade === "B-") return "#eab308";
  if (grade === "C+" || grade === "C" || grade === "C-") return "#f59e0b";
  if (grade === "D+" || grade === "D" || grade === "D-") return "#f97316";
  return "#ef4444";
}

function gradeClass(grade) {
  if (grade === "A+" || grade === "A" || grade === "A-") return "text-green-500";
  if (grade === "B+" || grade === "B" || grade === "B-") return "text-yellow-500";
  if (grade === "C+" || grade === "C" || grade === "C-") return "text-amber-500";
  if (grade === "D+" || grade === "D" || grade === "D-") return "text-orange-500";
  return "text-red-500";
}

const GRADE_SCALE = [
  { grade: "A+", range: "95-100", color: "#22c55e", description: "Excellent security" },
  { grade: "A", range: "90-94", color: "#22c55e", description: "Very strong" },
  { grade: "A-", range: "85-89", color: "#22c55e", description: "Good with minor gaps" },
  { grade: "B+", range: "80-84", color: "#eab308", description: "Above average" },
  { grade: "B", range: "75-79", color: "#eab308", description: "Satisfactory" },
  { grade: "B-", range: "70-74", color: "#eab308", description: "Minimum acceptable" },
  { grade: "C+", range: "65-69", color: "#f59e0b", description: "Needs improvement" },
  { grade: "C", range: "60-64", color: "#f59e0b", description: "Below average" },
  { grade: "C-", range: "55-59", color: "#f59e0b", description: "Weak posture" },
  { grade: "D+", range: "50-54", color: "#f97316", description: "Poor security" },
  { grade: "D", range: "45-49", color: "#f97316", description: "Very poor" },
  { grade: "D-", range: "40-44", color: "#f97316", description: "Critical gaps" },
  { grade: "F", range: "0-39", color: "#ef4444", description: "Severe vulnerabilities" },
];

function ScoreExplanationContent() {
  const searchParams = useSearchParams();

  const score = searchParams.get("score");
  const grade = searchParams.get("grade");
  const domain = searchParams.get("domain");
  const scanId = searchParams.get("scanId");

  const currentScore = score ? parseInt(score) : null;
  const currentGrade = grade || null;
  const color = currentGrade ? gradeColor(currentGrade) : "#ef4444";
  const gradeClassName = currentGrade ? gradeClass(currentGrade) : "text-red-500";

  const getScoreMessage = () => {
    if (!currentScore) return "No score available";
    if (currentScore >= 85) return "Excellent security posture!";
    if (currentScore >= 70) return "Good security with room for improvement";
    if (currentScore >= 55) return "Fair security - several headers missing";
    if (currentScore >= 40) return "Poor security - immediate action needed";
    return "Critical - severe security risks detected";
  };

  const getScoreIcon = () => {
    if (!currentScore) return Shield;
    if (currentScore >= 85) return ShieldCheck;
    if (currentScore >= 70) return CheckCircle;
    if (currentScore >= 55) return AlertTriangle;
    if (currentScore >= 40) return AlertCircle;
    return XCircle;
  };

  const ScoreIcon = getScoreIcon();

  // Calculate circle circumference and stroke offset
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const percentage = currentScore ? (currentScore / 100) * circumference : 0;
  const strokeDashoffset = circumference - percentage;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Back Button */}
        <Link
          href={scanId ? `/scan/${scanId}` : "/"}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Results</span>
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Security Score Guide</h1>
            </div>
            <p className="text-gray-600 text-sm">
              Understand how your security headers are evaluated and scored
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-xs text-blue-700 font-medium">v2.0 Scoring System</span>
          </div>
        </div>

        {/* Current Score Card - Circular Design */}
        {currentScore !== null && currentGrade && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center justify-center">
                {/* Circular Score Indicator */}
                <div className="relative inline-flex items-center justify-center">
                  {/* Background Circle */}
                  <svg className="w-48 h-48 transform -rotate-90">
                    <circle
                      cx="96"
                      cy="96"
                      r={radius}
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="10"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r={radius}
                      fill="none"
                      stroke={color}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="relative">
                      <span
                        className="text-6xl font-bold tracking-tight"
                        style={{ color }}
                      >
                        {currentGrade}
                      </span>
                      <div
                        className="absolute -top-1 -right-6 p-1.5 bg-white rounded-full shadow-sm"
                      >
                        <ScoreIcon className="h-4 w-4" style={{ color }} />
                      </div>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{currentScore}</span>
                      <span className="text-sm text-gray-400 font-medium">/ 100</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs font-medium text-gray-600">{getScoreMessage()}</span>
                    </div>
                  </div>
                </div>

                {/* Domain and Status Badges */}
                <div className="mt-6 flex flex-col items-center gap-3">
                  {domain && (
                    <p className="text-sm text-gray-500">
                      Domain: <span className="font-mono text-blue-600 font-medium">{domain}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs text-green-700 font-medium">Present</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      <span className="text-xs text-amber-700 font-medium">Weak</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                      <XCircle className="h-3.5 w-3.5 text-red-600" />
                      <span className="text-xs text-red-700 font-medium">Missing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              How the Score is Calculated
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">1. Header Weights</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Each header has a maximum point value:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-700">Content-Security-Policy</span>
                    <span className="font-bold text-blue-600">25 pts</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-700">HSTS</span>
                    <span className="font-bold text-blue-600">20 pts</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-700">X-Frame-Options</span>
                    <span className="font-bold text-blue-600">10 pts</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-gray-100">
                    <span className="text-gray-700">Other Headers</span>
                    <span className="font-bold text-blue-600">5-10 pts</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t-2 border-gray-200 font-bold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-blue-600">100 pts</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">2. Scoring Rules</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">Evaluation based on header configuration:</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <span className="flex items-center gap-2 text-sm text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      Present & Valid
                    </span>
                    <span className="font-bold text-green-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="flex items-center gap-2 text-sm text-amber-800">
                      <AlertCircle className="h-4 w-4" />
                      Weak Configuration
                    </span>
                    <span className="font-bold text-amber-600">30%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="flex items-center gap-2 text-sm text-red-800">
                      <XCircle className="h-4 w-4" />
                      Missing Header
                    </span>
                    <span className="font-bold text-red-600">0%</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">3. Final Calculation</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Score aggregates evaluated header points dynamically
                </p>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">Example:</span>
                    <span className="text-sm font-bold text-gray-900">65 points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Grade:</span>
                    <span className="text-lg font-bold text-amber-500">C</span>
                    <span className="text-xs text-gray-400">(Needs improvement)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Header Weights Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Header Weights Details
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-6 py-3">Security Header</th>
                  <th className="px-6 py-3 text-center">Max Points</th>
                  <th className="px-6 py-3 text-center">Criticality</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">Content-Security-Policy</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">25</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      Critical
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">Strict-Transport-Security</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">20</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      Critical
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">X-Frame-Options</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">10</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      Critical
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">X-Content-Type-Options</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">10</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      <AlertCircle className="h-3 w-3" />
                      Medium
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">Permissions-Policy</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">10</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      <AlertCircle className="h-3 w-3" />
                      Medium
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">Cross-Origin-Opener-Policy</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">10</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      <AlertCircle className="h-3 w-3" />
                      Medium
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">Cross-Origin-Resource-Policy</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">10</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                      <AlertCircle className="h-3 w-3" />
                      Medium
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-medium text-gray-900">Referrer-Policy</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-blue-600">5</td>
                  <td className="px-6 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      <CheckCircle className="h-3 w-3" />
                      Low
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Grade Scale */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Grade Scale Reference
            </h2>
          </div>
          <div className="p-6">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {GRADE_SCALE.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border transition-all ${currentGrade === item.grade
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.grade}
                    </span>
                    <span className="text-xs font-medium text-gray-500">{item.range}</span>
                  </div>
                  <p className="text-xs text-gray-600">{item.description}</p>
                  {currentGrade === item.grade && (
                    <div className="mt-2 flex items-center gap-1">
                      <Star className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-600">Current Grade</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Pro Tips to Improve Your Score</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="p-1.5 bg-green-100 rounded-full mt-0.5">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Priority 1</p>
                      <p className="text-sm text-gray-600">Fix missing critical headers (CSP, HSTS)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <div className="p-1.5 bg-amber-100 rounded-full mt-0.5">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Priority 2</p>
                      <p className="text-sm text-gray-600">Strengthen weak configurations</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="p-1.5 bg-purple-100 rounded-full mt-0.5">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Priority 3</p>
                      <p className="text-sm text-gray-600">Add medium severity headers</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="p-1.5 bg-blue-100 rounded-full mt-0.5">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Quick Win</p>
                      <p className="text-sm text-gray-600">Each fixed header directly increases your score!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ScoreExplanationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-10 w-10 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-gray-600 text-sm">Loading score explanation...</p>
        </div>
      </div>
    }>
      <ScoreExplanationContent />
    </Suspense>
  );
}