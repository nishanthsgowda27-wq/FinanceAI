import { NextResponse } from "next/server";
import { getProfile, listTransactions } from "@/lib/db/finance";
import { requireUser } from "@/lib/server-auth";

export async function GET() {
  try {
    const { userId } = await requireUser();
    const [profile, transactions] = await Promise.all([getProfile(userId), listTransactions(userId)]);
    const income = Number(profile?.annualIncome ?? 0) / 12;
    const expenses = transactions.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const score = Math.max(0, Math.min(100, Math.round(Math.max(0, Math.min(40, savingsRate * 0.8)) + (savings > 0 ? 60 : 0))));
    return NextResponse.json({ success: true, analysis: { income, expenses, savings, savingsRate, score, status: score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Average" : "Needs Improvement" } });
  } catch (error) {
    console.error("ANALYSIS ERROR", error);
    return NextResponse.json({ success: false, message: "Unable to load financial analysis." }, { status: error instanceof Error && error.message === "UNAUTHORIZED" ? 401 : 500 });
  }
}
