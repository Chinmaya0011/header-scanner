import Navbar from "@/components/Navbar";
import HistoryTable from "@/components/HistoryTable";
import { MdHistory } from "react-icons/md";

async function getScans() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/history`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function HistoryPage() {
  const scans = await getScans();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-accent/10 border border-accent/30">
            <MdHistory className="text-accent text-xl" />
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
