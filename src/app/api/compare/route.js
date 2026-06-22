import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Scan from "@/lib/models/Scan";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id1 = searchParams.get("id1");
    const id2 = searchParams.get("id2");

    if (!id1 || !id2) {
      return NextResponse.json({ error: "Two scan IDs (id1 and id2) are required for comparison." }, { status: 400 });
    }

    await connectDB();

    const [scan1, scan2] = await Promise.all([
      Scan.findById(id1).lean(),
      Scan.findById(id2).lean()
    ]);

    if (!scan1 || !scan2) {
      return NextResponse.json({ error: "One or both scans could not be found." }, { status: 404 });
    }

    // Access check (admin can access all; user can access owned)
    const isAdmin = user.role === "admin";
    const ownsScan1 = scan1.owner && scan1.owner.toString() === user._id.toString();
    const ownsScan2 = scan2.owner && scan2.owner.toString() === user._id.toString();

    if (!isAdmin && (!ownsScan1 || !ownsScan2)) {
      return NextResponse.json({ error: "Forbidden. You do not own these scans." }, { status: 403 });
    }

    // Generate comparison diff
    const diff = {
      meta: {
        domain1: scan1.domain,
        domain2: scan2.domain,
        date1: scan1.createdAt,
        date2: scan2.createdAt,
      },
      score: {
        val1: scan1.score,
        val2: scan2.score,
        change: scan2.score - scan1.score,
      },
      grade: {
        val1: scan1.grade,
        val2: scan2.grade,
      },
      headers: getHeadersDiff(scan1.headers, scan2.headers),
      ssl: getSslDiff(scan1.ssl, scan2.ssl),
      dns: getDnsDiff(scan1.dns, scan2.dns),
      cookies: getCookiesDiff(scan1.cookies, scan2.cookies),
      vulnerabilities: getVulnerabilitiesDiff(scan1.vulnerabilities, scan2.vulnerabilities),
    };

    return NextResponse.json({ success: true, diff });
  } catch (error) {
    console.error("Comparison error:", error);
    return NextResponse.json({ error: "Failed to compare scans." }, { status: 500 });
  }
}

function getHeadersDiff(h1 = [], h2 = []) {
  const map1 = new Map(h1.map(h => [h.name.toLowerCase(), h.value]));
  const map2 = new Map(h2.map(h => [h.name.toLowerCase(), h.value]));
  const allNames = new Set([...map1.keys(), ...map2.keys()]);
  const changes = [];

  allNames.forEach(name => {
    const val1 = map1.get(name);
    const val2 = map2.get(name);
    if (val1 !== val2) {
      changes.push({
        name,
        val1: val1 || "Missing",
        val2: val2 || "Missing",
        status: !val1 ? "added" : !val2 ? "removed" : "modified"
      });
    }
  });

  return changes.sort((a, b) => a.name.localeCompare(b.name));
}

function getSslDiff(s1, s2) {
  if (!s1 || !s2) return { changed: true, details: "SSL data missing in one of the scans" };
  const changes = [];
  if (s1.valid !== s2.valid) {
    changes.push({ parameter: "Validity", val1: s1.valid ? "Valid" : "Invalid", val2: s2.valid ? "Valid" : "Invalid" });
  }
  if (s1.tlsVersion !== s2.tlsVersion) {
    changes.push({ parameter: "TLS Version", val1: s1.tlsVersion, val2: s2.tlsVersion });
  }
  if (s1.issuer !== s2.issuer) {
    changes.push({ parameter: "Issuer", val1: s1.issuer, val2: s2.issuer });
  }
  return { changed: changes.length > 0, changes };
}

function getDnsDiff(d1, d2) {
  if (!d1 || !d2) return { changed: true, details: "DNS records missing in one of the scans" };
  const changes = [];
  if (d1.spf?.value !== d2.spf?.value) {
    changes.push({ record: "SPF", val1: d1.spf?.value || "None", val2: d2.spf?.value || "None" });
  }
  if (d1.dmarc?.value !== d2.dmarc?.value) {
    changes.push({ record: "DMARC", val1: d1.dmarc?.value || "None", val2: d2.dmarc?.value || "None" });
  }
  if (d1.dnssec !== d2.dnssec) {
    changes.push({ record: "DNSSEC", val1: d1.dnssec ? "Enabled" : "Disabled", val2: d2.dnssec ? "Enabled" : "Disabled" });
  }
  return { changed: changes.length > 0, changes };
}

function getCookiesDiff(c1 = [], c2 = []) {
  const map1 = new Map(c1.map(c => [c.name, c]));
  const map2 = new Map(c2.map(c => [c.name, c]));
  const allNames = new Set([...map1.keys(), ...map2.keys()]);
  const changes = [];

  allNames.forEach(name => {
    const cook1 = map1.get(name);
    const cook2 = map2.get(name);
    if (!cook1) {
      changes.push({ name, status: "added" });
    } else if (!cook2) {
      changes.push({ name, status: "removed" });
    } else {
      const parts = [];
      if (cook1.secure !== cook2.secure) parts.push(`Secure (${cook1.secure} -> ${cook2.secure})`);
      if (cook1.httpOnly !== cook2.httpOnly) parts.push(`HttpOnly (${cook1.httpOnly} -> ${cook2.httpOnly})`);
      if (cook1.sameSite !== cook2.sameSite) parts.push(`SameSite (${cook1.sameSite} -> ${cook2.sameSite})`);
      if (parts.length > 0) {
        changes.push({ name, status: "modified", details: parts.join(", ") });
      }
    }
  });

  return changes.sort((a, b) => a.name.localeCompare(b.name));
}

function getVulnerabilitiesDiff(v1 = [], v2 = []) {
  const map1 = new Map(v1.map(v => [v.id, v.name]));
  const map2 = new Map(v2.map(v => [v.id, v.name]));
  const allIds = new Set([...map1.keys(), ...map2.keys()]);
  const changes = [];

  allIds.forEach(id => {
    const present1 = map1.has(id);
    const present2 = map2.has(id);
    if (present1 && !present2) {
      changes.push({ name: map1.get(id), status: "resolved" });
    } else if (!present1 && present2) {
      changes.push({ name: map2.get(id), status: "introduced" });
    }
  });

  return changes.sort((a, b) => a.name.localeCompare(b.name));
}
