"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code, Server, Zap, Info } from "lucide-react";
import { useToast } from "@/components/common/Toast";

export default function RemediationPanel({ scan }) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("nginx");
  const [copied, setCopied] = useState(false);

  const domain = scan?.domain || "example.com";

  // Generate server config code snippets based on findings
  const snippets = {
    nginx: `# Nginx Security Header Hardening Configuration
# Paste inside your server {} block in /etc/nginx/sites-available/default

add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'self';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=(), payment=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
add_header Cross-Origin-Resource-Policy "same-origin" always;
add_header X-Permitted-Cross-Domain-Policies "none" always;

# Hide Nginx server version banner
server_tokens off;`,

    apache: `# Apache Security Header Hardening Configuration
# Add to your .htaccess or VirtualHost directive in /etc/apache2/sites-available/

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

# Disable Server Signature
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
        { "key": "Content-Security-Policy", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors 'self';" }
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
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors 'self';" }
        ],
      },
    ];
  },
};`,

    cloudflare: `# Cloudflare Transform Rules (HTTP Response Header Modification)
# Configure via Cloudflare Dashboard -> Rules -> Transform Rules -> Modify Response Header

Rule 1: Set Strict-Transport-Security = max-age=31536000; includeSubDomains; preload
Rule 2: Set X-Frame-Options = SAMEORIGIN
Rule 3: Set X-Content-Type-Options = nosniff
Rule 4: Set Referrer-Policy = strict-origin-when-cross-origin
Rule 5: Set Permissions-Policy = camera=(), microphone=(), geolocation=()
Rule 6: Set Content-Security-Policy = default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data: https:; frame-ancestors 'self';`
  };

  const handleCopy = () => {
    const textToCopy = snippets[activeTab];
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    toast?.success?.(`${activeTab.toUpperCase()} configuration copied to clipboard!`) || alert(`${activeTab.toUpperCase()} config copied!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const tabs = [
    { id: "nginx", label: "Nginx" },
    { id: "apache", label: "Apache" },
    { id: "vercel", label: "Vercel" },
    { id: "nextjs", label: "Next.js" },
    { id: "cloudflare", label: "Cloudflare" },
  ];

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-xs text-text uppercase tracking-wider">
              Automated Remediation & Configuration Snippets
            </h3>
          </div>
          <p className="text-xs text-text-dim mt-0.5">
            Copy and apply production-ready security headers tailored for {domain}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-panel/60 p-1 rounded-xl overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 shrink-0 ${
                activeTab === tab.id
                  ? "bg-accent text-white shadow-glow"
                  : "text-text-dim hover:text-text hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Code Block Container */}
      <div className="relative rounded-xl overflow-hidden border border-border/80 bg-[#030a08]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-panel/60 border-b border-border/60 select-none">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-danger/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-warning/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-success/70" />
            <span className="font-mono text-[11px] text-text-muted ml-2">{activeTab}-security-headers.conf</span>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg text-xs font-mono font-bold text-accent transition-all duration-200"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Content */}
        <pre className="p-4 text-xs font-mono text-text-dim overflow-x-auto leading-relaxed max-h-80 select-all">
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>

      <div className="flex items-center gap-2 mt-3 text-[11px] text-text-muted">
        <Info className="w-3.5 h-3.5 text-accent shrink-0" />
        <span>Tip: Always test header configuration in staging before applying to production servers.</span>
      </div>
    </div>
  );
}
