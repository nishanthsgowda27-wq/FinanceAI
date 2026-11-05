import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { deletePendingRegistration, getAuthUser, savePendingRegistration } from "@/lib/auth-store";
import { databaseError, isDatabaseError } from "@/lib/api-response";
import { isValidRecipient, issueOtp } from "@/lib/otp";
import { SmtpDeliveryError } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    console.info("[REGISTER] request received");
    const rawBody = await request.text();
    let body: Record<string, unknown> = {};
    if (rawBody) {
      try {
        body = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ success: false, message: "Invalid request payload." }, { status: 400 });
      }
    }
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    console.info("[REGISTER] validating input");
    if (!name || !isValidRecipient(email) || password.length < 6) {
      return NextResponse.json({ success: false, message: "Enter a valid name, email, and password of at least 6 characters." }, { status: 400 });
    }

    console.info("[REGISTER] checking existing user");
    const existing = await getAuthUser(email);
    if (existing?.emailVerified) return NextResponse.json({ success: false, message: "An account with this email already exists." }, { status: 409 });

    console.info("[REGISTER] storing pending registration");
    await savePendingRegistration({ name, email, password: await bcrypt.hash(password, 12) });

    try {
      console.info("[REGISTER] sending verification email");
      await issueOtp(email);
      console.info("[REGISTER] email send completed");
      console.info("[REGISTER] sending response");
      return NextResponse.json({ success: true, message: "OTP email was accepted by the mail server. Check Spam, Junk, Promotions, or email filtering if it is not in your inbox." });
    } catch (error) {
      console.warn("[REGISTER] removing pending registration because OTP delivery failed");
      await deletePendingRegistration(email);
      throw error;
    }
  } catch (error) {
    if (isDatabaseError(error)) return databaseError(error);
    if (error instanceof SmtpDeliveryError) {
      console.error("[SMTP] registration delivery failed", { code: error.code, message: error.message });
    } else {
      console.error("[REGISTER] request failed", error instanceof Error ? error.message : "Unknown error");
    }
    if (error instanceof Error && (error.message === "EMAIL_USER_MISSING" || error.message === "EMAIL_PASS_MISSING")) {
      return NextResponse.json(
        {
          success: false,
          message: "Email verification is not configured. Add EMAIL_USER and EMAIL_PASS to .env.local, then restart the development server.",
        },
        { status: 503 }
      );
    }
    if (error instanceof SmtpDeliveryError) {
      return NextResponse.json({
        success: false,
        code: error.code,
        message: `${error.message} Registration was not completed.`,
      }, { status: 503 });
    }
    if (error instanceof Error && error.message === "OTP_EMAIL_RECIPIENT_REJECTED") {
      return NextResponse.json({ success: false, message: "The email address is not accepted by the mail server. Please check the address and try again." }, { status: 503 });
    }
    return NextResponse.json({ success: false, message: "Unable to create your account. Check the server log for the exact error." }, { status: 500 });
  }
}
