import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();
    const sql = fs.readFileSync(path.resolve(__dirname, "../../sql/seed.sql"), "utf-8");

    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");

    console.log("  ✅ Seed data inserted");
  } catch (err: any) {
    console.error("  ❌ Seed failed:", err.message);
    throw err;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0)).catch(() => process.exit(1));
}
