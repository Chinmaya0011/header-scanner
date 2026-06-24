import { headers } from "next/headers";
import { ToastProvider } from "@/components/common/Toast";
import VisitTracker from "@/components/common/VisitTracker";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://www.headerguards.online"),
  title: {
    default: "HeaderGuard — HTTP Security Header Scanner",
    template: "%s | HeaderGuard",
  },
  description:
    "Instantly scan any website's HTTP security headers. Get a detailed security report with risk scoring, letter grades, and actionable fix recommendations — free and no signup required.",
  keywords: [
    "security header scanner",
    "HTTP headers checker",
    "CSP checker",
    "HSTS checker",
    "web security audit",
    "Content-Security-Policy",
    "X-Frame-Options",
    "security headers test",
    "website security scan",
    "CORS misconfiguration",
    "HeaderGuard",
    "HTTP security scanner",
    "web security analyzer",
    "security headers grade",
    "website security checker",
    "vulnerability scanner",
  ],
  category: "Security",
  applicationName: "HeaderGuard",
  creator: "HeaderGuard",
  publisher: "HeaderGuard",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  authors: [{ name: "HeaderGuard" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.headerguards.online",
    siteName: "HeaderGuard",
    title: "HeaderGuard — HTTP Security Header Scanner",
    description:
      "Scan any website's HTTP security headers in seconds. Risk scoring, letter grades, and actionable recommendations.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "HeaderGuard — HTTP Security Header Scanner",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@headerguards",
    creator: "@headerguards",
    title: "HeaderGuard — HTTP Security Header Scanner",
    description:
      "Scan any website's HTTP security headers in seconds. Risk scoring, letter grades, and fix recommendations.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "https://www.headerguards.online",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
      { url: "/apple-touch-icon-precomposed.png" },
    ],
    shortcut: "/favicon.ico",
  },
  manifest: "/manifest.json",
  verification: {
    google: "4f7twDcE-tAqyiVVol5Bxnd3lO-I0l2j8yxzzLCkmDI",
  },
  other: {
    "theme-color": "#0a0a0a",
    "color-scheme": "dark light",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HeaderGuard",
  description:
    "Scan any website's HTTP security headers. Get risk scoring, letter grades, and actionable fix recommendations.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "All",
  browserRequirements: "Modern browsers",
  permissions: "None required",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  featureList: [
    "CSP analysis",
    "HSTS validation", 
    "X-Frame-Options check",
    "Permissions-Policy audit",
    "CORP and COOP detection",
    "Risk scoring and letter grades",
    "Actionable fix recommendations",
    "Detailed vulnerability reports",
    "Security grade calculations",
    "Real-time scanning",
  ],
  url: "https://www.headerguards.online",
  inLanguage: "en-US",
  audience: {
    "@type": "Audience",
    audienceType: "Security professionals, developers, website owners",
  },
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google-site-verification" content="4f7twDcE-tAqyiVVol5Bxnd3lO-I0l2j8yxzzLCkmDI" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className="min-h-screen bg-bg antialiased"
        suppressHydrationWarning
      >
        <ToastProvider>
          <VisitTracker />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}