import {
    openDatabaseAsync,
    type SQLiteDatabase,
} from "expo-sqlite";

let _db: SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLiteDatabase> {
  if (!_db) {
    _db = await openDatabaseAsync("subscriptions.db");
  }
  return _db;
}

/**
 * Initialize DB and ensure schema exists.
 * Adds `iconKey` column if it is missing.
 */
export async function initDatabase(): Promise<void> {
  const db = await getDb();

  // Create table if not exists (includes iconKey)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      iconKey TEXT,
      category TEXT,
      price REAL NOT NULL,
      currency TEXT,
      billingCycle TEXT,
      startDate TEXT,
      nextPaymentDate TEXT,
      notes TEXT
    );
  `);

  // If you migrated from an older schema without iconKey, ensure column exists
  // (SQLite has limited ALTER TABLE support; try add, ignore on error)
  try {
    await db.execAsync(`ALTER TABLE subscriptions ADD COLUMN iconKey TEXT;`);
  } catch {
    // Column already exists — ignore
  }
}

/**
 * Simple helper to run SQL.
 * - For SELECT queries: returns { rows: { _array, length, item(i) } }
 * - For non-SELECT: returns the same shape with empty rows (so callers don't crash)
 */
export async function executeSql(
  sql: string,
  params: any[] = []
): Promise<{
  rows: { _array: any[]; length: number; item: (i: number) => any | null };
}> {
  const db = await getDb();
  const isSelect = /^\s*select/i.test(sql);

  if (isSelect) {
    const rows = await db.getAllAsync<any>(sql, params);
    return {
      rows: {
        _array: rows,
        length: rows.length,
        item: (i: number) => (i >= 0 && i < rows.length ? rows[i] : null),
      },
    };
  } else {
    // INSERT/UPDATE/DELETE
    await db.runAsync(sql, params);
    return {
      rows: {
        _array: [],
        length: 0,
        item: () => null,
      },
    };
  }
}
