import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set. Please add it to server/.env');
  process.exitCode = 1;
  process.exit();
}

const sql = neon(connectionString);

async function main() {
  try {
    const result = await sql`SELECT version()`;
    const version = result[0]?.version ?? 'unknown version';
    console.log(`Connected! PostgreSQL reports version: ${version}`);
  } catch (error) {
    console.error('Failed to connect to Neon:', error);
    process.exitCode = 1;
  }
}

void main();
