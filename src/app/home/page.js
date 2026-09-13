import HomeClient from "./HomeClient";

import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "HTTP Security Header & EASM Scanner | HeaderGuard",
  description:
    "Instantly scan, audit, and analyze website HTTP security response headers, SSL/TLS parameter configurations, and DNS anti-spoofing setups to find digital vulnerabilities.",
  url: "/home",
  keywords: [
    "security header scanner",
    "http security checker",
    "easm scanner",
    "headers analyzer",
    "csp evaluator",
    "ssl cert checker",
  ],
});

export default function HomePage() {
  return <HomeClient />;
}
