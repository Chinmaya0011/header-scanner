import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Create Free Account",
  description:
    "Register for a free HeaderGuard account to unlock full EASM scans, continuous domain monitoring, and developer API access.",
  url: "/register",
});

export default function RegisterLayout({ children }) {
  return children;
}
