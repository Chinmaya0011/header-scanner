import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Security Operations Dashboard | HeaderGuard",
  description:
    "Manage your website security posture, view historical audits, and track vulnerability remediation.",
  url: "/dashboard",
  noIndex: true,
});

export default function DashboardLayout({ children }) {
  return children;
}
