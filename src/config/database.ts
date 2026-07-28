import { Pool, PoolClient } from "pg";
import { config } from "./env";

// ============================================================
// Connection pool using DATABASE_URL
// The pg library natively parses postgres:// URLs — no manual
// splitting of host/port/user/password needed.
// ============================================================

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("Unexpected pool error:", err.message);
    });
  }

  return pool;
}

// Helper for transactions (BEGIN → queries → COMMIT/ROLLBACK)
export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
