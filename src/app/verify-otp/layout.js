import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Verify Security OTP | HeaderGuard",
  description:
    "Verify one-time security authentication code for your HeaderGuard account.",
  url: "/verify-otp",
  noIndex: true,
});

export default function VerifyOtpLayout({ children }) {
  return children;
}
