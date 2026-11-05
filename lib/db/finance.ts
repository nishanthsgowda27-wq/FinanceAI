import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { query } from "@/lib/db/mysql";
import { getAuthUserById } from "@/lib/auth-store";
import type { ExpensePeriod } from "@/lib/finance/expense-period";

export type FinanceTransaction = { id: string; type: "income" | "expense"; amount: number; category: string; description: string; date: string; paymentMethod: string | null; notes: string | null };
export type FinanceExpense = { id: string; userId: string; title: string; amount: number; category: string; description: string; date: string; type: "expense"; paymentMethod: string | null; notes: string | null; createdAt: string | null; updatedAt: string | null };
export type FinanceProfile = { profession: string; incomeType: string; annualIncome: number; age: number; taxRegime: string; deductions: number };
export type FinanceLoan = { id: string; loanType: string; loanAmount: number; monthlyEmi: number; approvalStatus: string };

type TransactionRow = RowDataPacket & { id: string; type: "income" | "expense"; amount: number | string; category: string; description: string; date: string; payment_method: string | null; notes: string | null };
type ExpenseRow = RowDataPacket & { id: string; user_id: string; amount: number | string; category: string; description: string; date: string; payment_method: string | null; notes: string | null; created_at: string | null; updated_at: string | null };
type ProfileRow = RowDataPacket & { profession: string; income_type: string; annual_income: number | string; age: number; tax_regime: string; deductions: number | string };
type LoanRow = RowDataPacket & { id: string; loan_type: string; loan_amount: number | string; monthly_emi: number | string; approval_status: string };
type ExpenseAggregateRow = RowDataPacket & { category: string; amount: number | string; transaction_count: number | string };
type ExpenseMonthCategoryRow = RowDataPacket & { month_key: string; category: string; amount: number | string; transaction_count: number | string };
type FinanceIncomeMonthRow = RowDataPacket & { month_key: string; amount: number | string; transaction_count: number | string };
type MonthlyFinanceRow = RowDataPacket & { month_key: string; amount: number | string };
type DailyFinanceRow = RowDataPacket & { date_key: string; amount: number | string };
type DailyCategoryRow = RowDataPacket & { date_key: string; category: string; amount: number | string };

function mapTransaction(row: TransactionRow): FinanceTransaction { return { id: row.id, type: row.type, amount: Number(row.amount), category: row.category, description: row.description, date: String(row.date), paymentMethod: row.payment_method, notes: row.notes }; }
function mapExpense(row: ExpenseRow): FinanceExpense { return { id: row.id, userId: row.user_id, title: row.description, amount: Number(row.amount), category: row.category, description: row.description, date: String(row.date), type: "expense", paymentMethod: row.payment_method, notes: row.notes, createdAt: row.created_at, updatedAt: row.updated_at }; }

export function normalizeMonthKey(value?: string | null) {
  const raw = (value ?? "").trim();
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) return raw;
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function isDateInMonth(dateValue: string | null | undefined, monthKey: string) {
  if (!dateValue) return false;
  const normalized = String(dateValue).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;
  return normalized.slice(0, 7) === monthKey;
}

export async function ensureFinanceUser(userId: string, email: string) {
  const existingUser = await getAuthUserById(userId);
  const fallbackName = (email.split("@")[0] || "FinanceAI User").replace(/[^\p{L}\p{N} _.-]/gu, "").trim() || "FinanceAI User";
  const userName = existingUser?.name || fallbackName;

  await query(
    "INSERT INTO users (id, name, email, password_hash, email_verified) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), email = VALUES(email), password_hash = VALUES(password_hash), email_verified = VALUES(email_verified), updated_at = CURRENT_TIMESTAMP",
    [userId, userName, email, existingUser?.password ?? "", existingUser?.emailVerified ?? false]
  );
}

