import { headers } from "next/headers";
import { ToastProvider } from "@/components/common/Toast";
import VisitTracker from "@/components/common/VisitTracker";
import ActivityTimeoutListener from "@/components/common/ActivityTimeoutListener";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
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

const sitelinksJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "url": "https://www.headerguards.online",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.headerguards.online/scanner?url={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const nonce = headersList.get("x-nonce") ?? "";

  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="4f7twDcE-tAqyiVVol5Bxnd3lO-I0l2j8yxzzLCkmDI" />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(sitelinksJsonLd) }}
        />
      </head>
      <body
        className="min-h-screen bg-bg antialiased flex flex-col"
        suppressHydrationWarning
      >
        <ToastProvider>
          <AuthProvider>
            <VisitTracker />
            <ActivityTimeoutListener />
            <Navbar />
            <div className="flex-1 flex flex-col">
              {children}
            </div>
            <Footer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}