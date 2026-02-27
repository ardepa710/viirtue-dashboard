"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var adapter_pg_1 = require("@prisma/adapter-pg");
var pg_1 = require("pg");
var client_1 = require("@prisma/client");
var pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Limit connections for serverless
});
var adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new client_1.PrismaClient({ adapter: adapter });
