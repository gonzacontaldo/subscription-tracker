// src/db/database.ts
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase;

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('subscriptions.v2.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      displayName TEXT NOT NULL,
      avatarUri TEXT
    );
  `);

  // Create table with new columns if not exists
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      iconKey TEXT,
      category TEXT,
      price REAL,
      currency TEXT,
      billingCycle TEXT,
      startDate TEXT,
      nextPaymentDate TEXT,
      notes TEXT,
      reminderDaysBefore INTEGER DEFAULT 1,
      notificationId TEXT,
      userId INTEGER REFERENCES users(id)
    );
  `);

  try {
    await db.execAsync(
      'ALTER TABLE subscriptions ADD COLUMN userId INTEGER REFERENCES users(id);',
    );
  } catch (error) {
    void error;
    // Ignore if column already exists
  }

  return db;
}

export async function execute(
  sql: string,
  params: SQLite.SQLiteBindParams = [],
): Promise<SQLite.SQLiteRunResult> {
  return db.runAsync(sql, params);
}

export async function queryAll<T = Record<string, unknown>>(
  sql: string,
  params: SQLite.SQLiteBindParams = [],
): Promise<T[]> {
  const result = await db.getAllAsync<T>(sql, params);
  return result;
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: SQLite.SQLiteBindParams = [],
): Promise<T | null> {
  const result = await db.getFirstAsync<T>(sql, params);
  return result ?? null;
}
