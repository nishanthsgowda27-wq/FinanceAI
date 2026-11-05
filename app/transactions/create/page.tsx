import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import TransactionForm from "@/components/transactions/transaction-form";

export default function CreateTransactionPage() {
  return (
    <DashboardLayout>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/transactions"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Transactions
          </Link>

          <h1 className="text-3xl font-bold">
            Add Transaction
          </h1>

          <p className="mt-2 text-gray-500">
            Record your income or expense.
          </p>

          <div className="mt-8">
            <TransactionForm />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}