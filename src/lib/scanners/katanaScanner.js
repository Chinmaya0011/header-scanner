import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import https from "https";
import http from "http";

// ─── Binary discovery ──────────────────────────────────────────────────────────
const KATANA_PATHS = [
  process.env.KATANA_BIN,
  path.join(process.cwd(), "katana.exe"),
  path.join(process.cwd(), "katana"),
  "C:\\Tools\\katana.exe",
  "/usr/local/bin/katana",
  "/usr/bin/katana",
].filter(Boolean);

function findBinary(paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

// ─── URL utilities ────────────────────────────────────────────────────────────
function extractHost(url) {
  return (url || "").trim().replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
}

function resolveUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function isSameDomain(href, domain) {
  try {
    const u = new URL(href);
    return u.hostname === domain || u.hostname.endsWith(`.${domain}`);
  } catch {
    return false;
  }
}

// ─── HTML link extractor ──────────────────────────────────────────────────────
function extractLinks(html, baseUrl, domain) {
  const urls = new Set();
  const jsFiles = new Set();
  const apiEndpoints = new Set();
  const loginPages = new Set();
  const forms = [];

  // <a href>
  const aRegex = /href=["']([^"'#?]+(?:\?[^"']*)?)/gi;
  let m;
  while ((m = aRegex.exec(html)) !== null) {
    const resolved = resolveUrl(m[1], baseUrl);
    if (resolved && isSameDomain(resolved, domain)) urls.add(resolved);
  }

  // <script src>
  const scriptRegex = /src=["']([^"']+\.js(?:[^"']*)?)/gi;
  while ((m = scriptRegex.exec(html)) !== null) {
    const resolved = resolveUrl(m[1], baseUrl);
    if (resolved) jsFiles.add(resolved);
  }

  // API endpoint patterns
  const apiPatterns = ["/api/", "/v1/", "/v2/", "/v3/", "/graphql", "/rest/", "/service/", "/rpc/"];
  for (const u of urls) {
    if (apiPatterns.some(p => u.includes(p))) apiEndpoints.add(u);
  }

  // Login page patterns
  const loginPatterns = ["/login", "/signin", "/auth", "/account/login", "/user/login", "/admin/login", "/wp-login"];
  for (const u of urls) {
    const path = new URL(u).pathname.toLowerCase();
    if (loginPatterns.some(p => path.startsWith(p) || path === p)) loginPages.add(u);
  }

  // Extract inline API patterns from JS
  const inlineApiRegex = /["'`](\/api\/[^"'`\s]{1,100})/g;
  while ((m = inlineApiRegex.exec(html)) !== null) {
    const resolved = resolveUrl(m[1], baseUrl);
    if (resolved) apiEndpoints.add(resolved);
  }

  // <form action>
  const formRegex = /<form[^>]+action=["']([^"']+)["'][^>]*>/gi;
  while ((m = formRegex.exec(html)) !== null) {
    const resolved = resolveUrl(m[1], baseUrl);
    const methodMatch = m[0].match(/method=["'](\w+)["']/i);
    forms.push({
      action: resolved || m[1],
      method: (methodMatch?.[1] || "GET").toUpperCase(),
    });
  }

  return {
    urls: [...urls].slice(0, 200),
    jsFiles: [...jsFiles].slice(0, 100),
    apiEndpoints: [...apiEndpoints].slice(0, 50),
    loginPages: [...loginPages].slice(0, 20),
    forms: forms.slice(0, 30),
  };
}

// ─── Node.js crawler fallback ─────────────────────────────────────────────────
async function crawlFallback(url, domain) {
  const result = {
    urls: [],
    jsFiles: [],
    apiEndpoints: [],
    loginPages: [],
    forms: [],
    sitemap: [],
  };

  // Fetch homepage
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "HeaderGuard-Crawler/2.0", Accept: "text/html,*/*;q=0.8" },
      redirect: "follow",
    });
    const html = await res.text();
    const extracted = extractLinks(html, url, domain);
    Object.assign(result, extracted);
  } catch {}

  // Fetch sitemap.xml for additional URLs
  try {
    const sitemapRes = await fetch(`${url}/sitemap.xml`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "HeaderGuard-Crawler/2.0" },
    });
    if (sitemapRes.ok) {
      const sitemapText = await sitemapRes.text();
      const locRegex = /<loc>([^<]+)<\/loc>/gi;
      let m;
      while ((m = locRegex.exec(sitemapText)) !== null) {
        result.sitemap.push(m[1].trim());
      }
      result.sitemap = result.sitemap.slice(0, 100);

      // Merge sitemap URLs into urls list
      const sitemapUrls = result.sitemap.filter(u => isSameDomain(u, domain));
      result.urls = [...new Set([...result.urls, ...sitemapUrls])].slice(0, 300);
    }
  } catch {}

  // Crawl one level deeper on top 5 internal pages
  const pagesToCrawl = result.urls
    .filter(u => !u.includes(".js") && !u.includes(".css") && !u.includes(".png"))
    .slice(0, 5);

  for (const pageUrl of pagesToCrawl) {
    try {
      const res = await fetch(pageUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "HeaderGuard-Crawler/2.0" },
        redirect: "follow",
      });
      if (res.ok) {
        const html = await res.text();
        const extracted = extractLinks(html, pageUrl, domain);
        result.urls = [...new Set([...result.urls, ...extracted.urls])].slice(0, 300);
        result.jsFiles = [...new Set([...result.jsFiles, ...extracted.jsFiles])].slice(0, 100);
        result.apiEndpoints = [...new Set([...result.apiEndpoints, ...extracted.apiEndpoints])].slice(0, 50);
        result.loginPages = [...new Set([...result.loginPages, ...extracted.loginPages])].slice(0, 20);
      }
    } catch {}
  }

  return result;
}

