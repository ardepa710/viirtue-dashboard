import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/prisma/prisma.config";
import type { User } from "@prisma/client";

/**
 * NextAuth v5 Configuration
 *
 * Uses JWT strategy for serverless compatibility
 * Credentials provider with bcrypt password validation
 * Audit logging for authentication events
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

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
          role: user.role,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.role = (user as User).role;
      }
      return token;
    },

    async session({ session, token }) {
      // Add custom fields from token to session
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  events: {
    async signOut({ token }) {
      // Log logout event (fire and forget)
      if (token?.id) {
        prisma.auditLog
          .create({
            data: {
              userId: token.id as string,
              action: "LOGOUT",
              resource: "auth",
            },
          })
          .catch((error) => {
            console.error("Failed to log logout event:", error);
          });
      }
    },
  },
});
