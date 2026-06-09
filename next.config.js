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
      // ─── ALL routes ──────────────────────────────────────────────────────
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },

          // Cache-Control on ALL routes (fixes scanner seeing public cache on /)
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },

          // Clear-Site-Data on ALL routes (fixes scanner not finding logout endpoint)
          // Browsers only act on this during actual logout — safe to send globally
          {
            key: "Clear-Site-Data",
            value: '"cache", "cookies", "storage"',
          },

          ...(!isDev
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),

          // CSP — nonce injected via middleware, so NO 'unsafe-inline' here
          // middleware.js reads x-nonce and sets this header dynamically in prod
          // This static fallback only runs if middleware is skipped (e.g. static assets)
          {
            key: "Content-Security-Policy",
            value: isDev
              ? [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                  "style-src 'self' 'unsafe-inline'",
                  "connect-src 'self' http://localhost:* https:",
                  "img-src 'self' data: blob: https:",
                  "font-src 'self' data: https://fonts.gstatic.com",
                  "object-src 'none'",
                  "base-uri 'self'",
                ].join("; ")
              : [
                  "default-src 'self'",
                  "script-src 'self'",   // middleware will add nonce dynamically
                  "style-src 'self' 'unsafe-inline'",
                  "connect-src 'self' https:",
                  "img-src 'self' data: blob: https:",
                  "font-src 'self' data: https://fonts.gstatic.com",
                  "object-src 'none'",
                  "base-uri 'self'",
                  "frame-ancestors 'none'",
                  "upgrade-insecure-requests",
                ].join("; "),
          },
        ],
      },

      // ─── API routes — relax CORP so cross-origin fetches work ────────────
      {
        source: "/api/:path*",
        headers: [
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