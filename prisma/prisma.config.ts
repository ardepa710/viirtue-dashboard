import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "@prisma/client";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1, // Limit connections for serverless
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
