import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-6 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-blue-100 hover:text-white">
              <ArrowLeft size={18} /> Back to FinanceAI
            </Link>
            <div className="mt-16 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Sparkles size={28} />
            </div>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight">Take control of your finances.</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-blue-100">
              Track expenses, plan taxes, and make smarter financial decisions with FinanceAI.
            </p>
          </div>
          <p className="text-sm text-blue-100">Secure email verification protects your account.</p>
        </div>

        <div className="flex items-center justify-center p-8 sm:p-12">
          <div className="w-full max-w-md">
            <Link href="/" className="text-2xl font-bold text-blue-600 lg:hidden">FinanceAI</Link>
            <div className="mb-8 mt-8 lg:mt-0">
              <p className="font-semibold uppercase tracking-wider text-blue-600">Welcome Back</p>
              <h2 className="mt-2 text-4xl font-extrabold text-slate-900">Sign In</h2>
              <p className="mt-3 text-slate-500">Sign in to continue to your FinanceAI account.</p>
            </div>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}
