import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import RegisterForm from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">

        <div className="hidden items-center justify-center bg-blue-600 p-12 lg:flex">
          <div className="max-w-md text-white">

            <Link
              href="/"
              className="mb-12 inline-flex items-center gap-2 text-blue-100 hover:text-white"
            >
              <ArrowLeft size={18} />
              Back to FinanceAI
            </Link>

            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles size={28} />
            </div>

            <h1 className="text-5xl font-bold leading-tight">
              Start your
              <span className="block text-blue-200">
                financial journey.
              </span>
            </h1>

            <p className="mt-6 leading-8 text-blue-100">
              Build better financial habits with expense
              tracking, budgets, tax planning, loan analysis
              and AI-powered recommendations.
            </p>

          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-12">

          <div className="w-full max-w-md">

            <div className="mb-8 lg:hidden">

              <Link
                href="/"
                className="text-2xl font-bold text-blue-600"
              >
                FinanceAI
              </Link>

            </div>

            <div className="mb-8">

              <h1 className="text-3xl font-bold text-gray-900">
                Create Your Account
              </h1>

              <p className="mt-2 text-gray-500">
                Start managing your finances smarter.
              </p>

            </div>

            <RegisterForm />

          </div>

        </div>

      </div>
    </main>
  );
}