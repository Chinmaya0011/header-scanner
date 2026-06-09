/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// Get allowed origins for development
const devOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ? process.env.NEXT_ALLOWED_DEV_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [];

const nextConfig = {
  // Security: Remove X-Powered-By header
  poweredByHeader: false,

  // Security: Configure allowed dev origins
  allowedDevOrigins: devOrigins,

  // Enable React strict mode for development checks
  reactStrictMode: true,

  // Image optimization configuration
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
    // Security: Disable SVG with potential XSS risks
    dangerouslyAllowSVG: false,
    // Optimize images
    formats: ["image/webp", "image/avif"],
  },

  // Compress responses
  compress: true,

  // Security headers configuration
  async headers() {
    // For HeaderGuard, we only need the app's own origin for connect-src
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.NEXT_PUBLIC_FRONTEND_URL || 
                   (isDev ? "http://localhost:3000" : null);
    
    const allowedOrigins = new Set([
      "'self'",
      ...(appUrl ? [appUrl] : []),
      ...devOrigins,
    ]);

    // Different CSP for frontend vs API routes
    // Frontend CSP (strict)
    const frontendCSPDirectives = {
      'default-src': ["'self'"],
      'script-src': isDev 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        : ["'self'", "'strict-dynamic'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'style-src-elem': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "blob:", "https://avatars.githubusercontent.com", "https://lh3.googleusercontent.com"],
      'font-src': ["'self'", "data:", "https://fonts.gstatic.com"],
      'connect-src': ["'self'", ...allowedOrigins], // Only connect to self and allowed origins
      'frame-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'media-src': ["'self'"],
      'manifest-src': ["'self'"],
      'worker-src': ["'self'", "blob:"],
      'upgrade-insecure-requests': [],
      'block-all-mixed-content': [],
    };

    // API CSP (permissive for external fetches)
    const apiCSPDirectives = {
      'default-src': ["'self'"],
      'script-src': isDev 
        ? ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
        : ["'self'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:"],
      'font-src': ["'self'", "data:"],
      'connect-src': ["'self'", "https:", "http:"], // CRITICAL: Allow API to fetch external URLs
      'frame-src': ["'none'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'upgrade-insecure-requests': [],
    };

    // Build CSP strings
    const buildCSPString = (directives) => {
      return Object.entries(directives)
        .filter(([_, values]) => values.length > 0)
        .map(([directive, values]) => `${directive} ${values.join(" ")}`)
        .join("; ");
    };

    const frontendCSP = buildCSPString(frontendCSPDirectives);
    const apiCSP = buildCSPString(apiCSPDirectives);

    // Security headers for frontend
    const securityHeaders = [
      // HSTS - Force HTTPS
      {
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      },
      // XSS Protection
      {
        key: "X-XSS-Protection",
        value: "1; mode=block",
      },
      // Prevent MIME type sniffing
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      // Frame options - Prevent clickjacking
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      // DNS prefetch control
      {
        key: "X-DNS-Prefetch-Control",
        value: "off",
      },
      // Referrer policy
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      // Permissions policy - Restrict sensitive features
      {
        key: "Permissions-Policy",
        value: [
          "accelerometer=()",
          "autoplay=()",
          "camera=()",
          "display-capture=()",
          "encrypted-media=()",
          "fullscreen=(self)",
          "geolocation=()",
          "gyroscope=()",
          "magnetometer=()",
          "microphone=()",
          "midi=()",
          "payment=()",
          "picture-in-picture=()",
          "usb=()",
        ].join(", "),
      },
      // Cross-Origin policies
      {
        key: "Cross-Origin-Embedder-Policy",
        value: "require-corp",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
      {
        key: "Cross-Origin-Resource-Policy",
        value: "same-origin",
      },
    ];

    return [
      // Apply strict CSP and security headers to frontend routes only
      {
        source: "/((?!api).*)", // All non-API routes
        headers: [
          {
            key: "Content-Security-Policy",
            value: frontendCSP,
          },
          ...securityHeaders,
        ],
      },
      // Apply permissive CSP to API routes (allows external fetches)
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: apiCSP,
          },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
          // Don't apply restrictive security headers to API
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      // Scan results page - Short cache (5 minutes)
      {
        source: "/scan/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=300, must-revalidate",
          },
        ],
      },
      // History page - No cache (always show latest scans)
      {
        source: "/history",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },

  // Turbopack configuration for Next.js 16
  turbopack: {
    // Configure Turbopack for faster development
    resolveAlias: {
      // Add any aliases if needed
    },
  },

  // Output configuration for production
  output: 'standalone',
};

// Validate required environment variables
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

// Run validation
validateEnv();

module.exports = nextConfig;