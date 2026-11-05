import { NextResponse } from "next/server";
import { getDatabaseDiagnostics, pingDatabase } from "@/lib/db/mysql";
import { databaseError, isDatabaseError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, message: "Database diagnostics are disabled in production." }, { status: 404 });
  }

  try {
    const diagnostics = await pingDatabase();
    return NextResponse.json({
      success: true,
      database: {
        host: diagnostics.host,
        port: diagnostics.port,
        database: diagnostics.database,
        connectedDatabase: diagnostics.connectedDatabase,
        serverHost: diagnostics.serverHost,
        serverPort: diagnostics.serverPort,
      },
      config: getDatabaseDiagnostics(),
    });
  } catch (error) {
    if (isDatabaseError(error)) return databaseError(error);
    console.error("[DB] diagnostic failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "Database connection failed." }, { status: 500 });
  }
}