export async function listExpenses(userId: string) { return (await query<ExpenseRow[]>("SELECT id, user_id, amount, category, description, date, payment_method, notes, created_at, updated_at FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC", [userId])).map(mapExpense); }
async function listExpensesBetween(userId: string, startDate: string, endDate: string) {
  return (await query<ExpenseRow[]>("SELECT id, user_id, amount, category, description, date, payment_method, notes, created_at, updated_at FROM expenses WHERE user_id = ? AND date >= ? AND date < ? ORDER BY date DESC, created_at DESC", [userId, startDate, endDate])).map(mapExpense);
}
export async function getExpensePeriodAnalysis(userId: string, period: ExpensePeriod) {
  const [categoryRows, monthCategoryRows, comparisonRows] = await Promise.all([
    query<ExpenseAggregateRow[]>("SELECT COALESCE(NULLIF(category, ''), 'Other') AS category, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS transaction_count FROM expenses WHERE user_id = ? AND date >= ? AND date < ? GROUP BY COALESCE(NULLIF(category, ''), 'Other') ORDER BY amount DESC", [userId, period.startDate, period.endDate]),
    query<ExpenseMonthCategoryRow[]>("SELECT DATE_FORMAT(date, '%Y-%m') AS month_key, COALESCE(NULLIF(category, ''), 'Other') AS category, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS transaction_count FROM expenses WHERE user_id = ? AND date >= ? AND date < ? GROUP BY DATE_FORMAT(date, '%Y-%m'), COALESCE(NULLIF(category, ''), 'Other') ORDER BY month_key, amount DESC", [userId, period.startDate, period.endDate]),
    query<RowDataPacket[]>("SELECT COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS transaction_count FROM expenses WHERE user_id = ? AND date >= ? AND date < ?", [userId, period.comparisonStartDate, period.comparisonEndDate]),
  ]);
  const categoryTotals = categoryRows.map((row) => ({ category: row.category, amount: Number(row.amount), transactionCount: Number(row.transaction_count) }));
  const monthlyMap = new Map<string, { month: string; total: number; transactionCount: number; categories: Record<string, number> }>();
  for (const month of period.monthKeys) monthlyMap.set(month, { month, total: 0, transactionCount: 0, categories: {} });
  for (const row of monthCategoryRows) {
    const month = String(row.month_key).slice(0, 7);
    const entry = monthlyMap.get(month);
    if (!entry) continue;
    const amount = Number(row.amount);
    entry.total += amount;
    entry.transactionCount += Number(row.transaction_count);
    entry.categories[row.category] = amount;
  }
  const monthly = [...monthlyMap.values()];
  const totalExpenses = categoryTotals.reduce((sum, row) => sum + row.amount, 0);
  const transactionCount = categoryTotals.reduce((sum, row) => sum + row.transactionCount, 0);
  const comparisonTotal = Number(comparisonRows[0]?.amount ?? 0);
  return {
    period,
    totalExpenses,
    transactionCount,
    averageMonthlyExpense: period.averageMonthCount ? totalExpenses / period.averageMonthCount : 0,
    categoryTotals,
    monthly,
    comparisonTotal,
    comparisonChangePercent: comparisonTotal > 0 ? ((totalExpenses - comparisonTotal) / comparisonTotal) * 100 : null,
  };
}

