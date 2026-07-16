import net from "net";
import dns from "dns";
import { isIPv4, isIPv6 } from "../analyzer";

export function isIPPrivate(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    if (parts.length !== 4) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 169 && parts[1] === 254) return true;
    if (parts[0] === 0 || parts[0] >= 224) return true;
    return false;
  }
  
  if (net.isIPv6(ip)) {
    const cleanIp = ip.toLowerCase().trim();
    if (cleanIp === "::1" || cleanIp === "0:0:0:0:0:0:0:1") return true;
    if (cleanIp === "::" || cleanIp === "0:0:0:0:0:0:0:0") return true;
    if (/^f[cd]/i.test(cleanIp)) return true;
    if (cleanIp.startsWith("fe80:") || /^fe[89ab]:/i.test(cleanIp)) return true;
    if (cleanIp.startsWith("ff")) return true;
    return false;
  }
  
  return true;
}

export async function isPrivateHost(hostOrIp) {
  let hostname = (hostOrIp || "").trim().toLowerCase();
  if (hostname.startsWith("[")) {
    const close = hostname.indexOf("]");
    hostname = close !== -1 ? hostname.substring(1, close) : hostname;
  } else {
    const colon = hostname.indexOf(":");
    hostname = colon !== -1 ? hostname.substring(0, colon) : hostname;
  }

  if (hostname === "localhost") return true;
  
  if (isIPv4(hostname) || isIPv6(hostname)) {
    return isIPPrivate(hostname);
  }
  
  try {
    const lookupResult = await dns.promises.lookup(hostname, { all: true });
    return lookupResult.some(addr => isIPPrivate(addr.address));
  } catch {
    return false;
  }
}
