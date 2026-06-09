import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ScanResults from "@/components/ScanResults";
import { MdArrowBack, MdHistory } from "react-icons/md";

async function getScan(id) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/scan/${id}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Failed");
    return res.json();
  } catch {
    return null;
  }
}

export default async function ScanDetailPage({ params }) {
  const scan = await getScan(params.id);

  if (!scan) notFound();

  return (
    <div className="min-h-screen bg-bg">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/history"
            className="flex items-center gap-1.5 text-text-dim text-sm hover:text-text transition-colors"
          >
            <MdArrowBack />
            Back to History
          </Link>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1.5 text-text-dim text-xs">
            <MdHistory className="text-xs" />
            <span>
              Scanned{" "}
              {new Date(scan.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <ScanResults result={scan} />
      </main>
    </div>
  );
}
