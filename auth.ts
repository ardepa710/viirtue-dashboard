import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/prisma/prisma.config";

// Validate required environment variables
if (!process.env.AUTH_SECRET) {
  throw new Error("AUTH_SECRET environment variable is required");
}

/**
 * NextAuth v5 Configuration
 *
 * Minimal spec-compliant implementation:
 * - Credentials provider for authentication
 * - JWT strategy for serverless compatibility
 * - Audit logging for LOGIN events
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email?.trim() || !credentials?.password?.trim()) {
          return null;
        }

        const email = credentials.email.trim() as string;
        const password = credentials.password as string;

        try {
          // Find user
          const user = await prisma.dashboardUser.findUnique({
            where: { email },
          });

          if (!user) {
            return null;
          }

          // Verify password
          const isValid = await compare(password, user.password);

          if (!isValid) {
            return null;
          }

          // Log successful login (fire and forget)
          prisma.auditLog
            .create({
              data: {
                userId: user.id,
                action: "LOGIN",
                resource: "auth",
                details: JSON.stringify({ email: user.email }),
              },
            })
            .catch((error) => {
              console.error("Failed to log authentication event:", error);
            });

          // Return user object (will be encoded in JWT)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.error("Database error during authentication:", error);
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
});
