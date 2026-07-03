import DevelopersClient from "./DevelopersClient";

export const metadata = {
  title: "Developer REST API Hub & Credentials | HeaderGuard",
  description: "Configure developer API credentials, manage allowed scanning domains whitelists, adjust webhook alert settings, and view HTTP posture queries consumption statistics.",
  keywords: ["developer api keys", "security scanner rest endpoint", "allowed domains whitelist", "webhooks integration", "api query logs"],
  alternates: {
    canonical: "/developers",
  },
};

export default function DevelopersPage() {
  return <DevelopersClient />;
}
