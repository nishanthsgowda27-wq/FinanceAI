"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2 } from "lucide-react";

import Input from "@/components/ui/input";
import PasswordField from "./password-field";
import Button from "@/components/ui/button";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const password = String(formData.get("password") || "");
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }), signal: controller.signal });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        if (data.requiresVerification) {
          localStorage.removeItem("pendingVerificationEmail");
          sessionStorage.setItem("pendingVerificationEmail", email);
          setLoading(false);
          router.push("/verify-email");
          return;
        }
        setError(data.message || "Unable to sign in.");
        return;
      }
      setLoading(false);
      console.info("[LOGIN] redirecting");
      router.replace("/dashboard");
    } catch (requestError) {
      console.error("LOGIN REQUEST ERROR", requestError);
      setError(requestError instanceof DOMException && requestError.name === "AbortError" ? "Sign-in timed out." : requestError instanceof Error ? requestError.message : "Unable to sign in.");
    } finally {
      window.clearTimeout(timeout);
      controller.abort();
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}
      <Input
        label="Email Address"
        type="email"
        name="email"
        placeholder="you@example.com"
        required
      />

      <PasswordField />

      <div className="flex justify-end">
        <Link
          href="/forget-password"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        className="flex w-full items-center justify-center gap-2"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <LogIn size={18} />
            Login
          </>
        )}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-700"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}