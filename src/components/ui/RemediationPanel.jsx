"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Info } from "lucide-react";
import { useToast } from "@/components/common/Toast";

export default function RemediationPanel({ scan }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("nginx");
  const [copied, setCopied] = useState(false);

  const domain = scan?.domain || "example.com";

  const snippets = {
    nginx: `# Nginx Security Header Hardening Configuration
# Paste inside server {} block in /etc/nginx/sites-available/default

add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header X-Permitted-Cross-Domain-Policies "none" always;

# Disable Server Version Banner
server_tokens off;`,

    apache: `# Apache Security Header Hardening Configuration
# Add to .htaccess or VirtualHost directive in /etc/apache2/sites-available/

<IfModule mod_headers.c>
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors 'self';"
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()"
  Header always set Cross-Origin-Opener-Policy "same-origin"
  Header always unset X-Powered-By
</IfModule>

ServerSignature Off
ServerTokens Prod`,

    vercel: `// vercel.json configuration
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        { "key": "X-Frame-Options", "value": "SAMEORIGIN" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; frame-ancestors 'self';" }
      ]
    }
  ]
}`,

    nextjs: `// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; frame-ancestors 'self';" }
        ],
      },
    ];
  },
};`,

    cloudflare: `# Cloudflare Transform Rules (HTTP Response Header Modification)
# Rules -> Transform Rules -> Modify Response Header

Rule 1: Set Strict-Transport-Security = max-age=31536000; includeSubDomains; preload
Rule 2: Set X-Frame-Options = SAMEORIGIN
Rule 3: Set X-Content-Type-Options = nosniff
Rule 4: Set Referrer-Policy = strict-origin-when-cross-origin
Rule 5: Set Permissions-Policy = camera=(), microphone=(), geolocation=()
Rule 6: Set Content-Security-Policy = default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; frame-ancestors 'self';`
  };

  const handleCopy = () => {
    const textToCopy = snippets[activeTab];
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast?.success?.(`${activeTab.toUpperCase()} config copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs = [
    { id: "nginx", label: "Nginx" },
    { id: "apache", label: "Apache" },
    { id: "vercel", label: "Vercel" },
    { id: "nextjs", label: "Next.js" },
    { id: "cloudflare", label: "Cloudflare" },
  ];

  return (
    <div className="glass-card p-4 space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="inline-flex flex-row items-center gap-2">
            <Terminal className="w-4 h-4 text-accent shrink-0" />
            <h3 className="font-bold text-xs text-text uppercase tracking-wider whitespace-nowrap">
              Automated Remediation & Config Snippets
            </h3>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Production-ready hardening directives tailored for {domain}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="inline-flex flex-row items-center gap-1 bg-panel border border-border p-1 rounded font-mono text-xs shrink-0 whitespace-nowrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1 rounded transition-colors ${
                activeTab === tab.id
                  ? "bg-accent text-white font-bold"
                  : "text-text-dim hover:text-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Block Container */}
      <div className="rounded border border-border bg-panel overflow-hidden font-mono">
        <div className="flex flex-row items-center justify-between px-3 py-1.5 bg-surface border-b border-border select-none text-xs">
          <span className="text-text-muted whitespace-nowrap">{activeTab}-security-headers.conf</span>
          <button
            onClick={handleCopy}
            className="inline-flex flex-row items-center gap-1 text-accent hover:underline font-bold shrink-0 whitespace-nowrap"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
            <span>{copied ? "Copied" : "Copy Code"}</span>
          </button>
        </div>

        <pre className="p-3 text-xs text-text-dim overflow-x-auto select-all leading-relaxed max-h-80">
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>

      <div className="inline-flex flex-row items-center gap-1.5 text-[11px] text-text-muted font-mono whitespace-nowrap">
        <Info className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>Tip: Always validate headers in staging before deploying config changes to production.</span>
      </div>
    </div>
  );
}
