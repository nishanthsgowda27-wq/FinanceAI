import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Wallet,
  ReceiptIndianRupee,
  Landmark,
  Sparkles,
  TrendingUp,
  PieChart,
  CheckCircle2,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      {/* NAVBAR */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-3 font-bold"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
            <Wallet size={22} />
          </div>

          <div>
            <p className="text-lg">FinanceAI</p>
            <p className="text-xs font-normal text-slate-400">
              Smart Money Management
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>

          <Link href="/tax-assistant" className="hover:text-white">
            Tax
          </Link>

          <Link href="/loan-assistant" className="hover:text-white">
            Loans
          </Link>

        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/finance-ai"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-white/10 hover:text-white"
          >
            <Sparkles size={15} />
            Finance AI
          </Link>

          <Link
            href="/login"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 sm:block"
          >
            Login
          </Link>

          <Link
            href="/finance"
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[140px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 lg:grid-cols-2 lg:pt-24">
          
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              <Sparkles size={16} />
              AI Powered Personal Finance
            </div>

            <h1 className="mt-7 text-5xl font-black leading-tight tracking-tight md:text-6xl">
              Take Control of
              <span className="block bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                Your Money.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-400">
              Enter your profession, annual income and expenses.
              FinanceAI helps you understand your estimated tax,
              savings, spending and suitable loan options.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/finance"
                className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-7 py-4 font-bold text-white transition hover:bg-blue-500"
              >
                Start My Finance Profile
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 px-7 py-4 font-bold text-white transition hover:bg-slate-800"
              >
                View Dashboard
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-400" />
                Track expenses
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-400" />
                Estimate tax
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-green-400" />
                Calculate EMI
              </div>
            </div>
          </div>

          {/* RIGHT DASHBOARD PREVIEW */}
          <div className="relative">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">

              <div className="rounded-2xl bg-slate-900 p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">
                      Your Financial Overview
                    </p>

                    <h2 className="mt-2 text-2xl font-bold">
                      Financial Dashboard
                    </h2>
                  </div>

                  <div className="rounded-xl bg-blue-500/20 p-3 text-blue-400">
                    <BarChart3 size={24} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <PreviewCard
                    title="Income"
                    value="Your Income"
                    icon={<TrendingUp size={20} />}
                  />

                  <PreviewCard
                    title="Expenses"
                    value="Track Monthly"
                    icon={<ReceiptIndianRupee size={20} />}
                  />

                  <PreviewCard
                    title="Tax"
                    value="Estimate Tax"
                    icon={<PieChart size={20} />}
                  />

                  <PreviewCard
                    title="Savings"
                    value="Your Savings"
                    icon={<Wallet size={20} />}
                  />
                </div>

                {/* GRAPH PREVIEW */}
                <div className="mt-5 rounded-2xl bg-slate-800 p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      Monthly Financial Growth
                    </p>

                    <TrendingUp
                      size={20}
                      className="text-green-400"
                    />
                  </div>

                  <div className="mt-6 flex h-32 items-end justify-between gap-2">
                    {[35, 55, 45, 75, 60, 90, 80].map(
                      (height, index) => (
                        <div
                          key={index}
                          className="flex-1 rounded-t-lg bg-gradient-to-t from-blue-700 to-cyan-400"
                          style={{
                            height: `${height}%`,
                          }}
                        />
                      )
                    )}
                  </div>
                </div>

              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-xl md:block">
              <p className="text-sm text-slate-400">
                Smart Finance Analysis
              </p>

              <p className="mt-1 text-xl font-bold text-green-400">
                AI Powered
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-24 text-slate-900">
        <div className="mx-auto max-w-7xl px-6">

          <div className="mx-auto max-w-2xl text-center">
            <p className="font-bold text-blue-600">
              EVERYTHING IN ONE PLACE
            </p>

            <h2 className="mt-3 text-4xl font-black">
              Your Complete Finance Assistant
            </h2>

            <p className="mt-4 text-slate-600">
              Manage income, expenses, tax, savings and loans
              from one organized platform.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">

            <FeatureCard
              icon={<Wallet size={26} />}
              title="Expense Tracking"
              text="Enter monthly expenses and understand where your money goes."
            />

            <FeatureCard
              icon={<ReceiptIndianRupee size={26} />}
              title="Tax Assistant"
              text="Estimate your tax based on your financial details."
            />

            <FeatureCard
              icon={<Landmark size={26} />}
              title="Loan Assistant"
              text="Explore suitable loan types and calculate EMI."
            />

            <FeatureCard
              icon={<BarChart3 size={26} />}
              title="Financial Reports"
              text="Visualize income, expenses and savings with graphs."
            />

          </div>
        </div>
      </section>

      {/* TAX + LOAN SECTION */}
      <section className="bg-slate-50 py-24 text-slate-900">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-2">

          {/* TAX */}
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white md:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <ReceiptIndianRupee size={28} />
            </div>

            <h2 className="mt-7 text-3xl font-black">
              Smart Tax Assistant
            </h2>

            <p className="mt-4 leading-7 text-blue-100">
              Enter your profession and annual income.
              Get an estimated tax calculation and financial
              information based on the data you provide.
            </p>

            <Link
              href="/finance"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-blue-700"
            >
              Calculate My Tax
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* LOAN */}
          <div className="rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-800 p-8 text-white md:p-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
              <Landmark size={28} />
            </div>

            <h2 className="mt-7 text-3xl font-black">
              Find the Right Loan
            </h2>

            <p className="mt-4 leading-7 text-purple-100">
              Explore vehicle loans, home loans, agriculture loans
              and professional loans. Calculate EMI based on
              amount, interest and tenure.
            </p>

            <Link
              href="/loan-assistant"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-purple-700"
            >
              Explore Loans
              <ArrowRight size={18} />
            </Link>
          </div>

        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-slate-950 px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">

          <h2 className="text-4xl font-black">
            Ready to Understand Your Finances?
          </h2>

          <p className="mt-5 text-lg text-slate-400">
            Start by entering your profession, annual income
            and monthly expenses.
          </p>

          <Link
            href="/finance"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white hover:bg-blue-500"
          >
            Start Now
            <ArrowRight size={20} />
          </Link>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-8 text-center text-sm text-slate-500">
        © 2026 FinanceAI — Smart Personal Finance Management
      </footer>
    </main>
  );
}

function PreviewCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-800 p-4">
      <div className="text-blue-400">
        {icon}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        {title}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:-translate-y-1 hover:shadow-xl">

      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <h3 className="mt-6 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}