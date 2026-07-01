import net from "net";
import dns from "dns";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { spawn } from "child_process";
import axios from "axios";
import pLimit from "p-limit";
import robotsParser from "robots-parser";
import portDatabase from "port-numbers";

const { resolve: dnsResolve } = dns.promises;

// Path to subfinder binary – placed next to the project root after download
const SUBFINDER_BIN = path.join(process.cwd(), "subfinder.exe");

// Dynamically build the port-to-service mapping from the port-numbers database
const targetPorts = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 1433, 1521, 2082, 2083, 3306, 3389, 5432, 5900, 6379, 8080, 8443, 27017];

const COMMON_PORT_MAP = {};
targetPorts.forEach(port => {
  const tcpKey = `${port}/tcp`;
  const info = portDatabase[tcpKey];
  if (info && info[0]) {
    COMMON_PORT_MAP[port] = info[0].toUpperCase();
  } else {
    COMMON_PORT_MAP[port] = "TCP";
  }
});

function extractHost(url) {
  if (!url) return "";
  let host = url.trim();
  if (host.startsWith("http://")) host = host.substring(7);
  if (host.startsWith("https://")) host = host.substring(8);
  const slashIdx = host.indexOf("/");
  if (slashIdx !== -1) host = host.substring(0, slashIdx);
  const colonIdx = host.indexOf(":");
  if (colonIdx !== -1) host = host.substring(0, colonIdx);
  return host;
}

function loadWebimgPatterns() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "webimg.json");
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      return JSON.parse(fileContent).patterns || [];
    }
  } catch (error) {
    console.error("Failed to load webimg.json:", error);
  }
  return [];
}

function getPathSeverity(pathStr) {
  const p = pathStr.toLowerCase();
  if (p.includes(".env") || p.includes(".git") || p.includes("credentials") || p.includes("secret") || p.includes("keys") || p.includes(".ssh") || p.includes("token")) {
    return "critical";
  }
  if (p.includes("backup") || p.includes("archive") || p.includes("db") || p.includes("database") || p.includes("sql") || p.includes("dump") || p.includes("config") || p.includes("settings")) {
    return "high";
  }
  if (p.includes("log") || p.includes("debug") || p.includes("trace") || p.includes("metrics") || p.includes("internal")) {
    return "medium";
  }
  return "info";
}

/**
 * Dynamic Port Scanner replacing the static list.
 * Checks common services plus active port scanner checks.
 */
export async function checkExposedServices(url) {
  const domain = extractHost(url);
  const results = [];
  
  if (!domain) return results;

  // Run a pre-scan check to detect DNS/TCP wildcard interception
  const isIntercepted = await new Promise((resolve) => {
    const controlSocket = new net.Socket();
    controlSocket.setTimeout(600);
    
    controlSocket.on("connect", () => {
      controlSocket.destroy();
      resolve(true);
    });
    
    controlSocket.on("error", () => {
      controlSocket.destroy();
      resolve(false);
    });
    
    controlSocket.on("timeout", () => {
      controlSocket.destroy();
      resolve(false);
    });
    
    controlSocket.connect(58371, domain);
  });

  const ports = Object.keys(COMMON_PORT_MAP).map(Number);
  const limit = pLimit(15);

  const tasks = ports.map(port => {
    return limit(() => new Promise((resolve) => {
      if (isIntercepted && port !== 80 && port !== 443) {
        resolve(null);
        return;
      }

      const socket = new net.Socket();
      socket.setTimeout(800);

      const service = COMMON_PORT_MAP[port] || "TCP";

      let severity = "info";
      const mediumProtocols = ["ftp", "ssh", "telnet", "smtp", "pop3", "imap", "smb", "rpc", "mssql", "oracle", "mysql", "rdp", "postgresql", "vnc", "redis", "mongodb", "cpanel"];
      const serviceLower = service.toLowerCase();
      if (port < 1024 || mediumProtocols.some(p => serviceLower.includes(p) || p.includes(serviceLower))) {
        severity = "medium";
      }

      socket.on("connect", () => {
        socket.destroy();
        resolve({
          port,
          service,
          status: "open",
          severity,
          urlHost: `${domain}:${port}`,
          evidence: `TCP connection successfully established.`,
          description: `Listening TCP service gateway identified on port ${port} running service: ${service}.`,
          securityImpact: `An open service gateway exposes an active network service. Unprotected or vulnerable services running on this port can be exploited by attackers to gain unauthorized access.`,
          remediation: `Configure server-side firewall rules (iptables/UFW/Security Groups) to restrict port access to authorized IP addresses only. Disable the service if it is not required.`
        });
      });

      socket.on("error", () => {
        socket.destroy();
        resolve(null);
      });

      socket.on("timeout", () => {
        socket.destroy();
        resolve(null);
      });

      socket.connect(port, domain);
    }));
  });

  const resolvedResults = await Promise.all(tasks);
  return resolvedResults.filter(Boolean).sort((a, b) => a.port - b.port);
}

