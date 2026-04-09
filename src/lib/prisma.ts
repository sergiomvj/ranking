import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const dbUrl = `${process.env.DATABASE_URL}`;

function getPoolConfig() {
  if (!dbUrl || dbUrl === "undefined" || !dbUrl.startsWith("postgres")) {
    return { connectionString: dbUrl };
  }

  try {
    const url = new URL(dbUrl);
    return {
      user: url.username,
      password: decodeURIComponent(url.password),
      host: url.hostname,
      port: parseInt(url.port || "5432"),
      database: url.pathname.slice(1).split("?")[0],
      // Easypanel costuma usar sslmode=disable. Caso contrário, habilitamos SSL básico.
      ssl: dbUrl.includes("sslmode=disable") ? false : { rejectUnauthorized: false },
    };
  } catch (e) {
    console.warn("[Prisma] Falha ao decompor DATABASE_URL, tentando string pura.");
    return { connectionString: dbUrl };
  }
}

const pool = new Pool(getPoolConfig());
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