export async function getFinancialPeriodAnalysis(userId: string, period: ExpensePeriod) {
  const [expenseRows, incomeRows] = await Promise.all([
    query<ExpenseMonthCategoryRow[]>("SELECT DATE_FORMAT(date, '%Y-%m') AS month_key, COALESCE(NULLIF(category, ''), 'Other') AS category, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS transaction_count FROM expenses WHERE user_id = ? AND date >= ? AND date < ? GROUP BY DATE_FORMAT(date, '%Y-%m'), COALESCE(NULLIF(category, ''), 'Other') ORDER BY month_key, amount DESC", [userId, period.startDate, period.endDate]),
    query<FinanceIncomeMonthRow[]>("SELECT DATE_FORMAT(date, '%Y-%m') AS month_key, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS transaction_count FROM transactions WHERE user_id = ? AND type = 'income' AND date >= ? AND date < ? GROUP BY DATE_FORMAT(date, '%Y-%m') ORDER BY month_key", [userId, period.startDate, period.endDate]),
  ]);

  const monthlyMap = new Map(period.monthKeys.map((month) => [month, {
    month,
    income: 0,
    incomeTransactionCount: 0,
    expenses: 0,
    expenseTransactionCount: 0,
    categories: {} as Record<string, number>,
  }]));
  const categoryMap = new Map<string, { category: string; amount: number; transactionCount: number }>();

  for (const row of expenseRows) {
    const monthKey = String(row.month_key).slice(0, 7);
    const month = monthlyMap.get(monthKey);
    if (!month) continue;
    const amount = Number(row.amount);
    const transactionCount = Number(row.transaction_count);
    month.expenses += amount;
    month.expenseTransactionCount += transactionCount;
    month.categories[row.category] = amount;
    const category = categoryMap.get(row.category) ?? { category: row.category, amount: 0, transactionCount: 0 };
    category.amount += amount;
    category.transactionCount += transactionCount;
    categoryMap.set(row.category, category);
  }

  for (const row of incomeRows) {
    const month = monthlyMap.get(String(row.month_key).slice(0, 7));
    if (!month) continue;
    month.income += Number(row.amount);
    month.incomeTransactionCount += Number(row.transaction_count);
  }

  const monthly = [...monthlyMap.values()];
  const totalIncome = monthly.reduce((sum, month) => sum + month.income, 0);
  const totalExpenses = monthly.reduce((sum, month) => sum + month.expenses, 0);
  const incomeTransactionCount = monthly.reduce((sum, month) => sum + month.incomeTransactionCount, 0);
  const expenseTransactionCount = monthly.reduce((sum, month) => sum + month.expenseTransactionCount, 0);
  const categoryTotals = [...categoryMap.values()].sort((first, second) => second.amount - first.amount);
  const highestMonth = monthly.reduce<typeof monthly[number] | null>((highest, month) => month.expenses > 0 && month.expenses > (highest?.expenses ?? 0) ? month : highest, null);
  const recordedMonths = monthly.filter((month) => month.expenseTransactionCount > 0);
  const lowestRecordedMonth = recordedMonths.reduce<typeof monthly[number] | null>((lowest, month) => month.expenses < (lowest?.expenses ?? Number.POSITIVE_INFINITY) ? month : lowest, null);
  const recordedIncomeMonths = monthly.filter((month) => month.incomeTransactionCount > 0);
  const highestIncomeMonth = recordedIncomeMonths.reduce<typeof monthly[number] | null>((highest, month) => month.income > (highest?.income ?? Number.NEGATIVE_INFINITY) ? month : highest, null);
  const recordedSavingsMonths = monthly.filter((month) => month.incomeTransactionCount > 0);
  const highestSavingsMonth = recordedSavingsMonths.reduce<typeof monthly[number] | null>((highest, month) => month.income - month.expenses > (highest ? highest.income - highest.expenses : Number.NEGATIVE_INFINITY) ? month : highest, null);
  const lowestSavingsMonth = recordedSavingsMonths.reduce<typeof monthly[number] | null>((lowest, month) => month.income - month.expenses < (lowest ? lowest.income - lowest.expenses : Number.POSITIVE_INFINITY) ? month : lowest, null);
  const firstMonth = monthly[0];
  const lastMonth = monthly.at(-1);
  const comparison = monthly.length === 2 && firstMonth !== undefined && lastMonth !== undefined ? {
    firstMonth: firstMonth.month,
    firstExpenses: firstMonth.expenses,
    secondMonth: lastMonth!.month,
    secondExpenses: lastMonth!.expenses,
    difference: lastMonth!.expenses - firstMonth.expenses,
    percentageChange: firstMonth.expenses > 0 ? ((lastMonth!.expenses - firstMonth.expenses) / firstMonth.expenses) * 100 : null,
    higherMonth: lastMonth!.expenses === firstMonth.expenses ? "equal" : lastMonth!.expenses > firstMonth.expenses ? lastMonth!.month : firstMonth.month,
    firstIncome: firstMonth.income,
    secondIncome: lastMonth!.income,
    incomeDifference: lastMonth!.income - firstMonth.income,
    firstSavings: firstMonth.incomeTransactionCount > 0 ? firstMonth.income - firstMonth.expenses : null,
    secondSavings: lastMonth!.incomeTransactionCount > 0 ? lastMonth!.income - lastMonth!.expenses : null,
    savingsDifference: firstMonth.incomeTransactionCount > 0 && lastMonth!.incomeTransactionCount > 0 ? (lastMonth!.income - lastMonth!.expenses) - (firstMonth.income - firstMonth.expenses) : null,
  } : null;
  const expenseTrend = monthly.length > 1
    ? lastMonth!.expenses > firstMonth.expenses ? "increasing" : lastMonth!.expenses < firstMonth.expenses ? "decreasing" : "unchanged"
    : null;
  const quarterlyTotals = period.periodType === "quarter"
    ? [...monthly.reduce((quarters, month) => {
        const quarter = `Q${Math.floor((Number(month.month.slice(5, 7)) - 1) / 3) + 1} ${month.month.slice(0, 4)}`;
        const current = quarters.get(quarter) ?? { quarter, income: 0, expenses: 0, incomeTransactionCount: 0, expenseTransactionCount: 0 };
        current.income += month.income;
        current.expenses += month.expenses;
        current.incomeTransactionCount += month.incomeTransactionCount;
        current.expenseTransactionCount += month.expenseTransactionCount;
        quarters.set(quarter, current);
        return quarters;
      }, new Map<string, { quarter: string; income: number; expenses: number; incomeTransactionCount: number; expenseTransactionCount: number }>()).values()]
    : [];
  const quarterComparison = quarterlyTotals.length === 2 ? {
    firstQuarter: quarterlyTotals[0].quarter,
    firstExpenses: quarterlyTotals[0].expenses,
    secondQuarter: quarterlyTotals[1].quarter,
    secondExpenses: quarterlyTotals[1].expenses,
    difference: quarterlyTotals[1].expenses - quarterlyTotals[0].expenses,
    percentageChange: quarterlyTotals[0].expenses > 0 ? ((quarterlyTotals[1].expenses - quarterlyTotals[0].expenses) / quarterlyTotals[0].expenses) * 100 : null,
    higherQuarter: quarterlyTotals[0].expenses === quarterlyTotals[1].expenses ? "equal" : quarterlyTotals[1].expenses > quarterlyTotals[0].expenses ? quarterlyTotals[1].quarter : quarterlyTotals[0].quarter,
  } : null;
  const annualTotals = [...monthly.reduce((years, month) => {
    const year = month.month.slice(0, 4);
    const current = years.get(year) ?? { year, income: 0, expenses: 0, incomeTransactionCount: 0, expenseTransactionCount: 0 };
    current.income += month.income;
    current.expenses += month.expenses;
    current.incomeTransactionCount += month.incomeTransactionCount;
    current.expenseTransactionCount += month.expenseTransactionCount;
    years.set(year, current);
    return years;
  }, new Map<string, { year: string; income: number; expenses: number; incomeTransactionCount: number; expenseTransactionCount: number }>()).values()];
  const annualComparison = annualTotals.length === 2 ? {
    firstYear: annualTotals[0].year,
    firstExpenses: annualTotals[0].expenses,
    secondYear: annualTotals[1].year,
    secondExpenses: annualTotals[1].expenses,
    difference: annualTotals[1].expenses - annualTotals[0].expenses,
    percentageChange: annualTotals[0].expenses > 0 ? ((annualTotals[1].expenses - annualTotals[0].expenses) / annualTotals[0].expenses) * 100 : null,
    higherYear: annualTotals[0].expenses === annualTotals[1].expenses ? "equal" : annualTotals[1].expenses > annualTotals[0].expenses ? annualTotals[1].year : annualTotals[0].year,
    incomeDifference: annualTotals[1].income - annualTotals[0].income,
  } : null;

  return {
    period,
    totalIncome,
    incomeTransactionCount,
    incomeRecorded: incomeTransactionCount > 0,
    totalExpenses,
    expenseTransactionCount,
    savings: incomeTransactionCount > 0 ? totalIncome - totalExpenses : null,
    savingsRate: incomeTransactionCount > 0 && totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : null,
    averageMonthlyExpense: period.averageMonthCount ? totalExpenses / period.averageMonthCount : 0,
    categoryTotals: categoryTotals.map((category) => ({ ...category, percentage: totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0 })),
    monthly,
    highestMonth,
    lowestRecordedMonth,
    highestIncomeMonth,
    highestSavingsMonth,
    lowestSavingsMonth,
    comparison,
    expenseTrend,
    quarterlyTotals,
    quarterComparison,
    annualTotals,
    annualComparison,
  };
}

