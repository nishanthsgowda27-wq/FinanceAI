"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/auth-guard";
import FinanceAnalytics from "@/components/dashboard/finance-analytics";
import AccountControls from "@/components/layout/account-controls";
import { useApp } from "@/components/providers/app-provider";

type Transaction = {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: "income" | "expense";
};

type Profile = {
  name?: string;
  profession?: string;
  annualIncome?: number | string;
  monthlyIncome?: number | string;
  monthlyExpenses?: number | string;

  // Supports older saved data too
  income?: number | string;
  incomeAmount?: number | string;
  yearlyIncome?: number | string;
  monthlySalary?: number | string;
};
type ServerAnalysis = { savings: number; savingsRate: number; score: number; status: string };

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
};

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useApp();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [serverAnalysis, setServerAnalysis] = useState<ServerAnalysis | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadError(false);
        const response = await fetch(`/api/dashboard?month=${encodeURIComponent(selectedMonth)}`, { cache: "no-store" });
        const data = await response.json();
        if (response.status === 401 || data?.message === "Please sign in.") {
          router.replace("/login");
          return;
        }
        if (!response.ok || !data.success) {
          setLoadError(true);
          return;
        }
        setProfile(data.profile);
        setTransactions(data.transactions ?? []);
        setServerAnalysis(data.analysis ?? null);
      } catch {
        setLoadError(true);
      }
    };
    void load();
    const handler = () => void load();
    window.addEventListener("financeDataUpdated", handler);
    return () => window.removeEventListener("financeDataUpdated", handler);
  }, [router, selectedMonth, retryCount]);

  const analysis = useMemo(() => {
    /*
      Get annual income from any possible
      field used in your finance page.
    */

    const monthTransactions = transactions.filter((item) => item.date?.slice(0, 7) === selectedMonth);

    const annualIncome = Number(
      profile?.annualIncome ||
        profile?.income ||
        profile?.incomeAmount ||
        profile?.yearlyIncome ||
        0
    );

    /*
      Get monthly income directly if available.
      Otherwise calculate from annual income.
    */

    const savedMonthlyIncome = Number(
      profile?.monthlyIncome ||
        profile?.monthlySalary ||
        0
    );

    const monthlyIncome =
      savedMonthlyIncome > 0
        ? savedMonthlyIncome
        : annualIncome > 0
        ? annualIncome / 12
        : 0;

    /*
      Calculate total expenses from
      REAL transactions only.
    */

    const totalExpenses = monthTransactions.reduce(
      (sum, item) => {
        return (
          sum + Number(item.amount || 0)
        );
      },
      0
    );

    /*
      Savings calculation
    */

    const savings = serverAnalysis?.savings ?? monthlyIncome - totalExpenses;

    /*
      Expense percentage
    */

    const expensePercentage =
      monthlyIncome > 0
        ? (totalExpenses / monthlyIncome) * 100
        : 0;

    /*
      Savings percentage
    */

    const savingsPercentage = serverAnalysis?.savingsRate ?? (
      monthlyIncome > 0
        ? (Math.max(0, savings) /
            monthlyIncome) *
          100
        : 0);

    /*
      Financial health score
      Only calculated when real data exists.
    */

    let financialScore = serverAnalysis?.score ?? 0;

    if (!serverAnalysis && monthlyIncome > 0) {
      if (transactions.length === 0) {
        financialScore = 0;
      } else {
        financialScore = Math.round(
          Math.min(
            100,
            savingsPercentage * 2 +
              Math.max(
                0,
                40 - expensePercentage * 0.2
              )
          )
        );
      }
    }

    let health = serverAnalysis?.status ?? "No financial data";

    if (!serverAnalysis && monthlyIncome > 0 &&
        transactions.length > 0) {

      if (financialScore >= 80) {
        health = "Excellent";
      } else if (financialScore >= 60) {
        health = "Good";
      } else if (financialScore >= 40) {
        health = "Needs Improvement";
      } else {
        health = "Poor";
      }
    } else if (monthlyIncome > 0) {
      health = "Add expenses for analysis";
    }

    /*
      Category calculations
    */

    const categoryTotals: Record<
      string,
      number
    > = {};

    monthTransactions.forEach((item) => {
      const category =
        item.category || "Other";

      const amount =
        Number(item.amount || 0);

      categoryTotals[category] =
        (categoryTotals[category] || 0) +
        amount;
    });

    const categories = Object.entries(
      categoryTotals
    )
      .map(([name, value]) => ({
        name,
        value,
        percentage:
          totalExpenses > 0
            ? (value / totalExpenses) * 100
            : 0,
      }))
      .sort(
        (a, b) => b.value - a.value
      );

    return {
      annualIncome,
      monthlyIncome,
      totalExpenses,
      savings,
      expensePercentage,
      savingsPercentage,
      financialScore,
      health,
      categories,
    };
  }, [profile, transactions, serverAnalysis, selectedMonth]);

  const getAdvice = () => {
    if (analysis.monthlyIncome <= 0) {
      return "Add your income details in the Finance Profile section. Your dashboard will then calculate monthly income, savings, tax estimates and financial analysis.";
    }

    if (transactions.length === 0) {
      return "Your income has been added successfully. Now add your real monthly expenses so the system can analyse your spending and suggest where you can save money.";
    }

    if (analysis.savings < 0) {
      return `Your expenses are higher than your monthly income. You are overspending by ${formatCurrency(
        Math.abs(analysis.savings)
      )}. Review your highest spending categories immediately.`;
    }

    if (analysis.savingsPercentage < 10) {
      return `You are currently saving ${formatCurrency(
        analysis.savings
      )} per month. Try reducing non-essential expenses and aim to save at least 20% of your monthly income.`;
    }

    if (analysis.savingsPercentage < 25) {
      return `You are saving ${analysis.savingsPercentage.toFixed(
        1
      )}% of your monthly income. This is a good start, but try increasing your savings towards 25–30%.`;
    }

    return `Excellent financial discipline! You are saving ${analysis.savingsPercentage.toFixed(
      1
    )}% of your monthly income. Consider keeping an emergency fund and planning for long-term financial goals.`;
  };

  const maxCategoryValue =
    analysis.categories.length > 0
      ? analysis.categories[0].value
      : 1;

  return (
    <AuthGuard>
    <div className="min-h-screen bg-slate-950 text-white">

      <div className="flex min-h-screen">

        {/* ========================= */}
        {/* LEFT SIDEBAR */}
        {/* ========================= */}

        <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-900 lg:flex">

          <div className="border-b border-slate-800 p-7">

            <Link
              href="/dashboard"
              className="flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold">
                ₹
              </div>

              <div>
                <h1 className="text-xl font-bold">
                  FinanceAI
                </h1>

                <p className="text-xs text-slate-400">
                  Smart Financial Assistant
                </p>
              </div>
            </Link>

          </div>

          <nav className="flex-1 space-y-2 p-5">

            <Link
              href="/dashboard"
              className="flex items-center gap-4 rounded-xl bg-blue-600 px-5 py-4 font-semibold"
            >
              <span className="text-xl">🏠</span>
              Overview
            </Link>

            <Link
              href="/finance"
              className="flex items-center gap-4 rounded-xl px-5 py-4 text-slate-300 transition hover:bg-slate-800"
            >
              <span className="text-xl">💰</span>
              Finance Profile
            </Link>

            <Link
              href="/expenses"
              className="flex items-center gap-4 rounded-xl px-5 py-4 text-slate-300 transition hover:bg-slate-800"
            >
              <span className="text-xl">💳</span>
              Expenses
            </Link>

            <Link
              href="/tax-assistant"
              className="flex items-center gap-4 rounded-xl px-5 py-4 text-slate-300 transition hover:bg-slate-800"
            >
              <span className="text-xl">📊</span>
              Tax Assistant
            </Link>

            <Link
              href="/loan-assistant"
              className="flex items-center gap-4 rounded-xl px-5 py-4 text-slate-300 transition hover:bg-slate-800"
            >
              <span className="text-xl">🏦</span>
              Loan Assistant
            </Link>

            <Link
              href="/finance-ai"
              className="flex items-center gap-4 rounded-xl px-5 py-4 text-slate-300 transition hover:bg-slate-800"
            >
              <span className="text-xl">✨</span>
              Finance AI
            </Link>

            <Link
              href="/reports"
              className="flex items-center gap-4 rounded-xl px-5 py-4 text-slate-300 transition hover:bg-slate-800"
            >
              <span className="text-xl">📄</span>
              Reports
            </Link>

          </nav>

        </aside>

        {/* ========================= */}
        {/* MAIN CONTENT */}
        {/* ========================= */}

        <main className="flex-1 overflow-x-hidden">

          {/* HEADER */}

          <header className="border-b border-slate-800 bg-slate-900 px-5 py-5 md:px-8">

            <div className="mx-auto flex max-w-7xl items-center justify-between">

              <div>

                <p className="text-sm text-slate-400">
                  {t("dashboard.title").toUpperCase()}
                </p>

                <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                  {t("dashboard.welcome")}
                  {profile?.name
                    ? `, ${profile.name}`
                    : ""}
                  👋
                </h1>

                <p className="mt-1 text-sm text-slate-400">
                  Track and understand your financial activity.
                </p>

              </div>

              <div className="flex items-center gap-3">
                <Link href="/finance" className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold hover:bg-blue-500">{t("dashboard.updateProfile")}</Link>
                <AccountControls dark />
              </div>

            </div>

          </header>

          <div className="mx-auto max-w-7xl p-5 md:p-8">

            {loadError && (
              <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-5 py-4 text-amber-100">
                <p>Unable to load dashboard data. Please try again shortly.</p>
                <button
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                  className="rounded-lg border border-amber-200/40 px-4 py-2 text-sm font-semibold transition hover:bg-amber-200/10"
                >
                  Try again
                </button>
              </div>
            )}

            {/* HERO */}

            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-7">

              <div className="relative z-10 max-w-2xl">

                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <label className="rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm text-white backdrop-blur-sm">
                    <span className="mr-2 text-blue-100">Month</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value || new Date().toISOString().slice(0, 7))}
                      className="rounded-lg border-0 bg-transparent text-white outline-none"
                    />
                  </label>
                </div>

                <p className="text-sm font-semibold text-blue-100">
                  SMART FINANCE DASHBOARD
                </p>

                <h2 className="mt-3 text-3xl font-bold md:text-4xl">
                  Take control of your money.
                </h2>

                <p className="mt-4 leading-7 text-blue-100">
                  Analyse your real income, monthly expenses,
                  savings, estimated tax and loan eligibility
                  from one dashboard.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">

                  <Link
                    href="/expenses"
                    className="rounded-xl bg-white px-5 py-3 font-semibold text-blue-700"
                  >
                    Add Expenses
                  </Link>

                  <Link
                    href="/tax-assistant"
                    className="rounded-xl border border-white/40 px-5 py-3 font-semibold"
                  >
                    Calculate Tax
                  </Link>

                  <Link
                    href="/finance-ai"
                    className="rounded-xl border border-white/40 px-5 py-3 font-semibold transition hover:bg-white/10"
                  >
                    {t("dashboard.askFinanceAi")}
                  </Link>

                </div>

              </div>

              <div className="absolute right-8 top-8 hidden text-8xl opacity-30 md:block">
                📈
              </div>

            </div>

            {/* ========================= */}
            {/* FINANCIAL CARDS */}
            {/* ========================= */}

            <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

              {/* Annual Income */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-slate-400">
                    {t("dashboard.annualIncome")}
                  </p>

                  <span className="rounded-xl bg-green-500/20 p-3">
                    💰
                  </span>

                </div>

                <h2 className="mt-5 text-2xl font-bold">

                  {analysis.annualIncome > 0
                    ? formatCurrency(
                        analysis.annualIncome
                      )
                    : "₹0"}

                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  From your finance profile
                </p>

              </div>

              {/* Monthly Income */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-slate-400">
                    {t("dashboard.monthlyIncome")}
                  </p>

                  <span className="rounded-xl bg-blue-500/20 p-3">
                    📅
                  </span>

                </div>

                <h2 className="mt-5 text-2xl font-bold">

                  {analysis.monthlyIncome > 0
                    ? formatCurrency(
                        analysis.monthlyIncome
                      )
                    : "₹0"}

                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Annual income ÷ 12
                </p>

              </div>

              {/* Expenses */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-slate-400">
                    {t("dashboard.monthlyExpenses")}
                  </p>

                  <span className="rounded-xl bg-red-500/20 p-3">
                    💳
                  </span>

                </div>

                <h2 className="mt-5 text-2xl font-bold">

                  {formatCurrency(
                    analysis.totalExpenses
                  )}

                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  {transactions.length} real transaction
                  {transactions.length !== 1
                    ? "s"
                    : ""}
                </p>

              </div>

              {/* Savings */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                <div className="flex items-center justify-between">

                  <p className="text-slate-400">
                    {t("dashboard.monthlySavings")}
                  </p>

                  <span className="rounded-xl bg-purple-500/20 p-3">
                    🏦
                  </span>

                </div>

                <h2 className="mt-5 text-2xl font-bold">

                  {analysis.monthlyIncome > 0
                    ? formatCurrency(
                        analysis.savings
                      )
                    : "₹0"}

                </h2>

                <p className="mt-2 text-sm text-slate-500">

                  {analysis.monthlyIncome > 0
                    ? `${analysis.savingsPercentage.toFixed(
                        1
                      )}% saved`
                    : "Add income first"}

                </p>

              </div>

            </div>

            <section className="mt-7 overflow-hidden rounded-3xl border border-indigo-400/30 bg-indigo-950 p-7 shadow-xl shadow-indigo-950/20">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl">
                      ✨
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-300">Finance AI</p>
                  </div>
                  <h2 className="mt-4 text-2xl font-bold md:text-3xl">{t("dashboard.financeAiTitle")}</h2>
                  <p className="mt-3 leading-7 text-indigo-100/80">
                    Ask questions about your real spending, savings, tax estimate, loans and financial health in one focused workspace.
                  </p>
                </div>
                <Link
                  href="/finance-ai"
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white px-5 py-3 font-semibold text-indigo-900 transition hover:bg-indigo-50"
                >
                  {t("dashboard.openFinanceAi")} →
                </Link>
              </div>
            </section>

            <FinanceAnalytics monthlyIncome={analysis.monthlyIncome} selectedMonth={selectedMonth} />

            {/* ========================= */}
            {/* EXPENSE ANALYSIS */}
            {/* ========================= */}

            <div className="mt-7 grid gap-6 xl:grid-cols-3">

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 xl:col-span-2">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-sm text-slate-400">
                      EXPENSE ANALYSIS
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Where your money is going
                    </h2>

                  </div>

                  <Link
                    href="/expenses"
                    className="text-sm font-semibold text-blue-400"
                  >
                    Manage →
                  </Link>

                </div>

                {analysis.categories.length === 0 ? (

                  <div className="flex min-h-[350px] flex-col items-center justify-center text-center">

                    <div className="text-6xl">
                      📊
                    </div>

                    <h3 className="mt-5 text-xl font-bold">
                      No Expense Data Yet
                    </h3>

                    <p className="mt-2 text-slate-400">
                      Add your real expenses to see financial analysis.
                    </p>

                  </div>

                ) : (

                  <div className="mt-8 space-y-6">

                    {analysis.categories.map(
                      (category, index) => {

                        const width =
                          (category.value /
                            maxCategoryValue) *
                          100;

                        const icons = [
                          "🍔",
                          "🏠",
                          "🚗",
                          "🛍️",
                          "💡",
                          "📦",
                        ];

                        return (

                          <div
                            key={category.name}
                          >

                            <div className="flex items-center justify-between">

                              <div className="flex items-center gap-3">

                                <span className="text-xl">
                                  {
                                    icons[
                                      index %
                                        icons.length
                                    ]
                                  }
                                </span>

                                <span className="font-medium">
                                  {category.name}
                                </span>

                              </div>

                              <div className="text-right">

                                <span className="font-semibold">
                                  {formatCurrency(
                                    category.value
                                  )}
                                </span>

                                <span className="ml-2 text-sm text-slate-500">
                                  {category.percentage.toFixed(
                                    1
                                  )}
                                  %
                                </span>

                              </div>

                            </div>

                            <div className="mt-3 h-3 rounded-full bg-slate-800">

                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                                style={{
                                  width: `${width}%`,
                                }}
                              />

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>

                )}

              </div>

              {/* FINANCIAL HEALTH */}

              <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">

                <p className="text-sm text-slate-400">
                  FINANCIAL HEALTH
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Your Money Score
                </h2>

                {analysis.monthlyIncome > 0 &&
                transactions.length > 0 ? (

                  <div className="mt-8 text-center">

                    <div className="relative mx-auto h-48 w-48">

                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(
                            #2563eb ${
                              analysis.financialScore *
                              3.6
                            }deg,
                            #1e293b 0deg
                          )`,
                        }}
                      />

                      <div className="absolute inset-4 flex items-center justify-center rounded-full bg-slate-900">

                        <div>

                          <p className="text-4xl font-bold">
                            {analysis.financialScore}
                          </p>

                          <p className="text-sm text-slate-400">
                            out of 100
                          </p>

                        </div>

                      </div>

                    </div>

                    <h3 className="mt-6 text-xl font-bold">
                      {analysis.health}
                    </h3>

                  </div>

                ) : (

                  <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                    <div className="text-6xl">
                      ❤️
                    </div>

                    <p className="mt-5 text-slate-400">
                      Add income and real expenses to calculate your financial health.
                    </p>

                  </div>

                )}

              </div>

            </div>

            {/* AI ADVICE */}

            <div className="mt-7 rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950 to-slate-900 p-7">

              <div className="flex items-start gap-5">

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl">
                  🤖
                </div>

                <div>

                  <p className="text-sm font-semibold text-indigo-400">
                    AI FINANCIAL ADVICE
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Personalised Saving Suggestion
                  </h2>

                  <p className="mt-3 leading-7 text-slate-300">
                    {getAdvice()}
                  </p>

                </div>

              </div>

            </div>

            {/* QUICK ACTIONS */}

            <div className="mt-7">

              <h2 className="text-2xl font-bold">
                Financial Tools
              </h2>

              <div className="mt-5 grid gap-5 md:grid-cols-3">

                <Link
                  href="/tax-assistant"
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
                >

                  <div className="text-4xl">
                    📊
                  </div>

                  <h3 className="mt-4 text-xl font-bold">
                    Tax Assistant
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Calculate estimated income tax based on your financial information.
                  </p>

                </Link>

                <Link
                  href="/loan-assistant"
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-green-500"
                >

                  <div className="text-4xl">
                    🏦
                  </div>

                  <h3 className="mt-4 text-xl font-bold">
                    Loan Assistant
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    Check loan eligibility and estimated EMI.
                  </p>

                </Link>

                <Link
                  href="/reports"
                  className="rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-purple-500"
                >

                  <div className="text-4xl">
                    📄
                  </div>

                  <h3 className="mt-4 text-xl font-bold">
                    Reports
                  </h3>

                  <p className="mt-2 text-sm text-slate-400">
                    View your complete financial summary.
                  </p>

                </Link>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
    </AuthGuard>
  );
}