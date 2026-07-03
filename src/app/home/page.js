import HomeClient from "./HomeClient";

export const metadata = {
  title: "HTTP Security Header & EASM Scanner | HeaderGuard",
  description: "Instantly scan, audit, and analyze website HTTP security response headers, SSL/TLS parameter configurations, and DNS anti-spoofing setups to find digital vulnerabilities.",
  keywords: ["security header scanner", "http security checker", "easm scanner", "headers analyzer", "csp evaluator", "ssl cert checker"],
  alternates: {
    canonical: "/home",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
