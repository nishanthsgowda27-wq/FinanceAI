import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ success: false, message: "Use the FinanceAI email/password session flow." }, { status: 410 });
}