import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireUser } from "@/lib/server-auth";
import { ensureFinanceUser, getProfile, saveProfile } from "@/lib/db/finance";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await requireUser();
    await ensureFinanceUser(session.userId, session.email);
    const profile = await getProfile(session.userId);
    return NextResponse.json({ success: true, profile });
  } catch (error) { return apiError(error); }
}

export async function PUT(request: Request) {
  try {
    const session = await requireUser();
    const body = await request.json();
    const profession = typeof body.profession === "string" ? body.profession.trim() : "";
    const incomeType = typeof body.incomeType === "string" ? body.incomeType : "other";
    const annualIncome = Number(body.annualIncome);
    const age = Number(body.age);
    const taxRegime = body.taxRegime === "old" ? "old" : "new";
    const deductions = Math.max(0, Number(body.deductions || 0));
    if (!profession || !Number.isFinite(annualIncome) || annualIncome < 0 || !Number.isInteger(age) || age < 0 || age > 120) return NextResponse.json({ success: false, message: "Enter valid profile details." }, { status: 400 });
    await ensureFinanceUser(session.userId, session.email);
    const profile = await saveProfile(session.userId, { profession, incomeType, annualIncome, age, taxRegime, deductions });
    return NextResponse.json({ success: true, profile });
  } catch (error) { return apiError(error); }
}
