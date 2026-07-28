
import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";
import { migrate } from "./migrate";
import { seed } from "./seed";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });


// ============================================================
// Auto DB setup — runs via "predev" npm hook
// 1. Parses DATABASE_URL to extract the database name
// 2. Connects to default 'postgres' DB to check/create ours
// 3. Runs migrations + seeds (if newly created)
// ============================================================

function parseDatabaseUrl(url: string) {
  const parsed = new URL(url);
  return {
    user: parsed.username,
    password: decodeURIComponent(parsed.password),
    host: parsed.hostname,
    port: parseInt(parsed.port || "5432"),
    database: parsed.pathname.slice(1),
  };
}

async function checkDatabase(): Promise<boolean> {
  const dbConfig = parseDatabaseUrl(process.env.DATABASE_URL!);

  // Try connecting directly to the target database
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log(`  ✅ Connected to database "${dbConfig.database}"`);

    // Check if tables already exist (to decide whether to seed)
    const result = await client.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = 'employee' LIMIT 1"
    );
    return result.rows.length === 0; // true = fresh DB, needs seeding
  } catch (err: any) {
    if (err.code === "3D000") {
      // Database does not exist
      console.error(`\n❌ Database "${dbConfig.database}" does not exist.`);
      console.error(`   Run this first as postgres superuser:\n`);
      console.error(`   psql -U postgres`);
      console.error(`   CREATE USER ${dbConfig.user} WITH PASSWORD '****';`);
      console.error(`   CREATE DATABASE ${dbConfig.database} OWNER ${dbConfig.user};\n`);
      process.exit(1);
    }
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  try {
    console.log("\n🔧 Setting up database...\n");

    const isFresh = await checkDatabase();
    await migrate();

    if (isFresh) {
      await seed();
    } else {
      console.log("  ℹ️  Skipping seed (tables exist). Run 'npm run db:seed' to re-seed.");
    }

    console.log("\n✅ Database setup complete!\n");
  } catch (error: any) {
    console.error("❌ Database setup failed:", error.message);
    process.exit(1);
  }
}

main();