import { auth } from "@/auth";

/**
 * Middleware for route protection and auth state management
 * Auth.js handles redirects automatically via pages.signIn config
 */
export default auth((req) => {
  // Auth state is managed by req.auth
  // Route protection handled by Auth.js
  return req.auth ? undefined : null;
});

export const config = {
  matcher: ["/((?!api/auth).*)"],
};
