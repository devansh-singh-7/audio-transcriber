import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

export const DATABASE_URL_MISSING_MESSAGE =
  "DATABASE_URL is not set. Add a Postgres connection string to audio/.env.local.";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
    });
  }

  if (!db) {
    db = drizzle(pool);
  }

  return db;
}

export function getDbOrThrow() {
  const database = getDb();

  if (!database) {
    throw new Error(DATABASE_URL_MISSING_MESSAGE);
  }

  return database;
}
