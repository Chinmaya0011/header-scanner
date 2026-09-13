import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Account Settings",
  description:
    "Manage your HeaderGuard security preferences, authentication credentials, and user profile.",
  url: "/profile",
  noIndex: true,
});

export default function ProfileLayout({ children }) {
  return children;
}
