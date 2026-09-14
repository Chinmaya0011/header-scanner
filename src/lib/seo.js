const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.headerguards.online";
const DEFAULT_OG_IMAGE = "https://www.headerguards.online/og-image.jpg";

/**
 * Helper to construct consistent Open Graph and Twitter metadata for Next.js App Router.
 *
 * @param {Object} options
 * @param {string} [options.title] - Page title
 * @param {string} [options.description] - Page description
 * @param {string} [options.image] - Absolute or relative image URL (defaults to /og-image.jpg)
 * @param {string} [options.url] - Canonical relative or absolute page path
 * @param {string} [options.type] - Open Graph type (e.g. 'website', 'article')
 * @param {boolean} [options.noIndex] - Whether to disallow indexing (e.g. private dashboard/auth)
 * @param {string[]} [options.keywords] - Optional keywords
 * @returns {import('next').Metadata}
 */
export function constructMetadata({
  title = "HeaderGuard — HTTP Security Header Scanner",
  description = "Audit website HTTP security headers in seconds. Get instant security reports with risk scoring, letter grades, and actionable fix recommendations.",
  ogDescription = "Audit website HTTP security headers in seconds. Get instant risk scores, grades, and actionable fix recommendations.",
  image = DEFAULT_OG_IMAGE,
  url = "/",
  type = "website",
  noIndex = false,
  keywords = [],
} = {}) {
  const canonicalUrl = url.startsWith("http")
    ? url
    : `${BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;

  const absoluteImageUrl = image.startsWith("http")
    ? image
    : `${BASE_URL}${image.startsWith("/") ? image : `/${image}`}`;

  const socialDescription = ogDescription || description;

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    ...(keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: socialDescription,
      url: canonicalUrl,
      siteName: "HeaderGuard",
      type,
      locale: "en_US",
      images: [
        {
          url: absoluteImageUrl,
          secureUrl: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: typeof title === "string" ? title : "HeaderGuard",
          type: absoluteImageUrl.endsWith(".png") ? "image/png" : "image/jpeg",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@headerguards",
      creator: "@headerguards",
      title,
      description: socialDescription,
      images: [absoluteImageUrl],
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: false,
          },
        }
      : {}),
  };
}

export { BASE_URL, DEFAULT_OG_IMAGE };
