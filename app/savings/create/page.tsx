import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import SavingsGoalForm from "@/components/savings/savings-goal-form";

export default function CreateSavingsPage() {
  return (
    <DashboardLayout>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/savings"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Savings
          </Link>

          <h1 className="text-3xl font-bold">
            Create Savings Goal
          </h1>

          <p className="mt-2 text-gray-500">
            Set a target and track your savings progress.
          </p>

          <div className="mt-8">
            <SavingsGoalForm />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}