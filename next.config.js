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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          // HSTS - add this, was missing entirely
          ...(!isDev
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
          {
            key: "Content-Security-Policy",
            value: isDev
              ? [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                  "style-src 'self' 'unsafe-inline'",
                  "connect-src 'self' http://localhost:* https:",
                  "img-src 'self' data: https:",
                  "font-src 'self' data: https://fonts.gstatic.com",
                ].join("; ")
              : [
                  "default-src 'self'",
                  // Next.js needs 'unsafe-inline' for its runtime scripts in prod
                  // If you use next/script with nonces, you can remove this
                  "script-src 'self' 'unsafe-inline'",
                  "style-src 'self' 'unsafe-inline'",
                  "connect-src 'self' https:",
                  "img-src 'self' data: https: blob:",
                  "font-src 'self' data: https://fonts.gstatic.com",
                  "frame-ancestors 'none'",
                ].join("; "),
          },
        ],
      },

      // API routes
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; connect-src 'self' https: http:",
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