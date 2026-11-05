import nodemailer from "nodemailer";

export class SmtpDeliveryError extends Error {
  readonly source = "smtp";

  constructor(
    readonly code: string,
    message: string
  ) {
    super(`${code}: ${message}`);
    this.name = "SmtpDeliveryError";
  }
}

function maskEmailAddress(email: string) {
  const trimmed = email.trim();
  if (!trimmed || !trimmed.includes("@")) return "***";
  const [localPart, domainPart] = trimmed.split("@");
  if (!domainPart) return "***";
  const maskedLocalPart = localPart.length <= 2 ? `${localPart.slice(0, 1)}***` : `${localPart.slice(0, 2)}***${localPart.slice(-1)}`;
  return `${maskedLocalPart}@${domainPart}`;
}

function getSafeSmtpError(error: unknown, secrets: string[]) {
  const smtpError = error as { code?: unknown; message?: unknown };
  const code = typeof smtpError?.code === "string" ? smtpError.code : "SMTP_ERROR";
  let message = typeof smtpError?.message === "string" ? smtpError.message : "SMTP operation failed.";

  for (const secret of secrets) {
    if (secret) message = message.replaceAll(secret, "[redacted]");
  }
  message = message.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[email redacted]");
  message = message.replace(/\b\d{6}\b/g, "[redacted]");
  return new SmtpDeliveryError(code, message);
}

export function getGmailConfig() {
  const user = process.env.EMAIL_USER?.trim() ?? "";
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "") ?? "";
  return {
    user,
    pass,
    hasUser: Boolean(user),
    hasPass: Boolean(pass),
  };
}

export function getGmailSender() {
  return process.env.EMAIL_USER?.trim() ?? "";
}

export async function sendVerificationEmail({ to, code }: { to: string; code: string }) {
  const { user, pass, hasUser, hasPass } = getGmailConfig();
  const sender = getGmailSender();
  const normalizedTo = to.trim().toLowerCase();
  const maskedRecipient = maskEmailAddress(normalizedTo);

  console.info("[SMTP] config check", {
    hasUser,
    hasPass,
    recipient: maskedRecipient,
    sender: sender ? sender.replace(/(.{2}).+(@.*)/, "$1***$2") : "not-set",
  });

  if (!hasUser) {
    throw new Error("EMAIL_USER_MISSING");
  }

  if (!hasPass) {
    throw new Error("EMAIL_PASS_MISSING");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    auth: {
      user,
      pass,
    },
  });
  const sensitiveValues = [user, pass, normalizedTo, code];

  try {
    await transporter.verify();
    console.info("[SMTP] authentication verified", { recipient: maskedRecipient });
  } catch (error) {
    const smtpError = getSafeSmtpError(error, sensitiveValues);
    console.error("[SMTP] verification failed", { code: smtpError.code, message: smtpError.message });
    throw smtpError;
  }

  const text = [
    "Hello,",
    "",
    `Your FinanceAI verification code is: ${code}`,
    "",
    "This code will expire in 10 minutes.",
    "",
    "If you did not create a FinanceAI account, you can ignore this email.",
    "",
    "Regards,",
    "FinanceAI Team",
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <p>Hello,</p>
      <p>Your FinanceAI verification code is: <strong>${code}</strong></p>
      <p>This code will expire in 10 minutes.</p>
      <p>If you did not create a FinanceAI account, you can ignore this email.</p>
      <p>Regards,<br />FinanceAI Team</p>
    </div>
  `;

  console.info("[SMTP] sending message", {
    from: sender ? sender.replace(/(.{2}).+(@.*)/, "$1***$2") : "not-set",
    recipient: maskedRecipient,
  });

  try {
    const info = await transporter.sendMail({
      from: sender,
      to: [normalizedTo],
      subject: "FinanceAI Email Verification",
      text,
      html,
    });

    const accepted = Array.isArray(info.accepted) ? info.accepted : [];
    const rejected = Array.isArray(info.rejected) ? info.rejected : [];
    const recipientAccepted = accepted.some((address) => address.trim().toLowerCase() === normalizedTo);
    const recipientRejected = rejected.some((address) => address.trim().toLowerCase() === normalizedTo);

    console.info("[SMTP] result", {
      recipient: maskedRecipient,
      accepted: accepted.map(maskEmailAddress),
      rejected: rejected.map(maskEmailAddress),
      messageId: info.messageId,
      response: info.response,
    });

    if (recipientRejected) {
      console.error("[SMTP] Gmail rejected the recipient address", {
        recipient: maskedRecipient,
        accepted: accepted.map(maskEmailAddress),
        rejected: rejected.map(maskEmailAddress),
        messageId: info.messageId,
        response: info.response,
      });
      throw new SmtpDeliveryError("EENVELOPE", "SMTP server rejected the recipient.");
    }

    if (!recipientAccepted) {
      console.error("[SMTP] Gmail did not accept the recipient in info.accepted", {
        recipient: maskedRecipient,
        accepted: accepted.map(maskEmailAddress),
        rejected: rejected.map(maskEmailAddress),
        messageId: info.messageId,
        response: info.response,
      });
      throw new SmtpDeliveryError("EENVELOPE", "SMTP server did not accept the recipient.");
    }

    console.info("[SMTP] Gmail accepted the SMTP message", {
      recipient: maskedRecipient,
      accepted: accepted.map(maskEmailAddress),
      rejected: rejected.map(maskEmailAddress),
      messageId: info.messageId,
      response: info.response,
    });

    return info.messageId;
  } catch (error) {
    const smtpError = error instanceof SmtpDeliveryError
      ? error
      : getSafeSmtpError(error, sensitiveValues);
    console.error("[SMTP] sendMail failed", {
      recipient: maskedRecipient,
      code: smtpError.code,
      message: smtpError.message,
    });
    throw smtpError;
  }
}
