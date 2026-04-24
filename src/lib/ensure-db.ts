import { sql } from "drizzle-orm";

import { getDbOrThrow } from "./db";

let ensureDatabaseSchemaPromise: Promise<void> | null = null;

async function createMissingTables() {
  const db = getDbOrThrow();

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "transcript" (
      "id" text PRIMARY KEY,
      "user_id" text NOT NULL,
      "file_name" text NOT NULL,
      "content" text NOT NULL,
      "duration" integer,
      "created_at" timestamp DEFAULT now() NOT NULL
    )
  `);

  await db.execute(sql`
    ALTER TABLE "transcript"
    ADD COLUMN IF NOT EXISTS "duration" integer
  `);

  await db.execute(sql`
    ALTER TABLE "transcript"
    ADD COLUMN IF NOT EXISTS "created_at" timestamp
  `);

  await db.execute(sql`
    UPDATE "transcript"
    SET "created_at" = now()
    WHERE "created_at" IS NULL
  `);

  await db.execute(sql`
    ALTER TABLE "transcript"
    ALTER COLUMN "created_at" SET DEFAULT now()
  `);

  await db.execute(sql`
    ALTER TABLE "transcript"
    ALTER COLUMN "created_at" SET NOT NULL
  `);

  await db.execute(sql.raw(`
    DO $$
    DECLARE constraint_row record;
    BEGIN
      FOR constraint_row IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu
          ON tc.constraint_name = ccu.constraint_name
         AND tc.table_schema = ccu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = current_schema()
          AND tc.table_name = 'transcript'
          AND kcu.column_name = 'user_id'
          AND ccu.table_name = 'user'
          AND ccu.column_name = 'id'
      LOOP
        EXECUTE format(
          'ALTER TABLE "transcript" DROP CONSTRAINT %I',
          constraint_row.constraint_name
        );
      END LOOP;
    END $$;
  `));
}

export async function ensureDatabaseSchema() {
  if (!ensureDatabaseSchemaPromise) {
    ensureDatabaseSchemaPromise = createMissingTables().catch((error) => {
      ensureDatabaseSchemaPromise = null;
      throw error;
    });
  }

  await ensureDatabaseSchemaPromise;
}
