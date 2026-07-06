import dns from "dns";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const { resolve: dnsResolve } = dns.promises;

// ─── Binary discovery — uses existing subfinder.exe in project root ────────────
const SUBFINDER_PATHS = [
  process.env.SUBFINDER_BIN,
  path.join(process.cwd(), "subfinder.exe"),
  path.join(process.cwd(), "subfinder"),
  "C:\\Tools\\subfinder.exe",
  "/usr/local/bin/subfinder",
  "/usr/bin/subfinder",
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

// ─── Certificate transparency via crt.sh ──────────────────────────────────────
async function fetchCrtSh(domain) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(
      `https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json", "User-Agent": "HeaderGuard-Scanner/2.0" },
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return [];
    const data = await res.json();
    const subs = new Set();
    for (const entry of data) {
      const names = (entry.name_value || "").split("\n");
      for (const name of names) {
        const clean = name.trim().replace(/^\*\./, "").toLowerCase();
        if (clean.endsWith(`.${domain}`) && clean !== domain && !clean.includes("*")) {
          subs.add(clean);
        }
      }
    }
    return [...subs].map(host => ({ host, source: "crt.sh", ip: "" }));
  } catch {
    return [];
  }
}

// ─── DNS brute-force wordlist ─────────────────────────────────────────────────
const COMMON_SUBDOMAINS = [
  "www", "mail", "remote", "blog", "webmail", "server", "ns1", "ns2",
  "smtp", "secure", "vpn", "m", "shop", "ftp", "mail2", "test", "portal",
  "ns", "ww1", "host", "support", "dev", "web", "bbs", "ww42", "mx",
  "email", "1", "mail1", "2", "forum", "owa", "www2", "gw", "admin",
  "store", "mx1", "cdn", "api", "exchange", "app", "archive", "beta",
  "chat", "en", "imap", "it", "news", "old", "owa", "pop", "pop3", "pos",
  "search", "staging", "static", "status", "wiki", "www1", "ws", "demo",
  "media", "cdn1", "cdn2", "image", "images", "img", "files", "data",
  "new", "login", "mysql", "db", "oracle", "mssql", "internal",
  "intranet", "vpn2", "remote2", "git", "gitlab", "github", "jenkins",
  "jira", "confluence", "help", "docs", "kb", "knowledge", "hr",
  "mail3", "smtp2", "mail4", "ns3", "ns4", "autodiscover", "autoconfig",
  "mobile", "catalog", "manage", "marketing", "video", "download",
];

async function dnsBruteForce(domain) {
  const results = [];
  const concurrency = 20;

  for (let i = 0; i < COMMON_SUBDOMAINS.length; i += concurrency) {
    const batch = COMMON_SUBDOMAINS.slice(i, i + concurrency);
    const checks = batch.map(async (sub) => {
      const fqdn = `${sub}.${domain}`;
      try {
        const addrs = await dnsResolve(fqdn, "A");
        if (addrs && addrs.length > 0) {
          results.push({ host: fqdn, source: "dns-brute", ip: addrs[0] });
        }
      } catch {}
    });
    await Promise.all(checks);
  }

  return results;
}

// ─── Subfinder binary runner ──────────────────────────────────────────────────
function runSubfinderBinary(bin, domain) {
  return new Promise((resolve) => {
    const proc = spawn(bin, ["-d", domain, "-silent", "-all", "-timeout", "10"], {
      timeout: 60000,
    });

    let stdout = "";
    proc.stdout?.on("data", (d) => { stdout += d.toString(); });
    proc.on("close", () => {
      const subs = stdout
        .split("\n")
        .map(s => s.trim().toLowerCase())
        .filter(s => s && s.endsWith(`.${domain}`) && !s.includes("*"))
        .map(host => ({ host, source: "subfinder", ip: "" }));
      resolve(subs);
    });
    proc.on("error", () => resolve([]));
  });
}

/**
 * scanSubfinder — subdomain enumeration.
 * @param {string} urlOrDomain  full URL or bare domain
 * @returns {{ subdomains: Array<{host, source, ip}>, source: string, scanTime: number }}
 */
export async function scanSubfinder(urlOrDomain) {
  const domain = extractHost(urlOrDomain);
  if (!domain) return { subdomains: [], source: "fallback", scanTime: 0 };

  const t0 = Date.now();
  const bin = findBinary(SUBFINDER_PATHS);

  let subdomains = [];
  let source;

  // Run both crt.sh and either subfinder or brute-force in parallel
  const crtPromise = fetchCrtSh(domain);
  let binaryPromise;

  if (bin) {
    binaryPromise = runSubfinderBinary(bin, domain);
    source = "subfinder+crt.sh";
  } else {
    binaryPromise = dnsBruteForce(domain);
    source = "dns-brute+crt.sh";
  }

  const [crtResults, primaryResults] = await Promise.all([crtPromise, binaryPromise]);

  // Deduplicate by hostname
  const seen = new Set();
  const merged = [...primaryResults, ...crtResults];
  for (const entry of merged) {
    if (!seen.has(entry.host)) {
      seen.add(entry.host);
      subdomains.push(entry);
    }
  }

  // Resolve IPs for any subdomains that don't have one yet
  const needsIp = subdomains.filter(s => !s.ip);
  await Promise.allSettled(
    needsIp.map(async (s) => {
      try {
        const addrs = await dnsResolve(s.host, "A");
        if (addrs?.[0]) s.ip = addrs[0];
      } catch {}
    })
  );

  return {
    subdomains: subdomains.slice(0, 150), // Cap at 150
    source,
    scanTime: Date.now() - t0,
  };
}
