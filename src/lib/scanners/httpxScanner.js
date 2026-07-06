import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import dns from "dns";

const { resolve: dnsResolve } = dns.promises;

// ─── Binary discovery ──────────────────────────────────────────────────────────
const HTTPX_PATHS = [
  process.env.HTTPX_BIN,
  path.join(process.cwd(), "httpx.exe"),
  path.join(process.cwd(), "httpx"),
  "C:\\Tools\\httpx.exe",
  "/usr/local/bin/httpx",
  "/usr/bin/httpx",
].filter(Boolean);

function findBinary(paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

// ─── Technology fingerprinting patterns ──────────────────────────────────────
const TECH_PATTERNS = [
  { name: "Next.js", patterns: ["__NEXT_DATA__", "/_next/", "x-nextjs-cache"] },
  { name: "React", patterns: ["react.development.js", "react.production.min.js", "react-dom"] },
  { name: "Vue.js", patterns: ["__vue__", "vue.min.js", "vue.runtime"] },
  { name: "Angular", patterns: ["ng-version", "angular.min.js", "ng-app"] },
  { name: "WordPress", patterns: ["/wp-content/", "/wp-includes/", "wp-json"] },
  { name: "Drupal", patterns: ["Drupal.settings", "/sites/default/files/", "drupal.js"] },
  { name: "Joomla", patterns: ["/components/com_", "Joomla!", "joomla.javascript"] },
  { name: "Laravel", patterns: ["laravel_session", "csrf-token", "Laravel"] },
  { name: "Django", patterns: ["csrftoken", "django.jQuery", "__admin_media_prefix__"] },
  { name: "Ruby on Rails", patterns: ["rails.js", "data-turbo", "application.js", "_rails_version"] },
  { name: "Express.js", patterns: ["X-Powered-By: Express", "connect.sid"] },
  { name: "Nginx", patterns: ["nginx", "Server: nginx"] },
  { name: "Apache", patterns: ["Server: Apache", "Apache/"] },
  { name: "IIS", patterns: ["Server: Microsoft-IIS", "X-Powered-By: ASP.NET"] },
  { name: "PHP", patterns: ["X-Powered-By: PHP", ".php", "PHPSESSID"] },
  { name: "jQuery", patterns: ["jquery.min.js", "jquery.js", "jQuery v"] },
  { name: "Bootstrap", patterns: ["bootstrap.min.css", "bootstrap.css", "bootstrap.min.js"] },
  { name: "Cloudflare", patterns: ["cf-ray", "cf-cache-status", "cloudflare"] },
  { name: "AWS S3", patterns: ["x-amz-request-id", "AmazonS3", "s3.amazonaws.com"] },
  { name: "Shopify", patterns: ["Shopify.shop", "/cdn.shopify.com/", "shopify_analytics"] },
  { name: "GraphQL", patterns: ["/graphql", "application/graphql", "__typename"] },
  { name: "Elasticsearch", patterns: ["x-elastic-product", "elasticsearch"] },
  { name: "Varnish Cache", patterns: ["X-Varnish", "via: varnish"] },
  { name: "Redis", patterns: ["x-redis-hits", "x-cache-hits: redis"] },
];

// CDN detection from headers
const CDN_PATTERNS = {
  "Cloudflare": ["cf-ray", "cf-cache-status"],
  "AWS CloudFront": ["x-amz-cf-id", "x-amz-cf-pop"],
  "Fastly": ["x-served-by", "fastly-debug"],
  "Akamai": ["x-check-cacheable", "x-akamai-transformed"],
  "Vercel": ["x-vercel-cache", "x-vercel-id"],
  "Netlify": ["x-nf-request-id", "netlify"],
  "Azure CDN": ["x-msedge-ref", "x-azure-ref"],
  "StackPath": ["x-sp-url", "x-sp-original-uri"],
  "KeyCDN": ["x-origin-cache", "x-cache: HIT"],
  "BunnyCDN": ["cdn-pullzone", "cdn-uid"],
};

// WAF detection from headers/responses
const WAF_PATTERNS = {
  "Cloudflare WAF": ["cf-ray"],
  "AWS WAF": ["awswaf"],
  "Sucuri WAF": ["x-sucuri-id", "x-sucuri-cache"],
  "Incapsula": ["x-iinfo", "incap_ses"],
  "ModSecurity": ["mod_security", "modsec"],
  "F5 BIG-IP": ["bigipserver", "x-waf-event-info"],
  "Barracuda": ["barra_counter_session"],
  "Akamai Kona": ["akamai-ghost-ip"],
};

function detectTech(html, headers) {
  const technologies = [];
  const headerStr = JSON.stringify(headers).toLowerCase();
  const combined = (html || "").substring(0, 50000) + headerStr;

  for (const tech of TECH_PATTERNS) {
    const found = tech.patterns.some(p => combined.toLowerCase().includes(p.toLowerCase()));
    if (found) technologies.push(tech.name);
  }
  return [...new Set(technologies)];
}

function detectCDN(headers) {
  for (const [cdn, patterns] of Object.entries(CDN_PATTERNS)) {
    if (patterns.some(p => headers[p.toLowerCase()] !== undefined ||
        Object.keys(headers).some(h => h.toLowerCase().includes(p.toLowerCase())))) {
      return cdn;
    }
  }
  return null;
}

function detectWAF(headers) {
  const headerStr = JSON.stringify(headers).toLowerCase();
  for (const [waf, patterns] of Object.entries(WAF_PATTERNS)) {
    if (patterns.some(p => headerStr.includes(p.toLowerCase()))) return waf;
  }
  return null;
}

function extractTitle(html) {
  const match = (html || "").match(/<title[^>]*>([^<]{1,200})<\/title>/i);
  return match ? match[1].trim() : "";
}

// ─── Node.js HTTP probing ─────────────────────────────────────────────────────
async function probeUrl(targetUrl) {
  const t0 = Date.now();
  try {
    const res = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "HeaderGuard-Scanner/2.0", Accept: "text/html,*/*;q=0.8" },
      redirect: "follow",
    });
    const html = await res.text().catch(() => "");
    const headers = Object.fromEntries(res.headers);
    const responseTime = Date.now() - t0;

    return {
      url: targetUrl,
      status: res.status,
      title: extractTitle(html),
      technologies: detectTech(html, headers),
      cdn: detectCDN(headers),
      waf: detectWAF(headers),
      responseTime,
      https: targetUrl.startsWith("https://"),
      server: headers["server"] || "",
      contentType: headers["content-type"] || "",
    };
  } catch {
    return null;
  }
}

