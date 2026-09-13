import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "API Security Scanner",
  description:
    "Discover API endpoints, inspect schemas, and evaluate API authorization boundaries against OWASP API Top 10 vulnerabilities.",
  url: "/api-security",
  keywords: [
    "api security scanner",
    "owasp api top 10",
    "endpoint discovery",
    "bola checker",
    "api authorization tester",
  ],
});

export default function ApiSecurityLayout({ children }) {
  return children;
}
