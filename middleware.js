// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  // Web Crypto API — works in Edge Runtime (no import needed)
  const array = new Uint8Array(16);
  globalThis.crypto.getRandomValues(array);
  const nonce = Buffer.from(array).toString("base64");

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https: ws: wss:",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  // Setup base response
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  // --- Inactivity & Route Protection ---
  const token = request.cookies.get("token")?.value;
  const lastActivity = request.cookies.get("lastActivityTime")?.value;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // List of protected routes
  const protectedPaths = ["/dashboard", "/profile", "/monitors", "/history", "/developers"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // 1. If page is protected and user is not logged in, redirect to login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Inactivity check for authenticated users
  if (token) {
    const now = Date.now();
    const limit = 10 * 60 * 1000; // 10 minutes

    if (lastActivity) {
      const elapsed = now - parseInt(lastActivity);
      if (elapsed > limit) {
        // Clear session cookies and redirect to login
        const redirectRes = NextResponse.redirect(new URL("/login?timeout=inactivity", request.url));
        redirectRes.cookies.set({
          name: "token",
          value: "",
          expires: new Date(0),
          path: "/",
        });
        redirectRes.cookies.set({
          name: "lastActivityTime",
          value: "",
          expires: new Date(0),
          path: "/",
        });
        return redirectRes;
      }
    }

    // Refresh the lastActivityTime cookie
    response.cookies.set({
      name: "lastActivityTime",
      value: now.toString(),
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf)).*)",
  ],
};