import { NextResponse } from "next/server";
import { getAuthUser, hasPendingRegistration } from "@/lib/auth-store";
import { isValidRecipient, issueOtp } from "@/lib/otp";
import { SmtpDeliveryError } from "@/lib/email";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try { const body = await request.json(); const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""; if (!isValidRecipient(email)) return NextResponse.json({ success: false, message: "Email address is required." }, { status: 400 }); if (!(await getAuthUser(email)) && !(await hasPendingRegistration(email))) return NextResponse.json({ success: false, message: "Account not found." }, { status: 404 }); await issueOtp(email); return NextResponse.json({ success: true, message: "OTP email was accepted by the mail server. Check Spam, Junk, Promotions, or email filtering if it is not in your inbox." }); }
  catch (error) { console.error("OTP EMAIL ERROR", error); if (error instanceof SmtpDeliveryError) return NextResponse.json({ success: false, code: error.code, message: error.message }, { status: 503 }); return NextResponse.json({ success: false, message: error instanceof Error && (error.message === "EMAIL_USER_MISSING" || error.message === "EMAIL_PASS_MISSING") ? "Email verification is not configured. Add EMAIL_USER and EMAIL_PASS to .env.local and restart the development server." : error instanceof Error && error.message === "OTP_EMAIL_RECIPIENT_REJECTED" ? "The mail server rejected this recipient address. Please check the address and try again." : "Unable to send the verification email." }, { status: 503 }); }
}