// ─── Httpx binary runner ──────────────────────────────────────────────────────
function runHttpxBinary(bin, urls) {
  return new Promise((resolve) => {
    const args = ["-l", "-", "-json", "-silent", "-title", "-tech-detect",
                  "-status-code", "-no-color", "-timeout", "10"];
    const proc = execFile(bin, args, { timeout: 60000, maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
      if (!stdout) return resolve([]);
      const results = [];
      for (const line of stdout.split("\n").filter(Boolean)) {
        try {
          const obj = JSON.parse(line);
          results.push({
            url: obj.url,
            status: obj.status_code,
            title: obj.title || "",
            technologies: obj.technologies || [],
            cdn: obj.cdn || null,
            waf: obj.waf || null,
            responseTime: obj.time || 0,
            https: (obj.url || "").startsWith("https://"),
            server: obj.webserver || "",
            contentType: "",
          });
        } catch {}
      }
      resolve(results);
    });
    // Write URLs to stdin
    if (proc.stdin) {
      proc.stdin.write(urls.join("\n"));
      proc.stdin.end();
    }
    proc.on("error", () => resolve([]));
  });
}

/**
 * scanHttpx — live host probing with tech detection.
 * @param {string} url        primary URL
 * @param {string} domain     bare hostname
 * @param {Array}  subdomains array of {host} subdomain objects
 * @returns {{ liveHosts: Array, source: string, scanTime: number }}
 */
export async function scanHttpx(url, domain, subdomains = []) {
  const t0 = Date.now();

  // Build target URL list (primary + top 20 subdomains)
  const urls = [url];
  for (const sub of subdomains.slice(0, 20)) {
    urls.push(`https://${sub.host}`);
    urls.push(`http://${sub.host}`);
  }

  const bin = findBinary(HTTPX_PATHS);
  let liveHosts = [];
  let source;

  if (bin) {
    try {
      liveHosts = await runHttpxBinary(bin, urls);
      source = "httpx";
    } catch {
      source = "fallback";
    }
  }

  if (!bin || source === "fallback") {
    source = "fallback";
    // Probe URLs with concurrency limit
    const jobs = urls.slice(0, 25).map(u => probeUrl(u));
    const results = await Promise.allSettled(jobs);
    for (const r of results) {
      if (r.status === "fulfilled" && r.value) liveHosts.push(r.value);
    }
  }

  // Deduplicate by URL
  const seen = new Set();
  liveHosts = liveHosts.filter(h => {
    if (seen.has(h.url)) return false;
    seen.add(h.url);
    return true;
  });

  return { liveHosts, source, scanTime: Date.now() - t0 };
}
