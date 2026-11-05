"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCategoryBadgeStyle, getCategoryChartColor } from "@/lib/finance/category-colors";
import type { ExpensePeriodKey } from "@/lib/finance/expense-period";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const periodOptions: Array<{ key: ExpensePeriodKey; label: string }> = [
  { key: "this-month", label: "This Month" },
  { key: "last-3-months", label: "Last 3 Months" },
  { key: "last-6-months", label: "Last 6 Months" },
  { key: "last-12-months", label: "Last 12 Months" },
  { key: "this-year", label: "This Year" },
  { key: "last-year", label: "Last Year" },
];

type Analysis = {
  period: { label: string; startDate: string; endDate: string; monthKeys: string[] };
  totalExpenses: number;
  transactionCount: number;
  averageMonthlyExpense: number;
  comparisonTotal: number;
  comparisonChangePercent: number | null;
  categoryTotals: Array<{ category: string; amount: number; transactionCount: number }>;
  monthly: Array<{ month: string; total: number; transactionCount: number; categories: Record<string, number> }>;
};

function monthLabel(month: string, year = true) {
  return new Intl.DateTimeFormat("en", { month: "short", ...(year ? { year: "2-digit" } : {}) }).format(new Date(`${month}-01T00:00:00`));
}

export default function ExpensePeriodBreakdown() {
  const [period, setPeriod] = useState<ExpensePeriodKey>("this-month");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/expenses/analysis?period=${period}`, { cache: "no-store", credentials: "include" });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || data.message || "Unable to load expense analysis.");
        if (active) setAnalysis(data as Analysis);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load expense analysis.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    const handler = () => void load();
    window.addEventListener("financeDataUpdated", handler);
    return () => {
      active = false;
      window.removeEventListener("financeDataUpdated", handler);
    };
  }, [period]);

  const highestCategory = analysis?.categoryTotals[0];
  const lowestCategory = analysis?.categoryTotals.at(-1);
  const highestMonth = analysis?.monthly.reduce((highest, month) => month.total > (highest?.total ?? -1) ? month : highest, analysis.monthly[0]);
  const yearlyView = period === "this-year" || period === "last-year";
  const isThisMonth = period === "this-month";

  return <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-wide text-sky-400">Expense analysis</p><h3 className="mt-1 text-lg font-semibold text-slate-100">Category breakdown</h3></div>
      <label className="flex items-center gap-2 text-sm text-slate-300">Period
        <select aria-label="Expense analysis period" value={period} onChange={(event) => setPeriod(event.target.value as ExpensePeriodKey)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-500">
          {periodOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
        </select>
      </label>
    </div>

    {loading ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">Loading expense analysis...</div> : error ? <div role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">{error}</div> : !analysis || analysis.transactionCount === 0 ? <div className="flex min-h-48 items-center justify-center text-center text-sm text-slate-400">No expense data available for this period.</div> : <>
      <div className={`mb-5 grid gap-3 ${isThisMonth ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <Metric label="Total expenses" value={money(analysis.totalExpenses)} />
        {isThisMonth ? <Metric label="Transactions" value={String(analysis.transactionCount)} /> : <>
          <Metric label="Average monthly expense" value={money(analysis.averageMonthlyExpense)} />
          <Metric label="Highest category" value={highestCategory ? `${highestCategory.category} · ${money(highestCategory.amount)}` : "No data"} />
          <Metric label="Highest spending month" value={highestMonth?.total ? `${monthLabel(highestMonth.month)} · ${money(highestMonth.total)}` : "No expenses"} />
        </>}
      </div>

      {!isThisMonth && analysis.comparisonChangePercent !== null && <p className="mb-4 text-xs text-slate-400">Compared with the previous matching period: <span className={analysis.comparisonChangePercent > 0 ? "text-orange-300" : analysis.comparisonChangePercent < 0 ? "text-emerald-300" : "text-slate-300"}>{analysis.comparisonChangePercent > 0 ? "increased" : analysis.comparisonChangePercent < 0 ? "decreased" : "unchanged"} {Math.abs(analysis.comparisonChangePercent).toFixed(1)}%</span></p>}

      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-200">Category Breakdown</h4>
          <div className="space-y-3">
            {analysis.categoryTotals.map((category) => {
              const percentage = analysis.totalExpenses > 0 ? category.amount / analysis.totalExpenses * 100 : 0;
              return <div key={category.category}>
                <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex min-w-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium" style={getCategoryBadgeStyle(category.category)}>{category.category}</span>
                  <span className="shrink-0 font-medium text-slate-100">{money(category.amount)} <span className="text-xs text-slate-400">{percentage.toFixed(1)}%</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: getCategoryChartColor(category.category) }} /></div>
              </div>;
            })}
          </div>
          {analysis.categoryTotals.length > 1 && <p className="mt-3 text-xs text-slate-400">Lowest spending category: <span className="text-slate-200">{lowestCategory?.category} · {money(lowestCategory?.amount ?? 0)}</span></p>}
          <p className="mt-2 border-t border-slate-800 pt-3 text-sm font-semibold text-slate-100">Total Expenses <span className="float-right">{money(analysis.totalExpenses)}</span></p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-200">Monthly Expense Trend</h4>
          <div className="h-56 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.monthly} margin={{ top: 8, right: 4, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" tickFormatter={(value) => monthLabel(String(value), analysis.monthly.length <= 6)} stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} width={58} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`} fontSize={10} />
                <Tooltip labelFormatter={(value) => monthLabel(String(value))} formatter={(value) => [money(Number(value)), "Expense"]} contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                <Bar dataKey="total" name="Expense" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {(yearlyView || period !== "this-month") && <div className="mt-3 max-h-36 overflow-y-auto rounded-lg border border-slate-800">
            {analysis.monthly.map((month) => <div key={month.month} className="flex justify-between border-b border-slate-800 px-3 py-2 text-xs last:border-0"><span className="text-slate-300">{monthLabel(month.month)}</span><span className="font-medium text-slate-100">{money(month.total)}</span></div>)}
          </div>}
        </div>
      </div>

      {yearlyView && <details className="mt-6 rounded-xl border border-slate-800">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200">Detailed Yearly Breakdown</summary>
        <div className="max-w-full overflow-x-auto border-t border-slate-800">
          <table className="min-w-[900px] w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400"><tr><th className="sticky left-0 bg-slate-950 px-3 py-2">Category</th>{analysis.monthly.map((month) => <th key={month.month} className="px-2 py-2 text-right">{monthLabel(month.month, false)}</th>)}<th className="px-3 py-2 text-right">Year total</th></tr></thead>
            <tbody>{analysis.categoryTotals.map((category) => <tr key={category.category} className="border-t border-slate-800"><th className="sticky left-0 bg-slate-900 px-3 py-2 font-medium text-slate-200">{category.category}</th>{analysis.monthly.map((month) => <td key={month.month} className="px-2 py-2 text-right text-slate-300">{money(month.categories[category.category] ?? 0)}</td>)}<td className="px-3 py-2 text-right font-semibold text-slate-100">{money(category.amount)}</td></tr>)}</tbody>
            <tfoot className="border-t border-slate-700 bg-slate-950 font-semibold text-slate-100"><tr><th className="sticky left-0 bg-slate-950 px-3 py-2">Total</th>{analysis.monthly.map((month) => <td key={month.month} className="px-2 py-2 text-right">{money(month.total)}</td>)}<td className="px-3 py-2 text-right">{money(analysis.totalExpenses)}</td></tr></tfoot>
          </table>
        </div>
      </details>}
    </>}
  </div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-3"><p className="text-[11px] text-slate-400">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-100" title={value}>{value}</p></div>;
}