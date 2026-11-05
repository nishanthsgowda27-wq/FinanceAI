import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { requireUser } from "@/lib/server-auth";
import { createLoan, ensureFinanceUser } from "@/lib/db/finance";

const DEFAULT_MINIMUM_CIBIL_SCORE = 750;

function getMinimumCibilScore() {
  const configured = Number(process.env.LOAN_MINIMUM_CIBIL_SCORE);
  return Number.isInteger(configured) && configured >= 300 && configured <= 900
    ? configured
    : DEFAULT_MINIMUM_CIBIL_SCORE;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    await ensureFinanceUser(user.userId, user.email);
    const body = await request.json();
    const loanAmount = Number(body.loanAmount);
    const interestRate = Number(body.interestRate);
    const tenureYears = Number(body.tenureYears);
    const cibilScore = Number(body.cibilScore);
    if (![loanAmount, interestRate, tenureYears, cibilScore].every(Number.isFinite) || loanAmount <= 0 || interestRate < 0 || tenureYears <= 0 || !Number.isInteger(cibilScore) || cibilScore < 300 || cibilScore > 900) return NextResponse.json({ success: false, message: "Enter valid loan details and a CIBIL score between 300 and 900." }, { status: 400 });
    const months = tenureYears * 12;
    const monthlyRate = interestRate / 1200;
    const monthlyEmi = monthlyRate === 0 ? loanAmount / months : loanAmount * monthlyRate * (1 + monthlyRate) ** months / ((1 + monthlyRate) ** months - 1);
    const totalPayment = monthlyEmi * months;
    const minimumCibilScore = getMinimumCibilScore();
    const passesCibilRequirement = cibilScore >= minimumCibilScore;
    const eligible = passesCibilRequirement && body.affordable !== false;
    const approvalStatus = eligible ? "approved" : "requires_review";
    const analysis = await createLoan(user.userId, user.email, { loanType: String(body.loanType || "Personal Loan"), loanAmount, interestRate, tenureYears, monthlyEmi, totalInterest: totalPayment - loanAmount, totalPayment, cibilScore, minimumCibilScore, eligible, approvalStatus });
    return NextResponse.json({ success: true, analysis });
  } catch (error) { return apiError(error); }
}
