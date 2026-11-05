import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { ensureFinanceUser, getDashboardData } from "@/lib/db/finance";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    await ensureFinanceUser(session.userId, session.email);
    const { searchParams } = new URL(request.url);
    const selectedMonth = searchParams.get("month");
    const includeHistory = searchParams.get("history") === "1";
    return NextResponse.json({ success: true, ...(await getDashboardData(session.userId, selectedMonth, { includeHistory })) });
  } catch (error) {
    return apiError(error);
  }
}