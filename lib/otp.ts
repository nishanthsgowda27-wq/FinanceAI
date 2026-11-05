import { sendVerificationEmail, SmtpDeliveryError } from "@/lib/email";
import { createOtp, deleteOtp } from "@/lib/otp-store";

export function normalizeRecipient(email: string) {
  return email.trim().toLowerCase();
}

export function isValidRecipient(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && !/[\u0000-\u001F\u007F]/.test(email);
}

export async function issueOtp(email: string) {
  const recipientEmail = normalizeRecipient(email);
  console.info("[OTP] requested email verification");

  if (!isValidRecipient(recipientEmail)) {
    throw new Error("OTP_EMAIL_RECIPIENT_REJECTED");
  }

  const code = await createOtp(recipientEmail);
  console.info("[REGISTER] OTP generated and stored");

  try {
    const messageId = await sendVerificationEmail({ to: recipientEmail, code });
    console.info("[OTP] email accepted", { messageId });
    return code;
  } catch (error) {
    await deleteOtp(recipientEmail);
    console.error("[OTP] email delivery failed", error instanceof Error ? error.message : "Unknown SMTP error");
    if (error instanceof SmtpDeliveryError) {
      throw error;
    }
    if (error instanceof Error && (error.message === "EMAIL_USER_MISSING" || error.message === "EMAIL_PASS_MISSING")) {
      throw error;
    }
    throw new Error("OTP_EMAIL_SEND_FAILED");
  }
}
