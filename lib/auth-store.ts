import { getPool, query } from "@/lib/db/mysql";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type AuthUser = { id: string; name: string; email: string; password: string; emailVerified: boolean };
type AuthUserRow = RowDataPacket & { id: string; name: string; email: string; password_hash: string; email_verified: number | boolean };
type PendingRegistration = { name: string; email: string; password: string };
type PendingRegistrationRow = RowDataPacket & PendingRegistration;

async function ensureUsersTableSchema() {
  const rows = await query<RowDataPacket[]>("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'");
  const columns = new Set(rows.map((row) => row.COLUMN_NAME));

  const changes: string[] = [];
  if (!columns.has("name")) changes.push("ADD COLUMN name VARCHAR(191) NOT NULL DEFAULT ''");
  if (!columns.has("password_hash")) changes.push("ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT ''");
  if (!columns.has("email_verified")) changes.push("ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE");
  if (!columns.has("created_at")) changes.push("ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
  if (!columns.has("updated_at")) changes.push("ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");

  if (changes.length > 0) {
    await query(`ALTER TABLE users ${changes.join(", ")}`);
  }

  const indexes = await query<RowDataPacket[]>("SHOW INDEX FROM users WHERE Key_name = 'users_email_unique'");
  if (indexes.length === 0) {
    await query("CREATE UNIQUE INDEX users_email_unique ON users (email)");
  }
}

async function ensurePendingRegistrationsTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS pending_registrations (
      email VARCHAR(320) NOT NULL PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      expires_at DATETIME(6) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`
  );
}

function mapUser(row: AuthUserRow): AuthUser { return { id: row.id, name: row.name, email: row.email, password: row.password_hash, emailVerified: Boolean(row.email_verified) }; }

export async function getAuthUser(email: string) {
  await ensureUsersTableSchema();
  const rows = await query<AuthUserRow[]>("SELECT id, name, email, password_hash, email_verified FROM users WHERE email = ? LIMIT 1", [email]);
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function getAuthUserById(id: string) {
  await ensureUsersTableSchema();
  const rows = await query<AuthUserRow[]>("SELECT id, name, email, password_hash, email_verified FROM users WHERE id = ? LIMIT 1", [id]);
  return rows[0] ? mapUser(rows[0]) : undefined;
}

export async function saveAuthUser(user: Omit<AuthUser, "id" | "emailVerified"> & Partial<Pick<AuthUser, "id" | "emailVerified">>) {
  await ensureUsersTableSchema();
  const id = user.id ?? crypto.randomUUID();
  await query("INSERT INTO users (id, name, email, password_hash, email_verified) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), email_verified = VALUES(email_verified), updated_at = CURRENT_TIMESTAMP", [id, user.name, user.email, user.password, user.emailVerified ?? false]);
  return { id, name: user.name, email: user.email, password: user.password, emailVerified: user.emailVerified ?? false };
}

export async function savePendingRegistration(registration: PendingRegistration) {
  await ensurePendingRegistrationsTable();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await query(
    `INSERT INTO pending_registrations (email, name, password_hash, expires_at)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash),
       expires_at = VALUES(expires_at), updated_at = CURRENT_TIMESTAMP`,
    [registration.email, registration.name, registration.password, expiresAt]
  );
}

export async function hasPendingRegistration(email: string) {
  await ensurePendingRegistrationsTable();
  const rows = await query<RowDataPacket[]>(
    "SELECT 1 FROM pending_registrations WHERE email = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1",
    [email]
  );
  return rows.length > 0;
}

export async function deletePendingRegistration(email: string) {
  await ensurePendingRegistrationsTable();
  await query("DELETE FROM pending_registrations WHERE email = ?", [email]);
}

export async function completePendingRegistration(email: string) {
  await ensureUsersTableSchema();
  await ensurePendingRegistrationsTable();

  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [pendingRows] = await connection.execute<PendingRegistrationRow[]>(
      "SELECT name, email, password_hash AS password FROM pending_registrations WHERE email = ? AND expires_at > CURRENT_TIMESTAMP LIMIT 1 FOR UPDATE",
      [email]
    );
    const pending = pendingRows[0];
    if (!pending) {
      await connection.commit();
      return undefined;
    }

    const [userRows] = await connection.execute<AuthUserRow[]>(
      "SELECT id, name, email, password_hash, email_verified FROM users WHERE email = ? LIMIT 1 FOR UPDATE",
      [email]
    );
    const existing = userRows[0];
    const id = existing?.id ?? crypto.randomUUID();
    await connection.execute<ResultSetHeader>(
      `INSERT INTO users (id, name, email, password_hash, email_verified)
       VALUES (?, ?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash),
         email_verified = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [id, pending.name, pending.email, pending.password]
    );
    await connection.execute("DELETE FROM pending_registrations WHERE email = ?", [email]);
    await connection.commit();
    return {
      id,
      name: pending.name,
      email: pending.email,
      password: pending.password,
      emailVerified: true,
    } satisfies AuthUser;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function markEmailVerified(email: string) {
  await ensureUsersTableSchema();
  await query("UPDATE users SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE email = ?", [email]);
  return getAuthUser(email);
}

export function publicAuthUser(user: AuthUser) { return { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified }; }
