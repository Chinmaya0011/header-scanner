import dns from "dns";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";

const { resolve: dnsResolve } = dns.promises;

// ─── Binary discovery ──────────────────────────────────────────────────────────
const DNSX_PATHS = [
  process.env.DNSX_BIN,
  path.join(process.cwd(), "dnsx.exe"),
  path.join(process.cwd(), "dnsx"),
  "C:\\Tools\\dnsx.exe",
  "/usr/local/bin/dnsx",
  "/usr/bin/dnsx",
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

// ─── Node.js DNS resolution fallback ─────────────────────────────────────────
async function resolveAllRecords(domain) {
  const result = {
    A: [],
    AAAA: [],
    CNAME: [],
    MX: [],
    TXT: [],
    NS: [],
    SOA: null,
    CAA: [],
    PTR: [],
    SRV: [],
    resolveTime: 0,
  };

  const t0 = Date.now();

  await Promise.allSettled([
    dnsResolve(domain, "A").then(r => { result.A = r; }).catch(() => {}),
    dnsResolve(domain, "AAAA").then(r => { result.AAAA = r; }).catch(() => {}),
    dnsResolve(domain, "CNAME").then(r => { result.CNAME = r; }).catch(() => {}),
    dnsResolve(domain, "MX").then(r => {
      result.MX = r.map(m => ({ priority: m.priority, exchange: m.exchange }));
    }).catch(() => {}),
    dnsResolve(domain, "TXT").then(r => {
      result.TXT = r.map(t => (Array.isArray(t) ? t.join("") : t));
    }).catch(() => {}),
    dnsResolve(domain, "NS").then(r => { result.NS = r; }).catch(() => {}),
    dnsResolve(domain, "SOA").then(r => {
      result.SOA = {
        nsname: r.nsname,
        hostmaster: r.hostmaster,
        serial: r.serial,
        refresh: r.refresh,
        retry: r.retry,
        expire: r.expire,
        minttl: r.minttl,
      };
    }).catch(() => {}),
    dnsResolve(domain, "CAA").then(r => {
      result.CAA = r.map(c => `${c.tag} "${c.value}"`);
    }).catch(() => {}),
    // Resolve PTR for first A record
  ]);

  // Reverse DNS for first A record
  if (result.A.length > 0) {
    try {
      const ptrs = await dns.promises.reverse(result.A[0]);
      result.PTR = ptrs;
    } catch {}
  }

  result.resolveTime = Date.now() - t0;
  return result;
}

// ─── Dnsx binary runner ───────────────────────────────────────────────────────
function runDnsxBinary(bin, domain) {
  return new Promise((resolve) => {
    const args = ["-d", domain, "-a", "-aaaa", "-cname", "-mx", "-txt", "-ns",
                  "-resp", "-json", "-silent"];
    execFile(bin, args, { timeout: 30000, maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (!stdout) return resolve(null);
      try {
        const result = {
          A: [], AAAA: [], CNAME: [], MX: [], TXT: [], NS: [], SOA: null, CAA: [], PTR: [],
          resolveTime: 0,
        };
        for (const line of stdout.split("\n").filter(Boolean)) {
          try {
            const obj = JSON.parse(line);
            if (obj.a) result.A.push(...obj.a);
            if (obj.aaaa) result.AAAA.push(...obj.aaaa);
            if (obj.cname) result.CNAME.push(...obj.cname);
            if (obj.mx) result.MX.push(...obj.mx.map(m => ({ priority: 0, exchange: m })));
            if (obj.txt) result.TXT.push(...obj.txt);
            if (obj.ns) result.NS.push(...obj.ns);
          } catch {}
        }
        resolve(result);
      } catch { resolve(null); }
    });
  });
}

/**
 * scanDnsx — comprehensive DNS record resolution.
 * @param {string} urlOrDomain
 * @returns {{ dns: Object, source: string, scanTime: number }}
 */
export async function scanDnsx(urlOrDomain) {
  const domain = extractHost(urlOrDomain);
  if (!domain) return { dns: {}, source: "fallback", scanTime: 0 };

  const t0 = Date.now();
  const bin = findBinary(DNSX_PATHS);

  let dnsData = null;
  let source;

  if (bin) {
    try {
      dnsData = await runDnsxBinary(bin, domain);
      source = "dnsx";
    } catch { source = "fallback"; }
  }

  if (!dnsData) {
    dnsData = await resolveAllRecords(domain);
    source = "fallback";
  }

  return { dns: dnsData, source, scanTime: Date.now() - t0 };
}
