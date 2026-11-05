import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getAuthUserById } from "@/lib/auth-store";
import { ensureFinanceUser, getDashboardData, isDateInMonth, normalizeMonthKey } from "@/lib/db/finance";
import { requireUser } from "@/lib/server-auth";
import { calculateTax } from "@/lib/tax/tax-calculator";

export const runtime = "nodejs";

const loanAssumptions = [
  { name: "Personal Loan", rate: 12, years: 5 },
  { name: "Car Loan", rate: 9, years: 5 },
  { name: "Home Loan", rate: 8.5, years: 20 },
  { name: "Bike Loan", rate: 10, years: 3 },
];

function emi(principal: number, annualRate: number, years: number) {
  const months = years * 12;
  const monthlyRate = annualRate / 1200;
  if (monthlyRate === 0) return principal / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

function monthLabel(monthKey: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(`${monthKey}-01T00:00:00`));
}

function assessmentYear(date: Date) {
  const year = date.getFullYear();
  return date.getMonth() >= 3 ? `${year}-${String(year + 1).slice(-2)}` : `${year - 1}-${String(year).slice(-2)}`;
}

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    await ensureFinanceUser(session.userId, session.email);
    const generatedAt = new Date();
    const selectedMonth = normalizeMonthKey(new URL(request.url).searchParams.get("month"));
    const [dashboard, user] = await Promise.all([getDashboardData(session.userId), getAuthUserById(session.userId)]);
    const transactions = dashboard.allTransactions;
    const periodTransactions = transactions.filter((item) => isDateInMonth(item.date, selectedMonth));
    const income = periodTransactions.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0);
    const expenses = periodTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0);
    const categories = Object.entries(periodTransactions.filter((item) => item.type === "expense").reduce<Record<string, number>>((result, item) => {
      result[item.category] = (result[item.category] ?? 0) + Number(item.amount);
      return result;
    }, {})).map(([category, amount]) => ({ category, amount, percentage: expenses > 0 ? (amount / expenses) * 100 : 0 })).sort((a, b) => b.amount - a.amount);
    const daysInPeriod = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)), 0).getDate();
    const highestExpense = periodTransactions.filter((item) => item.type === "expense").sort((a, b) => Number(b.amount) - Number(a.amount))[0] ?? null;
    const monthlyIncome = Number(dashboard.profile?.annualIncome ?? 0) / 12;
    const obligations = dashboard.loans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
    const monthlySurplus = monthlyIncome - expenses - obligations;
    const expenseRatio = monthlyIncome > 0 ? (expenses / monthlyIncome) * 100 : 100;
    const tax = calculateTax({ annualIncome: dashboard.profile?.annualIncome ?? 0, deductions: dashboard.profile?.deductions ?? 0, regime: dashboard.profile?.taxRegime === "old" ? "old" : "new" });
    const savingsScore = Math.round(Math.max(0, Math.min(40, (monthlyIncome > 0 ? (monthlySurplus / monthlyIncome) * 100 : 0) * 0.8)));
    const expenseManagementScore = Math.round(Math.max(0, Math.min(30, 30 - Math.max(0, expenseRatio - 50) * 0.6)));
    const debtManagementScore = monthlyIncome > 0 ? Math.round(Math.max(0, Math.min(15, 15 - (obligations / monthlyIncome) * 50))) : 0;
    const incomeStabilityScore = monthlyIncome > 0 ? 10 : 0;
    const planningScore = dashboard.profile ? 5 : 0;
    const overallScore = Math.min(100, savingsScore + expenseManagementScore + debtManagementScore + incomeStabilityScore + planningScore);
    const projectCibilScore = Math.round(Math.max(300, Math.min(900, 600 + savingsScore + debtManagementScore + (incomeStabilityScore * 5))));
    const eligibleMonthlyPayment = Math.max(0, monthlySurplus * 0.4);
    const loanEstimates = loanAssumptions.map((loan) => {
      const months = loan.years * 12;
      const amount = Math.max(0, eligibleMonthlyPayment > 0 ? eligibleMonthlyPayment * ((1 - Math.pow(1 + loan.rate / 1200, -months)) / (loan.rate / 1200)) : 0);
      const monthlyEmi = emi(amount, loan.rate, loan.years);
      return { ...loan, eligibleAmount: Math.round(amount), tenureYears: loan.years, monthlyEmi: Math.round(monthlyEmi), estimatedInterest: Math.max(0, Math.round(monthlyEmi * months - amount)), totalRepayment: Math.round(monthlyEmi * months), assumptions: `EMI capped at 40% of estimated monthly surplus; ${loan.rate}% annual interest; existing obligations included.` };
    });

    return NextResponse.json({
      success: true,
      generatedAt: generatedAt.toISOString(),
      reportId: `FIN-${generatedAt.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      period: { key: selectedMonth, label: monthLabel(selectedMonth) },
      assessmentYear: assessmentYear(generatedAt),
      user: { name: user?.name || session.email.split("@")[0], email: user?.email || session.email },
      profile: dashboard.profile,
      transactions: periodTransactions,
      summary: { income, expenses, netSavings: income - expenses, savingsRate: monthlyIncome > 0 ? ((income - expenses) / monthlyIncome) * 100 : 0, averageDailyExpense: expenses / daysInPeriod, highestCategory: categories[0]?.category || "No recorded expenses", highestExpense },
      categories,
      trends: Array.from({ length: 6 }, (_, index) => {
        const date = new Date(Number(selectedMonth.slice(0, 4)), Number(selectedMonth.slice(5, 7)) - 1 - (5 - index), 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const entries = transactions.filter((item) => isDateInMonth(item.date, key));
        return { month: key.slice(5), income: entries.filter((item) => item.type === "income").reduce((sum, item) => sum + Number(item.amount), 0), expenses: entries.filter((item) => item.type === "expense").reduce((sum, item) => sum + Number(item.amount), 0) };
      }),
      tax: { ...tax, assessmentYear: assessmentYear(generatedAt), calculationDate: generatedAt.toISOString() },
      loan: { profession: dashboard.profile?.profession || "Not provided", monthlyIncome, existingObligations: obligations, estimatedMonthlySurplus: monthlySurplus, projectCibilScore, estimates: loanEstimates },
      health: { overallScore, savingsScore, expenseManagementScore, debtManagementScore, incomeStabilityScore, planningScore, formula: "Savings (40) + expense management (30) + debt management (15) + income stability (10) + financial planning (5) = overall score" },
    });
  } catch (error) {
    return apiError(error);
  }
}