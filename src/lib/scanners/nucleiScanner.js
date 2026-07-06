import { execFile } from "child_process";
import path from "path";
import fs from "fs";

// ─── Binary discovery ──────────────────────────────────────────────────────────
const NUCLEI_PATHS = [
  process.env.NUCLEI_BIN,
  path.join(process.cwd(), "nuclei.exe"),
  path.join(process.cwd(), "nuclei"),
  "C:\\Tools\\nuclei.exe",
  "/usr/local/bin/nuclei",
  "/usr/bin/nuclei",
].filter(Boolean);

function findBinary(paths) {
  for (const p of paths) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return null;
}

// ─── Built-in Node.js vulnerability checks ────────────────────────────────────
// Each check returns a finding object or null.

const FETCH_OPTS = (timeout = 6000) => ({
  signal: AbortSignal.timeout(timeout),
  headers: { "User-Agent": "HeaderGuard-Security-Scanner/2.0" },
  redirect: "follow",
});

async function fetchUrl(url) {
  try {
    const res = await fetch(url, FETCH_OPTS());
    const text = await res.text().catch(() => "");
    return { status: res.status, headers: Object.fromEntries(res.headers), text };
  } catch {
    return null;
  }
}

// All built-in templates
const BUILTIN_TEMPLATES = [
  // ── Information disclosure ──────────────────────────────────────────────────
  {
    id: "server-version-disclosure",
    title: "Server Version Disclosure",
    severity: "low",
    description: "The web server discloses its version in the Server response header, enabling targeted version-specific exploits.",
    recommendation: "Configure the server to suppress version information from the Server header.",
    check: async (url, _domain, headers) => {
      const server = headers?.["server"] || "";
      const versionRegex = /[\d]+\.[\d]+/;
      if (versionRegex.test(server)) {
        return { matchedUrl: url, evidence: `Server: ${server}` };
      }
      return null;
    },
  },
  {
    id: "x-powered-by-disclosure",
    title: "X-Powered-By Technology Disclosure",
    severity: "low",
    description: "The application exposes its server-side technology stack via the X-Powered-By header.",
    recommendation: "Remove the X-Powered-By header via server/framework configuration.",
    check: async (url, _domain, headers) => {
      const val = headers?.["x-powered-by"];
      if (val) return { matchedUrl: url, evidence: `X-Powered-By: ${val}` };
      return null;
    },
  },
  {
    id: "git-exposure",
    title: "Exposed .git Directory",
    severity: "high",
    description: "The .git directory is publicly accessible, potentially exposing source code and credentials.",
    cve: null,
    recommendation: "Block access to .git via web server configuration (deny all requests to /.git).",
    check: async (url) => {
      const r = await fetchUrl(`${url}/.git/HEAD`);
      if (r && r.status === 200 && r.text?.startsWith("ref:")) {
        return { matchedUrl: `${url}/.git/HEAD`, evidence: "Git HEAD file publicly accessible" };
      }
      return null;
    },
  },
  {
    id: "env-file-exposure",
    title: "Exposed .env Configuration File",
    severity: "critical",
    description: "A .env file is publicly accessible, potentially exposing API keys, database credentials, and secrets.",
    recommendation: "Immediately block access to .env files via web server rules and rotate all exposed credentials.",
    check: async (url) => {
      const r = await fetchUrl(`${url}/.env`);
      if (r && r.status === 200 && (r.text?.includes("DB_") || r.text?.includes("APP_KEY") || r.text?.includes("SECRET"))) {
        return { matchedUrl: `${url}/.env`, evidence: "Environment file contains credentials" };
      }
      return null;
    },
  },
  {
    id: "phpinfo-exposure",
    title: "PHP Info Page Exposed",
    severity: "medium",
    description: "A phpinfo() page is publicly accessible, revealing PHP configuration, environment variables, and server paths.",
    recommendation: "Remove phpinfo() pages from production environments.",
    check: async (url) => {
      for (const path of ["/phpinfo.php", "/info.php", "/php_info.php"]) {
        const r = await fetchUrl(`${url}${path}`);
        if (r && r.status === 200 && r.text?.includes("phpinfo()")) {
          return { matchedUrl: `${url}${path}`, evidence: "PHP info page found" };
        }
      }
      return null;
    },
  },
  {
    id: "directory-listing",
    title: "Web Server Directory Listing Enabled",
    severity: "medium",
    description: "Directory listing is enabled, allowing attackers to enumerate server files.",
    recommendation: "Disable directory listing via server configuration (e.g., Options -Indexes in Apache).",
    check: async (url) => {
      const r = await fetchUrl(`${url}/`);
      if (r && r.status === 200 && (r.text?.includes("Index of /") || r.text?.includes("Directory listing for"))) {
        return { matchedUrl: url, evidence: "Directory listing detected on root" };
      }
      return null;
    },
  },
  {
    id: "cors-wildcard",
    title: "Permissive CORS Configuration",
    severity: "medium",
    description: "The server responds with Access-Control-Allow-Origin: * which allows any origin to make cross-origin requests.",
    recommendation: "Restrict CORS to trusted origins. Avoid wildcard (*) for authenticated endpoints.",
    check: async (url, _domain, headers) => {
      const acao = headers?.["access-control-allow-origin"];
      if (acao === "*") {
        return { matchedUrl: url, evidence: "Access-Control-Allow-Origin: *" };
      }
      return null;
    },
  },
  {
    id: "http-methods-exposed",
    title: "Dangerous HTTP Methods Enabled",
    severity: "medium",
    description: "The server allows potentially dangerous HTTP methods such as TRACE, PUT, or DELETE.",
    recommendation: "Disable TRACE, PUT, DELETE methods unless explicitly required by the application.",
    check: async (url) => {
      try {
        const r = await fetch(url, { method: "OPTIONS", signal: AbortSignal.timeout(5000), redirect: "follow" });
        const allow = r.headers.get("Allow") || r.headers.get("allow") || "";
        const dangerous = ["TRACE", "PUT", "DELETE"].filter(m => allow.toUpperCase().includes(m));
        if (dangerous.length > 0) {
          return { matchedUrl: url, evidence: `Allow: ${allow} (dangerous methods: ${dangerous.join(", ")})` };
        }
      } catch {}
      return null;
    },
  },
  {
    id: "admin-panel-exposure",
    title: "Admin Panel Publicly Accessible",
    severity: "high",
    description: "An administrative interface is accessible without authentication restrictions.",
    recommendation: "Restrict admin panels to internal/VPN networks only using firewall rules or IP allowlisting.",
    check: async (url) => {
      const adminPaths = ["/admin", "/administrator", "/wp-admin", "/phpmyadmin", "/cpanel", "/manager", "/console", "/_admin"];
      for (const p of adminPaths) {
        const r = await fetchUrl(`${url}${p}`);
        if (r && r.status === 200 && !r.text?.includes("404") && r.text?.length > 200) {
          return { matchedUrl: `${url}${p}`, evidence: `Admin path accessible (HTTP 200): ${p}` };
        }
      }
      return null;
    },
  },
  {
    id: "swagger-ui-exposed",
    title: "API Documentation Publicly Exposed",
    severity: "low",
    description: "Swagger/OpenAPI documentation is publicly accessible, revealing API endpoints and schemas.",
    recommendation: "Restrict API docs to authenticated users or internal networks in production.",
    check: async (url) => {
      const paths = ["/swagger-ui.html", "/swagger-ui", "/api-docs", "/openapi.json", "/api/swagger.json", "/docs"];
      for (const p of paths) {
        const r = await fetchUrl(`${url}${p}`);
        if (r && r.status === 200 && (r.text?.includes("swagger") || r.text?.includes("openapi"))) {
          return { matchedUrl: `${url}${p}`, evidence: `API documentation found at ${p}` };
        }
      }
      return null;
    },
  },
  {
    id: "debug-mode-enabled",
    title: "Application Debug Mode Active",
    severity: "high",
    description: "The application appears to be running in debug mode, which may expose stack traces and configuration.",
    recommendation: "Disable debug mode in production. Set NODE_ENV=production or equivalent.",
    check: async (url, _domain, headers) => {
      const val = headers?.["x-debug-token"] || headers?.["x-debug-token-link"];
      if (val) return { matchedUrl: url, evidence: `Debug header found: x-debug-token: ${val}` };
      return null;
    },
  },
  {
    id: "waf-bypass-test",
    title: "Missing Web Application Firewall",
    severity: "info",
    description: "No WAF signatures detected in response headers. The application may lack an application-layer firewall.",
    recommendation: "Consider deploying a WAF (Cloudflare, AWS WAF, ModSecurity) for additional protection.",
    check: async (url, _domain, headers) => {
      const wafHeaders = ["cf-ray", "x-sucuri-id", "x-fw-hash", "x-cache", "x-akamai-transformed"];
      const hasWaf = wafHeaders.some(h => headers?.[h]);
      if (!hasWaf) {
        return { matchedUrl: url, evidence: "No WAF signatures detected in response headers" };
      }
      return null;
    },
  },
  {
    id: "backup-file-exposure",
    title: "Backup File Publicly Accessible",
    severity: "high",
    description: "A backup or archive file is publicly accessible, potentially containing sensitive application data.",
    recommendation: "Remove backup files from web-accessible directories and store them securely.",
    check: async (url, domain) => {
      const baseDomain = domain.split(".")[0];
      const paths = [
        `/backup.zip`, `/backup.tar.gz`, `/${baseDomain}.zip`,
        `/backup.sql`, `/db.sql`, `/database.sql`, `/dump.sql`
      ];
      for (const p of paths) {
        const r = await fetchUrl(`${url}${p}`);
        if (r && (r.status === 200 || r.status === 206)) {
          return { matchedUrl: `${url}${p}`, evidence: `Backup file accessible: ${p}` };
        }
      }
      return null;
    },
  },
  {
    id: "wp-config-exposure",
    title: "WordPress Configuration File Exposed",
    severity: "critical",
    description: "WordPress wp-config.php contains database credentials and secret keys.",
    recommendation: "Move wp-config.php outside the web root and restrict server access.",
    check: async (url) => {
      const r = await fetchUrl(`${url}/wp-config.php`);
      if (r && r.status === 200 && r.text?.includes("DB_PASSWORD")) {
        return { matchedUrl: `${url}/wp-config.php`, evidence: "WordPress config file exposed with credentials" };
      }
      return null;
    },
  },
  {
    id: "security-txt-missing",
    title: "security.txt File Missing",
    severity: "info",
    description: "No security.txt file found. This file provides a standard channel for reporting security vulnerabilities.",
    recommendation: "Create a security.txt file at /.well-known/security.txt per RFC 9116.",
    check: async (url) => {
      const r = await fetchUrl(`${url}/.well-known/security.txt`);
      if (!r || r.status !== 200 || !r.text?.includes("Contact:")) {
        return { matchedUrl: `${url}/.well-known/security.txt`, evidence: "security.txt not found or missing Contact field" };
      }
      return null;
    },
  },
  {
    id: "error-page-disclosure",
    title: "Verbose Error Pages",
    severity: "low",
    description: "Error pages expose technology stack or file paths, aiding attackers in fingerprinting.",
    recommendation: "Implement custom error pages that do not reveal server internals.",
    check: async (url) => {
      const r = await fetchUrl(`${url}/this-page-definitely-does-not-exist-12345`);
      if (r && r.text) {
        const reveals = ["Traceback", "stack trace", "Laravel", "Django", "Rails", "PHP Fatal", "at com.", "Exception in thread"];
        for (const keyword of reveals) {
          if (r.text.includes(keyword)) {
            return { matchedUrl: url, evidence: `Error page reveals: "${keyword}"` };
          }
        }
      }
      return null;
    },
  },
];

