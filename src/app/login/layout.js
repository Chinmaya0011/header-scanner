import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Sign In",
  description:
    "Sign in to your HeaderGuard account to access security dashboards, continuous monitors, and API keys.",
  url: "/login",
});

export default function LoginLayout({ children }) {
  return children;
}
