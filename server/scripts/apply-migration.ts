import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Please add it to server/.env');
  process.exit(1);
}

type Statement = {
  sql: string;
  ignoreErrorCodes?: string[];
};

const statements: Statement[] = [
  {
    sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS "User" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "email" TEXT NOT NULL,
      "password_hash" TEXT NOT NULL,
      "display_name" TEXT NOT NULL,
      "avatar_uri" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" ("email");`,
  },
  {
    sql: `CREATE TABLE IF NOT EXISTS "Subscription" (
      "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      "user_id" UUID NOT NULL,
      "name" TEXT NOT NULL,
      "icon_key" TEXT,
      "category" TEXT,
      "price" DECIMAL(65,30),
      "currency" TEXT,
      "billing_cycle" TEXT NOT NULL,
      "start_date" TIMESTAMP(3),
      "next_payment_date" TIMESTAMP(3),
      "notes" TEXT,
      "reminder_days_before" INTEGER,
      "notification_id" TEXT,
      "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  },
  {
    sql: `ALTER TABLE "Subscription"
      ADD CONSTRAINT "Subscription_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE;`,
    ignoreErrorCodes: ['42710'],
  },
  {
    sql: `CREATE INDEX IF NOT EXISTS "Subscription_user_id_idx" ON "Subscription" ("user_id");`,
  },
];

const sql = neon(connectionString);

async function main() {
  try {
    for (const { sql: statement, ignoreErrorCodes } of statements) {
      console.log(`Executing:\n${statement}`);
      try {
        await sql(statement);
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (ignoreErrorCodes?.includes(code ?? '')) {
          console.log(`Skipping error with code ${code}: constraint already exists.`);
          continue;
        }
        throw error;
      }
    }
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Failed to apply migration:', error);
    process.exit(1);
  }
}

void main();
