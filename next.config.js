// next.config.js
/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
    dangerouslyAllowSVG: false,
    formats: ["image/webp", "image/avif"],
  },

  compress: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options",          value: "DENY" },
          { key: "X-Content-Type-Options",   value: "nosniff" },
          { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy",   value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          {
            key: "Clear-Site-Data",
            value: '"cache", "cookies", "storage"',
          },
          ...(!isDev ? [{
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          }] : []),

          // DEV: permissive CSP so HMR/fast-refresh works
          // PROD: NO CSP here — middleware.js owns it with per-request nonce
          ...(isDev ? [{
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' http://localhost:* ws://localhost:* https:",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          }] : []),
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          // Relax CORP on API so cross-origin fetch calls work
          { key: "Cross-Origin-Resource-Policy", value: "same-site" },
        ],
      },
    ];
  },

  output: "standalone",
};

const validateEnv = () => {
  const required = ["MONGODB_URI"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`❌ Missing required env variables: ${missing.join(", ")}`);
    if (!isDev) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
};

validateEnv();

module.exports = nextConfig;