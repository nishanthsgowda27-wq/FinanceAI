import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api-response";
import { getFinancialPeriodAnalysis, getProfile, listLoans } from "@/lib/db/finance";
import { normalizeFinanceQuestion, resolveExpensePeriod } from "@/lib/finance/expense-period";
import { requireUser } from "@/lib/server-auth";
import { calculateTax } from "@/lib/tax/tax-calculator";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 30000;
const MAX_GEMINI_ATTEMPTS = 3;

function isTransientGeminiError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: number; message?: string };
  return candidate.status === 500 || candidate.status === 503 || /UNAVAILABLE|temporarily unavailable|high demand/i.test(candidate.message ?? "");
}

function isGeminiRateLimitError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: number; message?: string };
  return candidate.status === 429 || /RESOURCE_EXHAUSTED|quota exceeded|rate limit/i.test(candidate.message ?? "");
}

async function generateGeminiResponse(ai: GoogleGenAI, prompt: string) {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_GEMINI_ATTEMPTS; attempt += 1) {
    try {
      return { result: await ai.models.generateContent({ model: GEMINI_MODEL, contents: prompt }), model: GEMINI_MODEL };
    } catch (error) {
      lastError = error;
      if (!isTransientGeminiError(error)) throw error;
      if (attempt === MAX_GEMINI_ATTEMPTS) break;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }

  if (lastError && isTransientGeminiError(lastError)) {
    try {
      return { result: await ai.models.generateContent({ model: GEMINI_FALLBACK_MODEL, contents: prompt }), model: GEMINI_FALLBACK_MODEL };
    } catch (fallbackError) {
      throw fallbackError;
    }
  }
  throw lastError ?? new Error("GEMINI_UNAVAILABLE");
}