// ─── Katana binary runner ─────────────────────────────────────────────────────
function runKatanaBinary(bin, url) {
  return new Promise((resolve) => {
    const args = ["-u", url, "-j", "-silent", "-depth", "2", "-timeout", "10", "-no-color"];
    execFile(bin, args, { timeout: 120000, maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
      if (!stdout) return resolve(null);
      const result = { urls: [], jsFiles: [], apiEndpoints: [], loginPages: [], forms: [], sitemap: [] };
      const apiPatterns = ["/api/", "/v1/", "/v2/", "/graphql", "/rest/"];
      const loginPatterns = ["/login", "/signin", "/auth", "/wp-login"];
      for (const line of stdout.split("\n").filter(Boolean)) {
        try {
          const obj = JSON.parse(line);
          const endpoint = obj.endpoint || obj.url || obj;
          if (typeof endpoint === "string") {
            result.urls.push(endpoint);
            if (endpoint.endsWith(".js")) result.jsFiles.push(endpoint);
            if (apiPatterns.some(p => endpoint.includes(p))) result.apiEndpoints.push(endpoint);
            if (loginPatterns.some(p => endpoint.toLowerCase().includes(p))) result.loginPages.push(endpoint);
          }
        } catch {}
      }
      // Deduplicate
      result.urls = [...new Set(result.urls)].slice(0, 300);
      result.jsFiles = [...new Set(result.jsFiles)].slice(0, 100);
      result.apiEndpoints = [...new Set(result.apiEndpoints)].slice(0, 50);
      result.loginPages = [...new Set(result.loginPages)].slice(0, 20);
      resolve(result);
    });
  });
}

/**
 * scanKatana — web surface crawling.
 * @param {string} url     full URL with protocol
 * @param {string} domain  bare hostname
 * @returns {{ crawl: Object, source: string, scanTime: number }}
 */
export async function scanKatana(url, domain) {
  const host = extractHost(domain || url);
  const t0 = Date.now();
  const bin = findBinary(KATANA_PATHS);

  let crawl = null;
  let source;

  if (bin) {
    try {
      crawl = await runKatanaBinary(bin, url);
      source = "katana";
    } catch { source = "fallback"; }
  }

  if (!crawl) {
    crawl = await crawlFallback(url, host);
    source = "fallback";
  }

  return { crawl, source, scanTime: Date.now() - t0 };
}
