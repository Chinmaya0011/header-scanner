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
      // ─── Global headers (all routes) ────────────────────────────────────
      {
        source: "/:path*",
        headers: [
          // X-Frame-Options → validate: "DENY" = present ✓
          { key: "X-Frame-Options", value: "DENY" },

          // X-Content-Type-Options → validate: "nosniff" = present ✓
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Referrer-Policy → validate: in safePolicies list = present ✓
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Permissions-Policy → validate: contains =() = present ✓
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },

          // COOP → validate: "same-origin-allow-popups" = present ✓
          // (use allow-popups variant so OAuth popups still work)
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },

          // CORP → validate: "same-origin" = present ✓
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-origin",
          },

          // HSTS (prod only) → validate: max-age ≥ 31536000 = present ✓
          // Skip in dev — http://localhost won't accept it
          ...(!isDev
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),

          // CSP → validate: has unsafe-inline without nonce = weak (unavoidable in Next.js)
          // To reach "present": set up nonce-based CSP via middleware (see note below)
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
                  "script-src 'self' 'unsafe-inline'", // needed for Next.js hydration
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

      // ─── API routes ──────────────────────────────────────────────────────
      {
        source: "/api/:path*",
        headers: [
          // Cache-Control → validate: has "no-store" = present ✓
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          // Relax CORP on API routes so cross-origin fetch calls work
          {
            key: "Cross-Origin-Resource-Policy",
            value: "same-site",
          },
        ],
      },

      // ─── Logout endpoint ─────────────────────────────────────────────────
      // Clear-Site-Data → validate: has "cookies" or "storage" = present ✓
      // Your scanner hits this only on logout, which is correct behaviour
      {
        source: "/api/auth/logout",
        headers: [
          {
            key: "Clear-Site-Data",
            value: '"cache", "cookies", "storage"',
          },
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
    if (!isDev) {
      throw new Error(`Missing required env vars: ${missing.join(", ")}`);
    }
  }
};

validateEnv();

module.exports = nextConfig;