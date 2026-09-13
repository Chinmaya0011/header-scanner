import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Free Instant HTTP Security Scanner",
  description:
    "Instantly scan and audit any website's HTTP security response headers for free with no signup required. Analyze CSP, HSTS, X-Frame-Options, CORS, and more.",
  url: "/scan",
  keywords: [
    "free security header scan",
    "instant http checker",
    "test security headers",
    "csp test",
    "hsts test",
  ],
});

export default function ScanLayout({ children }) {
  return children;
}
