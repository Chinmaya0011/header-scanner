/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

const nextConfig = {
  // Security: Remove X-Powered-By header
  poweredByHeader: false,

  // Enable React strict mode
  reactStrictMode: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
    dangerouslyAllowSVG: false,
    formats: ["image/webp", "image/avif"],
  },

  compress: true,

  // Simple security headers that won't break the scanner
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Basic security headers
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          // Simple CSP that allows API to work
          {
            key: "Content-Security-Policy",
            value: isDev 
              ? "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:3000 https:; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com;"
              : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https:; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com;",
          },
        ],
      },
      // API routes - no caching, relaxed CSP
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; connect-src 'self' https: http:;", // Allows external fetches
          },
        ],
      },
    ];
  },

  output: 'standalone',
};

// Validate environment variables
const validateEnv = () => {
  const required = ['MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    if (!isDev) {
      throw new Error(`Missing required env vars: ${missing.join(', ')}`);
    }
  }
};

validateEnv();

module.exports = nextConfig;