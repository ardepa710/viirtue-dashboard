import { handlers } from "@/auth";

/**
 * NextAuth v5 API Route Handler
 *
 * Handles all authentication routes:
 * - GET  /api/auth/signin
 * - POST /api/auth/signin
 * - POST /api/auth/signout
 * - GET  /api/auth/session
 * - GET  /api/auth/csrf
 * - GET  /api/auth/providers
 */
export const { GET, POST } = handlers;
