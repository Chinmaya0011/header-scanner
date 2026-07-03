import DocsClient from "./DocsClient";

export const metadata = {
  title: "Documentation & Technical Reference Guides | HeaderGuard",
  description: "Comprehensive guides detailing HTTP response headers, SSL/TLS parameter checks, SPF/DMARC DNS spoofing records, port mappings, and API structures.",
  keywords: ["security audit documentation", "hsts preloading standards", "csp parameters index", "digital surface analysis info", "domain setup tutorials"],
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsPage() {
  return <DocsClient />;
}
