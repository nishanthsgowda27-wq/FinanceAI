import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireUser } from "@/lib/server-auth";
import { createTransaction, ensureFinanceUser, listTransactions } from "@/lib/db/finance";

export const runtime = "nodejs";

function serialize(item: { id: string; type: "income" | "expense"; amount: number; category: string; description: string; date: string; paymentMethod: string | null; notes: string | null }) { return item; }

export async function GET(request: Request) {
  try {
    const session = await requireUser();
    const { userId } = session;
    await ensureFinanceUser(userId, session.email);
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const category = url.searchParams.get("category");
    const transactions = await listTransactions(userId, type, category);
    return NextResponse.json({ success: true, transactions: transactions.map(serialize) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const { userId } = session;
    await ensureFinanceUser(userId, session.email);
    const body = await request.json();
    const type = body.type === "income" || body.type === "expense" ? body.type : null;
    const amount = Number(body.amount);
    const date = new Date(`${String(body.date)}T00:00:00`);
    if (!type || !Number.isFinite(amount) || amount <= 0 || !body.category || !body.description || Number.isNaN(date.getTime())) return NextResponse.json({ success: false, message: "Enter valid transaction details." }, { status: 400 });
    const transaction = await createTransaction(userId, { type, amount, category: String(body.category), description: String(body.description).trim(), date: String(body.date), paymentMethod: body.paymentMethod ? String(body.paymentMethod) : null, notes: body.notes ? String(body.notes) : null });
    return NextResponse.json({ success: true, transaction: serialize(transaction) }, { status: 201 });
  } catch (error) { return apiError(error); }
}
