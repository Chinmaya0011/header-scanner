import whois from "whois-json";
import { getDomain } from "tldts";
import { extractDomain } from "../analyzer";

/**
 * Scan domain registry info using WHOIS or RDAP fallback.
 * @param {string} url - The target URL or domain.
 * @returns {Promise<object>} The normalized WHOIS details object.
 */
export async function scanWhois(url) {
  const hostname = extractDomain(url);
  const domain = getDomain(hostname) || hostname;
  if (!domain) {
    return {
      registrar: "Unknown",
      createdDate: null,
      expiryDate: null,
      updatedDate: null,
      domainAgeDays: null,
      daysToExpiry: null,
      nameServers: [],
      isRecent: false,
      isExpiringSoon: false,
    };
  }

  let whoisData = null;

  // 1. Try standard WHOIS (Port 43) first with a short timeout
  try {
    const whoisPromise = whois(domain);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("WHOIS timeout")), 2000)
    );
    whoisData = await Promise.race([whoisPromise, timeoutPromise]);
  } catch (err) {
    console.warn(`[WHOIS] Standard query failed/timed out for ${domain}: ${err.message}. Trying RDAP fallback...`);
  }

  // 2. Parse standard WHOIS data if successfully retrieved
  if (whoisData && Object.keys(whoisData).length > 0) {
    try {
      const createdStr = whoisData.creationDate || whoisData.created || whoisData.creationDateUtc || whoisData.registrationDate;
      const expiryStr = whoisData.registrarRegistrationExpirationDate || whoisData.expires || whoisData.registryExpiryDate || whoisData.expirationDate || whoisData.expirationDateUtc;
      const updatedStr = whoisData.updatedDate || whoisData.updated || whoisData.updatedDateUtc;

      const createdDate = createdStr ? new Date(createdStr) : null;
      const expiryDate = expiryStr ? new Date(expiryStr) : null;
      const updatedDate = updatedStr ? new Date(updatedStr) : null;

      const now = new Date();
      const domainAgeDays = createdDate && !isNaN(createdDate.getTime()) ? Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)) : null;
      const daysToExpiry = expiryDate && !isNaN(expiryDate.getTime()) ? Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;

      let nameServers = [];
      if (whoisData.nameServer) {
        if (Array.isArray(whoisData.nameServer)) {
          nameServers = whoisData.nameServer;
        } else {
          nameServers = whoisData.nameServer.split(/[\s,;]+/).filter(Boolean);
        }
      }

      return {
        registrar: whoisData.registrar || "Unknown",
        createdDate,
        expiryDate,
        updatedDate,
        domainAgeDays,
        daysToExpiry,
        nameServers: nameServers.map(ns => ns.toLowerCase()),
        isRecent: domainAgeDays !== null ? domainAgeDays < 30 : false,
        isExpiringSoon: daysToExpiry !== null ? daysToExpiry < 30 : false,
      };
    } catch (parseErr) {
      console.error("[WHOIS] Failed to parse standard WHOIS response:", parseErr);
    }
  }

  // 3. Try who-dat public hosted API (HTTPS Port 443)
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://who-dat.as93.net/${domain.toLowerCase()}`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/json",
        "User-Agent": "HeaderGuard-Scanner/2.0"
      }
    });
    clearTimeout(tid);

    if (res.status === 200) {
      const data = await res.json();
      
      const createdStr = data.dates?.created;
      const expiryStr = data.dates?.expires;
      const updatedStr = data.dates?.updated;

      const createdDate = createdStr ? new Date(createdStr) : null;
      const expiryDate = expiryStr ? new Date(expiryStr) : null;
      const updatedDate = updatedStr ? new Date(updatedStr) : null;

      const now = new Date();
      const domainAgeDays = createdDate && !isNaN(createdDate.getTime()) ? Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)) : null;
      const daysToExpiry = expiryDate && !isNaN(expiryDate.getTime()) ? Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;

      const nameServers = data.nameservers?.map(ns => ns.name.toLowerCase()) || [];

      return {
        registrar: data.registrar?.name || "Unknown",
        createdDate,
        expiryDate,
        updatedDate,
        domainAgeDays,
        daysToExpiry,
        nameServers,
        isRecent: domainAgeDays !== null ? domainAgeDays < 30 : false,
        isExpiringSoon: daysToExpiry !== null ? daysToExpiry < 30 : false,
      };
    }
  } catch (whodatErr) {
    console.warn(`[WHOIS] Public who-dat API query failed/timed out for ${domain}: ${whodatErr.message}. Trying direct RDAP fallback...`);
  }

  // 4. Fallback to direct RDAP API (HTTPS Port 443) if who-dat fails
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`https://rdap.org/domain/${domain.toLowerCase()}`, {
      signal: controller.signal,
      headers: {
        "Accept": "application/rdap+json, application/json",
      }
    });
    clearTimeout(tid);

    if (res.status === 200) {
      const data = await res.json();

      const registrationEvent = data.events?.find(e => e.eventAction === "registration");
      const expirationEvent = data.events?.find(e => e.eventAction === "expiration");
      const lastChangedEvent = data.events?.find(e => e.eventAction === "last changed");

      const createdDate = registrationEvent ? new Date(registrationEvent.eventDate) : null;
      const expiryDate = expirationEvent ? new Date(expirationEvent.eventDate) : null;
      const updatedDate = lastChangedEvent ? new Date(lastChangedEvent.eventDate) : null;

      const now = new Date();
      const domainAgeDays = createdDate && !isNaN(createdDate.getTime()) ? Math.floor((now - createdDate) / (1000 * 60 * 60 * 24)) : null;
      const daysToExpiry = expiryDate && !isNaN(expiryDate.getTime()) ? Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24)) : null;

      // Extract Registrar from entities
      const registrarEntity = data.entities?.find(e => e.roles?.includes("registrar"));
      const fnProp = registrarEntity?.vcardArray?.[1]?.find(prop => prop[0] === "fn");
      const registrar = fnProp?.[3] || registrarEntity?.handle || "Unknown";

      // Extract Nameservers
      const nameServers = data.nameservers?.map(ns => ns.ldhName.toLowerCase()) || [];

      return {
        registrar,
        createdDate,
        expiryDate,
        updatedDate,
        domainAgeDays,
        daysToExpiry,
        nameServers,
        isRecent: domainAgeDays !== null ? domainAgeDays < 30 : false,
        isExpiringSoon: daysToExpiry !== null ? daysToExpiry < 30 : false,
      };
    }
  } catch (rdapErr) {
    console.error(`[WHOIS] Direct RDAP fallback query failed for ${domain}:`, rdapErr.message);
  }

  // Final fallback structure
  return {
    registrar: "Unknown",
    createdDate: null,
    expiryDate: null,
    updatedDate: null,
    domainAgeDays: null,
    daysToExpiry: null,
    nameServers: [],
    isRecent: false,
    isExpiringSoon: false,
  };
}
