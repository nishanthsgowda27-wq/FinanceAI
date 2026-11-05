import { NextResponse } from "next/server";

type DatabaseErrorDetails = {
  code: string;
  errno?: number;
  message: string;
};

function getDatabaseErrorDetails(error: unknown): DatabaseErrorDetails {
  const candidate = error as { code?: unknown; errno?: unknown; message?: unknown };
  const code = typeof candidate?.code === "string"
    ? candidate.code
    : error instanceof Error && /MYSQL_NOT_CONFIGURED/.test(error.message)
      ? "MYSQL_NOT_CONFIGURED"
      : "DATABASE_ERROR";
  const message = error instanceof Error ? error.message : "Unknown database error";
  const secrets = [process.env.DB_PASSWORD, process.env.EMAIL_PASS].filter((value): value is string => Boolean(value));
  let safeMessage = message;

  for (const secret of secrets) safeMessage = safeMessage.replaceAll(secret, "[redacted]");
  safeMessage = safeMessage
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]")
    .replace(/\b\d{6}\b/g, "[redacted]")
    .slice(0, 500);

  return {
    code,
    errno: typeof candidate?.errno === "number" ? candidate.errno : undefined,
    message: safeMessage,
  };
}

export function isDatabaseError(error: unknown) {
  if (!(error instanceof Error)) return false;
  if ((error as Error & { source?: string }).source === "smtp") return false;
  const details = getDatabaseErrorDetails(error);
  return /^(MYSQL_NOT_CONFIGURED|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|PROTOCOL_CONNECTION_LOST|PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR|ER_[A-Z0-9_]+)$/.test(details.code)
    || typeof (error as { errno?: unknown })?.errno === "number"
    || /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|PROTOCOL_CONNECTION_LOST|MYSQL_NOT_CONFIGURED/i.test(error.message);
}

export function databaseError(error: unknown) {
  const details = getDatabaseErrorDetails(error);
  const isUnavailable = details.code === "MYSQL_NOT_CONFIGURED"
    || /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|PROTOCOL_CONNECTION_LOST|PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR|ER_CON_COUNT_ERROR/.test(details.code)
    || /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|PROTOCOL_CONNECTION_LOST|MYSQL_NOT_CONFIGURED/i.test(details.message);
  console.error("[DB] request failed", details);

  return NextResponse.json(
    {
      success: false,
      message: isUnavailable
        ? "The service is temporarily unavailable. Please try again shortly."
        : "We couldn't complete your request. Please try again shortly.",
    },
    { status: isUnavailable ? 503 : 500 }
  );
}

export function apiError(error: unknown) {
  if (error instanceof Error && error.message === "UNAUTHORIZED") {
    return NextResponse.json({ success: false, message: "Please sign in." }, { status: 401 });
  }

  if (isDatabaseError(error)) return databaseError(error);

  if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ success: false, message: "Record not found." }, { status: 404 });

  console.error(error);
  return NextResponse.json({ success: false, message: "Something went wrong." }, { status: 500 });
}
