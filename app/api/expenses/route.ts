import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireExpenseUser } from "@/lib/expense-auth";
import { createExpense, ensureFinanceUser, listExpenses } from "@/lib/db/finance";

export const runtime = "nodejs";

export async function GET() {
	try {
		const session = await requireExpenseUser();
		await ensureFinanceUser(session.userId, session.email);
		return NextResponse.json({ success: true, expenses: await listExpenses(session.userId) });
	} catch (error) {
		return apiError(error);
	}
}

export async function POST(request: Request) {
	try {
		const session = await requireExpenseUser();
		await ensureFinanceUser(session.userId, session.email);
		const body = await request.json();
		const description = typeof body.title === "string" ? body.title.trim() : typeof body.description === "string" ? body.description.trim() : "";
		const category = typeof body.category === "string" ? body.category.trim() : "";
		const amount = Number(body.amount);
		const date = String(body.date ?? "");
		if (!description || !category || !Number.isFinite(amount) || amount <= 0 || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
			return NextResponse.json({ success: false, message: "Enter valid expense details." }, { status: 400 });
		}
		const expense = await createExpense(session.userId, { amount, category, description, date, paymentMethod: body.paymentMethod ? String(body.paymentMethod) : null, notes: body.notes ? String(body.notes) : null });
		return NextResponse.json({ success: true, expense }, { status: 201 });
	} catch (error) {
		return apiError(error);
	}
}