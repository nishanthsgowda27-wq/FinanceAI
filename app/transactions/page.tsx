"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";

interface Transaction {
  id: string;
  name: string;
  category: string;
  amount: number;
  type: string;
  account: string;
  date: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/transactions", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { transactions: [] })
      .then((data) => setTransactions(data.transactions.map((item: { id: string; description: string; category: string; amount: number; type: string; paymentMethod?: string; date: string }) => ({ ...item, name: item.description, account: item.paymentMethod || "" }))));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">

      <Header />

      <div className="mx-auto max-w-6xl px-6 py-8">

        <div className="flex items-center justify-between">

          <div>
            <h1 className="text-3xl font-bold">
              Transactions
            </h1>

            <p className="mt-2 text-gray-600">
              Track your real income and expenses.
            </p>
          </div>

          <Link
            href="/transactions/create"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            + Add Transaction
          </Link>

        </div>

        {transactions.length === 0 ? (

          <div className="mt-8 rounded-2xl bg-white p-12 text-center shadow-sm">

            <h2 className="text-xl font-bold">
              No transactions yet
            </h2>

            <p className="mt-2 text-gray-500">
              Add your first income or expense.
            </p>

            <Link
              href="/transactions/create"
              className="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white"
            >
              Add First Transaction
            </Link>

          </div>

        ) : (

          <div className="mt-8 space-y-3">

            {transactions.map((transaction) => {

              const isIncome =
                transaction.type === "income";

              return (

                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm"
                >

                  <div className="flex items-center gap-4">

                    <div
                      className={`rounded-xl p-3 ${
                        isIncome
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUp size={20} />
                      ) : (
                        <ArrowDown size={20} />
                      )}
                    </div>

                    <div>

                      <p className="font-semibold">
                        {transaction.name}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {transaction.category} •{" "}
                        {transaction.date}
                      </p>

                      <p className="text-xs text-gray-400">
                        {transaction.account}
                      </p>

                    </div>

                  </div>

                  <p
                    className={`font-bold ${
                      isIncome
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}₹
                    {Number(
                      transaction.amount
                    ).toLocaleString("en-IN")}
                  </p>

                </div>

              );
            })}

          </div>

        )}

      </div>

    </main>
  );
}

function Header() {
  return (
    <header className="border-b bg-white">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

        <Link
          href="/"
          className="text-2xl font-bold text-blue-600"
        >
          FinanceAI
        </Link>

        <Link
          href="/dashboard"
          className="font-medium text-gray-600 hover:text-blue-600"
        >
          Dashboard
        </Link>

      </div>

    </header>
  );
}