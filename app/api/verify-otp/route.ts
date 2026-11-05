import { NextResponse } from "next/server";
import { completePendingRegistration, getAuthUser, markEmailVerified } from "@/lib/auth-store";
import { verifyOtp } from "@/lib/otp-store";
import { createSession } from "@/lib/server-auth";
import { databaseError, isDatabaseError } from "@/lib/api-response";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request payload." }, { status: 400 });
    }
    const { email, code } = body;
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanCode = typeof code === "string" ? code.trim() : "";
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail) || !/^\d{6}$/.test(cleanCode)) {
      return NextResponse.json({ success: false, message: "Enter a valid email address and verification code." }, { status: 400 });
    }
    if (!(await verifyOtp(cleanEmail, cleanCode))) return NextResponse.json({ success: false, message: "Invalid or expired verification code." }, { status: 400 });

    const pendingUser = await completePendingRegistration(cleanEmail);
    if (pendingUser) {
      await createSession({ userId: pendingUser.id, email: pendingUser.email });
      return NextResponse.json({ success: true });
    }

    if (!(await getAuthUser(cleanEmail))) return NextResponse.json({ success: false, message: "Account not found. Please register first." }, { status: 404 });
    const user = await markEmailVerified(cleanEmail);
    if (!user) return NextResponse.json({ success: false, message: "Account not found. Please register first." }, { status: 404 });
    await createSession({ userId: user.id, email: user.email });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDatabaseError(error)) return databaseError(error);
    console.error("[OTP] verification failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ success: false, message: "Unable to verify the code." }, { status: 500 });
  }
}
