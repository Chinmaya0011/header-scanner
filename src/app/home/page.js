import HomeClient from "./HomeClient";

import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "HTTP Security Header Scanner",
  description:
    "Scan website HTTP security headers, SSL/TLS setups, and DNS anti-spoofing records to detect digital vulnerabilities.",
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
