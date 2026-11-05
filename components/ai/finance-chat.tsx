"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  Bot,
  CircleDollarSign,
  CreditCard,
  PiggyBank,
  RotateCcw,
  Send,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import { useApp } from "@/components/providers/app-provider";

const quickPrompts = ["ai.analyze", "ai.monthly", "ai.tax", "ai.loan", "ai.health", "ai.savings"];

const suggestedQuestions = [
  { en: "How much did I spend this month?", kn: "ಈ ತಿಂಗಳು ನಾನು ಎಷ್ಟು ಖರ್ಚು ಮಾಡಿದ್ದೇನೆ?" },
  { en: "Where am I spending the most?", kn: "ನಾನು ಹೆಚ್ಚು ಖರ್ಚು ಮಾಡುತ್ತಿರುವುದು ಎಲ್ಲಿದೆ?" },
  { en: "Explain my financial health", kn: "ನನ್ನ ಹಣಕಾಸಿನ ಆರೋಗ್ಯವನ್ನು ವಿವರಿಸಿ" },
  { en: "Explain my tax estimate", kn: "ನನ್ನ ತೆರಿಗೆ ಅಂದಾಜನ್ನು ವಿವರಿಸಿ" },
  { en: "Can I afford a vehicle loan?", kn: "ನಾನು ವಾಹನ ಸಾಲವನ್ನು ಭರಿಸಬಹುದೇ?" },
  { en: "How can I save more?", kn: "ನಾನು ಹೆಚ್ಚು ಉಳಿತಾಯ ಮಾಡುವುದು ಹೇಗೆ?" },
];

type ChatMessage = { id: string; role: "user" | "assistant"; content: string };

type DashboardApiResponse = {
  success: boolean;
  profile?: { profession?: string; annualIncome?: number; incomeType?: string; age?: number } | null;
  expenses?: Array<{ category: string; amount: number; description?: string; date?: string }>; 
  analysis?: {
    monthlyIncome?: number;
    monthlyExpenses?: number;
    savings?: number;
    score?: number;
    status?: string;
  };
  loans?: Array<{ loanType?: string; monthlyEmi?: number; approvalStatus?: string; loanAmount?: number }>;
  transactions?: Array<{ category?: string; amount?: number; type?: string; date?: string }>;
  selectedMonth?: string;
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function isDateInMonth(dateValue: string | undefined, monthKey: string | undefined) {
  return Boolean(dateValue && monthKey && dateValue.slice(0, 7) === monthKey);
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderMarkdown(markdown: string) {
  const escaped = escapeHtml(markdown);
  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  const withEmphasis = withBold.replace(/\*(.+?)\*/g, "<em>$1</em>");
  const lines = withEmphasis.split("\n");
  let html = "";
  let inList = false;
  let listType: "ul" | "ol" | null = null;

  const flushList = () => {
    if (!inList || !listType) return;
    html += `</${listType}>`;
    inList = false;
    listType = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      html += "<div class=\"mb-3\"></div>";
      return;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!inList || listType !== "ul") {
        flushList();
        html += "<ul class=\"mb-3 list-disc space-y-1 pl-5\">";
        inList = true;
        listType = "ul";
      }
      html += `<li>${trimmed.replace(/^[-*]\s+/, "")}</li>`;
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inList || listType !== "ol") {
        flushList();
        html += "<ol class=\"mb-3 list-decimal space-y-1 pl-5\">";
        inList = true;
        listType = "ol";
      }
      html += `<li>${trimmed.replace(/^\d+\.\s+/, "")}</li>`;
      return;
    }

    flushList();

    if (/^###\s+/.test(trimmed)) {
      html += `<h3 class="mt-2 mb-2 text-base font-semibold text-slate-800">${trimmed.replace(/^###\s+/, "")}</h3>`;
      return;
    }

    if (/^##\s+/.test(trimmed)) {
      html += `<h2 class="mt-2 mb-2 text-lg font-semibold text-slate-800">${trimmed.replace(/^##\s+/, "")}</h2>`;
      return;
    }

    if (/^#\s+/.test(trimmed)) {
      html += `<h2 class="mt-2 mb-2 text-xl font-semibold text-slate-800">${trimmed.replace(/^#\s+/, "")}</h2>`;
      return;
    }

    html += `<p class="mb-3 leading-7 text-slate-700">${trimmed}</p>`;
  });

  flushList();

  return { __html: html };
}

