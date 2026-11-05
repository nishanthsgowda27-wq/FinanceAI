import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireExpenseUser } from "@/lib/expense-auth";
import { ensureFinanceUser, getExpensePeriodAnalysis } from "@/lib/db/finance";
import { getExpensePeriod, type ExpensePeriodKey } from "@/lib/finance/expense-period";

export const runtime = "nodejs";

const validPeriods: ExpensePeriodKey[] = ["this-month", "last-3-months", "last-6-months", "last-12-months", "this-year", "last-year"];

export async function GET(request: Request) {
  try {
    const session = await requireExpenseUser();
    await ensureFinanceUser(session.userId, session.email);
    const requested = new URL(request.url).searchParams.get("period") as ExpensePeriodKey | null;
    const period = validPeriods.includes(requested as ExpensePeriodKey) ? requested as ExpensePeriodKey : "this-month";
    return NextResponse.json({ success: true, ...(await getExpensePeriodAnalysis(session.userId, getExpensePeriod(period))) });
  } catch (error) {
    return apiError(error);
  }
}