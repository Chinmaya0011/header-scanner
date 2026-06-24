import net from "net";
import dns from "dns";
import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { spawn } from "child_process";

const { resolve: dnsResolve } = dns.promises;

// Path to subfinder binary – placed next to the project root after download
const SUBFINDER_BIN = path.join(process.cwd(), "subfinder.exe");

const PORT_SERVICES = {
  20: "FTP-Data",
  21: "FTP",
  22: "SSH",
  23: "Telnet",
  25: "SMTP",
  43: "WHOIS",
  53: "DNS",
  67: "DHCP",
  68: "DHCP",
  69: "TFTP",
  80: "HTTP",
  110: "POP3",
  115: "SFTP",
  123: "NTP",
  135: "RPC",
  137: "NetBIOS",
  138: "NetBIOS",
  139: "NetBIOS",
  143: "IMAP",
  161: "SNMP",
  179: "BGP",
  194: "IRC",
  389: "LDAP",
  443: "HTTPS",
  445: "SMB",
  465: "SMTPS",
  514: "Syslog",
  587: "SMTP",
  636: "LDAPS",
  873: "Rsync",
  993: "IMAPS",
  995: "POP3S",
  1433: "MSSQL",
  1521: "Oracle",
  2082: "cPanel",
  2083: "cPanel-SSL",
  2086: "WHM",
  2087: "WHM-SSL",
  2222: "DirectAdmin",
  3000: "HTTP-Dev",
  3306: "MySQL",
  3389: "RDP",
  5000: "HTTP-Dev",
  5432: "PostgreSQL",
  5671: "AMQPS",
  5672: "AMQP",
  5900: "VNC",
  5901: "VNC",
  5902: "VNC",
  5903: "VNC",
  6379: "Redis",
  6443: "Kubernetes",
  7000: "Cassandra",
  8000: "HTTP-Alt",
  8080: "HTTP-Alt",
  8081: "HTTP-Alt",
  8082: "HTTP-Alt",
  8443: "HTTPS-Alt",
  8888: "HTTP-Alt",
  9000: "HTTP-Alt",
  9200: "Elasticsearch",
  9300: "Elasticsearch",
  27017: "MongoDB"
};

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

function loadAttackSurfaceData() {
  try {
    const filePath = path.join(process.cwd(), "src", "data", "attackSurface.json");
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent).attackSurface;
  } catch (error) {
    console.error("Failed to load attackSurface.json:", error);
    return null;
  }
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

async function limitConcurrency(tasks, limit) {
  const results = [];
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      try {
        results[index] = await tasks[index]();
      } catch (err) {
        results[index] = null;
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
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

export async function checkExposedServices(url) {
  const domain = extractHost(url);
  const results = [];
  
  if (!domain) return results;

  const data = loadAttackSurfaceData();
  const ports = data?.exposedServiceGateways?.ports || [21, 22, 25, 80, 443];

  const tasks = ports.map(port => {
    return () => new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);

      const service = PORT_SERVICES[port] || "TCP";

      let severity = "info";
      if ([21, 22, 23, 25, 110, 135, 137, 139, 143, 445, 1433, 1521, 2082, 2083, 2086, 2087, 2222, 3306, 3389, 5432, 5672, 5900, 6379, 6443, 27017].includes(port)) {
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
    });
  });

  const resolvedResults = await limitConcurrency(tasks, 40);
  return resolvedResults.filter(Boolean).sort((a, b) => a.port - b.port);
}

