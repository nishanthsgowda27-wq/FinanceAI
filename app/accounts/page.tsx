import Link from "next/link";
import { Plus, ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import AccountList from "@/components/accounts/account-list";

export default function AccountsPage() {
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
                My Accounts
              </h1>
            </div>

            <Link
              href="/accounts/create"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Account
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

          <AccountList />
        </main>
      </div>
    </DashboardLayout>
  );
}