function buildFinancialContext(
  profile: Awaited<ReturnType<typeof getProfile>>,
  loans: Awaited<ReturnType<typeof listLoans>>,
  finances: Awaited<ReturnType<typeof getFinancialPeriodAnalysis>> | null,
  includeLoanAffordability: boolean,
) {
  const tax = profile ? calculateTax({
    annualIncome: profile.annualIncome,
    deductions: profile.deductions,
    regime: profile.taxRegime === "old" ? "old" : "new",
  }) : null;
  const monthlyIncome = Number(profile?.annualIncome ?? 0) / 12;
  const averageMonthlyExpenses = finances?.averageMonthlyExpense ?? 0;
  const monthlyDebt = loans.reduce((sum, loan) => sum + loan.monthlyEmi, 0);
  const remainingBalance = monthlyIncome - averageMonthlyExpenses - monthlyDebt;
  const savingsRate = monthlyIncome > 0 ? (remainingBalance / monthlyIncome) * 100 : 0;
  const expenseRate = monthlyIncome > 0 ? (averageMonthlyExpenses / monthlyIncome) * 100 : 100;
  const healthScore = monthlyIncome > 0
    ? Math.max(0, Math.min(100, Math.round(Math.max(0, Math.min(40, savingsRate * 0.8)) + Math.max(0, Math.min(35, 35 - Math.max(0, expenseRate - 50) * 0.7)) + (remainingBalance > 0 ? 25 : 0))))
    : 0;
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  const availableAfterExpenses = monthlyIncome - averageMonthlyExpenses;

  return {
    currentDate: new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date()),
    currentYear: new Date().getFullYear(),
    profile: profile ? {
      name: profile.profession || "User",
      profession: profile.profession,
      incomeType: profile.incomeType,
      annualIncome: profile.annualIncome,
      expectedMonthlyIncomeFromProfile: monthlyIncome,
      age: profile.age,
      taxRegime: profile.taxRegime,
      deductions: profile.deductions,
    } : null,
    financialHealth: finances && profile ? {
      score: healthScore,
      status: healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Average" : "Needs Improvement",
      calculation: "Existing FinanceAI dashboard formula; profile annual income / 12, requested-period average monthly expenses, and saved monthly EMIs.",
      requestedPeriod: finances.period.label,
      monthlyIncome,
      averageMonthlyExpenses,
      monthlyDebt,
      remainingBalance,
      savingsRate,
    } : null,
    finances: finances ? {
      dataSource: "MySQL query completed",
      period: finances.period.label,
      startDateInclusive: finances.period.startDate,
      endDateExclusive: finances.period.endDate,
      periodType: finances.period.periodType,
      periodSource: finances.period.periodSource,
      income: {
        recordedAmount: finances.totalIncome,
        transactionCount: finances.incomeTransactionCount,
        hasRecordedTransactions: finances.incomeRecorded,
      },
      expenses: {
        total: finances.totalExpenses,
        transactionCount: finances.expenseTransactionCount,
        averageMonthly: finances.averageMonthlyExpense,
        categories: finances.categoryTotals,
        highestMonth: finances.highestMonth,
        lowestRecordedMonth: finances.lowestRecordedMonth,
        highestIncomeMonth: finances.highestIncomeMonth,
        highestSavingsMonth: finances.highestSavingsMonth,
        lowestSavingsMonth: finances.lowestSavingsMonth,
      },
      savings: {
        amount: finances.savings,
        ratePercent: finances.savingsRate,
        definition: "Recorded income transactions minus recorded expenses; null when no income transactions are recorded.",
      },
      monthlyBreakdown: finances.monthly.map((month) => ({
        ...month,
        futureMonth: month.month > currentMonth,
        savings: month.incomeTransactionCount > 0 ? month.income - month.expenses : null,
      })),
      comparison: finances.comparison,
      expenseTrend: finances.expenseTrend,
      quarterlyTotals: finances.quarterlyTotals,
      quarterComparison: finances.quarterComparison,
      annualTotals: finances.annualTotals,
      annualComparison: finances.annualComparison,
    } : null,
    loanAffordability: includeLoanAffordability && profile && finances ? {
      monthlyIncomeFromProfile: monthlyIncome,
      requestedPeriodAverageMonthlyExpenses: averageMonthlyExpenses,
      availableAfterExpenses,
      recommendedMaximumEmi: Math.max(0, availableAfterExpenses * 0.4),
      rule: "Existing Loan Assistant affordability rule: EMI must not exceed 40% of monthly income remaining after expenses.",
      requiresLoanAmountRateAndTenureForAnEmi: true,
    } : null,
    loans: loans.map((loan) => ({
      loanType: loan.loanType,
      loanAmount: loan.loanAmount,
      monthlyEmi: loan.monthlyEmi,
      approvalStatus: loan.approvalStatus,
    })),
    tax: tax ? {
      source: "Existing Tax Assistant calculateTax logic",
      estimateOnly: true,
      annualIncome: tax.annualIncome,
      deductions: tax.deductions,
      taxableIncome: tax.taxableIncome,
      annualTax: tax.annualTax,
      monthlyTax: tax.monthlyTax,
      effectiveTaxRate: tax.effectiveTaxRate,
      regime: profile?.taxRegime === "old" ? "old" : "new",
      incomeTaxBeforeCess: tax.incomeTaxBeforeCess,
      cess: tax.cess,
    } : null,
  };
}