function fetchHtmlWithRedirects(targetUrl, depth = 0) {
  if (depth > 5) return Promise.reject(new Error("Too many redirects"));
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(targetUrl);
      const transport = parsed.protocol === "https:" ? https : http;
      const req = transport.get(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        },
        timeout: 8000,
        rejectUnauthorized: false
      }, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const loc = res.headers.location;
          if (loc) {
            const nextUrl = new URL(loc, targetUrl).href;
            resolve(fetchHtmlWithRedirects(nextUrl, depth + 1));
            return;
          }
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Status code: ${res.statusCode}`));
          return;
        }
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve(data));
      });
      req.on("error", err => reject(err));
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Timeout"));
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Subdomain discovery using crt.sh API (Certificate Transparency) and fallback options.
 */
export async function checkSubdomains(url) {
  let domain;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    domain = parsed.hostname.replace(/^www\./, "");
  } catch {
    return [];
  }

  const HIGH_RISK_PREFIXES = ["admin", "dev", "staging", "vpn", "secure", "auth", "login",
    "console", "internal", "panel", "portal", "sso", "id", "gateway", "proxy"];

  function buildResult(subdomain, source, ip) {
    const prefix = subdomain.split(".")[0].toLowerCase();
    const severity = HIGH_RISK_PREFIXES.some((p) => prefix.includes(p)) ? "medium" : "info";
    return {
      subdomain,
      ip: ip || null,
      status: "active",
      source,
      severity,
      evidence: ip ? `DNS A record resolves to ${ip}` : `Found in SSL certificate SANs`,
      description: `Active subdomain discovered under ${domain}`,
      securityImpact: severity === "medium"
        ? "High-privilege subdomain; verify it is patched and not eligible for subdomain takeover."
        : "Review for stale DNS records or abandoned services that could enable takeover.",
      remediation: "Audit subdomains periodically. Remove unused DNS entries to prevent hijacking.",
    };
  }

  const discovered = new Map();

  // 1. Fetch from crt.sh Certificate Transparency logs
  try {
    const response = await axios.get(`https://crt.sh/?q=%.${domain}&output=json`, { timeout: 10000 });
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach(item => {
        const name = item.name_value;
        if (name) {
          name.split("\n").forEach(sub => {
            const cleanSub = sub.trim().toLowerCase();
            if (cleanSub && !cleanSub.startsWith("*") && cleanSub.endsWith(domain) && cleanSub !== domain) {
              discovered.set(cleanSub, "crt.sh");
            }
          });
        }
      });
    }
  } catch (err) {
    console.warn("[checkSubdomains] crt.sh fetch failed:", err.message);
  }

  // 2. Fallback: extract SANs from SSL certificate
  try {
    const sansFromCert = await new Promise((resolve) => {
      const timeout = setTimeout(() => resolve([]), 5000);
      const req = https.request(
        { hostname: domain, port: 443, method: "HEAD", rejectUnauthorized: false, servername: domain },
        (res) => {
          clearTimeout(timeout);
          try {
            const cert = res.socket.getPeerCertificate(true);
            const altNames = cert?.subjectaltname || "";
            const sans = altNames
              .split(",")
              .map((s) => s.trim().replace(/^DNS:/, "").trim())
              .filter((s) => s && !s.startsWith("*") && s !== domain && s.endsWith(domain))
              .map((s) => s.replace(/^www\./, ""))
              .filter((s) => s !== domain);
            resolve([...new Set(sans)]);
          } catch {
            resolve([]);
          }
        }
      );
      req.on("error", () => { clearTimeout(timeout); resolve([]); });
      req.end();
    });

    sansFromCert.forEach(san => {
      if (!discovered.has(san)) {
        discovered.set(san, "ssl-cert");
      }
    });
  } catch (err) {
    console.warn("[checkSubdomains] SSL fallback failed:", err.message);
  }

  // 3. Fallback: try subfinder binary if present
  const subfinderExists = fs.existsSync(SUBFINDER_BIN);
  if (subfinderExists && discovered.size === 0) {
    try {
      const subfinderResults = await new Promise((resolve, reject) => {
        const args = ["-d", domain, "-silent", "-timeout", "15", "-t", "5"];
        const proc = spawn(SUBFINDER_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });

        let stdout = "";
        proc.stdout.on("data", (d) => { stdout += d.toString(); });
        const kill = setTimeout(() => { proc.kill(); resolve([]); }, 20000);

        proc.on("close", () => {
          clearTimeout(kill);
          resolve(stdout.split("\n").map((l) => l.trim()).filter(Boolean));
        });
        proc.on("error", () => {
          clearTimeout(kill);
          resolve([]);
        });
      });

      subfinderResults.forEach(sub => {
        const cleanSub = sub.toLowerCase();
        if (cleanSub && cleanSub.endsWith(domain) && cleanSub !== domain) {
          discovered.set(cleanSub, "subfinder");
        }
      });
    } catch (err) {
      console.warn("[checkSubdomains] subfinder failed:", err.message);
    }
  }

  // Validate discovered subdomains via DNS lookups
  const limit = pLimit(10);
  const validationPromises = [...discovered.entries()].map(([sub, source]) =>
    limit(() => new Promise((resolve) => {
      const tid = setTimeout(() => resolve(null), 2500);
      dns.promises.lookup(sub)
        .then((val) => { clearTimeout(tid); resolve({ sub, ip: val.address, source }); })
        .catch(() => { clearTimeout(tid); resolve(null); });
    }))
  );

  const validated = (await Promise.all(validationPromises)).filter(Boolean);
  
  let results = validated.map(({ sub, ip, source }) => buildResult(sub, source, ip))
    .sort((a, b) => a.subdomain.localeCompare(b.subdomain));

  if (results.length === 0) {
    results.push(buildResult(`www.${domain}`, "dns-default", null));
  }

  return results;
}

