import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ============================================================
// Single DATABASE_URL — same pattern as your dealer portal.
// Format: postgres://user:password@host:port/database
//
// WHY a single URL instead of separate DB_HOST, DB_PORT, etc.?
//   • Industry standard — Heroku, Railway, Render, Supabase,
//     Prisma all use DATABASE_URL
//   • One variable to configure, not six
//   • Easy to copy from any cloud provider's dashboard
//   • Your dealer portal already uses this format
// ============================================================

interface AppConfig {
  databaseUrl: string;
  nodeEnv: string;
  isDev: boolean;
  defaultBonusPercentage: number;
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function loadConfig(): AppConfig {
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    nodeEnv: process.env.NODE_ENV || "development",
    isDev: (process.env.NODE_ENV || "development") === "development",
    defaultBonusPercentage: parseFloat(process.env.DEFAULT_BONUS_PERCENTAGE || "5"),
  };
}

export const config = loadConfig();
