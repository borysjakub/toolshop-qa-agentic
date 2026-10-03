import mysql, { type Connection, type RowDataPacket } from 'mysql2/promise';

// Connection to the LOCAL Toolshop database (local-toolshop/start.ps1).
// Credentials come from .env, see .env.example.
export async function connectToDb(): Promise<Connection> {
  const { DB_USER, DB_PASSWORD } = process.env;
  if (!DB_USER || DB_PASSWORD === undefined) {
    throw new Error('DB_USER and DB_PASSWORD are missing: copy .env.example to .env (see CLAUDE.md).');
  }
  return mysql.createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: DB_USER,
    password: DB_PASSWORD,
    database: process.env.DB_NAME ?? 'toolshop',
    // DECIMAL columns as numbers, so totals compare with API values directly.
    decimalNumbers: true,
  });
}

// Runs a parameterized data change (test setup on the LOCAL database only).
export async function execute(db: Connection, sql: string, values: (string | number)[] = []) {
  await db.execute(sql, values);
}

// Runs a parameterized SELECT. Test data and anything from outside goes to `?` placeholders,
// never into the SQL string (the only exception is a fixed number forced with Math.trunc).
export async function select<T extends RowDataPacket>(
  db: Connection,
  sql: string,
  values: (string | number)[] = [],
): Promise<T[]> {
  const [rows] = await db.execute<T[]>(sql, values);
  return rows;
}