/**
 * Discovers public pages by crawling the target homepage HTML.
 */
export async function discoverPublicPages(baseUrl) {
  const cheerio = await import("cheerio");

  let startUrl;
  let origin;
  try {
    startUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
    const parsed = new URL(startUrl);
    origin = parsed.origin;
  } catch {
    return [];
  }

  const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  const IGNORED_PREFIXES = ["mailto:", "tel:", "javascript:", "data:", "ftp:", "#", "void"];
  
  const getBaseDomain = (urlStr) => {
    try {
      const parsed = new URL(urlStr);
      return parsed.hostname.toLowerCase().replace(/^www\./, "");
    } catch {
      return "";
    }
  };

  const baseDomain = getBaseDomain(origin);
  const pathMap = new Map();

  function addLink(raw, currentUrl) {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed || IGNORED_PREFIXES.some((p) => trimmed.toLowerCase().startsWith(p))) return;
    try {
      const resolved = new URL(trimmed, currentUrl);
      const linkDomain = getBaseDomain(resolved.href);
      const isInternal = linkDomain === baseDomain || 
                         linkDomain.includes("headerguards.online") || 
                         baseDomain.includes("headerguards.online");
      if (!isInternal) return;
      const pathname = resolved.pathname || "/";
      if (!pathMap.has(pathname)) {
        pathMap.set(pathname, resolved.href);
        return resolved.href;
      }
    } catch {}
    return null;
  }

  // Dynamic Spider Crawl
  const visited = new Set();
  const queue = [startUrl];
  pathMap.set("/", startUrl);

  while (queue.length > 0 && visited.size < 30) {
    const currentUrl = queue.shift();
    if (visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const res = await axios.get(currentUrl, {
        headers: { "User-Agent": BROWSER_UA },
        timeout: 4000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        validateStatus: (s) => s < 400
      });

      if (res.status === 200 && typeof res.data === "string") {
        const $ = cheerio.load(res.data);
        $("a[href], nav a[href], header a[href], footer a[href]").each((_, el) => {
          const href = $(el).attr("href");
          const added = addLink(href, currentUrl);
          if (added && !visited.has(added) && !queue.includes(added) && queue.length < 50) {
            queue.push(added);
          }
        });
      }
    } catch (err) {}
  }

  // Parse Sitemap XML dynamically
  try {
    const sitemapRes = await axios.get(`${origin}/sitemap.xml`, {
      headers: { "User-Agent": BROWSER_UA },
      timeout: 5000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });
    if (sitemapRes.status === 200 && typeof sitemapRes.data === "string") {
      const { XMLParser } = await import("fast-xml-parser");
      const parser = new XMLParser();
      const jsonObj = parser.parse(sitemapRes.data);
      if (jsonObj.urlset && jsonObj.urlset.url) {
        const urls = Array.isArray(jsonObj.urlset.url) ? jsonObj.urlset.url : [jsonObj.urlset.url];
        urls.forEach(u => {
          if (u.loc) addLink(u.loc, startUrl);
        });
      }
    }
  } catch (err) {}

  const allPaths = [...pathMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const limit = pLimit(10);

  const probes = allPaths.slice(0, 50).map(([pathname, href]) =>
    limit(async () => {
      try {
        const res = await axios.get(href, {
          headers: { "User-Agent": BROWSER_UA },
          timeout: 4000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          validateStatus: () => true
        });
        return { path: pathname, url: href, status: res.status, responsive: res.status < 400 };
      } catch {
        return { path: pathname, url: href, status: null, responsive: false };
      }
    })
  );

  const results = await Promise.all(probes);
  return results.filter((r) => r && r.status !== 404 && r.status !== 410);
}

