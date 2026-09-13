import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Security Monitors",
  description:
    "Automated periodic HTTP security header and certificate monitoring with instant alerts.",
  url: "/monitors",
  noIndex: true,
});

export default function MonitorsLayout({ children }) {
  return children;
}
