import mysql, { type ResultSetHeader, type RowDataPacket } from "mysql2/promise";

type SqlValue = string | number | boolean | null | Date | Buffer;

const globalForMysql = globalThis as typeof globalThis & {
  financeMysqlPool?: mysql.Pool;
};

export function getDatabaseConfig() {
  return {
    host: process.env.DB_HOST?.trim() || "127.0.0.1",
    port: Number(process.env.DB_PORT?.trim() || "3307"),
    user: process.env.DB_USER?.trim() || "root",
    password: process.env.DB_PASSWORD?.trim(),
    database: process.env.DB_NAME?.trim() || "financeai",
  };
}

export function getDatabaseDiagnostics() {
  const { host, port, database } = getDatabaseConfig();
  return {
    host,
    port,
    database,
  };
}

export function getPool() {
  if (globalForMysql.financeMysqlPool) return globalForMysql.financeMysqlPool;

  const { host, port, user, password, database } = getDatabaseConfig();

  if (!password) {
    throw new Error("MYSQL_NOT_CONFIGURED:DB_PASSWORD. Add DB_PASSWORD to .env.local and match the MySQL instance configured in database/FinanceAI-my.ini.");
  }

  globalForMysql.financeMysqlPool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    dateStrings: true,
    charset: "utf8mb4",
  });

  if (process.env.NODE_ENV !== "production") {
    console.info("[DB] Connected");
    console.info("[DB] Host: 127.0.0.1");
    console.info("[DB] Port: 3307");
    console.info("[DB] Database: financeai");
  }

  return globalForMysql.financeMysqlPool;
}

export async function query<T extends RowDataPacket[] | ResultSetHeader[]>(sql: string, values: unknown[] = []) {
  const pool = getPool();
  const [rows] = await pool.execute<T>(sql, values as SqlValue[]);

  if (process.env.NODE_ENV !== "production") {
    const trimmedSql = sql.trim();
    if (/^INSERT\s+/i.test(trimmedSql) || /^UPDATE\s+/i.test(trimmedSql) || /^DELETE\s+/i.test(trimmedSql)) {
      const safeRows = rows as ResultSetHeader[] | RowDataPacket[];
      const result = Array.isArray(safeRows) && "affectedRows" in safeRows[0] ? safeRows[0] as ResultSetHeader : null;
      console.info("[DB] write operation", {
        operation: trimmedSql.split(" ", 1)[0].toUpperCase(),
        affectedRows: result?.affectedRows ?? null,
        insertId: result?.insertId ?? null,
      });
    }
  }

  return rows;
}

export async function pingDatabase() {
  const diagnostics = getDatabaseDiagnostics();
  const [rows] = await getPool().execute<RowDataPacket[]>("SELECT DATABASE() AS database_name, @@hostname AS server_host, @@port AS mysql_port");
  const row = rows[0] ?? {};

  return {
    ...diagnostics,
    connectedDatabase: String(row.database_name ?? diagnostics.database),
    serverHost: String(row.server_host ?? diagnostics.host),
    serverPort: Number(row.mysql_port ?? diagnostics.port),
  };
}
