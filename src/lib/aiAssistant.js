export function generateAIAdvice(scanData) {
  const adviceList = [];

  const addAdvice = (key, checkTitle, severity, description, impact, risk, example, remediation, bestPractice, fixes) => {
    adviceList.push({
      key,
      title: checkTitle,
      severity,
      description,
      businessImpact: impact,
      exploitationRisk: risk,
      realWorldExample: example,
      remediationSteps: remediation,
      bestPractices: bestPractice,
      fixes: fixes || {
        nextjs: "// Configure in next.config.js headers wrapper",
        react: "// Implement security safeguards or meta tags where appropriate",
        express: "// Use helmet middleware for easy header settings",
        nginx: "# Add add_header directive in server block",
        apache: "# Use Header always set directive",
        cloudflare: "# Modify response headers under transform rules"
      }
    });
  };

  // 1. Content Security Policy
  const cspCheck = scanData.checks?.find(c => c.id === "check-csp-policy" && c.status !== "passed");
  if (cspCheck || (scanData.headers && !scanData.headers.find(h => h.name === "Content-Security-Policy" && h.status === "present"))) {
    addAdvice(
      "csp",
      "Content Security Policy Weaknesses",
      "critical",
      "Content Security Policy (CSP) restricts resource loads to allowlisted sources. Weak configurations, including unsafe-inline/eval directives or wildcards, let attackers bypass XSS defenses.",
      "XSS can lead to session theft, redirecting users to phishing sites, or stealing customer credentials.",
      "An attacker injects a script into the page that steals cookies and transmits them to an external server.",
      "British Airways (2018): Attackers injected Magecart scripts to steal payment cards of 380,000 customers due to lack of strict script integrity checks.",
      "1. Remove 'unsafe-inline' and 'unsafe-eval' from script directives.\n2. Implement Cryptographic Nonces/Hashes for scripts.\n3. Restrict object-src to 'none'.",
      "Adopt a strict CSP starting with default-src 'self' and build out permissions incrementally.",
      {
        nextjs: `// next.config.js\nconst cspHeader = "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';";\nmodule.exports = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [{ key: 'Content-Security-Policy', value: cspHeader.replace(/\\s{2,}/g, ' ') }]\n      }\n    ];\n  }\n}`,
        react: `<!-- public/index.html -->\n<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; object-src 'none';">`,
        express: `import helmet from 'helmet';\napp.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: ["'self'"],\n    scriptSrc: ["'self'"],\n    objectSrc: ["'none'"],\n    frameAncestors: ["'none'"]\n  }\n}));`,
        nginx: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';" always;`,
        apache: `Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';"`,
        cloudflare: `Transform Rules -> Modify Response Header:\nName: Content-Security-Policy\nValue: default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none';`
      }
    );
  }

  // 2. Cookie Security
  const cookieCheck = scanData.checks?.find(c => c.id === "check-cookie-security" && c.status !== "passed");
  const hasCookies = scanData.cookies && scanData.cookies.length > 0;
  const insecureCookies = scanData.cookies?.filter(c => !c.secure || !c.httpOnly);
  if (cookieCheck || (hasCookies && insecureCookies && insecureCookies.length > 0)) {
    addAdvice(
      "cookie",
      "Insecure Session Cookie Flags",
      "high",
      "Cookies set without HttpOnly, Secure, and SameSite attributes can be intercepted in transit, stolen via client-side scripts (XSS), or leveraged for Cross-Site Request Forgery (CSRF).",
      "Session hijack can allow unauthorized actions in user accounts, resulting in data modification or theft.",
      "An attacker uses XSS to read document.cookie and retrieve the user session token.",
      "Equifax (2017) breach exposed sensitive customer data because session IDs were vulnerable to hijacking and cross-site scripting bypasses.",
      "1. Set 'HttpOnly' flag so client scripts cannot read session cookies.\n2. Set 'Secure' flag so cookies are only transmitted over TLS.\n3. Apply SameSite=Lax or SameSite=Strict to defend against CSRF.",
      "Use double-submit cookies or anti-CSRF tokens alongside SameSite=Lax flags.",
      {
        nextjs: `// Next.js Server Action cookie setter\ncookies().set('session', token, {\n  httpOnly: true,\n  secure: true,\n  sameSite: 'lax',\n  path: '/'\n});`,
        react: `// React should read cookies solely from HTTP headers, not client-side scripts. Avoid document.cookie.`,
        express: `app.use(session({\n  secret: 'secure-secret',\n  cookie: { httpOnly: true, secure: true, sameSite: 'lax' }\n}));`,
        nginx: `# Add cookie parameters inside application backend. Nginx proxy bypass example:\nproxy_cookie_path / "/; HttpOnly; Secure; SameSite=Lax";`,
        apache: `# Rewrite cookie attributes using mod_headers:\nHeader edit Set-Cookie ^(.*)$ "$1; HttpOnly; Secure; SameSite=Lax"`,
        cloudflare: `// Cloudflare Worker modifying Response headers:\nlet response = await fetch(request);\nlet cookie = response.headers.get("Set-Cookie");\nif (cookie) {\n  response.headers.set("Set-Cookie", cookie + "; Secure; HttpOnly; SameSite=Lax");\n}`
      }
    );
  }

  // 3. SSL/TLS Certificate Check
  if (scanData.ssl && (!scanData.ssl.valid || scanData.ssl.daysRemaining < 15)) {
    addAdvice(
      "ssl",
      "Invalid or Expiring TLS Certificate",
      "high",
      "An invalid, expired, or self-signed SSL/TLS certificate prevents browsers from establishing a trusted encrypted channel with the website.",
      "Users see severe security warnings, driving away traffic and leaving transit open to active interception.",
      "An attacker in a coffee shop intercepts traffic using an ARP spoofing tool (Man-in-the-Middle).",
      "Superfish (2015): Adware pre-installed on Lenovo laptops injected self-signed root certs, enabling decryption of users' banking connections.",
      "1. Renew certificate immediately with Let's Encrypt or another certificate authority.\n2. Configure automatic renewal cron jobs.",
      "Set reminders for certificate expiry dates and employ automated validation checkers (like ACME).",
      {
        nextjs: `// Managed by hosting environment (Vercel, AWS). No code changes required.`,
        react: `// Handled by web host or CDN gateway.`,
        express: `// Load certificate in server options:\nhttps.createServer({\n  key: fs.readFileSync('key.pem'),\n  cert: fs.readFileSync('cert.pem')\n}, app);`,
        nginx: `ssl_certificate /path/to/fullchain.pem;\nssl_certificate_key /path/to/privkey.pem;\nssl_protocols TLSv1.2 TLSv1.3;\nssl_ciphers HIGH:!aNULL:!MD5;`,
        apache: `SSLEngine on\nSSLCertificateFile "/path/to/cert.pem"\nSSLCertificateKeyFile "/path/to/key.pem"`,
        cloudflare: `Go to SSL/TLS and switch configuration mode to Full (Strict). Enable Always Use HTTPS.`
      }
    );
  }

  // 4. DNS Records SPF/DMARC
  const hasDns = scanData.dns;
  const badSpf = hasDns && !scanData.dns.spf.valid;
  const badDmarc = hasDns && !scanData.dns.dmarc.valid;
  if (badSpf || badDmarc) {
    addAdvice(
      "dns-email",
      "Missing or Weak Email Security Records (SPF/DMARC)",
      "medium",
      "Missing or weak SPF/DMARC records allow attackers to spoof the company's domain names, sending phishing emails that appear authentic to clients.",
      "Brand damage, client trust loss, and domain blacklisting by major email providers.",
      "An attacker sends spoofed billing emails from support@company.com to customers, demanding direct wire transfers.",
      "Phishing attacks leveraging domain spoofing accounts for over $1.8B in corporate business email compromise losses annually (FBI IC3).",
      "1. Add an SPF TXT record: v=spf1 include:_spf.google.com ~all.\n2. Add a DMARC TXT record under _dmarc: v=DMARC1; p=reject;.",
      "Transition DMARC gradually from p=none (monitoring) to p=quarantine, and finally p=reject.",
      {
        nextjs: `// No application code changes needed. Add records to DNS provider.`,
        react: `// No frontend changes. Managed in DNS console.`,
        express: `// No backend modifications. Configure in registrar dns control.`,
        nginx: `# Not applicable to web servers. Add to registrar DNS zone.`,
        apache: `# Not applicable. Add TXT records to DNS settings.`,
        cloudflare: `Go to DNS > Records > Add Record:\n- Type: TXT, Name: @, Value: v=spf1 include:_spf.mx.cloudflare.net ~all\n- Type: TXT, Name: _dmarc, Value: v=DMARC1; p=reject;`
      }
    );
  }

  // 5. Exposed sensitive files
  const exposedFiles = scanData.sensitiveFiles?.filter(f => f.exists);
  if (exposedFiles && exposedFiles.length > 0) {
    addAdvice(
      "exposure",
      "Exposed Sensitive Files (Environment / Git Repository)",
      "critical",
      "Sensitive files like /.env or /.git expose credentials, API keys, database connection strings, and the site's complete source code to public downloads.",
      "Attackers gain full control of database servers, access customer credentials, and leverage credentials for cloud resource hijack.",
      "An attacker crawls /.env, extracts MONGODB_URI and AWS_ACCESS_KEY_ID, then accesses the client records directly.",
      "Codecov (2021): Attackers modified upload tools and crawled credentials from customer CI/CD environments, exposing codebases.",
      "1. Add /.env and /.git/ block rules to the web server configuration.\n2. Ensure credentials are deleted and rotated immediately if exposed.",
      "Never store credentials or sensitive configs directly in public web root directories.",
      {
        nextjs: `// Ensure .env files are in the .gitignore. Do not push them to GitHub.`,
        react: `// Never store private API keys in client-side React variables. They are compiled to public JS.`,
        express: `// Serve only static public assets. Ensure backend files are structured outside the public/ directory.`,
        nginx: `location ~ /\\.(env|git) {\n    deny all;\n    return 404;\n}`,
        apache: `RedirectMatch 404 /\\.(env|git)`,
        cloudflare: `Create a WAF Block Rule:\n- Expression: (http.request.uri.path contains "/.env") or (http.request.uri.path contains "/.git")\n- Action: Block`
      }
    );
  }

  // 6. Server banners
  const bannerCheck = scanData.checks?.find(c => c.id === "check-server-disclosure" && c.status !== "passed");
  if (bannerCheck) {
    addAdvice(
      "banners",
      "Verbose Server Stack Disclosures",
      "low",
      "The Server and X-Powered-By response headers disclose software, runtime versions, and operating systems in use.",
      "Makes path footprinting easy for attackers searching for unpatched zero-day vulnerabilities.",
      "An attacker identifies 'Server: Apache/2.4.18 (Ubuntu)' and runs exploit CVE-2016-5387 target matching.",
      "Vulnerability scanners automatically query web endpoints for versions to match against known CVE lists for targeted exploit scripts.",
      "1. Turn off server signature banners in configuration files.\n2. Disable X-Powered-By header tags in the web app settings.",
      "Implement a hardening checklist on all backend proxies and servers before deploying to production.",
      {
        nextjs: `// next.config.js\nmodule.exports = {\n  poweredByHeader: false,\n};`,
        react: `// Not applicable to frontend single page apps.`,
        express: `const express = require('express');\nconst app = express();\napp.disable('x-powered-by');`,
        nginx: `server_tokens off;`,
        apache: `ServerTokens ProductOnly\nServerSignature Off`,
        cloudflare: `Disable the 'Server' header mirroring in your Cloudflare dashboard edge rules.`
      }
    );
  }

  if (adviceList.length === 0) {
    addAdvice(
      "clean",
      "General Security Recommendations",
      "info",
      "No critical EASM security issues were identified during this scan session.",
      "Maintain active monitoring to prevent regressions during future deployments.",
      "No immediate threat profiles detected.",
      "Standard threat operations audits.",
      "1. Regularly review security headers during software releases.\n2. Update TLS certificates before expiration.",
      "Leverage CI/CD security validation to prevent introducing posture risks.",
      {
        nextjs: `// Maintain secure-by-default next.config.js headers configuration.`,
        react: `// Keep dependencies updated.`,
        express: `app.use(helmet());`,
        nginx: `# Keep server configurations up to date.`,
        apache: `# Maintain security configs.`,
        cloudflare: `# Enable automatic HSTS and WAF services.`
      }
    );
  }

  return adviceList;
}
