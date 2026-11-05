"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Input from "@/components/ui/input";
import PasswordField from "./password-field";
import Button from "@/components/ui/button";

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const formData = new FormData(event.currentTarget);

    const name = String(
      formData.get("name") || ""
    ).trim();

    const email = String(
      formData.get("email") || ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.get("password") || ""
    );

    const confirmPassword = String(
      formData.get("confirmPassword") || ""
    );

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all the fields.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Password and confirm password do not match."
      );
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () =>
        controller.abort(
          new DOMException("Registration request timed out", "AbortError")
        ),
      45000
    );

    try {
      const response = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }), signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) { setError(data.message || "Failed to send verification email."); return; }

      setSuccess(
        "OTP email accepted by the mail server. Check your email, including Spam, Junk, or Promotions."
      );
      localStorage.removeItem("pendingVerificationEmail");
      sessionStorage.setItem("pendingVerificationEmail", email);
      router.push("/verify-email");

    } catch (error) {
      const isTimeout =
        error instanceof DOMException && error.name === "AbortError";

      if (!isTimeout) console.error("REGISTRATION REQUEST ERROR", error);
      setError(
        isTimeout
          ? "Registration is taking longer than expected while contacting the email service. Please try again."
          : error instanceof Error
            ? error.message
            : "Could not create your account."
      );

      setLoading(false);
    } finally {
      window.clearTimeout(timeout);
      controller.abort();
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">
            ⚠️ {error}
          </p>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">
            ✓ {success}
          </p>
        </div>
      )}

      <Input
        label="Full Name"
        type="text"
        name="name"
        placeholder="Enter your full name"
        required
      />

      <Input
        label="Email Address"
        type="email"
        name="email"
        placeholder="you@example.com"
        required
      />

      <PasswordField
        label="Password"
        name="password"
        placeholder="Create a password"
      />

      <PasswordField
        label="Confirm Password"
        name="confirmPassword"
        placeholder="Confirm your password"
      />

      <Button
        type="submit"
        className="flex w-full items-center justify-center gap-2"
        disabled={loading}
      >
        {loading
          ? "Sending verification email..."
          : "Create Account"}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}

        <Link
          href="/login"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Login
        </Link>
      </p>
    </form>
  );
}
