"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email.trim().toLowerCase(), code, password }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to reset your password.");
      setMessage("Password reset successfully. You can now log in.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send the password reset link.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">

        <h1 className="text-3xl font-bold text-gray-900">
          Forgot Password
        </h1>

        <p className="mt-2 text-gray-500">
          Enter your registered email address.
        </p>

        {message && (
          <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div>
            <label className="mb-2 block font-medium">
              Email Address
            </label>

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Verification Code</label>
            <input type="text" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" />
          </div>

          <div>
            <label className="mb-2 block font-medium">New Password</label>
            <input type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500" />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Continue
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Remember your password?{" "}

          <Link
            href="/login"
            className="font-semibold text-blue-600"
          >
            Login
          </Link>
        </p>

      </div>
    </main>
  );
}