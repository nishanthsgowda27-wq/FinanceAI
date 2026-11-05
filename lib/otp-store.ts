import { query } from "@/lib/db/mysql";
import type { RowDataPacket } from "mysql2";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_PURPOSE = "email_verification";
type OtpRow = RowDataPacket & { otp_code: string; expires_at: Date | string };

function normalizeEmail(email: string) { return email.trim().toLowerCase(); }

export async function createOtp(email: string) {
	const normalizedEmail = normalizeEmail(email);
	const code = Math.floor(100000 + Math.random() * 900000).toString();
	const expiresAt = new Date(Date.now() + OTP_TTL_MS);
	await ensureOtpTable();
	await query(
		`INSERT INTO otp_verifications (email, purpose, otp_code, expires_at)
		 VALUES (?, ?, ?, ?)
		 ON DUPLICATE KEY UPDATE otp_code = VALUES(otp_code), expires_at = VALUES(expires_at), created_at = CURRENT_TIMESTAMP`,
		[normalizedEmail, OTP_PURPOSE, code, expiresAt]
	);
	return code;
}

async function ensureOtpTable() {
	await query(
		`CREATE TABLE IF NOT EXISTS otp_verifications (
			email VARCHAR(320) NOT NULL,
			purpose VARCHAR(64) NOT NULL,
			otp_code CHAR(6) NOT NULL,
			expires_at DATETIME(6) NOT NULL,
			created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			PRIMARY KEY (email, purpose)
		) ENGINE=InnoDB`
	);
}

export async function deleteOtp(email: string) {
	await ensureOtpTable();
	await query("DELETE FROM otp_verifications WHERE email = ? AND purpose = ?", [normalizeEmail(email), OTP_PURPOSE]);
}

export async function verifyOtp(email: string, code: string) {
	const normalizedEmail = normalizeEmail(email);
	const cleanCode = code.trim();
	await ensureOtpTable();
	const rows = await query<OtpRow[]>(
		"SELECT otp_code, expires_at FROM otp_verifications WHERE email = ? AND purpose = ? LIMIT 1",
		[normalizedEmail, OTP_PURPOSE]
	);
	const pending = rows[0];
	const expiresAt = pending ? new Date(pending.expires_at).getTime() : 0;
	if (!pending || expiresAt <= Date.now() || pending.otp_code !== cleanCode) {
		if (pending && expiresAt <= Date.now()) await deleteOtp(normalizedEmail);
		return false;
	}
	await deleteOtp(normalizedEmail);
	return true;
}
