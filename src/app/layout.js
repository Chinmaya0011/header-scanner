// app/layout.js
import { headers } from "next/headers";
import "./globals.css";

export const metadata = {
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
  ],
  category: "Security",
  applicationName: "HeaderGuard",
  openGraph: {
    type: "website",
    locale: "en_US",
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
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  // Removed manifest from metadata — handled via static file below
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HeaderGuard",
  description:
    "Scan any website's HTTP security headers. Get risk scoring, letter grades, and actionable fix recommendations.",
  applicationCategory: "SecurityApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "CSP analysis",
    "HSTS validation",
    "X-Frame-Options check",
    "Permissions-Policy audit",
    "CORP and COOP detection",
    "Risk scoring and letter grades",
    "Actionable fix recommendations",
  ],
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  return (
    <html lang="en">
      <head>
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
        {children}
      </body>
    </html>
  );
}