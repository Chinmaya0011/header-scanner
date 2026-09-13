import DevelopersClient from "./DevelopersClient";

import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Developer REST API Hub & Credentials | HeaderGuard",
  description:
    "Configure developer API credentials, manage allowed scanning domains whitelists, adjust webhook alert settings, and view HTTP posture queries consumption statistics.",
  url: "/developers",
  keywords: [
    "developer api keys",
    "security scanner rest endpoint",
    "allowed domains whitelist",
    "webhooks integration",
    "api query logs",
  ],
});

export default function DevelopersPage() {
  return <DevelopersClient />;
}
