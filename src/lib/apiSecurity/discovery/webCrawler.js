import { normalizePath, classifyEndpoint } from "./normalizer.js";

/**
 * Passive Website Discovery from sitemap.xml, robots.txt, and HTML links/forms
 */
export async function discoverFromWeb(targetUrl, headers = {}) {
  const discovered = [];

  let baseUrl = targetUrl;
  try {
    const parsed = new URL(targetUrl);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // preserve
  }

  // 1. Fetch robots.txt
  try {
    const robotsRes = await fetch(`${baseUrl}/robots.txt`, {
      headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...headers },
      signal: AbortSignal.timeout(3000)
    });
    if (robotsRes.ok) {
      const robotsText = await robotsRes.text();
      const lines = robotsText.split("\n");
      for (const line of lines) {
        if (line.toLowerCase().startsWith("disallow:") || line.toLowerCase().startsWith("allow:")) {
          const path = line.split(":")[1]?.trim();
          if (path && (path.includes("/api/") || path.includes("/v1/"))) {
            const normPath = normalizePath(path);
            discovered.push({
              method: "GET",
              path: normPath,
              url: `${baseUrl}${normPath}`,
              source: "web",
              parameters: [],
              authenticationRequired: true,
              tags: ["robots-txt"]
            });
          }
        }
      }
    }
  } catch {
    // Ignore
  }

  // 2. Fetch sitemap.xml
  try {
    const sitemapRes = await fetch(`${baseUrl}/sitemap.xml`, {
      headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...headers },
      signal: AbortSignal.timeout(3000)
    });
    if (sitemapRes.ok) {
      const sitemapXml = await sitemapRes.text();
      const locRegex = /<loc>(https?:\/\/[^<]+)<\/loc>/gi;
      let locMatch;
      while ((locMatch = locRegex.exec(sitemapXml)) !== null) {
        const urlStr = locMatch[1];
        if (urlStr.includes("/api/") || urlStr.includes("/v1/")) {
          const normPath = normalizePath(urlStr);
          discovered.push({
            method: "GET",
            path: normPath,
            url: `${baseUrl}${normPath}`,
            source: "web",
            parameters: [],
            authenticationRequired: true,
            tags: ["sitemap-xml"]
          });
        }
      }
    }
  } catch {
    // Ignore
  }

  return discovered;
}
