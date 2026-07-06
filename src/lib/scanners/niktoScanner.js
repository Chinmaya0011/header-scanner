import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// ─── Binary discovery ──────────────────────────────────────────────────────────
const NIKTO_PATHS = [
  process.env.NIKTO_BIN,
  path.join(process.cwd(), "nikto"),
  "/usr/bin/nikto",
  "/usr/local/bin/nikto",
].filter(Boolean);

function findBinary(paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

const FETCH_OPTS = (timeout = 5000) => ({
  signal: AbortSignal.timeout(timeout),
  headers: { "User-Agent": "HeaderGuard-Nikto-Scanner/2.0" },
  redirect: "follow",
});

async function fetchSafe(url) {
  try {
    const res = await fetch(url, FETCH_OPTS());
    const text = await res.text().catch(() => "");
    return { status: res.status, headers: Object.fromEntries(res.headers), text };
  } catch {
    return null;
  }
}

// ─── Built-in Nikto-style checks ──────────────────────────────────────────────
const NIKTO_CHECKS = [
  // Missing security headers
  {
    id: "NIKTO-001",
    title: "Missing X-Frame-Options Header",
    severity: "medium",
    check: async (url, _d, headers) => {
      if (!headers?.["x-frame-options"]) {
        return { description: "X-Frame-Options header is not set, enabling clickjacking attacks.", url, remedy: "Set X-Frame-Options: SAMEORIGIN or DENY" };
      }
    },
  },
  {
    id: "NIKTO-002",
    title: "Missing X-Content-Type-Options Header",
    severity: "low",
    check: async (url, _d, headers) => {
      if (!headers?.["x-content-type-options"]) {
        return { description: "X-Content-Type-Options is not set, enabling MIME-type sniffing.", url, remedy: "Set X-Content-Type-Options: nosniff" };
      }
    },
  },
  {
    id: "NIKTO-003",
    title: "Missing Strict-Transport-Security Header",
    severity: "high",
    check: async (url, _d, headers) => {
      if (url.startsWith("https://") && !headers?.["strict-transport-security"]) {
        return { description: "HSTS not enforced. Clients can downgrade to HTTP.", url, remedy: "Set Strict-Transport-Security: max-age=31536000; includeSubDomains" };
      }
    },
  },
  {
    id: "NIKTO-004",
    title: "Server Banner Information Leakage",
    severity: "low",
    check: async (url, _d, headers) => {
      const server = headers?.["server"] || "";
      if (/[\d.]/.test(server)) {
        return { description: `Server header exposes version: ${server}`, url, remedy: "Configure server to suppress version details from the Server header." };
      }
    },
  },
  {
    id: "NIKTO-005",
    title: "HTTP Strict Transport Security Max-Age Too Short",
    severity: "low",
    check: async (url, _d, headers) => {
      const hsts = headers?.["strict-transport-security"] || "";
      const match = hsts.match(/max-age=(\d+)/i);
      if (match && Number(match[1]) < 10886400) {
        return { description: `HSTS max-age is ${match[1]}s, less than recommended 180 days.`, url, remedy: "Set HSTS max-age to at least 10886400 (180 days)." };
      }
    },
  },
  // Dangerous files / paths
  {
    id: "NIKTO-006",
    title: "Exposed Dockerfile",
    severity: "medium",
    check: async (url) => {
      const r = await fetchSafe(`${url}/Dockerfile`);
      if (r?.status === 200 && r.text?.includes("FROM ")) {
        return { description: "Dockerfile is publicly accessible, revealing infrastructure.", url: `${url}/Dockerfile`, remedy: "Block Dockerfile from web-accessible directories." };
      }
    },
  },
  {
    id: "NIKTO-007",
    title: "Composer.json Exposed",
    severity: "low",
    check: async (url) => {
      const r = await fetchSafe(`${url}/composer.json`);
      if (r?.status === 200 && r.text?.includes('"require"')) {
        return { description: "composer.json exposes PHP dependency versions.", url: `${url}/composer.json`, remedy: "Block composer files from public access." };
      }
    },
  },
  {
    id: "NIKTO-008",
    title: "Package.json Exposed",
    severity: "low",
    check: async (url) => {
      const r = await fetchSafe(`${url}/package.json`);
      if (r?.status === 200 && r.text?.includes('"dependencies"')) {
        return { description: "package.json exposes Node.js dependency names and versions.", url: `${url}/package.json`, remedy: "Serve only built assets; block source files from public access." };
      }
    },
  },
  {
    id: "NIKTO-009",
    title: "Exposed Log Files",
    severity: "high",
    check: async (url) => {
      for (const p of ["/logs/error.log", "/error.log", "/access.log", "/app.log", "/server.log"]) {
        const r = await fetchSafe(`${url}${p}`);
        if (r?.status === 200 && r.text?.length > 100) {
          return { description: `Log file at ${p} is publicly accessible.`, url: `${url}${p}`, remedy: "Move log files outside web root or block with server rules." };
        }
      }
    },
  },
  {
    id: "NIKTO-010",
    title: "HTTP TRACE Method Enabled",
    severity: "medium",
    check: async (url) => {
      try {
        const r = await fetch(url, { method: "TRACE", signal: AbortSignal.timeout(5000) });
        if (r.status === 200) {
          const body = await r.text();
          if (body?.includes("TRACE")) {
            return { description: "HTTP TRACE method is enabled, enabling cross-site tracing (XST) attacks.", url, remedy: "Disable TRACE method in web server configuration." };
          }
        }
      } catch {}
    },
  },
  {
    id: "NIKTO-011",
    title: "Exposed .htaccess File",
    severity: "high",
    check: async (url) => {
      const r = await fetchSafe(`${url}/.htaccess`);
      if (r?.status === 200 && (r.text?.includes("Deny") || r.text?.includes("Allow") || r.text?.includes("RewriteRule"))) {
        return { description: ".htaccess file is publicly accessible, revealing server configuration rules.", url: `${url}/.htaccess`, remedy: "Configure Apache to deny access to .htaccess files." };
      }
    },
  },
  {
    id: "NIKTO-012",
    title: "Clickjacking Vulnerability",
    severity: "medium",
    check: async (url, _d, headers) => {
      const xfo = headers?.["x-frame-options"] || "";
      const csp = headers?.["content-security-policy"] || "";
      const hasFrameAncestors = csp.includes("frame-ancestors");
      if (!xfo && !hasFrameAncestors) {
        return { description: "No frame embedding protection detected. Page may be embedded in iframes for clickjacking.", url, remedy: "Add X-Frame-Options: DENY or use CSP frame-ancestors directive." };
      }
    },
  },
  {
    id: "NIKTO-013",
    title: "Missing Referrer-Policy Header",
    severity: "low",
    check: async (url, _d, headers) => {
      if (!headers?.["referrer-policy"]) {
        return { description: "Referrer-Policy header is missing. Full URL referrers may leak sensitive path data.", url, remedy: "Set Referrer-Policy: strict-origin-when-cross-origin" };
      }
    },
  },
  {
    id: "NIKTO-014",
    title: "Exposed Web.config File",
    severity: "high",
    check: async (url) => {
      const r = await fetchSafe(`${url}/web.config`);
      if (r?.status === 200 && r.text?.includes("<configuration>")) {
        return { description: "ASP.NET web.config is publicly accessible, exposing app secrets and connection strings.", url: `${url}/web.config`, remedy: "Deny access to web.config via IIS configuration." };
      }
    },
  },
  {
    id: "NIKTO-015",
    title: "Outdated jQuery Version",
    severity: "medium",
    check: async (url) => {
      const r = await fetchSafe(`${url}/`);
      if (r?.text) {
        const match = r.text.match(/jquery[.-](\d+\.\d+\.?\d*)(\.min)?\.js/i);
        if (match) {
          const [major, minor] = match[1].split(".").map(Number);
          if (major < 3 || (major === 3 && minor < 5)) {
            return { description: `Outdated jQuery version ${match[1]} detected. Contains known XSS vulnerabilities.`, url, remedy: "Upgrade jQuery to version 3.7.0 or later." };
          }
        }
      }
    },
  },
];

// ─── Nikto binary runner ──────────────────────────────────────────────────────
function runNiktoBinary(bin, url) {
  return new Promise((resolve) => {
    // Nikto outputs in text format; parse key fields
    const args = ["-h", url, "-Format", "txt", "-nointeractive", "-timeout", "10"];
    execFile(bin, args, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (!stdout) return resolve([]);
      const findings = [];
      const lines = stdout.split("\n");
      for (const line of lines) {
        if (line.startsWith("+ ") && line.length > 10) {
          const clean = line.substring(2).trim();
          const sevMatch = clean.match(/\(OSVDB-(\d+)\)/i);
          findings.push({
            id: sevMatch ? `OSVDB-${sevMatch[1]}` : `NIKTO-BIN-${findings.length}`,
            title: clean.split(":")[0].trim().substring(0, 80),
            severity: "medium",
            description: clean,
            url,
            remedy: "Refer to Nikto and OSVDB documentation for remediation steps.",
          });
        }
      }
      resolve(findings);
    });
  });
}

/**
 * scanNikto — web server misconfiguration checks.
 * @param {string} url     full URL with protocol
 * @param {string} domain  bare hostname
 * @param {object} headers response headers from the main scan
 * @returns {{ serverIssues: Array, source: string, scanTime: number }}
 */
export async function scanNikto(url, domain, headers = {}) {
  const t0 = Date.now();
  const bin = findBinary(NIKTO_PATHS);

  let serverIssues = [];
  let source;

  if (bin) {
    try {
      serverIssues = await runNiktoBinary(bin, url);
      source = "nikto";
    } catch {
      source = "fallback";
    }
  }

  // Run built-in checks (always, to supplement binary or as standalone)
  if (!bin || source === "fallback") {
    source = "builtin";
    const results = await Promise.allSettled(
      NIKTO_CHECKS.map(c => c.check(url, domain, headers))
    );
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled" && r.value) {
        serverIssues.push({
          id: NIKTO_CHECKS[i].id,
          title: NIKTO_CHECKS[i].title,
          severity: NIKTO_CHECKS[i].severity,
          description: r.value.description,
          url: r.value.url || url,
          remedy: r.value.remedy,
        });
      }
    }
  }

  return { serverIssues, source, scanTime: Date.now() - t0 };
}