export default function FinanceChat() {
  const { language, t } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snapshot, setSnapshot] = useState<DashboardApiResponse | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSnapshot() {
      try {
        const response = await fetch("/api/dashboard", { cache: "no-store" });
        const data = await response.json().catch(() => ({}));
        if (!active) return;

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load your finance summary.");
        }

        setSnapshot(data);
      } catch {
        if (active) {
          setSnapshot(null);
        }
      } finally {
        if (active) {
          setSnapshotLoading(false);
        }
      }
    }

    void loadSnapshot();

    return () => {
      active = false;
    };
  }, []);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    (snapshot?.expenses ?? []).filter((item) => isDateInMonth(item.date, snapshot?.selectedMonth)).forEach((item) => {
      const current = totals.get(item.category ?? "Other") ?? 0;
      totals.set(item.category ?? "Other", current + Number(item.amount || 0));
    });

    return [...totals.entries()].sort(([, first], [, second]) => second - first);
  }, [snapshot]);

  const topCategory = useMemo(() => categoryTotals[0] ?? ["No data available yet", 0], [categoryTotals]);

  const currentMonthSpending = Number(snapshot?.analysis?.monthlyExpenses ?? 0);
  const remainingBalance = Number(snapshot?.analysis?.savings ?? 0);
  const financialHealthScore = Number(snapshot?.analysis?.score ?? 0);
  const monthlyIncome = Number(snapshot?.analysis?.monthlyIncome ?? 0);
  const hasFinancialData = Boolean(snapshot?.profile || snapshot?.expenses?.length || snapshot?.transactions?.length || snapshot?.loans?.length);

  const quickInsights = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    if (!hasFinancialData) return [];

    return [
      {
        label: "Highest spending category",
        detail: topCategory[0],
        value: formatCurrency(topCategory[1]),
      },
      {
        label: "Current month spend",
        detail: "This month",
        value: formatCurrency(currentMonthSpending),
      },
      {
        label: "Estimated savings",
        detail: "Monthly remaining",
        value: formatCurrency(remainingBalance),
      },
      {
        label: "Financial health",
        detail: snapshot.analysis?.status || "Reviewing",
        value: `${financialHealthScore}/100`,
      },
    ];
  }, [snapshot, topCategory, currentMonthSpending, remainingBalance, financialHealthScore, hasFinancialData]);

  async function sendQuestion(value = question) {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setQuestion("");
    setError("");
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/finance-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, language, history: messages.slice(-10).map(({ role, content }) => ({ role, content })) }),
      });

      const data = await response.json().catch(() => ({}));
      const reply = data?.data?.reply ?? data?.message ?? "";

      if (!response.ok || !data.success || !reply) {
        if (data?.code === "AI_NOT_CONFIGURED") {
          throw new Error("Finance AI is temporarily unavailable. Please check the AI configuration.");
        }
        if (data?.code === "AI_RATE_LIMITED") {
          throw new Error("Finance AI is temporarily busy. Please try again in a minute.");
        }
        if (data?.code === "AI_PROVIDER_UNAVAILABLE") {
          throw new Error("Finance AI is temporarily busy. Please try again shortly.");
        }
        throw new Error(data?.error || data?.message || "Sorry, I couldn't process that request right now. Please try again.");
      }

      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: reply }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Sorry, I couldn't process that request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendQuestion();
  }

  return (
    <section className="mx-auto max-w-[1500px] px-4 py-6 md:px-6 xl:px-8">
      <header className="mb-6 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">FinanceAI</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{t("ai.title")}</h1>
              <p className="mt-1 text-sm text-slate-500">{t("ai.subtitle")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{snapshot?.profile?.profession || "Profile"}</p>
              <p className="text-xs text-slate-500">Ready to help</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">FinanceAI Assistant</p>
                <p className="text-xs text-emerald-600">Online</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMessages([])}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </button>
          </div>

          <div className="space-y-5 p-5">
            {messages.length === 0 ? (
              <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-sm">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">{t("ai.welcome")}</h2>
                <p className="mt-2 max-w-lg text-sm text-slate-500">{t("ai.welcomeText")}</p>

                <div className="mt-6 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                  {suggestedQuestions.map((questionItem) => {
                    const questionText = language === "kn" ? questionItem.kn : questionItem.en;
                    return (
                    <button
                      key={questionText}
                      type="button"
                      disabled={loading}
                      onClick={() => void sendQuestion(questionText)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {questionText}
                    </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[86%] gap-3 rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-current">
                        {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div dangerouslySetInnerHTML={renderMarkdown(message.content)} />
                      </div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <Bot className="h-4 w-4 text-indigo-600" />
                      <span>{t("ai.thinking")}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50/80 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {quickPrompts.map((promptKey) => (
                <button
                  key={promptKey}
                  type="button"
                  disabled={loading}
                  onClick={() => void sendQuestion(t(promptKey))}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t(promptKey)}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="sticky bottom-0 z-10 flex gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void sendQuestion();
                  }
                }}
                placeholder={t("ai.placeholder")}
                rows={1}
                disabled={loading}
                className="max-h-28 min-h-[54px] flex-1 resize-none rounded-xl border-0 bg-transparent px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Overview</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Your Financial Snapshot</h2>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
                <CircleDollarSign className="h-5 w-5" />
              </div>
            </div>

            {snapshotLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Monthly income</span>
                    <Wallet className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{hasFinancialData ? formatCurrency(monthlyIncome) : "No data available yet"}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Monthly expenses</span>
                      <ReceiptIcon />
                    </div>
                    <p className="mt-2 text-xl font-bold text-slate-900">{hasFinancialData ? formatCurrency(currentMonthSpending) : "No data available yet"}</p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Remaining</span>
                      <PiggyBank className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-2 text-xl font-bold text-emerald-600">{hasFinancialData ? formatCurrency(remainingBalance) : "No data available yet"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Financial health</span>
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{hasFinancialData ? `${financialHealthScore}/100` : "No data available yet"}</p>
                  {hasFinancialData && <p className="mt-1 text-xs text-slate-500">{snapshot?.analysis?.status || "Reviewing"}</p>}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Top category</span>
                    <ArrowUpRight className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-900">{topCategory[0]}</p>
                  {hasFinancialData && <p className="mt-1 text-xs text-slate-500">{formatCurrency(topCategory[1])}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TrendingDown className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Insights</p>
                <h3 className="text-xl font-bold text-slate-900">Quick Insights</h3>
              </div>
            </div>

            <div className="space-y-3">
              {quickInsights.map((insight) => (
                <div key={insight.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{insight.label}</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-slate-700">{insight.detail}</p>
                    <p className="text-sm font-bold text-slate-900">{insight.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function ReceiptIcon() {
  return <CreditCard className="h-4 w-4 text-slate-400" />;
}