export async function POST(request: Request) {
  let stage = "authentication";
  try {
    const session = await requireUser();
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      console.error("FINANCE CHAT CONFIGURATION ERROR: GEMINI_API_KEY is not configured");
      return NextResponse.json({ success: false, code: "AI_NOT_CONFIGURED", error: "Finance AI is temporarily unavailable." }, { status: 503 });
    }

    stage = "request parsing";
    const body = await request.json();
    const questionValue = typeof body.message === "string" ? body.message : body.question;
    const question = typeof questionValue === "string" ? questionValue.trim().slice(0, 1000) : "";
    const intentQuestion = normalizeFinanceQuestion(question);
    const language = body.language === "kn" ? "Kannada" : "English";
    const history = Array.isArray(body.history)
      ? body.history
          .filter((item: unknown): item is { role: "user" | "assistant"; content: string } => Boolean(item && typeof item === "object" && "role" in item && "content" in item && ((item as { role?: unknown }).role === "user" || (item as { role?: unknown }).role === "assistant") && typeof (item as { content?: unknown }).content === "string"))
          .slice(-10)
          .map((item: { role: "user" | "assistant"; content: string }) => ({ role: item.role, content: item.content.slice(0, 1000) }))
      : [];
    const previousUserQuestions = [...history].reverse().filter((item: { role: string }) => item.role === "user");
    const previousQuestion = previousUserQuestions.find((item: { content: string }) => resolveExpensePeriod(item.content).periodSource === "question")?.content ?? previousUserQuestions[0]?.content;
    if (!question) {
      return NextResponse.json({ success: false, error: "Enter a financial question." }, { status: 400 });
    }

    stage = "financial data loading";
    const financeTopic = /\b(expenses?|spend|spending|income|earn(?:ed|ings?)?|savings?|save|categories|category|trend|compare|finance|financial|finances|healthy|health|tax|loan|emi|report|summary|analysis|transaction)\b/i.test(intentQuestion);
    const personalReference = /\b(my|mine|i|me|our)\b/i.test(intentQuestion);
    const followUpReference = Boolean(previousQuestion) && /\b(what about|how about|which category|which month|what was|and|compare|highest|lowest)\b/i.test(intentQuestion);
    const dateReference = /\b(today|yesterday|this week|last week|this month|last month|this year|last year|year to date|ytd|last\s+\d+\s+(?:days?|months?)|q[1-4]|20\d{2}|jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i.test(intentQuestion);
    const asksTax = /\b(tax|taxable|taxation)\b/i.test(intentQuestion);
    const asksLoan = /\b(loan|emi|cibil|afford|eligib)\b/i.test(intentQuestion);
    const asksHealth = /\bfinancial health|healthy|health score|health of my finances\b/i.test(intentQuestion);
    const asksReport = /\b(report|summary|summarize|complete analysis|yearly analysis)\b/i.test(intentQuestion) || /\bcomplete\b.*\b(analysis|financial|finances?)\b/i.test(intentQuestion);
    const asksPersonalSavingsAdvice = /\bhow (?:can|do) i save|improve my savings\b/i.test(intentQuestion);
    const personalTaxQuestion = asksTax && /\b(estimate|estimated|how much|owe|pay|calculation|compare|my tax)\b/i.test(intentQuestion);
    const personalLoanQuestion = asksLoan && /\b(eligib\w*|afford|my loan|my emi|my cibil|can i afford)\b/i.test(intentQuestion);
    const personalFinanceQuestion = financeTopic && (personalReference || followUpReference || dateReference || asksReport || asksHealth || personalTaxQuestion || personalLoanQuestion || asksPersonalSavingsAdvice || language === "Kannada");
    const includeLoanAffordability = asksLoan && /\b(afford|eligib|emi)\b/i.test(question);
    const asksPeriodData = personalFinanceQuestion && (/\b(expenses?|spend|spending|income|earn|savings?|save|categories|category|trend|compare|transaction|report|summary|analysis|afford|eligib|health|month|year|quarter)\b/i.test(intentQuestion) || asksLoan);
    const requestedPeriod = asksPeriodData ? resolveExpensePeriod(question, new Date(), previousQuestion) : null;
    const [profile, loans, finances] = await Promise.all([
      personalFinanceQuestion && (asksTax || asksLoan || asksHealth || asksReport) ? getProfile(session.userId) : Promise.resolve(null),
      personalFinanceQuestion && (asksLoan || asksHealth || asksReport) ? listLoans(session.userId) : Promise.resolve([]),
      requestedPeriod ? getFinancialPeriodAnalysis(session.userId, requestedPeriod) : Promise.resolve(null),
    ]);
    const safeContext = buildFinancialContext(profile, loans, finances, includeLoanAffordability);

    const prompt = `You are FinanceAI Assistant, a professional and friendly personal finance guide for FinanceAI. Use only the authenticated user's financial context below. Never invent numbers, dates, balances, taxes, or loan eligibility. Treat every application-calculated value as authoritative. If data is missing, say which source is missing. A completed query with zero expense transactions means ₹0 recorded, not unavailable. A zero income transaction count means no income transactions were recorded; savings is not calculable when income is unrecorded. Do not claim to be a financial advisor, and for tax/investment/loan decisions remind the user to verify with official sources or a qualified professional when needed.

Important behavior rules:
- Answer as if you are helping with the user's real FinanceAI account.
- Prefer concise, clear explanations in plain language.
- Use INR formatting when relevant.
- For tax questions, say that the number is an estimate from the existing Tax Assistant calculation and should be verified before filing or making decisions.
- For general education questions (like emergency fund, EMI, SIP, compound interest, credit score), explain the concept clearly and separate it from their personal FinanceAI data.
- For personal period questions, use only finances from the authenticated user's current MySQL query. Income is from income transactions; expenses are from expense records.
- For yearly questions, say whether the range is current-year year-to-date or a completed full calendar year. Include all monthlyBreakdown months, their expense and income values, total expenses, monthly average, top category, and highest/lowest recorded expense month. Mark futureMonth months as future, not as zero-record months.
- For a complete financial report, include available income, expenses, savings and rate, category analysis, the existing tax estimate, saved loan/EMI information, existing financial-health score, monthly breakdowns, and supported observations. Clearly identify unrecorded sources.
- For rolling ranges, named-month comparisons, quarters, and year-over-year comparisons, include the month-by-month values and combined total. For two-month, quarter, and annual comparisons, report the supplied difference, percentage change, and higher period. Use category counts and percentages exactly as supplied.
- For income questions, use income transaction totals and highestIncomeMonth; do not substitute expenses or profile income. For savings questions, use recorded income minus recorded expenses, savingsRate, and the supplied high/low month values. Do not use profile annual income to fabricate actual income or savings.
- For loans, use loanAffordability and the existing Loan Assistant affordability rule only. If principal, rate, or term is missing, do not invent an EMI. Stored approval status is not lender approval; project CIBIL values are simulated, not bureau scores.
- For financial health, use only the existing FinanceAI score in context and identify that it uses the existing formula and the requested period's average monthly expenses.
- Use recent conversation history only to interpret follow-up references. Do not reuse numbers in past assistant replies; the current MySQL context is authoritative.
- If the question is ambiguous, ask for clarification or explain the likely interpretation.
- A loan's approval status or credit value is application data and must not be presented as a guaranteed lender decision or an official bureau score.
- Respond in ${language} unless the user explicitly asks for another language. Preserve INR currency values and user-entered names/descriptions exactly.

AUTHENTICATED USER FINANCIAL CONTEXT:
${JSON.stringify(safeContext, null, 2)}

RECENT CONVERSATION HISTORY (reference resolution only; not a source of financial facts):
${JSON.stringify(history)}

USER QUESTION:
${question}

Provide a polished response with short paragraphs, bullets or numbered points when helpful, and keep it easy to understand. Keep the answer grounded in facts from the FinanceAI data.`;

    stage = "gemini request";
    const ai = new GoogleGenAI({ apiKey });
    const generation = generateGeminiResponse(ai, prompt);
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("GEMINI_TIMEOUT")), REQUEST_TIMEOUT_MS));
    const generated = await Promise.race([generation, timeout]);
    const reply = generated.result.text?.trim();
    if (!reply) throw new Error("GEMINI_EMPTY_RESPONSE");

    return NextResponse.json({
      success: true,
      message: reply,
      data: { reply },
      model: generated.model,
    });
  } catch (error) {
    if (isGeminiRateLimitError(error)) {
      console.error(`FINANCE CHAT RATE LIMIT stage=${stage} model=${GEMINI_MODEL}`);
      return NextResponse.json({ success: false, code: "AI_RATE_LIMITED", error: "Finance AI is temporarily busy. Please try again in a minute." }, { status: 429 });
    }
    if (isTransientGeminiError(error)) {
      console.error(`FINANCE CHAT PROVIDER UNAVAILABLE stage=${stage} model=${GEMINI_MODEL}`);
      return NextResponse.json({ success: false, code: "AI_PROVIDER_UNAVAILABLE", error: "Finance AI is temporarily busy. Please try again shortly." }, { status: 503 });
    }
    if (error instanceof Error && (error.message === "GEMINI_TIMEOUT" || error.message === "GEMINI_EMPTY_RESPONSE")) {
      return NextResponse.json({ success: false, error: "Sorry, I couldn't process that request right now. Please try again." }, { status: 503 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") return apiError(error);

    const providerError = error as { name?: string; status?: number; code?: string; message?: string };
    console.error(`FINANCE CHAT ERROR stage=${stage} name=${providerError.name ?? "unknown"} status=${providerError.status ?? "unknown"} code=${providerError.code ?? "unknown"} message=${String(providerError.message ?? error)}`);
    return NextResponse.json({ success: false, error: "Sorry, I couldn't process that request right now. Please try again." }, { status: 503 });
  }
}
