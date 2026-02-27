import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for Route Protection
 *
 * Runs on every request to protected routes
 * - Checks authentication status
 * - Redirects unauthenticated users to /login
 * - Allows authenticated users to proceed
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname === "/login";
  const isOnPublicRoute = req.nextUrl.pathname === "/";

  // Redirect authenticated users away from login page
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Redirect unauthenticated users to login (except public routes)
  if (!isLoggedIn && !isOnLoginPage && !isOnPublicRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Allow request to proceed
  return NextResponse.next();
});

/**
 * Middleware Configuration
 *
 * Specify which routes to run middleware on
 * - Matches all routes except static files and API auth routes
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     * - API auth routes (handled by NextAuth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/auth).*)",
  ],
};
