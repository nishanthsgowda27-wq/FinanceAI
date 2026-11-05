import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import SavingsCard from "@/components/savings/savings-card";

const goals = [
  {
    id: 1,
    name: "Emergency Fund",
    saved: 45000,
    target: 100000,
    deadline: "Dec 2026",
  },
  {
    id: 2,
    name: "New Laptop",
    saved: 35000,
    target: 75000,
    deadline: "Oct 2026",
  },
  {
    id: 3,
    name: "Vacation",
    saved: 20000,
    target: 60000,
    deadline: "Mar 2027",
  },
];

export default function SavingsPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <header className="border-b bg-white px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Finance</p>

              <h1 className="mt-1 text-2xl font-bold">
                Savings Goals
              </h1>
            </div>

            <Link
              href="/savings/create"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Goal
            </Link>
          </div>
        </header>

        <main className="space-y-6 p-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <div className="grid gap-5 md:grid-cols-2">
            {goals.map((goal) => (
              <SavingsCard
                key={goal.id}
                name={goal.name}
                saved={goal.saved}
                target={goal.target}
                deadline={goal.deadline}
              />
            ))}
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}