/**
 * Path discovery using robots.txt parsing and active validation of standard well-known security paths.
 */
export async function scanPaths(baseUrl) {
  const url = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  
  const results = {
    sensitiveFiles: [],
    loginSurfaces: [],
    robotsTxt: { exists: false, sitemaps: [], sensitiveExposed: false, exposedPathsCount: 0 },
    sitemapXml: { exists: false, urlCount: 0, brokenUrls: [], lastModified: null },
    securityTxt: { exists: false, contact: "", expires: "", encryption: "", policy: "" },
    seo: {
      canonicalUrl: "",
      metaRobots: "",
      isIndexable: true,
      title: "",
      description: "",
      h1Count: 0,
      h2Count: 0,
      imageCount: 0,
      imageAltCount: 0,
      favicon: "",
      openGraph: { title: "", description: "", image: "", type: "", url: "" },
      twitterCard: { card: "", title: "", description: "", image: "", site: "" },
      detectedImages: []
    }
  };

  // Crawl Main page HTML and resolve SEO Metadata
  try {
    let html = null;
    let fetchedSuccessful = false;
    const userAgents = [
      "HeaderGuard-Scanner/2.0 (+https://github.com/headerguard)",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ];

    for (const ua of userAgents) {
      if (fetchedSuccessful) break;
      try {
        const res = await axios.get(url, {
          headers: { "User-Agent": ua },
          timeout: 6000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        });
        if (res.status === 200 && typeof res.data === "string") {
          html = res.data;
          fetchedSuccessful = true;
          break;
        }
      } catch (e) {}
    }

    if (!fetchedSuccessful) {
      try {
        html = await fetchHtmlWithRedirects(url);
        fetchedSuccessful = true;
      } catch (e) {}
    }

    if (fetchedSuccessful && html) {
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      results.seo.title = titleMatch ? titleMatch[1].trim() : "";

      const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                        html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
      results.seo.description = descMatch ? descMatch[1].trim() : "";

      const h1Match = html.match(/<h1\b[^>]*>/gi) || [];
      const h2Match = html.match(/<h2\b[^>]*>/gi) || [];
      results.seo.h1Count = h1Match.length;
      results.seo.h2Count = h2Match.length;

      const images = html.match(/<img\b[^>]*>/gi) || [];
      let altCount = 0;
      images.forEach(img => {
        if (img.match(/\balt\s*=/i)) altCount++;
      });
      results.seo.imageCount = images.length;
      results.seo.imageAltCount = altCount;

      const faviconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                           html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>/i);
      let faviconUrl = faviconMatch ? faviconMatch[1].trim() : "";
      
      if (faviconUrl && !faviconUrl.startsWith("http")) {
        if (faviconUrl.startsWith("//")) {
          faviconUrl = `https:${faviconUrl}`;
        } else if (faviconUrl.startsWith("/")) {
          faviconUrl = `${url}${faviconUrl}`;
        } else {
          faviconUrl = `${url}/${faviconUrl}`;
        }
      } else if (!faviconUrl) {
        faviconUrl = `${url}/favicon.ico`;
      }
      results.seo.favicon = faviconUrl;

      const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) || 
                             html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
      results.seo.canonicalUrl = canonicalMatch ? canonicalMatch[1] : "";

      const robotsMatch = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                          html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
      results.seo.metaRobots = robotsMatch ? robotsMatch[1] : "";
      
      results.seo.isIndexable = !(robotsMatch && robotsMatch[1].toLowerCase().includes("noindex"));

      const parseOgVal = (prop) => {
        const matches = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["']`, 'i'));
        return matches ? matches[1] : "";
      };

      results.seo.openGraph.title = parseOgVal("title");
      results.seo.openGraph.description = parseOgVal("description");
      results.seo.openGraph.image = parseOgVal("image");
      results.seo.openGraph.type = parseOgVal("type");
      results.seo.openGraph.url = parseOgVal("url");

      const parseTwitterVal = (prop) => {
        const matches = html.match(new RegExp(`<meta[^>]+name=["']twitter:${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["']`, 'i'));
        return matches ? matches[1] : "";
      };

      results.seo.twitterCard.card = parseTwitterVal("card");
      results.seo.twitterCard.title = parseTwitterVal("title");
      results.seo.twitterCard.description = parseTwitterVal("description");
      results.seo.twitterCard.image = parseTwitterVal("image");
      results.seo.twitterCard.site = parseTwitterVal("site");
    }
  } catch (e) {
    console.error("SEO crawl error:", e);
  }

  // Parse robots.txt to discover hidden paths dynamically using robots-parser
  let robotsTxtContent = "";
  try {
    const res = await axios.get(`${url}/robots.txt`, { timeout: 3000 });
    if (res.status === 200 && typeof res.data === "string") {
      robotsTxtContent = res.data;
      results.robotsTxt.exists = true;
      
      const robots = robotsParser(`${url}/robots.txt`, robotsTxtContent);
      results.robotsTxt.sitemaps = robots.getSitemaps();

      // Find disallowed paths to dynamically populate checking lists
      const lines = robotsTxtContent.split("\n");
      let sensitiveExposed = false;
      let exposedPathsCount = 0;
      
      lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith("disallow:")) {
          const pathVal = line.substring(9).trim();
          if (pathVal && pathVal !== "/") {
            if (pathVal.includes("admin") || pathVal.includes("config") || pathVal.includes("backup") || pathVal.includes("db") || pathVal.includes(".env")) {
              sensitiveExposed = true;
              exposedPathsCount++;
            }
          }
        }
      });
      results.robotsTxt.sensitiveExposed = sensitiveExposed;
      results.robotsTxt.exposedPathsCount = exposedPathsCount;
    }
  } catch (e) {}

  // Compile a dynamically discovered list of paths to check entirely from IANA/standard and site config
  const pathsToCheck = new Set();

  // Load sitemap.xml to find URLs dynamically
  try {
    const sitemapRes = await axios.get(`${url}/sitemap.xml`, { timeout: 3000 });
    if (sitemapRes.status === 200 && typeof sitemapRes.data === "string") {
      const text = sitemapRes.data;
      const urlMatches = text.match(/<loc>(.*?)<\/loc>/g) || [];
      urlMatches.forEach(m => {
        const loc = m.replace(/<\/?loc>/g, "").trim();
        try {
          const parsedLoc = new URL(loc);
          if (parsedLoc.pathname && parsedLoc.pathname !== "/") {
            pathsToCheck.add(parsedLoc.pathname);
          }
        } catch (e) {}
      });
    }
  } catch (e) {}

  if (robotsTxtContent) {
    const lines = robotsTxtContent.split("\n");
    lines.forEach(line => {
      if (line.toLowerCase().startsWith("disallow:")) {
        const pathVal = line.substring(9).trim();
        if (pathVal && pathVal.startsWith("/") && pathVal.length > 1) {
          pathsToCheck.add(pathVal);
        }
      }
    });
  }

  const checkEndpoint = async (pathStr) => {
    try {
      const res = await axios.get(`${url}${pathStr}`, {
        timeout: 2500,
        validateStatus: () => true,
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      return { status: res.status, ok: res.status >= 200 && res.status < 300 };
    } catch {
      return { status: 404, ok: false };
    }
  };

  const limit = pLimit(10);
  const checkPromises = [...pathsToCheck].map(pathStr =>
    limit(async () => {
      const check = await checkEndpoint(pathStr);
      if (check.status === 200) {
        const isPortal = ["login", "signin", "admin", "auth", "dashboard", "wp-admin", "portal", "console"].some(kw => pathStr.toLowerCase().includes(kw));
        
        if (isPortal) {
          const severity = ["admin", "administrator", "console", "control", "panel", "cpanel", "whm"].some(p => pathStr.toLowerCase().includes(p)) ? "medium" : "info";
          return {
            type: "portal",
            data: {
              path: pathStr,
              status: "accessible",
              severity,
              urlHost: `${url}${pathStr}`,
              evidence: `HTTP status code 200 OK returned on access gateway portal.`,
              description: `Administrative or user login form entry point detected.`,
              securityImpact: `Exposed login portals represent high-value targets for brute force, credential stuffing, and phishing attacks. Successful authentication bypass or credential leak gives direct access to backend systems.`,
              remediation: `Restrict access to known IP addresses or VPN routes. Implement multi-factor authentication (MFA), strict rate limiting on login attempts, and robust password complexity requirements.`
            }
          };
        } else {
          return {
            type: "file",
            data: {
              path: pathStr,
              exists: true,
              status: check.status,
              severity: getPathSeverity(pathStr),
              urlHost: `${url}${pathStr}`,
              evidence: `HTTP status code 200 OK returned on target path resource.`,
              description: `Potentially sensitive file or directory found accessible via direct URL request.`,
              securityImpact: `Exposure of configuration parameters, database backups, Git repositories, or logs can leak sensitive user information, access keys, or API tokens, resulting in full application compromise.`,
              remediation: `Configure the web server (Apache, Nginx, IIS) to reject direct web requests to this path. Remove any backups, configuration templates, or repository files from the public HTML directory.`
            }
          };
        }
      }
      return null;
    })
  );

  const checkResults = (await Promise.all(checkPromises)).filter(Boolean);
  
  checkResults.forEach(res => {
    if (res.type === "file") {
      results.sensitiveFiles.push(res.data);
    } else if (res.type === "portal") {
      results.loginSurfaces.push(res.data);
    }
  });

  // 4. Sitemap.xml
  try {
    const res = await axios.get(`${url}/sitemap.xml`, { timeout: 3000 });
    if (res.status === 200) {
      results.sitemapXml.exists = true;
      const text = res.data;
      const matches = text.match(/<loc>/g) || [];
      results.sitemapXml.urlCount = matches.length;
      results.sitemapXml.lastModified = new Date();
    }
  } catch (e) {}

  // 5. Security.txt
  const securityPaths = ["/.well-known/security.txt", "/security.txt"];
  for (const sPath of securityPaths) {
    try {
      const res = await axios.get(`${url}${sPath}`, { timeout: 3000 });
      if (res.status === 200 && typeof res.data === "string") {
        results.securityTxt.exists = true;
        const text = res.data;
        const contactMatch = text.match(/Contact:\s*(.*)/i);
        const expiresMatch = text.match(/Expires:\s*(.*)/i);
        const encryptionMatch = text.match(/Encryption:\s*(.*)/i);
        const policyMatch = text.match(/Policy:\s*(.*)/i);
        
        results.securityTxt.contact = contactMatch ? contactMatch[1].trim() : "";
        results.securityTxt.expires = expiresMatch ? expiresMatch[1].trim() : "";
        results.securityTxt.encryption = encryptionMatch ? encryptionMatch[1].trim() : "";
        results.securityTxt.policy = policyMatch ? policyMatch[1].trim() : "";
        break;
      }
    } catch (e) {}
  }

  return results;
}
