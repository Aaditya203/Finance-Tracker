import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

type CachedPrismaClient = PrismaClient & {
  bankTransaction?: PrismaClient["bankTransaction"];
  student?: PrismaClient["student"];
  teacher?: PrismaClient["teacher"];
};

const globalForPrisma = globalThis as typeof globalThis & { prisma?: CachedPrismaClient };

export const prisma = (() => {
  const cachedClient = globalForPrisma.prisma;
  if (cachedClient?.bankTransaction && cachedClient?.student && cachedClient?.teacher) {
    return cachedClient as PrismaClient;
  }

  // Prisma's generated client can be replaced while Next.js dev mode keeps
  // global state alive. Rebuild the singleton if it predates this model.
  if (cachedClient) {
    void cachedClient.$disconnect().catch((error) => {
      console.warn("Could not close the stale Prisma client:", error);
    });
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
  
  return client;
})();