// ─── Nuclei binary runner ─────────────────────────────────────────────────────
function runNucleiBinary(bin, url) {
  return new Promise((resolve) => {
    const args = ["-u", url, "-j", "-silent", "-severity", "critical,high,medium,low,info",
                  "-timeout", "10", "-no-update-check", "-disable-update-check"];
    execFile(bin, args, { timeout: 120000, maxBuffer: 20 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) return resolve([]);
      const findings = [];
      const lines = stdout.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          findings.push({
            title: obj.info?.name || obj["template-id"] || "Unknown Finding",
            severity: obj.info?.severity || "info",
            cve: obj.info?.classification?.["cve-id"]?.[0] || null,
            cvss: obj.info?.classification?.["cvss-score"] || null,
            template: obj["template-id"] || "",
            description: obj.info?.description || "",
            matchedUrl: obj["matched-at"] || url,
            recommendation: obj.info?.remediation || "Refer to the template documentation.",
          });
        } catch {}
      }
      resolve(findings);
    });
  });
}

/**
 * scanNuclei — vulnerability scanning.
 * @param {string} url     full URL with protocol
 * @param {string} domain  bare hostname
 * @param {object} headers response headers from the main scan
 * @returns {{ vulnerabilities: Array, source: string, scanTime: number }}
 */
export async function scanNuclei(url, domain, headers = {}) {
  const t0 = Date.now();
  const bin = findBinary(NUCLEI_PATHS);

  let vulnerabilities = [];
  let source;

  if (bin) {
    try {
      vulnerabilities = await runNucleiBinary(bin, url);
      source = "nuclei";
    } catch {
      source = "fallback";
    }
  }

  // Always run built-in templates (supplement binary results or serve as fallback)
  if (!bin || source === "fallback") {
    source = "builtin";
    const results = await Promise.allSettled(
      BUILTIN_TEMPLATES.map(t => t.check(url, domain, headers))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === "fulfilled" && result.value) {
        const tpl = BUILTIN_TEMPLATES[i];
        vulnerabilities.push({
          title: tpl.title,
          severity: tpl.severity,
          cve: tpl.cve || null,
          cvss: null,
          template: tpl.id,
          description: tpl.description,
          matchedUrl: result.value.matchedUrl || url,
          evidence: result.value.evidence || "",
          recommendation: tpl.recommendation,
        });
      }
    }
  }

  return {
    vulnerabilities,
    source,
    scanTime: Date.now() - t0,
  };
}
