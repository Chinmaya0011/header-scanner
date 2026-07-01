import HistoryTable from "@/components/tables/HistoryTable";
import { History } from "lucide-react";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getCurrentUser } from "@/lib/auth";

// Direct server-side DB query function
async function getScansDirectly() {
  try {
    await connectDB();
    
    // Check if requester is admin
    const user = await getCurrentUser();
    const isAdmin = user && user.role === "admin";

    const scans = await Scan.find({})
      .sort({ createdAt: -1 })
      .limit(50)
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
      </main>
    </div>
  );
}