export async function getDashboardAnalyticsData(userId: string, selectedMonth: string, range: "7d" | "30d" | "90d" | "180d" | "year") {
  const [yearText, monthText] = selectedMonth.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) throw new Error("INVALID_MONTH");
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEndDate = new Date(year, month, 1);
  const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, "0")}-01`;
  const yearStart = `${new Date().getFullYear()}-01-01`;
  const yearEnd = `${new Date().getFullYear() + 1}-01-01`;
  const today = new Date();
  const trendStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayCount = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : range === "180d" ? 180 : 0;
  if (dayCount) trendStart.setDate(trendStart.getDate() - dayCount + 1);
  else trendStart.setFullYear(today.getFullYear(), 0, 1);
  const trendStartKey = `${trendStart.getFullYear()}-${String(trendStart.getMonth() + 1).padStart(2, "0")}-${String(trendStart.getDate()).padStart(2, "0")}`;
  const trendEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const trendEndKey = `${trendEnd.getFullYear()}-${String(trendEnd.getMonth() + 1).padStart(2, "0")}-${String(trendEnd.getDate()).padStart(2, "0")}`;

  const [incomeRows, expenseMonthRows, trendRows, detailRows, incomeTotalRows, expenseTotalRows] = await Promise.all([
    query<MonthlyFinanceRow[]>("SELECT DATE_FORMAT(date, '%Y-%m') AS month_key, COALESCE(SUM(amount), 0) AS amount FROM transactions WHERE user_id = ? AND type = 'income' AND date >= ? AND date < ? GROUP BY DATE_FORMAT(date, '%Y-%m')", [userId, yearStart, yearEnd]),
    query<MonthlyFinanceRow[]>("SELECT DATE_FORMAT(date, '%Y-%m') AS month_key, COALESCE(SUM(amount), 0) AS amount FROM expenses WHERE user_id = ? AND date >= ? AND date < ? GROUP BY DATE_FORMAT(date, '%Y-%m')", [userId, yearStart, yearEnd]),
    query<DailyFinanceRow[]>("SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date_key, COALESCE(SUM(amount), 0) AS amount FROM expenses WHERE user_id = ? AND date >= ? AND date < ? GROUP BY DATE_FORMAT(date, '%Y-%m-%d') ORDER BY date_key", [userId, trendStartKey, trendEndKey]),
    query<DailyCategoryRow[]>("SELECT DATE_FORMAT(date, '%Y-%m-%d') AS date_key, COALESCE(NULLIF(category, ''), 'Other') AS category, COALESCE(SUM(amount), 0) AS amount FROM expenses WHERE user_id = ? AND date >= ? AND date < ? GROUP BY DATE_FORMAT(date, '%Y-%m-%d'), COALESCE(NULLIF(category, ''), 'Other') ORDER BY date_key", [userId, monthStart, monthEnd]),
    query<RowDataPacket[]>("SELECT COALESCE(SUM(amount), 0) AS amount FROM transactions WHERE user_id = ? AND type = 'income' AND date >= ? AND date < ?", [userId, monthStart, monthEnd]),
    query<RowDataPacket[]>("SELECT COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS transaction_count FROM expenses WHERE user_id = ? AND date >= ? AND date < ?", [userId, monthStart, monthEnd]),
  ]);

  const monthly = Array.from({ length: 12 }, (_, index) => {
    const monthKey = `${new Date().getFullYear()}-${String(index + 1).padStart(2, "0")}`;
    return {
      monthKey,
      income: Number(incomeRows.find((row) => row.month_key === monthKey)?.amount ?? 0),
      expense: Number(expenseMonthRows.find((row) => row.month_key === monthKey)?.amount ?? 0),
    };
  });
  return {
    monthly,
    trend: trendRows.map((row) => ({ date: String(row.date_key).slice(0, 10), expense: Number(row.amount) })),
    details: detailRows.map((row) => ({ date: String(row.date_key).slice(0, 10), category: row.category, amount: Number(row.amount) })),
    selectedMonthIncome: Number(incomeTotalRows[0]?.amount ?? 0),
    selectedMonthExpenses: Number(expenseTotalRows[0]?.amount ?? 0),
    selectedMonthTransactionCount: Number(expenseTotalRows[0]?.transaction_count ?? 0),
  };
}
export async function createExpense(userId: string, input: { amount: number; category: string; description: string; date: string; paymentMethod: string | null; notes: string | null }) {
  const id = crypto.randomUUID();
  await query("INSERT INTO expenses (id, user_id, amount, category, description, date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [id, userId, input.amount, input.category, input.description, input.date, input.paymentMethod, input.notes]);
  const rows = await query<ExpenseRow[]>("SELECT id, user_id, amount, category, description, date, payment_method, notes, created_at, updated_at FROM expenses WHERE id = ? AND user_id = ?", [id, userId]);
  return mapExpense(rows[0]);
}
export async function updateExpense(userId: string, id: string, input: Record<string, unknown>) {
  const fields: string[] = []; const values: unknown[] = [];
  for (const [key, value] of Object.entries(input)) { const column = { amount: "amount", category: "category", description: "description", date: "date", paymentMethod: "payment_method", notes: "notes" }[key as string]; if (column) { fields.push(`${column} = ?`); values.push(value); } }
  if (fields.length === 0) throw new Error("INVALID_DATA");
  values.push(id, userId);
  const result = await query<ResultSetHeader[]>(`UPDATE expenses SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`, values);
  if (result[0].affectedRows === 0) throw new Error("NOT_FOUND");
  const rows = await query<ExpenseRow[]>("SELECT id, user_id, amount, category, description, date, payment_method, notes, created_at, updated_at FROM expenses WHERE id = ? AND user_id = ?", [id, userId]);
  return mapExpense(rows[0]);
}
export async function deleteExpense(userId: string, id: string) { const result = await query<ResultSetHeader[]>("DELETE FROM expenses WHERE id = ? AND user_id = ?", [id, userId]); if (result[0].affectedRows === 0) throw new Error("NOT_FOUND"); }

export async function listTransactions(userId: string, type?: string | null, category?: string | null) {
  const conditions = ["user_id = ?"]; const values: unknown[] = [userId]; if (type) { conditions.push("type = ?"); values.push(type); } if (category) { conditions.push("category = ?"); values.push(category); }
  return (await query<TransactionRow[]>(`SELECT id, type, amount, category, description, date, payment_method, notes FROM transactions WHERE ${conditions.join(" AND ")} ORDER BY date DESC, created_at DESC`, values)).map(mapTransaction);
}
async function listTransactionsBetween(userId: string, startDate: string, endDate: string) {
  return (await query<TransactionRow[]>("SELECT id, type, amount, category, description, date, payment_method, notes FROM transactions WHERE user_id = ? AND date >= ? AND date < ? ORDER BY date DESC, created_at DESC", [userId, startDate, endDate])).map(mapTransaction);
}
export async function createTransaction(userId: string, data: Omit<FinanceTransaction, "id">) { const id = crypto.randomUUID(); await query("INSERT INTO transactions (id, user_id, type, amount, category, description, date, payment_method, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, userId, data.type, data.amount, data.category, data.description, data.date, data.paymentMethod, data.notes]); return { ...data, id }; }
export async function updateTransaction(userId: string, id: string, data: Record<string, unknown>) { const fields: string[] = []; const values: unknown[] = []; for (const [key, value] of Object.entries(data)) { if (["type", "amount", "category", "description", "date", "paymentMethod", "notes"].includes(key)) { fields.push(`${key === "paymentMethod" ? "payment_method" : key} = ?`); values.push(value); } } values.push(id, userId); const result = await query<ResultSetHeader[]>(`UPDATE transactions SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`, values); if (result[0].affectedRows === 0) throw new Error("NOT_FOUND"); const rows = await query<TransactionRow[]>("SELECT id, type, amount, category, description, date, payment_method, notes FROM transactions WHERE id = ? AND user_id = ?", [id, userId]); return mapTransaction(rows[0]); }
export async function deleteTransaction(userId: string, id: string) { const result = await query<ResultSetHeader[]>("DELETE FROM transactions WHERE id = ? AND user_id = ?", [id, userId]); if (result[0].affectedRows === 0) throw new Error("NOT_FOUND"); }

export async function getProfile(userId: string) { const rows = await query<ProfileRow[]>("SELECT profession, income_type, annual_income, age, tax_regime, deductions FROM financial_profiles WHERE user_id = ?", [userId]); const row = rows[0]; return row ? { profession: row.profession, incomeType: row.income_type, annualIncome: Number(row.annual_income), age: Number(row.age), taxRegime: row.tax_regime, deductions: Number(row.deductions) } : null; }
export async function saveProfile(userId: string, profile: FinanceProfile) { await query("INSERT INTO financial_profiles (user_id, profession, income_type, annual_income, age, tax_regime, deductions) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE profession = VALUES(profession), income_type = VALUES(income_type), annual_income = VALUES(annual_income), age = VALUES(age), tax_regime = VALUES(tax_regime), deductions = VALUES(deductions), updated_at = CURRENT_TIMESTAMP", [userId, profile.profession, profile.incomeType, profile.annualIncome, profile.age, profile.taxRegime, profile.deductions]); return profile; }
export async function listLoans(userId: string) { const rows = await query<LoanRow[]>("SELECT id, loan_type, loan_amount, monthly_emi, approval_status FROM loans WHERE user_id = ? ORDER BY created_at DESC", [userId]); return rows.map((row) => ({ id: row.id, loanType: row.loan_type, loanAmount: Number(row.loan_amount), monthlyEmi: Number(row.monthly_emi), approvalStatus: row.approval_status })); }

export async function createLoan(userId: string, email: string, data: Record<string, unknown>) { const id = crypto.randomUUID(); await query("INSERT INTO loans (id, user_id, email, loan_type, loan_amount, interest_rate, tenure_years, monthly_emi, total_interest, total_payment, cibil_score, minimum_cibil_score, eligible, approval_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, userId, email, data.loanType, data.loanAmount, data.interestRate, data.tenureYears, data.monthlyEmi, data.totalInterest, data.totalPayment, data.cibilScore, data.minimumCibilScore, data.eligible, data.approvalStatus]); return { id, userId, email, ...data }; }

export async function dashboardTransactionData(userId: string) { return listTransactions(userId); }

export async function getDashboardData(userId: string, selectedMonth?: string | null, options?: { includeHistory?: boolean }) {
  const monthKey = normalizeMonthKey(selectedMonth);
  const [year, month] = monthKey.split("-").map(Number);
  const monthEndDate = new Date(year, month, 1);
  const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, "0")}-01`;
  const startDate = `${monthKey}-01`;
  const includeHistory = options?.includeHistory !== false;
  const [profile, expenses, transactions, loans] = await Promise.all([
    getProfile(userId),
    includeHistory ? listExpenses(userId) : listExpensesBetween(userId, startDate, monthEnd),
    includeHistory ? listTransactions(userId) : listTransactionsBetween(userId, startDate, monthEnd),
    listLoans(userId),
  ]);
  const expenseTransactions = expenses.map((item) => ({ id: item.id, title: item.title, description: item.description, amount: item.amount, category: item.category, date: item.date, type: "expense" as const, paymentMethod: item.paymentMethod, notes: item.notes }));
  const allTransactions = [...transactions.filter((item) => item.type !== "expense"), ...expenseTransactions].sort((a, b) => a.date.localeCompare(b.date));
  const monthTransactions = allTransactions.filter((item) => isDateInMonth(item.date, monthKey));
  const monthlyIncome = Number(profile?.annualIncome ?? 0) / 12;
  const monthlyExpenses = monthTransactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const monthlyDebt = loans.reduce((sum, item) => sum + item.monthlyEmi, 0);
  const savings = monthlyIncome - monthlyExpenses - monthlyDebt;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
  const expenseRate = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 100;
  const score = monthlyIncome > 0 ? Math.max(0, Math.min(100, Math.round(Math.max(0, Math.min(40, savingsRate * 0.8)) + Math.max(0, Math.min(35, 35 - Math.max(0, expenseRate - 50) * 0.7)) + (savings > 0 ? 25 : 0)))) : 0;
  return {
    profile,
    expenses,
    transactions: monthTransactions,
    allTransactions,
    loans,
    selectedMonth: monthKey,
    analysis: {
      monthlyIncome,
      totalExpenses: monthlyExpenses,
      monthlyExpenses,
      monthlyDebt,
      savings,
      savingsRate,
      score,
      status: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Needs Improvement",
    },
  };
}
