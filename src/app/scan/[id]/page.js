import { notFound } from "next/navigation";
import ScanDetailClient from "../components/ScanDetailClient";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getCurrentUser } from "@/lib/auth";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

function applyMaskAndSerialize(scan, isAuthorized) {
  const finalScan = isAuthorized
    ? scan
    : {
        ...scan,
        domain: scan.maskedDomain,
        url: scan.url
          ? scan.url.replace(scan.domain, scan.maskedDomain)
          : scan.maskedDomain,
      };
  return JSON.parse(JSON.stringify(finalScan));
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified resolver:
//   - If slug is a 24-char hex → treat as MongoDB ObjectId (backward compat)
//   - Otherwise → treat as a domain name, return most recent successful scan
async function getScanBySlug(slug) {
  try {
    await connectDB();
    const user = await getCurrentUser();
    let scan = null;

    if (OBJECT_ID_REGEX.test(slug)) {
      // ── ObjectId path (backward compat for existing bookmarks) ───────────
      scan = await Scan.findById(slug).lean();
    } else {
      // ── Domain-name slug path  ────────────────────────────────────────────
      const domain = decodeURIComponent(slug).toLowerCase().trim();

      if (user) {
        // Prefer owner's latest successful scan
        scan = await Scan.findOne({
          domain,
          owner: user._id,
          isSuccess: true,
        })
          .sort({ createdAt: -1 })
          .lean();
      }

      if (!scan) {
        // Fall back to any scan for this domain
        scan = await Scan.findOne({ domain, isSuccess: true })
          .sort({ createdAt: -1 })
          .lean();
      }
    }

    if (!scan) return null;

    const isAuthorized =
      user &&
      (user.role === "admin" ||
        (scan.owner && scan.owner.toString() === user._id.toString()));

    return applyMaskAndSerialize(scan, isAuthorized);
  } catch (error) {
    console.error("getScanBySlug error:", error);
    return null;
  }
}

import { constructMetadata } from "@/lib/seo";

// ─────────────────────────────────────────────────────────────────────────────
// SEO Dynamic Metadata Generation
export async function generateMetadata({ params }) {
  const { id: slug } = await params;
  const scan = await getScanBySlug(slug);

  if (!scan) {
    return constructMetadata({
      title: "Report Not Found | HeaderGuard",
      description: "The requested security scan report could not be found or has expired.",
      noIndex: true,
    });
  }

  const siteDomain = scan.domain || scan.maskedDomain;
  // Use domain-name as canonical slug; fall back to ObjectId for old links
  const canonicalSlug = OBJECT_ID_REGEX.test(slug)
    ? slug
    : encodeURIComponent(siteDomain);
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.headerguards.online";
  const ogImageUrl = `${BASE_URL}/api/og/scan/${scan._id}`;

  return constructMetadata({
    title: `Audit ${siteDomain} (Grade ${scan.grade})`,
    description: `HTTP Response Headers scan report for ${siteDomain}. Security Score: ${scan.score}/100, Grade: ${scan.grade}. View missing security headers and fixes.`,
    url: `/scan/${canonicalSlug}`,
    image: ogImageUrl,
    keywords: [
      `security audit ${siteDomain}`,
      `headers grade ${scan.grade}`,
      "csp audit",
      "hsts validation",
      "headerguard report",
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default async function ScanDetailPage({ params }) {
  const { id: slug } = await params;

  if (!slug) notFound();

  const scan = await getScanBySlug(slug);

  if (!scan) notFound();

  // Always pass the real MongoDB _id to the client so internal API calls work
  return <ScanDetailClient scan={scan} id={scan._id} />;
}