/**
 * Subdomain discovery using the subfinder binary (ProjectDiscovery).
 * Falls back to SSL SANs extraction if subfinder is not installed.
 * Returns only real, validated, publicly discoverable subdomains.
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

  // --- Try subfinder binary first ---
  const subfinderExists = fs.existsSync(SUBFINDER_BIN);
  if (subfinderExists) {
    try {
      const subfinderResults = await new Promise((resolve, reject) => {
        const args = ["-d", domain, "-silent", "-timeout", "30", "-t", "10"];
        const proc = spawn(SUBFINDER_BIN, args, { stdio: ["ignore", "pipe", "pipe"] });

        let stdout = "";
        let stderr = "";
        proc.stdout.on("data", (d) => { stdout += d.toString(); });
        proc.stderr.on("data", (d) => { stderr += d.toString(); });

        const kill = setTimeout(() => { proc.kill(); reject(new Error("subfinder timeout")); }, 60000);

        proc.on("close", (code) => {
          clearTimeout(kill);
          const lines = stdout.split("\n").map((l) => l.trim()).filter(Boolean);
          resolve(lines);
        });

        proc.on("error", (err) => {
          clearTimeout(kill);
          reject(err);
        });
      });

      if (subfinderResults.length > 0) {
        // Validate each result via DNS A lookup
        const validated = await Promise.all(
          subfinderResults.map((sub) =>
            new Promise((resolve) => {
              const tid = setTimeout(() => resolve(null), 3000);
              dnsResolve(sub, "A")
                .then((ips) => { clearTimeout(tid); resolve({ sub, ip: ips[0] }); })
                .catch(() => { clearTimeout(tid); resolve(null); });
            })
          )
        );

        const valid = validated.filter(Boolean);
        if (valid.length > 0) {
          return valid.map(({ sub, ip }) => buildResult(sub, "subfinder", ip))
            .sort((a, b) => a.subdomain.localeCompare(b.subdomain));
        }
      }
    } catch (err) {
      console.warn("[checkSubdomains] subfinder failed, falling back to SSL SANs:", err.message);
    }
  }

  // --- Fallback: extract SANs from SSL certificate ---
  const discovered = new Map();

  const sansFromCert = await new Promise((resolve) => {
    const timeout = setTimeout(() => resolve([]), 8000);
    const req = https.request(
      { hostname: domain, port: 443, method: "HEAD", rejectUnauthorized: false },
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

  for (const san of sansFromCert) {
    discovered.set(san, { source: "ssl-cert" });
  }

  // Validate SANs via DNS
  const sanValidated = await Promise.all(
    [...discovered.keys()].map((sub) =>
      new Promise((resolve) => {
        const tid = setTimeout(() => resolve(null), 2500);
        dnsResolve(sub, "A")
          .then((ips) => { clearTimeout(tid); resolve({ sub, ip: ips[0], source: "ssl-cert" }); })
          .catch(() => { clearTimeout(tid); resolve(null); });
      })
    )
  );

  const results = sanValidated
    .filter(Boolean)
    .map(({ sub, ip, source }) => buildResult(sub, source, ip))
    .sort((a, b) => a.subdomain.localeCompare(b.subdomain));

  return results;
}

/**
 * Discovers public pages by crawling the target homepage HTML using axios + cheerio.
 * Extracts all internal links from <a href>, nav menus, footer links, and canonical URLs.
 * Returns normalised, deduplicated internal paths with HTTP status codes.
 */
