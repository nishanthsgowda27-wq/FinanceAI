import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUser, publicAuthUser } from "@/lib/auth-store";
import { databaseError, isDatabaseError } from "@/lib/api-response";
import { createSession } from "@/lib/server-auth";

export const runtime = "nodejs";

function withTimeout<T>(operation: Promise<T>, timeoutMs: number) {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("LOGIN_DATABASE_TIMEOUT")), timeoutMs);
  });
  return Promise.race([operation, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export async function POST(request: Request) {
  try {
    console.info("[LOGIN] request received");
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request payload." }, { status: 400 });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    console.info("[LOGIN] validating input");
    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email and password are required." }, { status: 400 });
    }

    console.info("[LOGIN] checking database");
    const user = await withTimeout(getAuthUser(email), 8000);
    console.info("[LOGIN] user lookup completed");
    if (!user) return NextResponse.json({ success: false, message: "Account not found. Please create an account." }, { status: 404 });
    if (!(await bcrypt.compare(password, user.password))) return NextResponse.json({ success: false, message: "Incorrect password." }, { status: 401 });
    console.info("[LOGIN] password verification completed");
    console.info("[LOGIN] OTP status checked");
    if (!user.emailVerified) return NextResponse.json({ success: false, message: "Please verify your email first.", requiresVerification: true, email }, { status: 403 });
    await createSession({ userId: user.id, email: user.email });
    console.info("[LOGIN] session creation completed");
    console.info("[LOGIN] response returned");
    return NextResponse.json({ success: true, user: publicAuthUser(user) });
  } catch (error) {
    if (error instanceof Error && error.message === "LOGIN_DATABASE_TIMEOUT") {
      console.error("[DB] login lookup timed out", { code: "LOGIN_DATABASE_TIMEOUT", message: error.message });
      return NextResponse.json({ success: false, message: "Database login timed out. Please try again." }, { status: 503 });
    }
    if (isDatabaseError(error)) return databaseError(error);
    console.error("[LOGIN] request failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "Unable to sign in. Check the server log for the exact authentication error." }, { status: 500 });
  }
}
