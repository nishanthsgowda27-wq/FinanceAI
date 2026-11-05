"use client";

import Link from "next/link";
import TransactionManager from "@/components/transactions/transaction-manager";
import AuthGuard from "@/components/auth/auth-guard";
import AccountControls from "@/components/layout/account-controls";
import { useApp } from "@/components/providers/app-provider";

export default function ExpensesPage() {
  const { t } = useApp();
  return <AuthGuard><main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-700">← Back to dashboard</Link>
            <p className="mt-6 text-sm font-bold uppercase tracking-wider text-blue-600">{t("expenses.title")}</p>
            <h1 className="mt-2 text-4xl font-extrabold text-slate-900">{t("expenses.title")}</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Record income and expenses once, then use the same live data across your dashboard and tax insights.</p>
          </div>
          <AccountControls />
        </div>
        <TransactionManager />
      </div>
    </main></AuthGuard>;
}
