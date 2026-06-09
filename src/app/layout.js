import "./globals.css";

export const metadata = {
  title: "HeaderGuard — Website Security Header Scanner",
  description:
    "Scan any website's HTTP security headers and get a detailed security report with recommendations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg antialiased">{children}</body>
    </html>
  );
}
