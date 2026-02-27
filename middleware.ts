import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Middleware for route protection and auth state management
 */
export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnLoginPage = req.nextUrl.pathname === "/login";

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth).*)"],
};
