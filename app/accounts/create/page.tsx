import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import AccountForm from "@/components/accounts/account-form";

export default function CreateAccountPage() {
  return (
    <DashboardLayout>
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/accounts"
            className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Back to Accounts
          </Link>

          <h1 className="text-3xl font-bold">
            Add New Account
          </h1>

          <p className="mt-2 text-gray-500">
            Add a bank, savings, current or cash account.
          </p>

          <div className="mt-8">
            <AccountForm />
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}