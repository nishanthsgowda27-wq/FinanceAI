"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (cancelled) return;
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;

        if (response.status === 401) {
          setAllowed(false);
          router.replace("/login");
          return;
        }

        if (!response.ok || !data.success) {
          setAllowed(false);
          setError("Your session couldn't be verified. Please try again shortly.");
          return;
        }

        setAllowed(true);
      })
      .catch(() => {
        if (cancelled) return;
        setAllowed(false);
        setError("Your session couldn't be verified. Please try again shortly.");
      });

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (allowed !== true) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">FinanceAI</p>
        <h1 className="mt-3 text-xl font-bold text-slate-900">{error || "Checking your session..."}</h1>
        {error && <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Try again</button>}
      </div>
    </div>
  );
  return children;
}
