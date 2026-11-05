import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthUser, saveAuthUser } from "@/lib/auth-store";
import { issueOtp } from "@/lib/otp";
import { verifyOtp } from "@/lib/otp-store";
import { databaseError, isDatabaseError } from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 6) return NextResponse.json({ success: false, message: "Enter a valid email and a password of at least 6 characters." }, { status: 400 });
    const user = await getAuthUser(email);
    if (!user) return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 });
    if (!code) { await issueOtp(email); return NextResponse.json({ success: true, message: "OTP email was accepted by the mail server. Check Spam, Junk, Promotions, or email filtering if it is not in your inbox." }); }
    if (!/^\d{6}$/.test(code) || !(await verifyOtp(email, code))) return NextResponse.json({ success: false, message: "Invalid or expired verification code." }, { status: 400 });
    await saveAuthUser({ id: user.id, name: user.name, email, password: await bcrypt.hash(password, 12), emailVerified: user.emailVerified });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (isDatabaseError(error)) return databaseError(error);

    console.error("PASSWORD RESET ERROR", error);
    const message = error instanceof Error && (error.message === "EMAIL_USER_MISSING" || error.message === "EMAIL_PASS_MISSING")
      ? "Email verification is not configured. Add EMAIL_USER and EMAIL_PASS to .env.local and restart the development server."
      : "Unable to reset your password. Please try again shortly.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}