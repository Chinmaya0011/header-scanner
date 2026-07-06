import net from "net";
import { execFile } from "child_process";
import path from "path";
import fs from "fs";
import pLimit from "p-limit";

// ─── Binary discovery ──────────────────────────────────────────────────────────
const NAABU_PATHS = [
  process.env.NAABU_BIN,
  path.join(process.cwd(), "naabu.exe"),
  path.join(process.cwd(), "naabu"),
  "C:\\Tools\\naabu.exe",
  "/usr/local/bin/naabu",
  "/usr/bin/naabu",
].filter(Boolean);

function findBinary(paths) {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

// Top 1000 ports to scan (common services prioritised)
const TOP_PORTS = [
  21, 22, 23, 25, 53, 80, 81, 110, 111, 119, 135, 139, 143, 194, 443, 445,
  465, 587, 631, 993, 995, 1080, 1194, 1433, 1521, 1723, 2049, 2082, 2083,
  2086, 2087, 2095, 2096, 3306, 3389, 4243, 4848, 5000, 5432, 5800, 5900,
  5984, 6379, 6443, 7000, 7001, 7070, 7474, 8000, 8080, 8081, 8443, 8888,
  9000, 9042, 9092, 9200, 9300, 9418, 9999, 10000, 11211, 27017, 27018,
  28017, 50070, 50075, 61616
];

function extractHost(url) {
  if (!url) return "";
  let host = url.trim()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0];
  return host;
}

/**
 * Run naabu binary for fast port scan.
 */
function runNaabuBinary(bin, domain) {
  return new Promise((resolve) => {
    const args = ["-host", domain, "-top-ports", "1000", "-json", "-silent", "-timeout", "5"];
    const proc = execFile(bin, args, { timeout: 60000, maxBuffer: 5 * 1024 * 1024 }, (err, stdout) => {
      if (err) return resolve([]);
      const ports = [];
      const lines = stdout.split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj.port) ports.push(Number(obj.port));
        } catch {}
      }
      resolve(ports);
    });
    proc.on("error", () => resolve([]));
  });
}

/**
 * Pure Node.js TCP connect scan fallback.
 * Uses high concurrency with short timeouts for speed.
 */
async function tcpScanFallback(domain) {
  const limit = pLimit(50); // 50 concurrent connections
  const TIMEOUT_MS = 800;

  const tasks = TOP_PORTS.map((port) =>
    limit(() =>
      new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(TIMEOUT_MS);

        socket.on("connect", () => {
          socket.destroy();
          resolve(port);
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
      })
    )
  );

  const results = await Promise.all(tasks);
  return results.filter((p) => p !== null);
}

/**
 * scanNaabu — fast port discovery.
 * @param {string} domain  bare hostname
 * @returns {{ openPorts: number[], source: string, scanTime: number }}
 */
export async function scanNaabu(domain) {
  const host = extractHost(domain);
  if (!host) return { openPorts: [], source: "fallback", scanTime: 0 };

  const t0 = Date.now();
  const bin = findBinary(NAABU_PATHS);

  let openPorts;
  let source;

  if (bin) {
    try {
      openPorts = await runNaabuBinary(bin, host);
      source = "naabu";
    } catch {
      openPorts = await tcpScanFallback(host);
      source = "fallback";
    }
  } else {
    openPorts = await tcpScanFallback(host);
    source = "fallback";
  }

  return {
    openPorts: openPorts.sort((a, b) => a - b),
    source,
    scanTime: Date.now() - t0,
  };
}
