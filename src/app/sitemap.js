export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://www.headerguards.online";
  
  const routes = [
    "",
    "/home",
    "/scanner",
    "/history",
    "/docs",
    "/developers",
    "/login",
    "/register",
    "/score-explanation"
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
    changeFrequency: route === "/history" ? "always" : "weekly",
    priority: route === "" || route === "/home" ? 1.0 : 0.8
  }));

  return routes;
}
