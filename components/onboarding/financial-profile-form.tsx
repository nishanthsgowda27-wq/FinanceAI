"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FinancialProfileForm() {
  const router = useRouter();

  const [profession, setProfession] = useState("");
  const [incomeType, setIncomeType] = useState("salary");
  const [annualIncome, setAnnualIncome] = useState("");
  const [age, setAge] = useState("");
  const [regime, setRegime] = useState("new");
  const [deductions, setDeductions] = useState("");
  const [loading, setLoading] = useState(false);

  const professions = [
    "Software Engineer / IT Professional",
    "Government Employee",
    "Private Company Employee",
    "Teacher / Professor",
    "Doctor",
    "Nurse / Healthcare Professional",
    "Lawyer / Advocate",
    "Chartered Accountant",
    "Bank Employee",
    "Business Owner",
    "Entrepreneur / Startup Founder",
    "Freelancer",
    "Consultant",
    "Designer",
    "Content Creator / YouTuber",
    "Digital Marketer",
    "Sales Professional",
    "Engineer",
    "Farmer / Agriculture",
    "Driver",
    "Police Officer",
    "Defence Personnel",
    "Student",
    "Retired / Pensioner",
    "Homemaker",
    "Other",
  ];

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!profession) {
      alert("Please select your profession.");
      return;
    }

    const profile = {
      profession,
      incomeType,
      annualIncome: Number(annualIncome),
      age: Number(age),
      regime,
      deductions:
        regime === "old"
          ? Number(deductions)
          : 0,
    };

    setLoading(true);
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, taxRegime: regime }) });
      const data = await response.json();
      if (!response.ok || !data.success) {
        alert(data.message || "Unable to save your profile.");
        return;
      }
      router.push("/tax-assistant");
    } catch {
      alert("Could not connect to the profile service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-2xl space-y-6 rounded-3xl border border-gray-200 bg-white p-8 shadow-sm"
    >
      <div>
        <p className="text-sm font-semibold text-blue-600">
          FINANCIAL PROFILE
        </p>

        <h1 className="mt-2 text-3xl font-bold text-gray-900">
          Tell us about your finances
        </h1>

        <p className="mt-2 text-gray-500">
          We will use this information to estimate your tax
          and personalize your financial analysis.
        </p>
      </div>

      {/* Profession */}

      <div>
        <label className="mb-2 block font-medium text-gray-800">
          Profession / Occupation
        </label>

        <select
          required
          value={profession}
          onChange={(e) =>
            setProfession(e.target.value)
          }
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">
            Select your profession
          </option>

          {professions.map((job) => (
            <option
              key={job}
              value={job}
            >
              {job}
            </option>
          ))}
        </select>
      </div>

      {/* Income Type */}

      <div>
        <label className="mb-2 block font-medium text-gray-800">
          Income Type
        </label>

        <select
          value={incomeType}
          onChange={(e) =>
            setIncomeType(e.target.value)
          }
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="salary">
            Salary / Employment Income
          </option>

          <option value="business">
            Business Income
          </option>

          <option value="freelance">
            Freelance / Self-Employment
          </option>

          <option value="professional">
            Professional Income
          </option>

          <option value="agriculture">
            Agricultural Income
          </option>

          <option value="rental">
            Rental / Property Income
          </option>

          <option value="pension">
            Pension Income
          </option>

          <option value="multiple">
            Multiple Sources of Income
          </option>

          <option value="other">
            Other Income
          </option>
        </select>
      </div>

      {/* Annual Income */}

      <div>
        <label className="mb-2 block font-medium text-gray-800">
          Annual Income (₹)
        </label>

        <input
          type="number"
          required
          min="0"
          value={annualIncome}
          onChange={(e) =>
            setAnnualIncome(e.target.value)
          }
          placeholder="Example: 720000"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Age */}

      <div>
        <label className="mb-2 block font-medium text-gray-800">
          Age
        </label>

        <input
          type="number"
          required
          min="18"
          max="100"
          value={age}
          onChange={(e) =>
            setAge(e.target.value)
          }
          placeholder="Enter your age"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      {/* Tax Regime */}

      <div>
        <label className="mb-3 block font-medium text-gray-800">
          Preferred Tax Regime
        </label>

        <div className="grid gap-3 sm:grid-cols-2">

          <button
            type="button"
            onClick={() => setRegime("new")}
            className={`rounded-xl border p-4 text-left transition ${
              regime === "new"
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <p className="font-bold text-gray-900">
              New Tax Regime
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Lower tax rates with fewer deductions.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRegime("old")}
            className={`rounded-xl border p-4 text-left transition ${
              regime === "old"
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 bg-white hover:border-blue-300"
            }`}
          >
            <p className="font-bold text-gray-900">
              Old Tax Regime
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Supports eligible tax deductions.
            </p>
          </button>

        </div>
      </div>

      {/* Deductions */}

      {regime === "old" && (
        <div>
          <label className="mb-2 block font-medium text-gray-800">
            Eligible Deductions (₹)
          </label>

          <input
            type="number"
            min="0"
            value={deductions}
            onChange={(e) =>
              setDeductions(e.target.value)
            }
            placeholder="Example: 150000"
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <p className="mt-2 text-sm text-gray-500">
            Enter the total amount of eligible deductions.
          </p>
        </div>
      )}

      {/* Submit */}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Saving profile..." : "Calculate My Tax →"}
      </button>
    </form>
  );
}