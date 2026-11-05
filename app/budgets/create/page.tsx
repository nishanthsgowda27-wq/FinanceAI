import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import BudgetForm from "@/components/budgets/budget-form";

export default function CreateBudgetPage() {
  return (
    <DashboardLayout>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/budgets"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Budgets
          </Link>

          <h1 className="text-3xl font-bold">
            Create Budget
          </h1>

          <p className="mt-2 text-gray-500">
            Set a spending limit for a category.
          </p>

          <div className="mt-8">
            <BudgetForm />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}