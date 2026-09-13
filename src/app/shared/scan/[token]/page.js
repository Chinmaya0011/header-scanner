import { notFound } from "next/navigation";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import ScanResults from "@/components/ui/ScanResults";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { ArrowLeft, Clock } from "lucide-react";

/**
 * Direct server-side DB query function for public scan
 */
async function getSharedScan(token) {
  try {
    await connectDB();
    const scan = await Scan.findOne({ shareToken: token, isPublic: true }).lean();
    if (!scan) return null;
    return JSON.parse(JSON.stringify(scan));
  } catch (error) {
    console.error("Shared scan database fetch error:", error);
    return null;
  }
}

import { constructMetadata } from "@/lib/seo";

// SEO Dynamic Metadata Generation for public link
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const { token } = resolvedParams;
  const scan = await getSharedScan(token);

  if (!scan) {
    return constructMetadata({
      title: "Shared Report Not Found | HeaderGuard",
      description: "The requested shared scan report could not be found or has expired.",
      noIndex: true,
    });
  }

  const siteDomain = scan.domain;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.headerguards.online";
  const ogImageUrl = `${BASE_URL}/api/og/shared/${token}`;

  return constructMetadata({
    title: `Shared Security Audit: ${siteDomain} | Grade ${scan.grade}`,
    description: `Public HTTP security header report for ${siteDomain}. Security Score: ${scan.score}/100, Grade: ${scan.grade}. Covers CSP, HSTS, X-Frame-Options, CORS, and more.`,
    url: `/shared/scan/${token}`,
    image: ogImageUrl,
    keywords: [
      `shared scan ${siteDomain}`,
      `grade ${scan.grade}`,
      "http security headers",
      "headerguard",
    ],
  });
}

export default async function SharedScanPage({ params }) {
  const resolvedParams = await params;
  const { token } = resolvedParams;
  const scan = await getSharedScan(token);

  if (!scan) {
    notFound();
  }

  const scanDate = scan.createdAt || scan.metadata?.timestamp || new Date().toISOString();

  return (
    <div className="min-h-screen bg-bg font-sans text-text">
      
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-border/60 pb-4">
          <div className="flex items-center gap-4">
            <Link href="/" passHref>
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                Back to Scanner
              </Button>
            </Link>
            <span className="text-border">·</span>
            <div className="flex items-center gap-1.5 text-text-dim text-xs font-semibold">
              <Clock className="h-4 w-4 text-accent/70" />
              <span>
                Shared Report · Scanned{" "}
                {new Date(scanDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
          <div className="text-xs text-text-muted font-semibold uppercase tracking-wider bg-panel/30 border border-border/80 px-3 py-1 rounded-full">
            Public Shared View
          </div>
        </div>

        <ScanResults result={scan} />
      </main>
    </div>
  );
}
