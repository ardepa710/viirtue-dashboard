import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

const pool = new Pool({
  connectionString,
  max: 1, // CRITICAL for Vercel serverless - prevents connection exhaustion
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
