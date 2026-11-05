import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { ensureFinanceUser, getDashboardAnalyticsData, normalizeMonthKey } from "@/lib/db/finance";
import { requireUser } from "@/lib/server-auth";

export const runtime = "nodejs";

const ranges = ["7d", "30d", "90d", "180d", "year"] as const;

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    await ensureFinanceUser(session.userId, session.email);
    const { searchParams } = new URL(request.url);
    const month = normalizeMonthKey(searchParams.get("month"));
    const selectedRange = searchParams.get("range");
    const range = ranges.includes(selectedRange as (typeof ranges)[number]) ? selectedRange as (typeof ranges)[number] : "30d";
    return NextResponse.json({ success: true, ...(await getDashboardAnalyticsData(session.userId, month, range)) });
  } catch (error) {
    return apiError(error);
  }
}