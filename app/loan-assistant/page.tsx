"use client";

import { useEffect, useState } from "react";
import {
  Car,
  Bike,
  Home,
  UserRound,
  Wheat,
  Calculator,
  CheckCircle,
  AlertTriangle,
  IndianRupee,
  Calendar,
} from "lucide-react";
import AuthGuard from "@/components/auth/auth-guard";
import AccountControls from "@/components/layout/account-controls";
import { useApp } from "@/components/providers/app-provider";

type LoanType =
  | "Car Loan"
  | "Bike Loan"
  | "Home Loan"
  | "Personal Loan"
  | "Farmer Loan";

type FinanceData = {
  annualIncome?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
};

const loanOptions = [
  {
    name: "Car Loan" as LoanType,
    description: "Finance your dream car",
    icon: Car,
    image:
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Bike Loan" as LoanType,
    description: "Get your dream motorcycle",
    icon: Bike,
    image:
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Home Loan" as LoanType,
    description: "Plan your dream home",
    icon: Home,
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Personal Loan" as LoanType,
    description: "Flexible loan for personal needs",
    icon: UserRound,
    image:
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Farmer Loan" as LoanType,
    description: "Agricultural finance based on acres",
    icon: Wheat,
    image:
      "https://images.unsplash.com/photo-1500076656116-558758c991c1?auto=format&fit=crop&w=1200&q=80",
  },
];

const formatINR = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
};

