import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";

// Carrega .env apenas se o arquivo existir (desenvolvimento local)
const envPath = resolve(process.cwd(), ".env");
if (existsSync(envPath)) {
  config({ path: envPath });
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --compiler-options \"{\\\"module\\\":\\\"CommonJS\\\"}\" prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
