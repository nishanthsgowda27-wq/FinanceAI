"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getCategoryChartColor, normalizeCategoryKey } from "@/lib/finance/category-colors";
import type { Transaction } from "@/lib/finance/financeData";
import ExpensePeriodBreakdown from "@/components/dashboard/expense-period-breakdown";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const palette = {
  income: "#16a34a",
  expense: "#f97316",
  trend: "#4f46e5",
  markdown: "#e2e8f0",
  grid: "#334155",
  text: "#cbd5e1",
  surface: "#0f172a",
  border: "#1e293b",
};
const rangeOptions = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "90d", label: "Last 3 Months" },
  { key: "180d", label: "Last 6 Months" },
  { key: "year", label: "This Year" },
] as const;
type RangeKey = (typeof rangeOptions)[number]["key"];

type YearChartPoint = {
  dateKey: string;
  sortKey: string;
  label: string;
  income: number;
  expense: number;
  categories: Record<string, number>;
  monthKey: string;
  title?: string;
  category?: string;
};

type TrendChartPoint = {
  dateKey: string;
  label: string;
  expense: number;
};

type MonthlyDetailPoint = {
  dateKey: string;
  label: string;
  [key: string]: string | number;
};

type DashboardAnalyticsData = {
  monthly: Array<{ monthKey: string; income: number; expense: number }>;
  trend: Array<{ date: string; expense: number }>;
  details: Array<{ date: string; category: string; amount: number }>;
  selectedMonthIncome: number;
  selectedMonthExpenses: number;
  selectedMonthTransactionCount: number;
};

