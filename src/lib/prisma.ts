import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string | undefined {
  const envUrl = process.env.DATABASE_URL;

  // If using external PostgreSQL/MySQL (Neon, Supabase, etc.)
  if (envUrl && (envUrl.startsWith("postgres://") || envUrl.startsWith("postgresql://"))) {
    return envUrl;
  }

  // On Vercel / serverless environments, SQLite must write to writable /tmp directory
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const tmpDbPath = "/tmp/dev.db";
    try {
      if (!fs.existsSync(tmpDbPath)) {
        // Try to copy seeded/created build db from project
        const projectDbPath = path.join(process.cwd(), "prisma", "dev.db");
        if (fs.existsSync(projectDbPath)) {
          fs.copyFileSync(projectDbPath, tmpDbPath);
        } else {
          // Check root dev.db
          const rootDbPath = path.join(process.cwd(), "dev.db");
          if (fs.existsSync(rootDbPath)) {
            fs.copyFileSync(rootDbPath, tmpDbPath);
          }
        }
      }
    } catch (e) {
      console.error("Error setting up /tmp SQLite on Vercel:", e);
    }
    return `file:${tmpDbPath}`;
  }

  return envUrl || "file:./dev.db";
}

const dbUrl = getDatabaseUrl();
if (!process.env.DATABASE_URL && dbUrl) {
  process.env.DATABASE_URL = dbUrl;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
