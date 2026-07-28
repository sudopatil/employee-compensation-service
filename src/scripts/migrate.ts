import { Client } from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ============================================================
// Migration runner — reads numbered SQL files from sql/ folder,
// tracks applied ones in a _migrations table, skips duplicates.
// ============================================================

export async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });

  try {
    await client.connect();

    // Create tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        filename    VARCHAR(255) NOT NULL UNIQUE,
        applied_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // Get already-applied migrations
    const applied = await client.query("SELECT filename FROM _migrations");
    const appliedSet = new Set(applied.rows.map((r) => r.filename));

    // Read migration files (exclude seed.sql, only numbered files)
    const sqlDir = path.resolve(__dirname, "../../sql");
    const files = fs
      .readdirSync(sqlDir)
      .filter((f) => f.endsWith(".sql") && /^\d/.test(f))  // starts with a digit
      .sort();

    let count = 0;

    for (const file of files) {
      if (appliedSet.has(file)) continue;

      const sql = fs.readFileSync(path.join(sqlDir, file), "utf-8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        console.log(`  ✅ Applied migration: ${file}`);
        count++;
      } catch (err: any) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${err.message}`);
      }
    }

    if (count === 0) {
      console.log("  ✅ All migrations already applied");
    }
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0)).catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
  });
}
