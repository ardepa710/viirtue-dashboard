import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware for route protection
 *
 * Uses cookie-based auth check (Edge Runtime compatible)
 * Does NOT import Prisma/auth (avoids crypto module error)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get NextAuth session cookie
  const sessionCookie = request.cookies.get("authjs.session-token") ||
                        request.cookies.get("__Secure-authjs.session-token");

  const isAuthenticated = !!sessionCookie;
  const isLoginPage = pathname === "/login";
  const isPublicRoute = pathname === "/";

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isLoginPage && !isPublicRoute) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (isAuthenticated && isLoginPage) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect all routes except Auth.js handlers and static assets
    "/((?!api/auth|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};
