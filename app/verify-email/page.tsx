"use client";

import VerifyEmailForm from "@/components/auth/verify-email-form";

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <VerifyEmailForm />
    </main>
  );
}
