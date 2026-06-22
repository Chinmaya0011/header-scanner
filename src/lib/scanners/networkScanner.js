import net from "net";
import dns from "dns";
import fs from "fs";
import path from "path";

const { resolve: dnsResolve } = dns.promises;

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

export async function checkSubdomains(url) {
  const domain = extractHost(url);
  const results = [];

  if (!domain) return results;

  const data = loadAttackSurfaceData();
  const subdomains = data?.subdomainReconnaissanceMap?.subdomains || ["api", "admin", "mail", "beta", "dev", "staging", "portal", "cdn", "dashboard", "test"];

  const tasks = subdomains.map(sub => {
    return () => new Promise((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 800);

      dnsResolve(`${sub}.${domain}`, "A")
        .then((ips) => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            const severity = ["admin", "dev", "staging", "vpn", "secure", "auth", "login", "console", "internal", "private", "it", "sysadmin"].some(p => sub.toLowerCase().startsWith(p)) ? "medium" : "info";
            resolve({
              subdomain: `${sub}.${domain}`,
              status: "active",
              ip: ips[0],
              severity,
              urlHost: `${sub}.${domain}`,
              evidence: `DNS A record resolved successfully to IP address: ${ips[0]}.`,
              description: `Active subdomain host verified under the root domain.`,
              securityImpact: `Subdomains expand the organization's external attack surface. If subdomains host vulnerable applications or run on insecure servers, they can lead to host takeover, data exposure, or DNS hijacking.`,
              remediation: `Audit active subdomains periodically. Remove unused DNS entries (CNAME/A records) to prevent subdomain hijacking, and ensure all active subdomains undergo vulnerability scanner assessments.`
            });
          }
        })
        .catch(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            resolve(null);
          }
        });
    });
  });

  const resolvedResults = await limitConcurrency(tasks, 50);
  return resolvedResults.filter(Boolean).sort((a, b) => a.subdomain.localeCompare(b.subdomain));
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
      openGraph: { title: "", description: "", image: "", type: "", url: "" },
      twitterCard: { card: "", title: "", description: "", image: "", site: "" }
    }
  };

  // Crawl Main page HTML and resolve SEO Metadata
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.status === 200) {
      const html = await res.text();
      
      // Parse Canonical URL
      const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["'][^>]*>/i) || 
                             html.match(/<link\s+[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["'][^>]*>/i);
      results.seo.canonicalUrl = canonicalMatch ? canonicalMatch[1] : "";

      // Parse Meta Robots
      const robotsMatch = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']+)["'][^>]*>/i) || 
                          html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']robots["'][^>]*>/i);
      results.seo.metaRobots = robotsMatch ? robotsMatch[1] : "";
      
      // Compute Indexable
      const isNoIndex = results.seo.metaRobots.toLowerCase().includes("noindex");
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
