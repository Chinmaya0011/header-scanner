import net from "net";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// ─── Binary discovery ──────────────────────────────────────────────────────────
const NMAP_PATHS = [
  process.env.NMAP_BIN,
  path.join(process.cwd(), "nmap.exe"),
  "C:\\Program Files (x86)\\Nmap\\nmap.exe",
  "C:\\Program Files\\Nmap\\nmap.exe",
  "/usr/bin/nmap",
  "/usr/local/bin/nmap",
].filter(Boolean);

function findBinary(paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

function extractHost(url) {
  return (url || "").trim().replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
}

// Service name map (port → service label)
const SERVICE_MAP = {
  21: "ftp", 22: "ssh", 23: "telnet", 25: "smtp", 53: "dns",
  80: "http", 110: "pop3", 111: "rpcbind", 119: "nntp", 135: "msrpc",
  139: "netbios-ssn", 143: "imap", 443: "https", 445: "microsoft-ds",
  465: "smtps", 587: "submission", 631: "ipp", 993: "imaps", 995: "pop3s",
  1433: "ms-sql-s", 1521: "oracle", 1723: "pptp", 2082: "cpanel",
  2083: "cpanels", 2086: "whm", 2087: "whms", 3306: "mysql",
  3389: "ms-wbt-server", 4848: "glassfish", 5000: "upnp", 5432: "postgresql",
  5900: "vnc", 5984: "couchdb", 6379: "redis", 6443: "kubernetes",
  7001: "weblogic", 8080: "http-proxy", 8443: "https-alt",
  8888: "sun-answerbook", 9000: "cslistener", 9042: "cassandra",
  9092: "kafka", 9200: "elasticsearch", 9300: "elasticsearch-cluster",
  10000: "webmin", 11211: "memcache", 27017: "mongodb", 28017: "mongodb-web",
};

// ─── Banner grabbing probes ────────────────────────────────────────────────────
const BANNER_PROBES = {
  21:  Buffer.from(""),               // FTP sends banner on connect
  22:  Buffer.from(""),               // SSH sends banner on connect
  25:  Buffer.from("EHLO test\r\n"), // SMTP
  80:  Buffer.from("HEAD / HTTP/1.0\r\n\r\n"),
  110: Buffer.from(""),               // POP3 sends banner
  143: Buffer.from(""),               // IMAP sends banner
  443: Buffer.from(""),
  3306: Buffer.from(""),              // MySQL sends banner
};

function grabBanner(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500);
    let banner = "";

    socket.on("connect", () => {
      const probe = BANNER_PROBES[port];
      if (probe && probe.length > 0) socket.write(probe);
    });

    socket.on("data", (chunk) => {
      banner += chunk.toString("utf8", 0, 512);
      socket.destroy();
    });

    socket.on("close", () => resolve(banner.trim().substring(0, 200)));
    socket.on("error", () => resolve(""));
    socket.on("timeout", () => { socket.destroy(); resolve(""); });

    socket.connect(port, host);
  });
}

// ─── Version extraction from banner ───────────────────────────────────────────
function extractVersion(banner, service) {
  if (!banner) return "";
  // SSH: "SSH-2.0-OpenSSH_8.9p1"
  const sshMatch = banner.match(/SSH-[\d.]+-([^\s\r\n]+)/);
  if (sshMatch) return sshMatch[1];
  // HTTP Server header
  const serverMatch = banner.match(/Server:\s*([^\r\n]+)/i);
  if (serverMatch) return serverMatch[1].trim().substring(0, 80);
  // FTP: "220 ProFTPD 1.3.5"
  const ftpMatch = banner.match(/220[- ]\s*(.{5,50})/);
  if (ftpMatch) return ftpMatch[1].trim();
  // SMTP: "220 mail.example.com ESMTP"
  const smtpMatch = banner.match(/220[- ]\s*(\S+[^\r\n]{0,50})/);
  if (smtpMatch) return smtpMatch[1].trim();
  // MySQL: first few bytes contain server version after null bytes
  const mysqlMatch = banner.match(/(\d+\.\d+\.\d+(?:-[A-Za-z0-9]+)?)/);
  if (mysqlMatch) return "MySQL " + mysqlMatch[1];
  return "";
}

// ─── Nmap binary path ─────────────────────────────────────────────────────────
function runNmapBinary(bin, host, openPorts) {
  return new Promise((resolve) => {
    const portList = openPorts.join(",");
    const args = ["-sV", "--version-intensity", "5", "-p", portList, "-oX", "-",
                  "--open", "--host-timeout", "45s", host];
    execFile(bin, args, { timeout: 90000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      try {
        // Parse nmap XML output
        const ports = [];
        const portRegex = /<port protocol="(\w+)" portid="(\d+)">[\s\S]*?<state state="(\w+)"[\s\S]*?(?:<service name="([^"]*)"(?:[^>]*version="([^"]*)")?)?/g;
        let match;
        while ((match = portRegex.exec(stdout)) !== null) {
          const [, protocol, portid, state, service, version] = match;
          if (state === "open") {
            const port = Number(portid);
            ports.push({
              port,
              protocol: protocol || "tcp",
              service: service || SERVICE_MAP[port] || "unknown",
              version: version || "",
              state: "open",
              banner: "",
            });
          }
        }
        resolve(ports);
      } catch { resolve([]); }
    });
  });
}

// ─── Pure Node.js fallback ────────────────────────────────────────────────────
async function nmapFallback(host, openPorts) {
  const results = [];
  // Grab banners concurrently (max 10 at once)
  const bannerJobs = openPorts.map(async (port) => {
    const banner = await grabBanner(host, port);
    const service = SERVICE_MAP[port] || "unknown";
    const version = extractVersion(banner, service);
    results.push({
      port,
      protocol: "tcp",
      service,
      version,
      state: "open",
      banner: banner.replace(/[\x00-\x1F]/g, " ").trim().substring(0, 120),
    });
  });

  // Batch in groups of 10 to avoid flooding
  for (let i = 0; i < bannerJobs.length; i += 10) {
    await Promise.all(bannerJobs.slice(i, i + 10));
  }

  return results.sort((a, b) => a.port - b.port);
}

/**
 * scanNmap — deep service fingerprinting.
 * @param {string} domain  bare hostname
 * @param {number[]} openPorts  pre-discovered open ports from naabu
 * @returns {{ ports: Array, source: string, scanTime: number }}
 */
export async function scanNmap(domain, openPorts = []) {
  const host = extractHost(domain);
  if (!host || openPorts.length === 0) {
    return { ports: [], source: "fallback", scanTime: 0 };
  }

  // Limit to first 50 open ports to avoid scan overload
  const portsToScan = openPorts.slice(0, 50);

  const t0 = Date.now();
  const bin = findBinary(NMAP_PATHS);

  let ports;
  let source;

  if (bin) {
    try {
      ports = await runNmapBinary(bin, host, portsToScan);
      source = "nmap";
    } catch {
      ports = await nmapFallback(host, portsToScan);
      source = "fallback";
    }
  } else {
    ports = await nmapFallback(host, portsToScan);
    source = "fallback";
  }

  return { ports, source, scanTime: Date.now() - t0 };
}
