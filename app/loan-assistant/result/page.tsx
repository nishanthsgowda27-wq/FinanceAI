import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import LoanResult from "@/components/loan/loan-result";
import EmiBreakdown from "@/components/loan/emi-breakdown";
import LoanComparison from "@/components/loan/loan-comparison";
import LoanAffordability from "@/components/loan/loan-affordability";
import LoanAdvice from "@/components/loan/loan-advice";

export default function LoanResultPage() {
  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <header className="border-b bg-white px-6 py-5">
          <h1 className="text-2xl font-bold">
            Loan Analysis
          </h1>
        </header>

        <main className="space-y-6 p-6">
          <Link
            href="/loan-assistant"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            Calculate Again
          </Link>

          <div className="grid gap-6 lg:grid-cols-2">
            <LoanResult />
            <EmiBreakdown />
          </div>

          <LoanComparison />

          <LoanAffordability />

          <LoanAdvice />
        </main>
      </div>
    </DashboardLayout>
  );
}