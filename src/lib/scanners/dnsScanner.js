import dns from "dns";

const { resolve: dnsResolve } = dns.promises;

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

export async function scanDNS(url) {
  const domain = extractHost(url);
  const dnsStart = Date.now();
  const result = {
    a: [],
    aaaa: [],
    cname: [],
    mx: [],
    txt: [],
    spf: { value: "", valid: false, error: "Missing SPF record" },
    dkim: { value: "", found: false },
    dmarc: { value: "", valid: false, error: "Missing DMARC record" },
    dnssec: false,
    caa: [],
    resolveTime: null
  };

  if (!domain) return result;

  try {
    const aRecords = await dnsResolve(domain, "A").catch(() => []);
    result.a = aRecords;
  } catch (e) {}

  try {
    const aaaaRecords = await dnsResolve(domain, "AAAA").catch(() => []);
    result.aaaa = aaaaRecords;
  } catch (e) {}

  try {
    const cnameRecords = await dnsResolve(domain, "CNAME").catch(() => []);
    result.cname = cnameRecords;
  } catch (e) {}

  try {
    const mxRecords = await dnsResolve(domain, "MX").catch(() => []);
    result.mx = mxRecords.map(r => `${r.priority} ${r.exchange}`);
  } catch (e) {}

  try {
    const txtRecords = await dnsResolve(domain, "TXT").catch(() => []);
    result.txt = txtRecords.map(r => Array.isArray(r) ? r.join("") : r);
  } catch (e) {}

  try {
    const caaRecords = await dnsResolve(domain, "CAA").catch(() => []);
    // CAA returns objects like [{critical: 0, tag: "issue", value: "letsencrypt.org"}]
    result.caa = caaRecords.map(r => `${r.tag || "issue"} "${r.value || ""}"`);
  } catch (e) {}

  // Parse SPF from TXT
  const spfTxt = result.txt.find(t => t.toLowerCase().startsWith("v=spf1"));
  if (spfTxt) {
    result.spf = {
      value: spfTxt,
      valid: true,
      error: null
    };
  }

  // Parse DMARC from _dmarc.domain
  try {
    const dmarcTxts = await dnsResolve(`_dmarc.${domain}`, "TXT").catch(() => []);
    const dmarcTxt = dmarcTxts.map(r => Array.isArray(r) ? r.join("") : r).find(t => t.toLowerCase().startsWith("v=dmarc1"));
    if (dmarcTxt) {
      result.dmarc = {
        value: dmarcTxt,
        valid: true,
        error: null
      };
    }
  } catch (e) {}

  // Parse MTA-STS from _mta-sts.domain
  result.mtaSts = { value: "", valid: false };
  try {
    const stsTxts = await dnsResolve(`_mta-sts.${domain}`, "TXT").catch(() => []);
    const stsTxt = stsTxts.map(r => Array.isArray(r) ? r.join("") : r).find(t => t.toLowerCase().startsWith("v=sts1"));
    if (stsTxt) {
      result.mtaSts = { value: stsTxt, valid: true };
    }
  } catch (e) {}

  // Parse TLS-RPT from _smtp._tls.domain
  result.tlsRpt = { value: "", valid: false };
  try {
    const rptTxts = await dnsResolve(`_smtp._tls.${domain}`, "TXT").catch(() => []);
    const rptTxt = rptTxts.map(r => Array.isArray(r) ? r.join("") : r).find(t => t.toLowerCase().startsWith("v=tlsrpt1"));
    if (rptTxt) {
      result.tlsRpt = { value: rptTxt, valid: true };
    }
  } catch (e) {}

  // Parse BIMI from default._bimi.domain
  result.bimi = { value: "", valid: false };
  try {
    const bimiTxts = await dnsResolve(`default._bimi.${domain}`, "TXT").catch(() => []);
    const bimiTxt = bimiTxts.map(r => Array.isArray(r) ? r.join("") : r).find(t => t.toLowerCase().startsWith("v=bimi1"));
    if (bimiTxt) {
      result.bimi = { value: bimiTxt, valid: true };
    }
  } catch (e) {}

  // Check common DKIM selectors
  for (const selector of ["google", "default", "mail", "k1"]) {
    try {
      const dkimTxts = await dnsResolve(`${selector}._domainkey.${domain}`, "TXT").catch(() => []);
      const dkimTxt = dkimTxts.map(r => Array.isArray(r) ? r.join("") : r).find(t => t.toLowerCase().startsWith("v=dkim1") || t.includes("p="));
      if (dkimTxt) {
        result.dkim = {
          value: dkimTxt,
          found: true
        };
        break;
      }
    } catch (e) {}
  }

  // Check DNSSEC via DNSKEY lookup
  try {
    const dnskeys = await dnsResolve(domain, "DNSKEY").catch(() => []);
    result.dnssec = dnskeys && dnskeys.length > 0;
  } catch (e) {}

  result.resolveTime = Date.now() - dnsStart;
  return result;
}
