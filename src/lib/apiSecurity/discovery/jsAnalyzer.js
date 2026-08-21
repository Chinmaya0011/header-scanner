import { normalizePath } from "./normalizer.js";

/**
 * Safely analyzes JS scripts on the target site for API references without executing arbitrary code
 */
export async function discoverFromJsBundles(targetUrl, htmlContent = "", headers = {}) {
  const discovered = [];
  const scriptUrls = [];

  let baseUrl = targetUrl;
  try {
    const parsed = new URL(targetUrl);
    baseUrl = `${parsed.protocol}//${parsed.host}`;
  } catch {
    // preserve
  }

  // Extract script src attributes from HTML
  const srcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = srcRegex.exec(htmlContent)) !== null) {
    let scriptSrc = match[1];
    if (scriptSrc.startsWith("//")) scriptSrc = "https:" + scriptSrc;
    else if (scriptSrc.startsWith("/")) scriptSrc = baseUrl + scriptSrc;
    else if (!scriptSrc.startsWith("http")) scriptSrc = baseUrl + "/" + scriptSrc;

    if (scriptSrc.startsWith(baseUrl)) {
      scriptUrls.push(scriptSrc);
    }
  }

  // Limit max script bundles to analyze safely
  const targetsToAnalyze = scriptUrls.slice(0, 8);

  for (const scriptUrl of targetsToAnalyze) {
    try {
      const res = await fetch(scriptUrl, {
        headers: { "User-Agent": "HeaderGuard-ApiScanner/2.0", ...headers },
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) continue;

      const jsText = await res.text();

      // Static Regex patterns matching fetch, axios, and API route literals
      const apiPathRegex = /(?:fetch|axios|get|post|put|delete|patch)\s*\(\s*["'](\/(?:api|v1|v2|graphql|rest)[^"']*)["']/gi;
      const urlLiteralRegex = /["'](\/(?:api|v1|v2|graphql|rest)\/[a-zA-Z0-9_\-\/{}]+)["']/gi;

      let apiMatch;
      while ((apiMatch = apiPathRegex.exec(jsText)) !== null) {
        const rawPath = apiMatch[1];
        const normPath = normalizePath(rawPath);
        discovered.push({
          method: "GET", // Default fallback
          path: normPath,
          url: `${baseUrl}${normPath}`,
          source: "javascript",
          parameters: [],
          authenticationRequired: true,
          tags: ["js-extracted"]
        });
      }

      let literalMatch;
      while ((literalMatch = urlLiteralRegex.exec(jsText)) !== null) {
        const rawPath = literalMatch[1];
        const normPath = normalizePath(rawPath);
        discovered.push({
          method: "GET",
          path: normPath,
          url: `${baseUrl}${normPath}`,
          source: "javascript",
          parameters: [],
          authenticationRequired: true,
          tags: ["js-literal"]
        });
      }

    } catch {
      // Ignore script fetch failures silently
    }
  }

  return discovered;
}
