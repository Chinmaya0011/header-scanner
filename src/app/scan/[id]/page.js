import { notFound } from "next/navigation";
import ScanDetailClient from "../components/ScanDetailClient";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getCurrentUser } from "@/lib/auth";

// Direct server-side DB query function
async function getScanDirectly(id) {
  try {
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Invalid scan ID format for direct fetch:", id);
      return null;
    }

    await connectDB();
    const scan = await Scan.findById(id).lean();

    if (!scan) {
      console.log("Scan not found in direct database fetch:", id);
      return null;
    }

    // Role-based auth check on the server
    const user = await getCurrentUser();
    const isAuthorized = user && (
      user.role === "admin" ||
      (scan.owner && scan.owner.toString() === user._id.toString())
    );

    // Apply privacy masking if unauthorized
    const finalScan = isAuthorized 
      ? scan 
      : {
          ...scan,
          domain: scan.maskedDomain,
          url: scan.url ? scan.url.replace(scan.domain, scan.maskedDomain) : scan.maskedDomain,
        };

    // Serialize MongoDB ObjectIds and Dates for standard client components
    return JSON.parse(JSON.stringify(finalScan));
  } catch (error) {
    console.error("Direct server-side fetch error:", error);
    return null;
  }
}

// SEO Dynamic Metadata Generation
export async function generateMetadata({ params }) {
  const { id } = await params;
  const scan = await getScanDirectly(id);
  
  if (!scan) {
    return {
      title: "Report Not Found | HeaderGuard",
    };
  }

  const siteDomain = scan.domain || scan.maskedDomain;
  return {
    title: `Security Header Audit for ${siteDomain} | Grade ${scan.grade}`,
    description: `HTTP Response Headers scan report for ${siteDomain}. Security Score: ${scan.score}/100, Grade: ${scan.grade}. View missing security headers and fixes.`,
    openGraph: {
      title: `HTTP Security Audit: ${siteDomain} — ${scan.grade}`,
      description: `Security Score: ${scan.score}/100. Audit checks for Content-Security-Policy (CSP), HSTS, X-Frame-Options, CORS, and more.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `HTTP Security Audit: ${siteDomain} — ${scan.grade}`,
      description: `Security Score: ${scan.score}/100. Actionable recommendations inside.`,
    },
  };
}

export default async function ScanDetailPage({ params }) {
  const { id: scanId } = await params;

  if (!scanId) {
    notFound();
  }

  const scan = await getScanDirectly(scanId);

  if (!scan) {
    notFound();
  }

  return <ScanDetailClient scan={scan} id={scanId} />;
}