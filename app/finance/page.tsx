"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function FinancePage() {
  const router = useRouter();

  const [profession, setProfession] =
    useState("");

  const [annualIncome, setAnnualIncome] =
    useState("");

  const [monthlyExpenses, setMonthlyExpenses] =
    useState("");

  const [age, setAge] =
    useState("25");

  const [regime, setRegime] =
    useState<"new" | "old">("new");

  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (response.status === 401) {
            router.replace("/login");
            return null;
          }
          throw new Error(data.message || "Unable to load your financial profile.");
        }
        return data;
      })
      .then((data) => {
        const profile = data?.profile;
        if (!profile) return;
        setProfession(profile.profession || "");
        setAnnualIncome(String(profile.annualIncome || ""));
        setAge(String(profile.age || "25"));
        setRegime(profile.taxRegime === "old" ? "old" : "new");
      })
      .catch((error) => {
        setPageError(error instanceof Error ? error.message : "Unable to load your financial profile.");
      });
  }, [router]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const income =
      Number(annualIncome);

    const expenses =
      Number(monthlyExpenses);

    if (!profession) {
      alert("Please select your profession.");
      return;
    }

    if (income <= 0) {
      alert(
        "Please enter a valid annual income."
      );
      return;
    }

    if (expenses < 0) {
      alert(
        "Please enter valid monthly expenses."
      );
      return;
    }

    let incomeType:
      | "salary"
      | "business"
      | "professional"
      | "agriculture"
      | "other" = "salary";

    if (
      profession === "Business Owner"
    ) {
      incomeType = "business";
    }

    if (
      profession === "Doctor"
    ) {
      incomeType = "professional";
    }

    if (
      profession === "Farmer"
    ) {
      incomeType = "agriculture";
    }

    const profile = {
      profession,
      incomeType,
      annualIncome: income,
      monthlyIncome: income / 12,
      monthlyExpenses: expenses,
      age: Number(age) || 25,
      regime,
      deductions: 0,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, taxRegime: regime }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "Unable to save your profile.");
        return;
      }
      router.push("/dashboard");
    } catch {
      alert("Could not connect to the profile service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-4 md:p-8">

      <div className="mx-auto max-w-4xl">

        {pageError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {pageError}
          </div>
        )}

        <div className="mb-10 text-center">

          <p className="font-semibold tracking-widest text-blue-400">
            FINANCE PROFILE
          </p>

          <h1 className="mt-3 text-4xl font-bold text-white md:text-5xl">
            Build Your Financial Profile
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Your tax, monthly income, savings,
            expenses and loan recommendations
            will be calculated from the information
            you provide.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-2xl md:p-10"
        >

          <div className="grid gap-6 md:grid-cols-2">

            <div>

              <label className="font-semibold text-slate-700">
                Profession
              </label>

              <select
                value={profession}
                onChange={(e) =>
                  setProfession(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
              >

                <option value="">
                  Select your profession
                </option>

                <option value="Student">
                  Student
                </option>

                <option value="Software Engineer">
                  Software Engineer
                </option>

                <option value="Government Employee">
                  Government Employee
                </option>

                <option value="Private Employee">
                  Private Employee
                </option>

                <option value="Business Owner">
                  Business Owner
                </option>

                <option value="Farmer">
                  Farmer
                </option>

                <option value="Doctor">
                  Doctor
                </option>

                <option value="Teacher">
                  Teacher
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>

            <div>

              <label className="font-semibold text-slate-700">
                Age
              </label>

              <input
                type="number"
                min="18"
                max="100"
                value={age}
                onChange={(e) =>
                  setAge(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
              />

            </div>

            <div>

              <label className="font-semibold text-slate-700">
                Annual Income (₹)
              </label>

              <input
                type="number"
                min="0"
                placeholder="Example: 1200000"
                value={annualIncome}
                onChange={(e) =>
                  setAnnualIncome(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
              />

            </div>

            <div>

              <label className="font-semibold text-slate-700">
                Monthly Expenses (₹)
              </label>

              <input
                type="number"
                min="0"
                placeholder="Example: 30000"
                value={monthlyExpenses}
                onChange={(e) =>
                  setMonthlyExpenses(e.target.value)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 p-4"
              />

            </div>

          </div>

          <div className="mt-8">

            <p className="font-semibold text-slate-700">
              Select Tax Regime
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-2">

              <button
                type="button"
                onClick={() =>
                  setRegime("new")
                }
                className={`rounded-2xl border-2 p-5 text-left ${
                  regime === "new"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200"
                }`}
              >

                <p className="font-bold">
                  New Tax Regime
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Simplified tax calculation.
                </p>

              </button>

              <button
                type="button"
                onClick={() =>
                  setRegime("old")
                }
                className={`rounded-2xl border-2 p-5 text-left ${
                  regime === "old"
                    ? "border-blue-600 bg-blue-50"
                    : "border-slate-200"
                }`}
              >

                <p className="font-bold">
                  Old Tax Regime
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Supports eligible deductions.
                </p>

              </button>

            </div>

          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-4 text-lg font-bold text-white disabled:opacity-60"
          >
            {loading ? "Saving profile..." : "Calculate My Financial Profile →"}
          </button>

        </form>

      </div>

    </main>
  );
}