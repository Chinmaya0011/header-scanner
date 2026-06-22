import tls from "tls";

// Helper to extract hostname/domain from URL
function extractHost(url) {
  if (!url) return "";
  let host = url.trim();
  if (host.startsWith("http://")) host = host.substring(7);
  if (host.startsWith("https://")) host = host.substring(8);
  // Remove path, query params, etc.
  const slashIdx = host.indexOf("/");
  if (slashIdx !== -1) host = host.substring(0, slashIdx);
  const colonIdx = host.indexOf(":");
  if (colonIdx !== -1) host = host.substring(0, colonIdx);
  return host;
}

export async function scanSSL(url) {
  const domain = extractHost(url);
  const sslStart = Date.now();
  
  return new Promise((resolve) => {
    const socket = tls.connect({
      host: domain,
      port: 443,
      servername: domain,
      rejectUnauthorized: false, // Connect even if cert is self-signed/expired so we can audit
      timeout: 5000,
    }, () => {
      try {
        const cert = socket.getPeerCertificate(true);
        const tlsVersion = socket.getProtocol();
        const cipherObj = socket.getCipher();
        const cipherSuite = cipherObj ? cipherObj.name : "Unknown Cipher";
        const handshakeMs = Date.now() - sslStart;
        
        socket.destroy();
        
        if (!cert || Object.keys(cert).length === 0) {
          resolve(getFallbackSSL(domain, false, "No certificate returned"));
          return;
        }

        const validTo = cert.valid_to ? new Date(cert.valid_to) : null;
        const daysRemaining = validTo ? Math.max(0, Math.round((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;
        const wildcard = cert.subject?.CN ? cert.subject.CN.includes("*") : false;
        
        let sans = [];
        if (cert.subjectaltname) {
          sans = cert.subjectaltname.split(",").map(s => s.replace("DNS:", "").trim());
        }

        const authorized = socket.authorized;
        
        resolve({
          valid: authorized,
          tlsVersion: tlsVersion || null,
          supportedVersions: tlsVersion ? [tlsVersion] : [],
          cipherSuite: cipherSuite || null,
          expirationDate: validTo,
          daysRemaining: daysRemaining,
          issuer: cert.issuer?.O || cert.issuer?.CN || null,
          wildcard: wildcard,
          sans: sans,
          ocspStatus: cert.has_ocsp ? "Good" : "Not Provided",
          hstsPreload: false,
          keyType: cert.pubkey ? "RSA" : "ECDSA",
          keyLength: cert.bits || null,
          handshakeMs: handshakeMs
        });
      } catch (err) {
        resolve(getFallbackSSL(domain, false, err.message));
      }
    });

    socket.on("error", (err) => {
      socket.destroy();
      resolve(getFallbackSSL(domain, false, err.message));
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(getFallbackSSL(domain, false, "Connection timeout"));
    });
  });
}

function getFallbackSSL(domain, valid = false, reason = "") {
  return {
    valid: false,
    tlsVersion: null,
    supportedVersions: [],
    cipherSuite: null,
    expirationDate: null,
    daysRemaining: null,
    issuer: null,
    wildcard: null,
    sans: [],
    ocspStatus: null,
    hstsPreload: null,
    keyType: null,
    keyLength: null,
    failReason: reason,
    handshakeMs: null
  };
}
