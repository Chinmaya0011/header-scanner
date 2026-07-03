import HistoryTable from "@/components/tables/HistoryTable";
import { History } from "lucide-react";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

// Direct server-side DB query function
async function getScansDirectly() {
  try {
    await connectDB();
    
    // Check if requester is admin
    const user = await getCurrentUser();
    const isAdmin = user && user.role === "admin";
    const limitCount = user ? 50 : 4;

    const scans = await Scan.find({})
      .sort({ createdAt: -1 })
      .limit(limitCount)
      .select("maskedDomain domain score grade summary statusCode scanDuration createdAt owner")
      .lean();

    // Map and serialize values
    return scans.map((s) => {
      const isOwner = user && s.owner && s.owner.toString() === user._id.toString();
      const showRaw = isAdmin || isOwner;
      return {
        _id: s._id.toString(),
        domain: showRaw ? s.domain : s.maskedDomain,
        maskedDomain: s.maskedDomain,
        score: s.score,
        grade: s.grade,
        summary: s.summary,
        statusCode: s.statusCode,
        scanDuration: s.scanDuration,
        createdAt: s.createdAt.toISOString(),
      };
    });
  } catch (error) {
    console.error("Direct history fetch error:", error);
    return [];
  }
}

// SEO static metadata configuration
export const metadata = {
  title: "Public Audit History | HeaderGuard",
  description: "View recent website security header scan audits. Privacy-masked history showing security scores and grades of evaluated sites.",
};

export default async function HistoryPage() {
  const scans = await getScansDirectly();
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen bg-bg">
      
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-accent/10 border border-accent/30">
            <History className="text-accent text-xl animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Scan History</h1>
            <p className="text-text-dim text-sm">
              {scans.length} scan{scans.length !== 1 ? "s" : ""} recorded — domains are masked for privacy
            </p>
          </div>
        </div>

        <HistoryTable scans={scans} />

        {!user && (
          <div className="mt-8 bg-gradient-to-r from-accent/10 to-accent-light/5 border border-accent/20 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden max-w-3xl mx-auto">
            <div className="absolute top-0 left-0 w-full h-full bg-surface/20 backdrop-blur-[1px] -z-10" />
            <div className="relative z-10 space-y-4">
              <p className="text-xs sm:text-sm font-bold text-text uppercase tracking-wider leading-relaxed">
                Create a free account to view all scan results, access complete reports, and manage your scan history.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3.5">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-light text-white text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-300 hover:shadow-glow"
                >
                  Create Free Account
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-text text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
