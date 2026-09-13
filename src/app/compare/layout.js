import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Security Posture Comparison",
  description:
    "Compare HTTP security scan audits side-by-side. Track HTTP headers changes, SSL/TLS parameter diffs, and security score variance.",
  url: "/compare",
  keywords: [
    "security comparison",
    "header diff tool",
    "posture regression",
    "ssl diff",
  ],
});

export default function CompareLayout({ children }) {
  return children;
}
