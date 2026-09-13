import DocsClient from "./DocsClient";

import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Documentation & Technical Reference Guides | HeaderGuard",
  description:
    "Comprehensive guides detailing HTTP response headers, SSL/TLS parameter checks, SPF/DMARC DNS spoofing records, port mappings, and API structures.",
  url: "/docs",
  keywords: [
    "security audit documentation",
    "hsts preloading standards",
    "csp parameters index",
    "digital surface analysis info",
    "domain setup tutorials",
  ],
});

export default function DocsPage() {
  return <DocsClient />;
}
