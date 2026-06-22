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

export async function scanInfraAndTech(url, dnsResults, headersObj) {
  const infra = {
    cdn: "None",
    waf: "None",
    reverseProxy: "Unknown",
    hosting: "Unknown",
    asn: "Unknown",
    isp: "Unknown",
    country: "Unknown",
    region: "Unknown",
  };

  const techStack = [];

  // IP Geolocation Lookup
  const ip = dnsResults.a && dnsResults.a[0];
  if (ip) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      
      const geoRes = await fetch(`http://ip-api.com/json/${ip}`, { signal: controller.signal })
        .then(r => r.json())
        .catch(() => null);
        
      clearTimeout(timeoutId);

      if (geoRes && geoRes.status === "success") {
        infra.asn = geoRes.as || "Unknown";
        infra.isp = geoRes.isp || "Unknown";
        infra.country = geoRes.country || "Unknown";
        infra.region = geoRes.regionName || "Unknown";
      }
    } catch (e) {
      // Silent catch
    }
  }

  // Header matching CDN, Hosting and Proxies
  const headers = {};
  Object.keys(headersObj).forEach(k => {
    headers[k.toLowerCase()] = headersObj[k];
  });

  if (headers["cf-ray"] || headers["server"] === "cloudflare") {
    infra.cdn = "Cloudflare";
    infra.waf = "Cloudflare WAF";
    infra.reverseProxy = "Cloudflare Edge";
    infra.hosting = "Cloudflare Network";
    techStack.push({ name: "Cloudflare", category: "Services", version: "" });
  } else if (headers["x-fastly-request-id"] || headers["server"] === "fastly") {
    infra.cdn = "Fastly";
    infra.reverseProxy = "Fastly Cache";
  } else if (headers["via"]?.includes("cloudfront") || headers["server"] === "cloudfront") {
    infra.cdn = "Amazon CloudFront";
    infra.reverseProxy = "CloudFront CDN";
    infra.hosting = "AWS S3/EC2 CDN";
  } else if (headers["x-vercel-id"]) {
    infra.hosting = "Vercel Serverless";
    infra.reverseProxy = "Vercel Router";
    techStack.push({ name: "Vercel", category: "Services", version: "" });
  } else if (headers["x-netlify-id"]) {
    infra.hosting = "Netlify Hosting";
    infra.reverseProxy = "Netlify Edge";
    techStack.push({ name: "Netlify", category: "Services", version: "" });
  } else if (headers["server"]?.includes("Netlify")) {
    infra.hosting = "Netlify";
  }

  // Web Servers fingerprinting
  const server = headers["server"] || "";
  const poweredBy = headers["x-powered-by"] || "";

  if (server.toLowerCase().includes("nginx")) {
    infra.reverseProxy = "Nginx Router";
    const match = server.match(/nginx\/([\d.]+)/i);
    techStack.push({ name: "Nginx", category: "Web Server", version: match ? match[1] : "" });
  } else if (server.toLowerCase().includes("apache")) {
    infra.reverseProxy = "Apache HTTPD";
    const match = server.match(/apache\/([\d.]+)/i);
    techStack.push({ name: "Apache", category: "Web Server", version: match ? match[1] : "" });
  } else if (server.toLowerCase().includes("microsoft-iis")) {
    infra.reverseProxy = "IIS Server";
    const match = server.match(/microsoft-iis\/([\d.]+)/i);
    techStack.push({ name: "Microsoft IIS", category: "Web Server", version: match ? match[1] : "" });
  }

  // Frameworks
  if (poweredBy.toLowerCase().includes("express") || headers["x-powered-by"] === "Express") {
    techStack.push({ name: "Express", category: "Backend", version: "" });
  }
  if (headers["x-nextjs-cache"] || poweredBy.toLowerCase().includes("next.js")) {
    techStack.push({ name: "Next.js", category: "Frontend Framework", version: "" });
    techStack.push({ name: "React", category: "Frontend Library", version: "" });
  }
  if (poweredBy.toLowerCase().includes("asp.net") || headers["x-aspnet-version"]) {
    techStack.push({ name: "ASP.NET", category: "Backend Framework", version: "" });
  }
  if (poweredBy.toLowerCase().includes("php")) {
    const match = poweredBy.match(/php\/([\d.]+)/i);
    techStack.push({ name: "PHP", category: "Backend Programming Language", version: match ? match[1] : "" });
  }

  // Set-Cookie check for backend technologies
  const setCookie = headers["set-cookie"] || "";
  const setCookieStr = Array.isArray(setCookie) ? setCookie.join(";") : setCookie;
  if (setCookieStr.includes("PHPSESSID")) {
    techStack.push({ name: "PHP Backend Engine", category: "Backend", version: "" });
  }
  if (setCookieStr.includes("csrftoken") && (setCookieStr.includes("sessionid") || server.toLowerCase().includes("gunicorn"))) {
    techStack.push({ name: "Django", category: "Backend Framework", version: "" });
  }
  if (setCookieStr.includes("laravel_session") || setCookieStr.includes("XSRF-TOKEN")) {
    techStack.push({ name: "Laravel", category: "Backend Framework", version: "" });
  }

  // Check site page contents for framework signals
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const htmlText = await fetch(url, {
      method: "GET",
      headers: { "User-Agent": "HeaderGuard-Scanner/2.0" },
      signal: controller.signal
    }).then(r => r.text()).catch(() => "");
    
    clearTimeout(timeoutId);

    if (htmlText) {
      if (htmlText.includes("wp-content") || htmlText.includes("wp-includes")) {
        techStack.push({ name: "WordPress", category: "CMS", version: "" });
      }
      if (htmlText.includes("react") || htmlText.includes("data-reactroot")) {
        techStack.push({ name: "React", category: "Frontend Library", version: "" });
      }
      if (htmlText.includes("next/static") || htmlText.includes("__NEXT_DATA__")) {
        techStack.push({ name: "Next.js", category: "Frontend Framework", version: "" });
      }
      if (htmlText.includes("vue") || htmlText.includes("v-data-app")) {
        techStack.push({ name: "Vue.js", category: "Frontend Framework", version: "" });
      }
      if (htmlText.includes("angular") || htmlText.includes("ng-version")) {
        techStack.push({ name: "Angular", category: "Frontend Framework", version: "" });
      }
      if (htmlText.includes("jquery")) {
        techStack.push({ name: "jQuery", category: "Frontend Library", version: "" });
      }
      if (htmlText.includes("bootstrap")) {
        techStack.push({ name: "Bootstrap CSS", category: "CSS Framework", version: "" });
      }
      if (htmlText.includes("tailwind")) {
        techStack.push({ name: "Tailwind CSS", category: "CSS Framework", version: "" });
      }
      if (htmlText.includes("google-analytics") || htmlText.includes("googletagmanager.com/gtm")) {
        techStack.push({ name: "Google Analytics", category: "Services", version: "" });
      }
      if (htmlText.includes("stripe")) {
        techStack.push({ name: "Stripe", category: "Services", version: "" });
      }
      if (htmlText.includes("hotjar")) {
        techStack.push({ name: "Hotjar", category: "Services", version: "" });
      }
    }
  } catch (e) {
    // Best-effort
  }

  // Deduplicate items
  const uniqueTech = [];
  const namesSeen = new Set();
  for (const t of techStack) {
    if (!namesSeen.has(t.name)) {
      namesSeen.add(t.name);
      uniqueTech.push(t);
    }
  }

  return { infra, techStack: uniqueTech };
}