export async function discoverPublicPages(baseUrl) {
  // Dynamic imports so Next.js doesn't bundle them into client chunks
  const axios = (await import("axios")).default;
  const { load } = await import("cheerio");

  let origin;
  try {
    const parsed = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
    origin = parsed.origin;
  } catch {
    return [];
  }

  // --- Fetch homepage HTML ---
  let html = "";
  const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
  const axiosConfig = {
    timeout: 12000,
    maxRedirects: 5,
    headers: {
      "User-Agent": BROWSER_UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    validateStatus: (s) => s < 500,
  };

  try {
    const res = await axios.get(origin, axiosConfig);
    if (res.status < 400 && typeof res.data === "string") {
      html = res.data;
    }
  } catch (err) {
    console.warn("[discoverPublicPages] axios fetch failed:", err.message);
    return [];
  }

  if (!html || html.length < 100) return [];

  // --- Parse with cheerio ---
  const $ = load(html);

  const IGNORED_PREFIXES = ["mailto:", "tel:", "javascript:", "data:", "ftp:", "#", "void"];
  const pathMap = new Map(); // pathname -> full href

  // Helper to add a link if it's internal
  function addLink(raw) {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (IGNORED_PREFIXES.some((p) => trimmed.toLowerCase().startsWith(p))) return;
    try {
      const resolved = new URL(trimmed, origin);
      if (resolved.origin !== origin) return;
      const pathname = resolved.pathname || "/";
      if (!pathMap.has(pathname)) pathMap.set(pathname, resolved.href);
    } catch { /* skip invalid */ }
  }

  // 1. All <a href>
  $("a[href]").each((_, el) => addLink($(el).attr("href")));

  // 2. Nav links explicitly
  $("nav a[href], header a[href], [role='navigation'] a[href]").each((_, el) => addLink($(el).attr("href")));

  // 3. Footer links
  $("footer a[href], [role='contentinfo'] a[href]").each((_, el) => addLink($(el).attr("href")));

  // 4. Canonical URL
  $("link[rel='canonical']").each((_, el) => addLink($(el).attr("href")));

  // 5. Sitemap links embedded in page
  $("[href*='sitemap']").each((_, el) => addLink($(el).attr("href")));

  // Always include root
  if (!pathMap.has("/")) pathMap.set("/", origin + "/");

  const allPaths = [...pathMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  // --- Probe each path for HTTP status ---
  const probes = allPaths.slice(0, 80).map(([pathname, href]) =>
    new Promise((resolve) => {
      const controller = new AbortController();
      const tid = setTimeout(() => {
        controller.abort();
        resolve({ path: pathname, url: href, status: null, responsive: false });
      }, 5000);

      fetch(href, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "manual",
        headers: { "User-Agent": BROWSER_UA },
      })
        .then((res) => {
          clearTimeout(tid);
          const status = res.status;
          resolve({ path: pathname, url: href, status, responsive: status < 400 });
        })
        .catch(() => {
          clearTimeout(tid);
          resolve({ path: pathname, url: href, status: null, responsive: false });
        });
    })
  );

  const results = await limitConcurrency(probes, 20);

  // Filter out 404s and 410s; keep everything else including redirects and unreachable (status: null)
  return results.filter((r) => r.status !== 404 && r.status !== 410);
}



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
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
    ];

    // Attempt to fetch HTML with User-Agent rotating
    for (const ua of userAgents) {
      if (fetchedSuccessful) break;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
          method: "GET",
          signal: controller.signal,
          redirect: "follow",
          headers: {
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Connection": "keep-alive"
          }
        });
        clearTimeout(timeoutId);

        if (res.status === 200) {
          html = await res.text();
          fetchedSuccessful = true;
          break;
        }
      } catch (e) {
        console.warn(`Fetch failed with UA: ${ua}. Error: ${e.message}`);
      }
    }

    // Fallback to https.get/http.get with rejectUnauthorized: false
    if (!fetchedSuccessful) {
      try {
        html = await new Promise((resolve, reject) => {
          const parsedUrl = new URL(url);
          const transport = parsedUrl.protocol === "https:" ? https : http;
          
          const req = transport.get(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            },
            timeout: 8000,
            rejectUnauthorized: false
          }, (res) => {
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
        });
        fetchedSuccessful = true;
      } catch (e) {
        console.warn(`Fallback http/https get failed for ${url}: ${e.message}`);
      }
    }

    if (fetchedSuccessful && html) {
      
      // Parse Page Title
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      results.seo.title = titleMatch ? titleMatch[1].trim() : "";

      // Parse Meta Description
      const descMatch = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                        html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*>/i);
      results.seo.description = descMatch ? descMatch[1].trim() : "";

      // Parse Headings count
      const h1Match = html.match(/<h1\b[^>]*>/gi) || [];
      const h2Match = html.match(/<h2\b[^>]*>/gi) || [];
      results.seo.h1Count = h1Match.length;
      results.seo.h2Count = h2Match.length;

      // Parse Image alt checks
      const images = html.match(/<img\b[^>]*>/gi) || [];
      let altCount = 0;
      images.forEach(img => {
        if (img.match(/\balt\s*=/i)) {
          altCount++;
        }
      });
      results.seo.imageCount = images.length;
      results.seo.imageAltCount = altCount;

      // Parse Favicon Link
      const faviconMatch = html.match(/<link\s+[^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*href=["']([^"']+)["'][^>]*>/i) ||
                           html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut\s+)?icon["'][^>]*>/i);
      let faviconUrl = faviconMatch ? faviconMatch[1].trim() : "";
      
      // If relative URL, make it absolute
      if (faviconUrl && !faviconUrl.startsWith("http")) {
        if (faviconUrl.startsWith("//")) {
          faviconUrl = `https:${faviconUrl}`;
        } else if (faviconUrl.startsWith("/")) {
          faviconUrl = `${url}${faviconUrl}`;
        } else {
          faviconUrl = `${url}/${faviconUrl}`;
        }
      } else if (!faviconUrl) {
        // Fallback to default domain favicon location
        faviconUrl = `${url}/favicon.ico`;
      }
      results.seo.favicon = faviconUrl;

      // Parse Canonical URL
      const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) || 
                             html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
      results.seo.canonicalUrl = canonicalMatch ? canonicalMatch[1] : "";

      // Parse Meta Robots
      const robotsMatch = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                          html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
      results.seo.metaRobots = robotsMatch ? robotsMatch[1] : "";
      
      // Compute Indexable
      const isNoIndex = robotsMatch && robotsMatch[1].toLowerCase().includes("noindex");
      results.seo.isIndexable = !isNoIndex;

      // Parse OpenGraph tags
      const parseOgVal = (prop) => {
        const matches = html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i'));
        return matches ? matches[1] : "";
      };

      results.seo.openGraph.title = parseOgVal("title");
      results.seo.openGraph.description = parseOgVal("description");
      results.seo.openGraph.image = parseOgVal("image");
      results.seo.openGraph.type = parseOgVal("type");
      results.seo.openGraph.url = parseOgVal("url");

      // Parse Twitter Cards tags
      const parseTwitterVal = (prop) => {
        const matches = html.match(new RegExp(`<meta[^>]+name=["']twitter:${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
                        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:${prop}["']`, 'i'));
        return matches ? matches[1] : "";
      };

      results.seo.twitterCard.card = parseTwitterVal("card");
      results.seo.twitterCard.title = parseTwitterVal("title");
      results.seo.twitterCard.description = parseTwitterVal("description");
      results.seo.twitterCard.image = parseTwitterVal("image");
      results.seo.twitterCard.site = parseTwitterVal("site");

      // Crawl and extract brand assets / matching images
      const detectedImages = [];
      const imagePatterns = loadWebimgPatterns();
      
      const imgRegex = /<img\s+([^>]+)>/gi;
      let imgMatch;
      const seenSrcs = new Set();

      while ((imgMatch = imgRegex.exec(html)) !== null) {
        const attrs = imgMatch[1];
        const srcAttr = attrs.match(/src=["']([^"']+)["']/i);
        const altAttr = attrs.match(/alt=["']([^"']+)["']/i);
        const classAttr = attrs.match(/class=["']([^"']+)["']/i);
        const idAttr = attrs.match(/id=["']([^"']+)["']/i);

        if (srcAttr) {
          let src = srcAttr[1].trim();
          const alt = altAttr ? altAttr[1].trim() : "";
          const cls = classAttr ? classAttr[1].trim() : "";
          const id = idAttr ? idAttr[1].trim() : "";

          // Resolve absolute URL
          if (src && !src.startsWith("http")) {
            if (src.startsWith("//")) {
              src = `https:${src}`;
            } else if (src.startsWith("/")) {
              src = `${url}${src}`;
            } else {
              src = `${url}/${src}`;
            }
          }

          if (src && !seenSrcs.has(src)) {
            // Check if matches any pattern in webimg.json
            const isMatch = imagePatterns.some(pattern => {
              const p = pattern.toLowerCase();
              return (
                src.toLowerCase().includes(p) ||
                alt.toLowerCase().includes(p) ||
                cls.toLowerCase().includes(p) ||
                id.toLowerCase().includes(p)
              );
            });

            if (isMatch) {
              seenSrcs.add(src);
              detectedImages.push({
                src,
                alt: alt || "Discovered brand asset",
                type: src.toLowerCase().endsWith(".svg") ? "svg" : 
                      src.toLowerCase().endsWith(".png") ? "png" : 
                      src.toLowerCase().endsWith(".ico") ? "ico" : "image"
              });
            }
          }
        }
      }

      // Also add favicon as a brand asset if found
      if (faviconUrl && !seenSrcs.has(faviconUrl)) {
        seenSrcs.add(faviconUrl);
        detectedImages.push({
          src: faviconUrl,
          alt: "Favicon Brand Icon",
          type: "ico"
        });
      }

      // Also add OpenGraph image if found
      const ogImage = parseOgVal("image");
      if (ogImage && !seenSrcs.has(ogImage)) {
        seenSrcs.add(ogImage);
        detectedImages.push({
          src: ogImage,
          alt: parseOgVal("title") || "OpenGraph Social Image",
          type: "og-image"
        });
      }

      // Also add Twitter image if found
      const twitterImage = parseTwitterVal("image");
      if (twitterImage && !seenSrcs.has(twitterImage)) {
        seenSrcs.add(twitterImage);
        detectedImages.push({
          src: twitterImage,
          alt: parseTwitterVal("title") || "Twitter Card Asset",
          type: "twitter-image"
        });
      }

      results.seo.detectedImages = detectedImages;
    }
  } catch (e) {
    console.error("SEO crawl error:", e);
  }

  const checkEndpoint = async (path) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}${path}`, { method: "GET", signal: controller.signal });
      clearTimeout(timeoutId);
      return { status: res.status, ok: res.ok };
    } catch {
      return { status: 404, ok: false };
    }
  };

  const data = loadAttackSurfaceData();
  const paths = data?.sensitiveStoragePathDiscovery?.paths || [
    "/.env", "/.git/HEAD", "/backup.zip", "/database.sql", "/logs/error.log", "/config.php"
  ];
  const portals = data?.webIdentityAccessPortals?.portals || [
    "/login", "/signin", "/admin", "/auth", "/dashboard", "/wp-admin"
  ];

  // 1. Sensitive files
  const fileTasks = paths.map(file => {
    return async () => {
      const check = await checkEndpoint(file);
      if (check.status === 200) {
        return {
          path: file,
          exists: true,
          status: check.status,
          severity: getPathSeverity(file),
          urlHost: `${url}${file}`,
          evidence: `HTTP status code 200 OK returned on target path resource.`,
          description: `Potentially sensitive file or directory found accessible via direct URL request.`,
          securityImpact: `Exposure of configuration parameters, database backups, Git repositories, or logs can leak sensitive user information, access keys, or API tokens, resulting in full application compromise.`,
          remediation: `Configure the web server (Apache, Nginx, IIS) to reject direct web requests to this path. Remove any backups, configuration templates, or repository files from the public HTML directory.`
        };
      }
      return null;
    };
  });
  const fileResults = await limitConcurrency(fileTasks, 15);
  results.sensitiveFiles = fileResults.filter(Boolean);

  // 2. Login surfaces
  const portalTasks = portals.map(path => {
    return async () => {
      const check = await checkEndpoint(path);
      if (check.status === 200) {
        const severity = ["admin", "administrator", "console", "control", "panel", "cpanel", "whm"].some(p => path.toLowerCase().includes(p)) ? "medium" : "info";
        return {
          path,
          status: "accessible",
          severity,
          urlHost: `${url}${path}`,
          evidence: `HTTP status code 200 OK returned on access gateway portal.`,
          description: `Administrative or user login form entry point detected.`,
          securityImpact: `Exposed login portals represent high-value targets for brute force, credential stuffing, and phishing attacks. Successful authentication bypass or credential leak gives direct access to backend systems.`,
          remediation: `Restrict access to known IP addresses or VPN routes. Implement multi-factor authentication (MFA), strict rate limiting on login attempts, and robust password complexity requirements.`
        };
      }
      return null;
    };
  });
  const portalResults = await limitConcurrency(portalTasks, 15);
  results.loginSurfaces = portalResults.filter(Boolean);

  // 3. Robots.txt
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${url}/robots.txt`, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const text = await res.text();
      results.robotsTxt.exists = true;
      const sitemaps = [];
      const lines = text.split("\n");
      let sensitiveExposed = false;
      let exposedPathsCount = 0;
      
      lines.forEach(line => {
        const lower = line.toLowerCase();
        if (lower.startsWith("sitemap:")) {
          sitemaps.push(line.substring(8).trim());
        }
        if (lower.startsWith("disallow:")) {
          const path = line.substring(9).trim();
          if (path.includes("admin") || path.includes("config") || path.includes("backup") || path.includes("db") || path.includes(".env")) {
            sensitiveExposed = true;
            exposedPathsCount++;
          }
        }
      });
      results.robotsTxt.sitemaps = sitemaps;
      results.robotsTxt.sensitiveExposed = sensitiveExposed;
      results.robotsTxt.exposedPathsCount = exposedPathsCount;
    }
  } catch (e) {}

  // 4. Sitemap.xml
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${url}/sitemap.xml`, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      results.sitemapXml.exists = true;
      const text = await res.text();
      const matches = text.match(/<loc>/g) || [];
      results.sitemapXml.urlCount = matches.length;
      results.sitemapXml.lastModified = new Date();
    }
  } catch (e) {}

  // 5. Security.txt
  const securityPaths = ["/.well-known/security.txt", "/security.txt"];
  for (const path of securityPaths) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${url}${path}`, { method: "GET", signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.status === 200) {
        results.securityTxt.exists = true;
        const text = await res.text();
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
