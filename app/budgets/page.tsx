import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import BudgetCard from "@/components/budgets/budget-card";

const budgets = [
  {
    id: 1,
    category: "Food",
    spent: 7500,
    limit: 10000,
    period: "August 2026",
  },
  {
    id: 2,
    category: "Transport",
    spent: 4500,
    limit: 6000,
    period: "August 2026",
  },
  {
    id: 3,
    category: "Shopping",
    spent: 3500,
    limit: 8000,
    period: "August 2026",
  },
  {
    id: 4,
    category: "Entertainment",
    spent: 2000,
    limit: 5000,
    period: "August 2026",
  },
];

export default function BudgetsPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <header className="border-b bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Finance
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Budgets
              </h1>
            </div>

            <Link
              href="/budgets/create"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Create Budget
            </Link>
          </div>
        </header>

        <main className="space-y-6 p-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="grid gap-5 md:grid-cols-2">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                category={budget.category}
                spent={budget.spent}
                limit={budget.limit}
                period={budget.period}
              />
            ))}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}