export default function LoanAssistantPage() {
  const { t } = useApp();
  const [selectedLoan, setSelectedLoan] =
    useState<LoanType>("Car Loan");

  const [monthlyIncome, setMonthlyIncome] =
    useState(0);

  const [monthlyExpenses, setMonthlyExpenses] =
    useState(0);

  const [loanAmount, setLoanAmount] =
    useState(500000);

  const [interestRate, setInterestRate] =
    useState(9);

  const [tenureYears, setTenureYears] =
    useState(5);

  const [cibilScore, setCibilScore] = useState(750);

  const [acres, setAcres] = useState(1);

  const [costPerAcre, setCostPerAcre] =
    useState(50000);

  const [crop, setCrop] = useState("Rice");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      fetch("/api/profile", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then(async (result) => {
          const data = result?.profile as FinanceData | null;
          if (!data) return;
          if (data.monthlyIncome) setMonthlyIncome(Number(data.monthlyIncome));
          else if (data.annualIncome) setMonthlyIncome(Number(data.annualIncome) / 12);
          const dashboardResponse = await fetch("/api/dashboard", { cache: "no-store" });
          const dashboard = dashboardResponse.ok ? await dashboardResponse.json() : null;
          if (dashboard?.analysis?.monthlyExpenses !== undefined) setMonthlyExpenses(Number(dashboard.analysis.monthlyExpenses));
        });
    } catch (error) {
      console.error(
        "Unable to load finance data",
        error
      );
    }
  }, []);

  async function saveLoanAnalysis() {
    setSaving(true);
    setSaveMessage("");
    try {
      const response = await fetch("/api/loans/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ loanType: selectedLoan, loanAmount: actualLoanAmount, interestRate, tenureYears, cibilScore, affordable: isAffordable }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save loan analysis");
      setSaveMessage(data.analysis.approvalStatus === "approved" ? "Loan application is eligible and saved to your account." : "Loan application saved and requires review.");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "Unable to save loan analysis.");
    } finally {
      setSaving(false);
    }
  }

  const farmerLoanAmount =
    acres * costPerAcre;

  const actualLoanAmount =
    selectedLoan === "Farmer Loan"
      ? farmerLoanAmount
      : loanAmount;

  const monthlyRate =
    interestRate / 12 / 100;

  const numberOfMonths =
    tenureYears * 12;

  let emi = 0;

  if (
    actualLoanAmount > 0 &&
    numberOfMonths > 0
  ) {
    if (monthlyRate === 0) {
      emi =
        actualLoanAmount /
        numberOfMonths;
    } else {
      const power = Math.pow(
        1 + monthlyRate,
        numberOfMonths
      );

      emi =
        (actualLoanAmount *
          monthlyRate *
          power) /
        (power - 1);
    }
  }

  const totalPayment =
    emi * numberOfMonths;

  const totalInterest =
    totalPayment - actualLoanAmount;

  const availableMoney =
    monthlyIncome - monthlyExpenses;

  const recommendedEmi =
    Math.max(0, availableMoney * 0.4);

  const isAffordable =
    emi <= recommendedEmi &&
    monthlyIncome > 0;

  const meetsCibilRequirement = cibilScore >= 750;
  const isEligible = meetsCibilRequirement && isAffordable;

  const affordabilityPercentage =
    monthlyIncome > 0
      ? (emi / monthlyIncome) * 100
      : 0;

  const selectLoan = (
    loan: LoanType
  ) => {
    setSelectedLoan(loan);

    if (loan === "Car Loan") {
      setLoanAmount(800000);
      setInterestRate(9);
      setTenureYears(5);
    }

    if (loan === "Bike Loan") {
      setLoanAmount(150000);
      setInterestRate(10);
      setTenureYears(3);
    }

    if (loan === "Home Loan") {
      setLoanAmount(3000000);
      setInterestRate(8.5);
      setTenureYears(20);
    }

    if (loan === "Personal Loan") {
      setLoanAmount(500000);
      setInterestRate(12);
      setTenureYears(5);
    }

    if (loan === "Farmer Loan") {
      setInterestRate(7);
      setTenureYears(3);
    }
  };

  return (
    <AuthGuard>
    <main className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
          <p className="font-semibold text-blue-600">
            {t("loan.title").toUpperCase()}
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-5xl">
            Find the Right Loan for You
          </h1>

          <p className="mt-3 text-slate-600">
            Calculate EMI and check whether
            the loan is affordable based on
            your income and expenses.
          </p>
          </div>
          <AccountControls />
        </div>

        {/* INCOME OVERVIEW */}

        <div className="mb-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-6 text-white shadow-lg">
            <p className="text-blue-100">
              Monthly Income
            </p>

            <h2 className="mt-3 text-3xl font-bold">
              {formatINR(monthlyIncome)}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <p className="text-slate-500">
              Monthly Expenses
            </p>

            <h2 className="mt-3 text-3xl font-bold text-red-500">
              {formatINR(monthlyExpenses)}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow">
            <p className="text-slate-500">
              Available After Expenses
            </p>

            <h2 className="mt-3 text-3xl font-bold text-green-600">
              {formatINR(
                Math.max(0, availableMoney)
              )}
            </h2>
          </div>

        </div>

        {/* LOAN CARDS */}

        <h2 className="mb-5 text-2xl font-bold">
          Choose Your Loan
        </h2>

        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {loanOptions.map((loan) => {
            const Icon = loan.icon;

            const active =
              selectedLoan === loan.name;

            return (
              <button
                key={loan.name}
                onClick={() =>
                  selectLoan(loan.name)
                }
                className={`overflow-hidden rounded-3xl border text-left transition hover:-translate-y-1 hover:shadow-xl ${
                  active
                    ? "border-blue-600 ring-4 ring-blue-100"
                    : "border-slate-200"
                }`}
              >
                <div className="relative h-44 overflow-hidden">

                  <img
                    src={loan.image}
                    alt={loan.name}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-white">
                    <Icon size={28} />

                    <span className="text-xl font-bold">
                      {loan.name}
                    </span>
                  </div>

                </div>

                <div className="bg-white p-5">
                  <p className="text-slate-500">
                    {loan.description}
                  </p>
                </div>

              </button>
            );
          })}

        </div>

        {/* MAIN CALCULATOR */}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* INPUT */}

          <div className="rounded-3xl bg-white p-6 shadow-lg md:p-8">

            <div className="mb-6 flex items-center gap-3">
              <Calculator className="text-blue-600" />

              <h2 className="text-2xl font-bold">
                {selectedLoan} Calculator
              </h2>
            </div>

            {selectedLoan === "Farmer Loan" ? (
              <div className="space-y-5">

                <div>
                  <label className="font-medium">
                    Crop Type
                  </label>

                  <select
                    value={crop}
                    onChange={(e) =>
                      setCrop(e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                  >
                    <option>Rice</option>
                    <option>Wheat</option>
                    <option>Cotton</option>
                    <option>Sugarcane</option>
                    <option>Vegetables</option>
                    <option>Other Crop</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium">
                    Number of Acres
                  </label>

                  <input
                    type="number"
                    min="1"
                    value={acres}
                    onChange={(e) =>
                      setAcres(
                        Number(e.target.value) || 0
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>

                <div>
                  <label className="font-medium">
                    Estimated Cost Per Acre
                  </label>

                  <input
                    type="number"
                    value={costPerAcre}
                    onChange={(e) =>
                      setCostPerAcre(
                        Number(e.target.value) || 0
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>

                <div className="rounded-2xl bg-green-50 p-5">
                  <p className="text-green-700">
                    Estimated Agricultural
                    Loan Requirement
                  </p>

                  <h3 className="mt-2 text-3xl font-bold text-green-700">
                    {formatINR(farmerLoanAmount)}
                  </h3>

                  <p className="mt-2 text-sm text-green-700">
                    {acres} acres ×{" "}
                    {formatINR(costPerAcre)}
                  </p>
                </div>

              </div>
            ) : (
              <div className="space-y-5">

                <div>
                  <label className="font-medium">
                    Loan Amount
                  </label>

                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) =>
                      setLoanAmount(
                        Number(e.target.value) || 0
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 p-3"
                  />
                </div>

              </div>
            )}

            {/* COMMON INPUTS */}

            <div className="mt-5">
              <label className="font-medium">
                Interest Rate (% per year)
              </label>

              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) =>
                  setInterestRate(
                    Number(e.target.value) || 0
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 p-3"
              />
            </div>

            <div className="mt-5">
              <label className="font-medium">
                Loan Tenure (Years)
              </label>

              <input
                type="number"
                min="1"
                value={tenureYears}
                onChange={(e) =>
                  setTenureYears(
                    Number(e.target.value) || 1
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 p-3"
              />
            </div>

            <div className="mt-5">
              <label className="font-medium">CIBIL Score</label>
              <input type="number" min="300" max="900" value={cibilScore} onChange={(e) => setCibilScore(Number(e.target.value) || 0)} className="mt-2 w-full rounded-xl border border-slate-300 p-3" />
              <p className={`mt-2 text-sm font-medium ${meetsCibilRequirement ? "text-green-700" : "text-red-700"}`}>
                {meetsCibilRequirement ? "CIBIL requirement passed (minimum 750)." : "CIBIL score is below 750. This application requires review."}
              </p>
            </div>

          </div>

          {/* RESULT */}

          <div className="space-y-6">

            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-blue-950 p-8 text-white shadow-xl">

              <p className="text-blue-200">
                Estimated Monthly EMI
              </p>

              <h1 className="mt-3 text-5xl font-bold">
                {formatINR(emi)}
              </h1>

              <div className="mt-8 grid grid-cols-2 gap-5">

                <div>
                  <p className="text-sm text-blue-200">
                    Loan Amount
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {formatINR(actualLoanAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">
                    Total Interest
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {formatINR(totalInterest)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">
                    Total Payment
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {formatINR(totalPayment)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-blue-200">
                    Tenure
                  </p>

                  <p className="mt-2 text-xl font-bold">
                    {tenureYears} Years
                  </p>
                </div>

              </div>

              <div className="mt-7">
                <button onClick={() => void saveLoanAnalysis()} disabled={saving} className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">
                  {saving ? "Saving..." : "Save loan analysis"}
                </button>
                {saveMessage && <p className="mt-2 text-sm text-blue-200">{saveMessage}</p>}
              </div>

            </div>

            {/* AFFORDABILITY */}

            <div
              className={`rounded-3xl p-7 shadow ${
                isEligible
                  ? "bg-green-50"
                  : "bg-red-50"
              }`}
            >
              <div className="flex items-center gap-3">

                {isEligible ? (
                  <CheckCircle className="text-green-600" size={32} />
                ) : (
                  <AlertTriangle className="text-red-600" size={32} />
                )}

                <h2 className="text-2xl font-bold">
                  Loan Affordability Analysis
                </h2>

              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">

                <div>
                  <p className="text-slate-500">
                    Your Monthly Income
                  </p>

                  <strong className="text-xl">
                    {formatINR(monthlyIncome)}
                  </strong>
                </div>

                <div>
                  <p className="text-slate-500">
                    Suggested Maximum EMI
                  </p>

                  <strong className="text-xl">
                    {formatINR(recommendedEmi)}
                  </strong>
                </div>

                <div>
                  <p className="text-slate-500">
                    Your Loan EMI
                  </p>

                  <strong className="text-xl">
                    {formatINR(emi)}
                  </strong>
                </div>

                <div>
                  <p className="text-slate-500">
                    EMI vs Income
                  </p>

                  <strong className="text-xl">
                    {affordabilityPercentage.toFixed(1)}
                    %
                  </strong>
                </div>

              </div>

              <div className="mt-6 rounded-2xl bg-white p-5">

                {monthlyIncome <= 0 ? (
                  <p className="font-medium text-orange-600">
                    Add your income in the Finance
                    Profile first to get a personalized
                    affordability analysis.
                  </p>
                ) : !meetsCibilRequirement ? (
                  <p className="font-medium text-red-700">
                    This loan is not automatically eligible because the CIBIL score is below 750; it requires review.
                  </p>
                ) : isEligible ? (
                  <p className="font-medium text-green-700">
                    ✅ Based on your income and
                    monthly expenses, this loan EMI
                    appears manageable.
                  </p>
                ) : (
                  <p className="font-medium text-red-700">
                    ⚠️ This EMI may be too high for
                    your current income and expenses.
                    Consider increasing your down
                    payment or selecting a longer
                    tenure.
                  </p>
                )}

              </div>

            </div>

          </div>

        </div>

        {/* SMART RECOMMENDATION */}

        <div className="mt-8 rounded-3xl bg-blue-50 p-8">

          <div className="flex items-center gap-3">
            <IndianRupee className="text-blue-600" />

            <h2 className="text-2xl font-bold text-blue-950">
              FinanceAI Recommendation
            </h2>
          </div>

          <div className="mt-5 space-y-3 text-blue-900">

            <p>
              • Your available money after monthly
              expenses is approximately{" "}
              <strong>
                {formatINR(
                  Math.max(0, availableMoney)
                )}
              </strong>.
            </p>

            <p>
              • A safer EMI limit for you is around{" "}
              <strong>
                {formatINR(recommendedEmi)}
              </strong>{" "}
              per month.
            </p>

            <p>
              • Your selected {selectedLoan} EMI is{" "}
              <strong>{formatINR(emi)}</strong>.
            </p>

            {!meetsCibilRequirement ? (
              <p className="font-semibold text-red-700">
                Recommendation: Improve the CIBIL score or submit the application for lender review.
              </p>
            ) : isEligible ? (
              <p className="font-semibold text-green-700">
                • Recommendation: This loan looks
                financially manageable based on the
                information available.
              </p>
            ) : (
              <p className="font-semibold text-red-700">
                • Recommendation: Reduce the loan
                amount, increase your down payment,
                or choose a longer repayment period.
              </p>
            )}

          </div>

        </div>

        {/* DISCLAIMER */}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">

          <strong>Disclaimer:</strong> Loan EMI and
          affordability calculations are estimates for
          educational purposes. Actual interest rates,
          eligibility, loan approval and repayment
          conditions may differ depending on the bank,
          financial institution and applicant profile.

        </div>

      </div>
    </main>
    </AuthGuard>
  );
}
