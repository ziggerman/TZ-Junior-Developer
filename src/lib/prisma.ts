import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | null | undefined;
};

function getSafeDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  // If envUrl is a valid SQLite file URL, use it
  if (envUrl && envUrl.startsWith("file:")) {
    return envUrl;
  }

  // On Vercel / serverless environments
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    const tmpDbPath = "/tmp/dev.db";
    try {
      if (!fs.existsSync(tmpDbPath)) {
        const projectDbPath = path.join(process.cwd(), "prisma", "dev.db");
        if (fs.existsSync(projectDbPath)) {
          fs.copyFileSync(projectDbPath, tmpDbPath);
        } else {
          const rootDbPath = path.join(process.cwd(), "dev.db");
          if (fs.existsSync(rootDbPath)) {
            fs.copyFileSync(rootDbPath, tmpDbPath);
          }
        }
      }
    } catch (e) {
      console.warn("Could not copy /tmp SQLite database:", e);
    }
    return `file:${tmpDbPath}`;
  }

  return "file:./dev.db";
}

export function getPrisma(): PrismaClient | null {
  if (globalForPrisma.prisma !== undefined) {
    return globalForPrisma.prisma;
  }

  try {
    const dbUrl = getSafeDatabaseUrl();
    process.env.DATABASE_URL = dbUrl;

    const client = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = client;
    }
    return client;
  } catch (error) {
    console.warn("PrismaClient initialization error, using resilient fallback:", error);
    globalForPrisma.prisma = null;
    return null;
  }
}

// Fallback proxy to maintain backwards compatibility
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string) {
    const client = getPrisma();
    if (!client) {
      throw new Error("Prisma client unavailable, use db layer fallback");
    }
    return (client as unknown as Record<string, unknown>)[prop];
  },
});
