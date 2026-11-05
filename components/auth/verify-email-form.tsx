"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const pendingEmail = sessionStorage.getItem("pendingVerificationEmail") ?? localStorage.getItem("pendingVerificationEmail") ?? "";
    if (pendingEmail) {
      sessionStorage.setItem("pendingVerificationEmail", pendingEmail);
    }
    setEmail(pendingEmail.trim());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = window.setTimeout(() => setOtpCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [otpCooldown]);

  async function verifyEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("No pending email was found. Please register again to receive a new verification code.");
      return;
    }

    setError("");
    setMessage("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, code }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setError(data.message || "Unable to verify the code.");
        return;
      }
      sessionStorage.removeItem("pendingVerificationEmail");
      localStorage.removeItem("pendingVerificationEmail");
      setMessage("Email verified. Continuing with onboarding...");
      router.push("/onboarding");
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      setError(isTimeout ? "The verification request timed out. Please try again." : "Unable to verify the code. Please try again.");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  async function sendNewOtp() {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setError("No pending email was found. Please register again to receive a new verification code.");
      return;
    }

    localStorage.removeItem("pendingVerificationEmail");
    sessionStorage.setItem("pendingVerificationEmail", cleanEmail);
    setError("");
    setMessage("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setError(data.message || "Unable to send a new verification code.");
        return;
      }
      setOtpCooldown(30);
      setMessage("OTP email accepted by the mail server. Check your email, including Spam, Junk, or Promotions.");
    } catch (error) {
      const isTimeout = error instanceof DOMException && error.name === "AbortError";
      setError(isTimeout ? "The OTP request timed out. Please try again." : "Unable to send a new verification code. Please try again.");
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }

  if (!isReady) {
    return (
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">FinanceAI</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Preparing verification</h1>
        <p className="mt-3 text-slate-600">Checking your pending email verification session...</p>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">FinanceAI</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">No pending verification found</h1>
        <p className="mt-3 text-slate-600">We could not find a pending email verification request. Please create a new account to receive a fresh OTP.</p>
        <div className="mt-6 space-y-3">
          <Link href="/register" className="block rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">Create Account</Link>
          <Link href="/login" className="block rounded-xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
      <div className="text-center">
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Verify Your Email</h1>
        <p className="mt-3 text-slate-600">Enter the six-digit code sent to:</p>
        <p className="mt-2 break-all font-semibold text-blue-600">{email}</p>
      </div>
      <form onSubmit={verifyEmail} className="mt-8 space-y-4">
        {error && <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-600">{error}</div>}
        {message && <div className="rounded-xl bg-green-50 p-4 text-sm font-medium text-green-600">{message}</div>}
        <label className="block text-sm font-medium text-slate-700" htmlFor="verification-code">Verification code</label>
        <input id="verification-code" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="123456" className="w-full rounded-xl border border-slate-300 px-4 py-3 text-center text-xl tracking-[0.4em] outline-none focus:border-blue-500" required />
        <button type="submit" disabled={loading || code.length !== 6} className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-bold text-white shadow-lg disabled:opacity-60">{loading ? "Verifying..." : "Verify Email"}</button>
      </form>
      <button type="button" onClick={sendNewOtp} disabled={loading || !email || otpCooldown > 0} className="mt-4 w-full text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-60">{otpCooldown > 0 ? `Send new code in ${otpCooldown}s` : "Send verification code"}</button>
      <button type="button" onClick={() => router.push("/login")} className="mt-4 w-full text-sm text-slate-500 hover:text-slate-800">Back to Login</button>
    </div>
  );
}
