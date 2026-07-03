export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.headerguards.online";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/profile/", "/monitors/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
