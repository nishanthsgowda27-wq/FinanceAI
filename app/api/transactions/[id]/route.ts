import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireUser } from "@/lib/server-auth";
import { deleteTransaction, updateTransaction } from "@/lib/db/finance";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
function serialize(item: { id: string; type: "income" | "expense"; amount: number; category: string; description: string; date: string; paymentMethod: string | null; notes: string | null }) { return item; }

export async function PATCH(request: Request, context: Context) {
  try {
    const { userId } = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const data: { type?: "income" | "expense"; amount?: number; category?: string; description?: string; date?: string; paymentMethod?: string | null; notes?: string | null } = {};
    if (body.type === "income" || body.type === "expense") data.type = body.type;
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.category !== undefined) data.category = String(body.category);
    if (body.description !== undefined) data.description = String(body.description).trim();
    if (body.date !== undefined) data.date = String(body.date);
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod ? String(body.paymentMethod) : null;
    if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
    const transaction = await updateTransaction(userId, id, { ...(data.type !== undefined ? { type: data.type } : {}), ...(data.amount !== undefined ? { amount: data.amount } : {}), ...(data.category !== undefined ? { category: data.category } : {}), ...(data.description !== undefined ? { description: data.description } : {}), ...(data.date !== undefined ? { date: data.date } : {}), ...(data.paymentMethod !== undefined ? { paymentMethod: data.paymentMethod } : {}), ...(data.notes !== undefined ? { notes: data.notes } : {}) });
    return NextResponse.json({ success: true, transaction: serialize(transaction) });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { userId } = await requireUser();
    const { id } = await context.params;
    await deleteTransaction(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) { return apiError(error); }
}
