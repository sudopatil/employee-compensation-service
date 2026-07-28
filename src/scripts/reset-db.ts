import { Client } from "pg";
import dotenv from "dotenv";
import path from "path";
import { migrate } from "./migrate";
import { seed } from "./seed";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function reset() {
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Cannot reset database in production!");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    console.log("🗑️  Dropping all tables...");
    await client.query(`
      DROP TABLE IF EXISTS Employee CASCADE;
      DROP TABLE IF EXISTS Department CASCADE;
      DROP TABLE IF EXISTS _migrations CASCADE;
    `);
    console.log("  ✅ Tables dropped");
  } finally {
    await client.end();
  }

  await migrate();
  await seed();
  console.log("\n✅ Database reset complete!\n");
}

reset().then(() => process.exit(0)).catch((err) => {
  console.error("❌", err.message);
  process.exit(1);
});