const formatDayMonth = (value: string) => {
  if (!value) return "";
  const cleanValue = value.includes("T") ? value.slice(0, 10) : value;
  const date = new Date(`${cleanValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
};

const buildYearChartData = (transactions: Transaction[]): YearChartPoint[] => {
  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const chartMap = new Map<string, YearChartPoint>();

  for (let monthIndex = 1; monthIndex <= 12; monthIndex += 1) {
    const monthKey = `${currentYear}-${String(monthIndex).padStart(2, "0")}`;
    chartMap.set(monthKey, {
      dateKey: monthKey,
      sortKey: `${monthKey}-01`,
      label: monthNames[monthIndex - 1],
      income: 0,
      expense: 0,
      categories: {},
      monthKey,
      title: "Monthly income and expenses",
    });
  }

  transactions
    .filter((item) => item.date && String(item.date).slice(0, 4) === String(currentYear))
    .forEach((item) => {
      const monthKey = String(item.date).slice(0, 7);
      const existing = chartMap.get(monthKey) ?? {
        dateKey: monthKey,
        sortKey: `${monthKey}-01`,
        label: monthNames[Number(monthKey.slice(5, 7)) - 1] || "Jan",
        income: 0,
        expense: 0,
        categories: {},
        monthKey,
        title: "Expense",
      };

      if (item.type === "income") {
        existing.income += Number(item.amount || 0);
      } else {
        existing.expense += Number(item.amount || 0);
        const categoryKey = normalizeCategoryKey(item.category);
        existing.categories[categoryKey] = (existing.categories[categoryKey] || 0) + Number(item.amount || 0);
      }

      existing.title = item.title || item.category || "Expense";
      chartMap.set(monthKey, existing);
    });

  return Array.from(chartMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((month) => ({
      ...month,
      ...month.categories,
    }));
};

const buildTrendChartData = (transactions: Transaction[], range: RangeKey): TrendChartPoint[] => {
  const now = new Date();
  const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let startDate = new Date(endDate);

  if (range === "7d") {
    startDate.setDate(endDate.getDate() - 6);
  } else if (range === "30d") {
    startDate.setDate(endDate.getDate() - 29);
  } else if (range === "90d") {
    startDate.setDate(endDate.getDate() - 89);
  } else if (range === "180d") {
    startDate.setDate(endDate.getDate() - 179);
  } else {
    startDate = new Date(endDate.getFullYear(), 0, 1, 0, 0, 0, 0);
  }

  const map = new Map<string, { dateKey: string; label: string; expense: number }>();

  transactions
    .filter((item) => item.type === "expense" && item.date)
    .forEach((item) => {
      const transactionDate = new Date(`${String(item.date).slice(0, 10)}T00:00:00`);
      if (Number.isNaN(transactionDate.getTime())) return;
      if (transactionDate < startDate || transactionDate > endDate) return;

      const dateKey = transactionDate.toISOString().slice(0, 10);
      const entry = map.get(dateKey) ?? {
        dateKey,
        label: formatDayMonth(dateKey),
        expense: 0,
      };
      entry.expense += Number(item.amount || 0);
      map.set(dateKey, entry);
    });

  return Array.from(map.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey)).map((item) => ({
    dateKey: item.dateKey,
    label: item.label,
    expense: item.expense,
  }));
};

const buildMonthlyDetailData = (details: DashboardAnalyticsData["details"], monthKey: string): MonthlyDetailPoint[] => {
  if (!monthKey) return [];
  const [year, month] = monthKey.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const categoryKeys = Array.from(new Set(details.map((item) => normalizeCategoryKey(item.category)))).sort((a, b) => a.localeCompare(b));
  if (categoryKeys.length === 0) return [];

  const dailyTotals = new Map<string, Record<string, number>>();
  details.forEach((item) => {
    const dateKey = item.date.slice(0, 10);
    const category = normalizeCategoryKey(item.category);
    const totals = dailyTotals.get(dateKey) ?? {};
    totals[category] = (totals[category] ?? 0) + Number(item.amount || 0);
    dailyTotals.set(dateKey, totals);
  });

  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month - 1, index + 1);
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
    const point: MonthlyDetailPoint = {
      dateKey,
      label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date),
    };
    categoryKeys.forEach((category) => {
      point[category] = dailyTotals.get(dateKey)?.[category] ?? 0;
    });
    return point;
  });
};

function YearChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value?: number | string; dataKey?: string; payload?: YearChartPoint }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  const incomeValue = Number(point.income || 0);
  const expenseValue = Number(point.expense || 0);
  const remainingValue = incomeValue - expenseValue;

  return (
    <div className="min-w-[240px] rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-slate-100">{point.label} {new Date().getFullYear()}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4 text-blue-300">
          <span>Income</span>
          <span>{money(incomeValue)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-red-300">
          <span>Total Expenses</span>
          <span>{money(expenseValue)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-slate-200">
          <span>Remaining</span>
          <span className={remainingValue >= 0 ? "text-emerald-300" : "text-red-300"}>{money(remainingValue)}</span>
        </div>
      </div>
    </div>
  );
}

function MonthlyDetailTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value?: number | string; dataKey?: string; color?: string; payload?: MonthlyDetailPoint }> }) {
  if (!active || !payload || payload.length === 0) return null;

  const dateLabel = payload[0]?.payload?.label || "Selected date";
  const entries = payload
    .filter((item) => item.dataKey && item.dataKey !== "dateKey" && item.dataKey !== "label" && Number(item.value ?? 0) > 0)
    .sort((a, b) => Number(b.value ?? 0) - Number(a.value ?? 0));

  if (entries.length === 0) return null;

  return (
    <div className="min-w-[240px] rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-slate-100">{dateLabel}</p>
      <div className="space-y-1.5 text-xs text-slate-200">
        {entries.map((entry) => (
          <div key={String(entry.dataKey)} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color ?? getCategoryChartColor(String(entry.dataKey)) }} />
              <span>{String(entry.dataKey)}</span>
            </span>
            <span>{money(Number(entry.value ?? 0))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TrendChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value?: number | string; payload?: TrendChartPoint }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 shadow-xl">
      <p className="mb-2 text-sm font-semibold text-slate-100">{point.label}</p>
      <div className="flex items-center justify-between gap-4 text-xs text-indigo-300">
        <span>Expense</span>
        <span>{money(Number(point.expense || 0))}</span>
      </div>
    </div>
  );
}

export default function FinanceAnalytics({ monthlyIncome = 0, selectedMonth: dashboardSelectedMonth }: { monthlyIncome?: number; selectedMonth?: string }) {
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalyticsData | null>(null);
  const [range, setRange] = useState<RangeKey>("30d");
  const [expandedGraph, setExpandedGraph] = useState<"year" | "month" | "trend" | null>(null);
  const [viewMode, setViewMode] = useState<"yearly" | "monthly">("yearly");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(dashboardSelectedMonth ?? null);
  const previousDashboardMonth = useRef(dashboardSelectedMonth);

  useEffect(() => {
    if (dashboardSelectedMonth === previousDashboardMonth.current) return;
    previousDashboardMonth.current = dashboardSelectedMonth;
    setSelectedMonth(dashboardSelectedMonth ?? null);
    setViewMode("yearly");
    setExpandedGraph(null);
  }, [dashboardSelectedMonth]);

  const activeMonth = selectedMonth ?? dashboardSelectedMonth ?? new Date().toISOString().slice(0, 7);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`/api/dashboard/analytics?month=${encodeURIComponent(activeMonth)}&range=${range}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setAnalyticsData(data);
    };

    const initialLoad = window.setTimeout(() => void load(), 0);
    const handler = () => void load();
    window.addEventListener("financeDataUpdated", handler);
    return () => {
      window.clearTimeout(initialLoad);
      window.removeEventListener("financeDataUpdated", handler);
    };
  }, [activeMonth, range]);

  useEffect(() => {
    if (!expandedGraph) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpandedGraph(null);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [expandedGraph]);

  const analysis = useMemo(() => {
    const expenses = analyticsData?.selectedMonthExpenses ?? 0;
    const effectiveIncome = analyticsData?.selectedMonthIncome || monthlyIncome;
    const yearlyTransactions: Transaction[] = (analyticsData?.monthly ?? []).flatMap((item) => {
      const date = `${item.monthKey}-01`;
      return [
        { id: `income-${item.monthKey}`, title: "Income", type: "income", date, amount: item.income, category: "Income" },
        { id: `expense-${item.monthKey}`, title: "Expense", type: "expense", date, amount: item.expense, category: "Expense" },
      ];
    });
    const trendTransactions: Transaction[] = (analyticsData?.trend ?? []).map((item) => ({
      id: item.date, title: "Expense", type: "expense", date: item.date, amount: item.expense, category: "Expense",
    }));
    const categoryMap = new Map<string, number>();
    (analyticsData?.details ?? []).forEach((item) => {
      const category = normalizeCategoryKey(item.category);
      const amount = Number(item.amount);
      if (!Number.isFinite(amount) || amount <= 0) return;
      categoryMap.set(category, (categoryMap.get(category) ?? 0) + amount);
    });

    const savings = effectiveIncome - expenses;
    const savingsRate = effectiveIncome > 0 ? (savings / effectiveIncome) * 100 : 0;
    const expenseRate = effectiveIncome > 0 ? (expenses / effectiveIncome) * 100 : 100;
    const score = Math.max(0, Math.min(100, Math.round(Math.max(0, Math.min(40, savingsRate * 0.8)) + Math.max(0, Math.min(35, 35 - Math.max(0, expenseRate - 50) * 0.7)) + (savings > 0 ? 25 : 0))));

    const yearChartData = buildYearChartData(yearlyTransactions);
    const trendChartData = buildTrendChartData(trendTransactions, range);

    return {
      income: effectiveIncome,
      expenses,
      savings,
      savingsRate,
      score,
      categories: Array.from(categoryMap, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      yearChartData,
      trendChartData,
    };
  }, [analyticsData, monthlyIncome, range]);

  const status = analysis.score >= 80 ? "Excellent" : analysis.score >= 60 ? "Good" : analysis.score >= 40 ? "Average" : "Needs Improvement";
  const getScoreTone = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-amber-400";
    return "text-red-400";
  };

  const detailMonthData = useMemo(() => (viewMode === "monthly" && selectedMonth ? buildMonthlyDetailData(analyticsData?.details ?? [], selectedMonth) : []), [analyticsData, selectedMonth, viewMode]);
  const detailCategoryKeys = useMemo(() => {
    const keys = new Set<string>();
    detailMonthData.forEach((entry) => {
      Object.keys(entry).forEach((key) => {
        if (key !== "dateKey" && key !== "label") keys.add(key);
      });
    });
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [detailMonthData]);

  const selectedMonthTitle = selectedMonth
    ? new Date(`${selectedMonth}-01T00:00:00`).toLocaleString("en-US", { month: "long", year: "numeric" })
    : "";
  const selectedMonthTotal = analyticsData?.selectedMonthExpenses ?? 0;
  const selectedMonthCount = analyticsData?.selectedMonthTransactionCount ?? 0;
  const selectedMonthDays = selectedMonth
    ? new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate()
    : 0;
  const averageDailyExpense = selectedMonthDays ? selectedMonthTotal / selectedMonthDays : 0;
  const highestMonthCategory = analysis.categories[0];

  function openExpenseMonth(index: number) {
    const monthKey = analysis.yearChartData[index]?.monthKey;
    if (!monthKey) return;
    setSelectedMonth(monthKey);
    setViewMode("monthly");
    setExpandedGraph((current) => current === "year" ? "month" : current);
  }

  const monthSummary = <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
    <Metric label="Total expenses" value={money(selectedMonthTotal)} tone="text-orange-400" />
    <Metric label="Transactions" value={String(selectedMonthCount)} tone="text-slate-200" />
    <Metric label="Average daily expense" value={money(averageDailyExpense)} tone="text-sky-300" />
    <Metric label="Highest spending category" value={highestMonthCategory?.name ?? "No expenses"} tone="text-emerald-300" />
  </div>;

  const renderLargeChart = (graph: "year" | "month" | "trend") => {
    if (graph === "year") {
      return (
        <ResponsiveContainer width="100%" height={560}>
          <BarChart data={analysis.yearChartData} margin={{ top: 20, right: 12, left: 6, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
            <XAxis dataKey="label" stroke={palette.text} tickLine={false} axisLine={false} minTickGap={14} angle={0} textAnchor="middle" />
            <YAxis stroke={palette.text} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`} />
            <Tooltip content={<YearChartTooltip />} />
            <Legend wrapperStyle={{ color: palette.markdown, fontSize: 12 }} />
            <Bar name="Income" dataKey="income" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar name="Expense" dataKey="expense" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={28} cursor="pointer" onClick={(_data, index) => openExpenseMonth(index)} />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (graph === "month" && selectedMonth) {
      return (
        <div className="h-full overflow-y-auto">
          {monthSummary}
          {detailMonthData.length === 0 ? <div className="flex min-h-48 items-center justify-center text-sm text-slate-400">No expenses recorded for this month.</div> : <ResponsiveContainer width="100%" height={480}>
            <LineChart data={detailMonthData} margin={{ top: 20, right: 12, left: 6, bottom: 42 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
              <XAxis dataKey="label" stroke={palette.text} tickLine={false} axisLine={false} minTickGap={8} angle={-45} textAnchor="end" height={54} />
              <YAxis stroke={palette.text} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`} />
              <Tooltip content={<MonthlyDetailTooltip />} />
              <Legend wrapperStyle={{ color: palette.markdown, fontSize: 12 }} />
              {detailCategoryKeys.map((category) => (
                <Line key={category} type="monotone" dataKey={category} name={category} stroke={getCategoryChartColor(category)} strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>}
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={560}>
        <LineChart data={analysis.trendChartData} margin={{ top: 20, right: 12, left: 6, bottom: 28 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
          <XAxis dataKey="label" stroke={palette.text} tickLine={false} axisLine={false} minTickGap={18} angle={0} textAnchor="middle" />
          <YAxis stroke={palette.text} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
          <Tooltip content={<TrendChartTooltip />} />
          <Legend wrapperStyle={{ color: palette.markdown, fontSize: 12 }} />
          <Line type="monotone" dataKey="expense" name="Expense" stroke={palette.trend} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <section className="mt-7 space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-slate-400">Selected month</p>
        <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-sm font-medium text-slate-200">{selectedMonth ?? new Date().toISOString().slice(0, 7)}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total income" value={money(analysis.income)} tone="text-emerald-500" />
        <Metric label="Total expenses" value={money(analysis.expenses)} tone="text-orange-400" />
        <Metric label="Remaining balance" value={money(analysis.savings)} tone={analysis.savings >= 0 ? "text-blue-400" : "text-red-400"} />
        <Metric label="Savings" value={money(Math.max(0, analysis.savings))} tone="text-indigo-400" />
        <Metric label="Savings rate" value={`${Math.max(0, analysis.savingsRate).toFixed(1)}%`} tone="text-amber-400" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {viewMode === "monthly" && selectedMonth ? (
          <ChartPanel
            title={`${selectedMonthTitle} — Expense Details`}
            action={
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setExpandedGraph("month")} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200 hover:border-slate-500">⛶ View Full Screen</button>
                <button type="button" onClick={() => { setSelectedMonth(null); setViewMode("yearly"); setExpandedGraph(null); }} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200 hover:border-slate-500">← Back to Yearly View</button>
              </div>
            }
          >
            {monthSummary}
            {detailMonthData.length === 0 ? (
              <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/40 px-4 text-center text-sm text-slate-300">
                No expenses recorded for this month.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={detailMonthData} margin={{ top: 16, right: 12, left: 6, bottom: 42 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
                  <XAxis dataKey="label" stroke={palette.text} tickLine={false} axisLine={false} minTickGap={8} angle={-45} textAnchor="end" height={54} />
                  <YAxis stroke={palette.text} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip content={<MonthlyDetailTooltip />} />
                  <Legend wrapperStyle={{ color: palette.markdown, fontSize: 12 }} />
                  {detailCategoryKeys.map((category) => (
                    <Line key={category} type="monotone" dataKey={category} name={category} stroke={getCategoryChartColor(category)} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 6 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartPanel>
        ) : (
          <ChartPanel
            title="Yearly income vs expense"
            action={<button type="button" onClick={() => setExpandedGraph("year")} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200 hover:border-slate-500">⛶ View Full Screen</button>}
          >
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={analysis.yearChartData} margin={{ top: 16, right: 12, left: 6, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
                <XAxis dataKey="label" stroke={palette.text} tickLine={false} axisLine={false} minTickGap={14} />
                <YAxis stroke={palette.text} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}k`} />
                <Tooltip content={<YearChartTooltip />} />
                <Legend wrapperStyle={{ color: palette.markdown, fontSize: 12 }} />
                <Bar name="Income" dataKey="income" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={28} cursor="pointer" />
                <Bar
                  name="Expense"
                  dataKey="expense"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                  cursor="pointer"
                  onClick={(_data, index) => openExpenseMonth(index)}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartPanel>
        )}

        <ChartPanel
          title="Expense trend"
          action={<button type="button" onClick={() => setExpandedGraph("trend")} className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-medium text-slate-200 hover:border-slate-500">⛶ View Full Screen</button>}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {rangeOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${range === option.key ? "border-indigo-500 bg-indigo-500/15 text-indigo-200" : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"}`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={analysis.trendChartData} margin={{ top: 16, right: 12, left: 6, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={palette.grid} />
              <XAxis dataKey="label" stroke={palette.text} tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis stroke={palette.text} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${Math.round(value / 1000)}k`} />
              <Tooltip content={<TrendChartTooltip />} />
              <Legend wrapperStyle={{ color: palette.markdown, fontSize: 12 }} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke={palette.trend} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Health score" value={`${analysis.score}/100`} tone={getScoreTone(analysis.score)} />
        <Metric label="Status" value={status} tone="text-slate-200" />
        <Metric label="Expense rate" value={`${Math.max(0, Number(analysis.expenses > 0 && analysis.income > 0 ? (analysis.expenses / analysis.income) * 100 : 0)).toFixed(1)}%`} tone="text-orange-400" />
        <Metric label="Trend" value={`${analysis.trendChartData.length} days`} tone="text-sky-400" />
      </div>

      <div className="grid gap-6">
        <ExpensePeriodBreakdown />
      </div>

      {expandedGraph && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
          <div className="h-[92vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-100">
                {expandedGraph === "year"
                  ? "Yearly income vs expense"
                  : expandedGraph === "month" && selectedMonth
                    ? `${selectedMonthTitle} — Expense Details`
                    : "Expense trend"}
              </h3>
              <button type="button" onClick={() => setExpandedGraph(null)} aria-label="Close full screen chart" className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm text-slate-200 hover:border-slate-500">Close / Exit Full Screen</button>
            </div>
            <div className="h-[calc(100%-73px)] p-4 md:p-6">
              {renderLargeChart(expandedGraph)}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}

function ChartPanel({ title, action, className = "", children }: { title: string; action?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-100">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
