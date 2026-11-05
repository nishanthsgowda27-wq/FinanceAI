import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireExpenseUser } from "@/lib/expense-auth";
import { deleteExpense, updateExpense } from "@/lib/db/finance";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
	try {
		const { userId } = await requireExpenseUser();
		const { id } = await context.params;
		const body = await request.json();
		const data: Record<string, unknown> = {};
		if (body.title !== undefined || body.description !== undefined) data.description = String(body.title ?? body.description).trim();
		if (body.amount !== undefined) data.amount = Number(body.amount);
		if (body.category !== undefined) data.category = String(body.category).trim();
		if (body.date !== undefined) data.date = String(body.date);
		if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod ? String(body.paymentMethod) : null;
		if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
		if (data.description === "" || (data.amount !== undefined && (!Number.isFinite(data.amount) || Number(data.amount) <= 0)) || (data.category !== undefined && data.category === "") || (data.date !== undefined && Number.isNaN(new Date(`${data.date}T00:00:00`).getTime()))) {
			return NextResponse.json({ success: false, message: "Enter valid expense details." }, { status: 400 });
		}
		const expense = await updateExpense(userId, id, data);
		return NextResponse.json({ success: true, expense });
	} catch (error) {
		return apiError(error);
	}
}

export async function DELETE(_request: Request, context: Context) {
	try {
		const { userId } = await requireExpenseUser();
		const { id } = await context.params;
		await deleteExpense(userId, id);
		return NextResponse.json({ success: true });
	} catch (error) {
		return apiError(error);
	}
}