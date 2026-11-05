export type ExpensePeriodKey = "this-month" | "last-3-months" | "last-6-months" | "last-12-months" | "this-year" | "last-year";

export type ExpensePeriod = {
  key: ExpensePeriodKey;
  label: string;
  startDate: string;
  endDate: string;
  monthKeys: string[];
  averageMonthCount: number;
  comparisonStartDate: string;
  comparisonEndDate: string;
  periodType?: "day" | "week" | "month" | "multi-month" | "quarter" | "year" | "rolling";
  selectedMonthKeys?: string[];
  periodSource?: "question" | "follow-up" | "default";
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeysBetween(start: Date, endExclusive: Date) {
  const months: string[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor < endExclusive) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

const monthPattern = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const monthNumbers: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

export function normalizeFinanceQuestion(question: string) {
  return question
    .replace(/ಈ ತಿಂಗಳು/g, "this month")
    .replace(/ಕಳೆದ ತಿಂಗಳು|ಹಿಂದಿನ ತಿಂಗಳು/g, "last month")
    .replace(/ಈ ವರ್ಷ/g, "this year")
    .replace(/ಕಳೆದ ವರ್ಷ|ಹಿಂದಿನ ವರ್ಷ/g, "last year")
    .replace(/ಈ ವಾರ/g, "this week")
    .replace(/ಕಳೆದ ವಾರ/g, "last week")
    .replace(/ಇಂದು|ಇವತ್ತು/g, "today")
    .replace(/ನಿನ್ನೆ/g, "yesterday")
    .replace(/ಕಳೆದ\s+(\d+)\s+ತಿಂಗಳ(?:ು)?/g, "last $1 months")
    .replace(/ಕಳೆದ\s+(\d+)\s+ದಿನಗಳ(?:ು)?/g, "last $1 days")
    .replace(/ಜನವರಿ/g, "January")
    .replace(/ಫೆಬ್ರವರಿ/g, "February")
    .replace(/ಮಾರ್ಚ್/g, "March")
    .replace(/ಏಪ್ರಿಲ್/g, "April")
    .replace(/ಮೇ/g, "May")
    .replace(/ಜೂನ್/g, "June")
    .replace(/ಜುಲೈ/g, "July")
    .replace(/ಆಗಸ್ಟ್/g, "August")
    .replace(/ಸೆಪ್ಟೆಂಬರ್/g, "September")
    .replace(/ಅಕ್ಟೋಬರ್/g, "October")
    .replace(/ನವೆಂಬರ್/g, "November")
    .replace(/ಡಿಸೆಂಬರ್/g, "December")
    .replace(/ಖರ್ಚು|ವೆಚ್ಚ/g, "expenses spending")
    .replace(/ಆದಾಯ|ಗಳಿಕೆ/g, "income earnings")
    .replace(/ಉಳಿತಾಯ/g, "savings")
    .replace(/ವರ್ಗ/g, "category")
    .replace(/ತೆರಿಗೆ/g, "tax")
    .replace(/ಸಾಲ/g, "loan")
    .replace(/ಇಎಂಐ/g, "EMI")
    .replace(/ಹಣಕಾಸು|ಹಣಕಾಸಿನ/g, "financial")
    .replace(/ಆರೋಗ್ಯ/g, "health")
    .replace(/ವರದಿ/g, "report")
    .replace(/ಸಾರಾಂಶ/g, "summary")
    .replace(/ವಿಶ್ಲೇಷಣೆ/g, "analysis")
    .replace(/ಹೋಲಿಸಿ|ಹೋಲಿಕೆ/g, "compare")
    .replace(/ನನ್ನ/g, "my")
    .replace(/ನಾನು/g, "I")
    .replace(/ಎಷ್ಟು/g, "how much")
    .replace(/ಯಾವ/g, "which")
    .replace(/ಹೆಚ್ಚು/g, "highest")
    .replace(/ಹಾಗಾದರೆ/g, "what about")
    .replace(/ಮತ್ತು/g, "and");
}

function makePeriod(start: Date, end: Date, label: string, periodType: NonNullable<ExpensePeriod["periodType"]>, options: { monthKeys?: string[]; selectedMonthKeys?: string[]; averageMonthCount?: number } = {}): ExpensePeriod {
  const startDate = dateKey(start);
  const duration = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  const previousStart = new Date(start);
  previousStart.setDate(previousStart.getDate() - duration);
  const monthKeys = options.monthKeys ?? monthKeysBetween(start, end);
  return {
    key: "this-year",
    label,
    startDate,
    endDate: dateKey(end),
    monthKeys,
    averageMonthCount: options.averageMonthCount ?? Math.max(1, monthKeys.length),
    comparisonStartDate: dateKey(previousStart),
    comparisonEndDate: startDate,
    periodType,
    selectedMonthKeys: options.selectedMonthKeys,
  };
}

function explicitPeriod(question: string, now: Date): ExpensePeriod | null {
  const text = normalizeFinanceQuestion(question).toLowerCase();
  const year = now.getFullYear();
  const tomorrow = new Date(year, now.getMonth(), now.getDate() + 1);
  const isoDate = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const humanDate = text.match(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:,?\\s+(20\\d{2}))?\\b`, "i"));

  if (isoDate || humanDate) {
    const dateYear = Number(isoDate?.[1] ?? humanDate?.[3] ?? year);
    const month = isoDate ? Number(isoDate[2]) - 1 : monthNumbers[humanDate![1].slice(0, 3)];
    const day = Number(isoDate?.[3] ?? humanDate?.[2]);
    const start = new Date(dateYear, month, day);
    if (start.getFullYear() === dateYear && start.getMonth() === month && start.getDate() === day) {
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      return makePeriod(start, end, new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(start), "day", { averageMonthCount: 1 });
    }
  }

  if (/\btoday\b/.test(text)) return makePeriod(new Date(year, now.getMonth(), now.getDate()), tomorrow, "Today", "day", { averageMonthCount: 1 });
  if (/\byesterday\b/.test(text)) return makePeriod(new Date(year, now.getMonth(), now.getDate() - 1), new Date(year, now.getMonth(), now.getDate()), "Yesterday", "day", { averageMonthCount: 1 });
  if (/\bthis\s+week\b|\blast\s+week\b/.test(text)) {
    const monday = new Date(year, now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    if (/\blast\s+week\b/.test(text)) monday.setDate(monday.getDate() - 7);
    return makePeriod(monday, /\blast\s+week\b/.test(text) ? new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 7) : tomorrow, /\blast\s+week\b/.test(text) ? "Last Week" : "This Week", "week", { averageMonthCount: 1 });
  }
  if (/\bthis\s+month\b/.test(text)) return makePeriod(new Date(year, now.getMonth(), 1), tomorrow, "This Month", "month");
  if (/\blast\s+month\b/.test(text)) return makePeriod(new Date(year, now.getMonth() - 1, 1), new Date(year, now.getMonth(), 1), "Last Month", "month");

  const range = text.match(/\blast\s+(\d+)\s+(days?|months?)\b/);
  if (range && Number(range[1]) > 0 && Number(range[1]) <= 3650) {
    const count = Number(range[1]);
    const isDays = range[2].startsWith("day");
    const start = new Date(year, now.getMonth(), now.getDate());
    if (isDays) start.setDate(start.getDate() - count + 1);
    else start.setMonth(start.getMonth() - count + 1, 1);
    return makePeriod(start, tomorrow, `Last ${count} ${isDays ? "Days" : "Months"}`, "rolling", { averageMonthCount: isDays ? Math.max(1, Math.ceil(count / 30)) : count });
  }

  if (/\bcompare\b/.test(text) && /\bthis\s+year\b/.test(text) && /\blast\s+year\b/.test(text)) {
    const start = new Date(year - 1, 0, 1);
    return makePeriod(start, tomorrow, `${year - 1} vs ${year} Year to Date`, "year", {
      monthKeys: monthKeysBetween(start, new Date(year + 1, 0, 1)),
      averageMonthCount: now.getMonth() + 13,
    });
  }

  const quarters = [...text.matchAll(/\bq([1-4])(?:\s*(20\d{2}))?\b/gi)].map((match) => ({ quarter: Number(match[1]), year: Number(match[2] ?? year) }));
  if (quarters.length) {
    const monthKeys = [...new Set(quarters.flatMap(({ quarter, year: quarterYear }) => [0, 1, 2].map((offset) => monthKey(new Date(quarterYear, (quarter - 1) * 3 + offset, 1)))))].sort();
    const starts = monthKeys.map((key) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1));
    const endMonth = starts.at(-1)!;
    const end = endMonth.getFullYear() === year && endMonth.getMonth() === now.getMonth() ? tomorrow : new Date(endMonth.getFullYear(), endMonth.getMonth() + 1, 1);
    return makePeriod(starts[0], end, quarters.length === 1 ? `Q${quarters[0].quarter} ${quarters[0].year}` : "Quarter Comparison", "quarter", { monthKeys, selectedMonthKeys: monthKeys });
  }

  const matches = [...text.matchAll(new RegExp(`\\b(${monthPattern})\\b(?:\\s+(20\\d{2}))?`, "gi"))];
  if (matches.length) {
    const yearMatch = text.match(/\b(20\d{2})\b/);
    const requested = matches.map((match) => ({ year: Number(match[2] ?? yearMatch?.[1] ?? year), month: monthNumbers[match[1].slice(0, 3)] }));
    const monthKeys = [...new Set(requested.map((item) => monthKey(new Date(item.year, item.month, 1))))].sort();
    const starts = monthKeys.map((key) => new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, 1));
    const last = starts.at(-1)!;
    const end = last.getFullYear() === year && last.getMonth() === now.getMonth() ? tomorrow : new Date(last.getFullYear(), last.getMonth() + 1, 1);
    const label = requested.map((item) => {
      const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(item.year, item.month, 1));
      return item.year === year && item.month === now.getMonth() ? `${monthLabel} to date` : monthLabel;
    }).join(" and ");
    return makePeriod(starts[0], end, label, requested.length > 1 ? "multi-month" : "month", { monthKeys, selectedMonthKeys: requested.length > 1 ? monthKeys : undefined });
  }

  if (/\blast\s+year\b|\bprevious\s+year\b/.test(text)) {
    const start = new Date(year - 1, 0, 1);
    return makePeriod(start, new Date(year, 0, 1), `Full Calendar Year ${year - 1}`, "year", { monthKeys: monthKeysBetween(start, new Date(year, 0, 1)) });
  }
  if (/\bthis\s+year\b|\byear\s+to\s+date\b|\bytd\b|\bcomplete\s+year\b|\bfull\s+year\b|\bwhole\s+year\b|\byearly\b/.test(text)) {
    const start = new Date(year, 0, 1);
    return makePeriod(start, tomorrow, `Year to Date ${year}`, "year", { monthKeys: monthKeysBetween(start, new Date(year + 1, 0, 1)), averageMonthCount: now.getMonth() + 1 });
  }
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    const requestedYear = Number(yearMatch[1]);
    const start = new Date(requestedYear, 0, 1);
    const end = requestedYear === year ? tomorrow : new Date(requestedYear + 1, 0, 1);
    return makePeriod(start, end, requestedYear === year ? `Year to Date ${requestedYear}` : `Full Calendar Year ${requestedYear}`, "year", {
      monthKeys: monthKeysBetween(start, new Date(requestedYear + 1, 0, 1)),
      averageMonthCount: requestedYear === year ? now.getMonth() + 1 : 12,
    });
  }
  return null;
}

export function getExpensePeriod(key: ExpensePeriodKey, now = new Date()): ExpensePeriod {
  const year = now.getFullYear();
  const month = now.getMonth();
  let start: Date;
  let endExclusive: Date;
  let comparisonStart: Date;
  let comparisonEnd: Date;
  let label: string;

  if (key === "this-month") {
    start = new Date(year, month, 1);
    endExclusive = new Date(year, month, now.getDate() + 1);
    comparisonStart = new Date(year, month - 1, 1);
    comparisonEnd = new Date(year, month, 1);
    label = "This Month";
  } else if (key === "last-year") {
    start = new Date(year - 1, 0, 1);
    endExclusive = new Date(year, 0, 1);
    comparisonStart = new Date(year - 2, 0, 1);
    comparisonEnd = new Date(year - 1, 0, 1);
    label = "Last Year";
  } else if (key === "this-year") {
    start = new Date(year, 0, 1);
    endExclusive = new Date(year, month, now.getDate() + 1);
    comparisonStart = new Date(year - 1, 0, 1);
    comparisonEnd = new Date(year - 1, month, now.getDate() + 1);
    label = "This Year";
  } else {
    const count = key === "last-3-months" ? 3 : key === "last-6-months" ? 6 : 12;
    start = new Date(year, month - count + 1, 1);
    endExclusive = new Date(year, month, now.getDate() + 1);
    comparisonStart = new Date(year, month - count * 2 + 1, 1);
    comparisonEnd = new Date(start);
    label = `Last ${count} Months`;
  }

  return {
    key,
    label,
    startDate: dateKey(start),
    endDate: dateKey(endExclusive),
    monthKeys: monthKeysBetween(start, new Date(start.getFullYear(), start.getMonth() + (key === "this-month" ? 1 : key === "last-year" || key === "this-year" ? 12 : key === "last-3-months" ? 3 : key === "last-6-months" ? 6 : 12), 1)),
    averageMonthCount: key === "this-year" ? month + 1 : key === "this-month" ? 1 : key === "last-year" ? 12 : key === "last-3-months" ? 3 : key === "last-6-months" ? 6 : 12,
    comparisonStartDate: dateKey(comparisonStart),
    comparisonEndDate: dateKey(comparisonEnd),
  };
}

export function resolveExpensePeriod(question: string, now = new Date(), previousQuestion?: string): ExpensePeriod {
  const explicit = explicitPeriod(question, now);
  if (explicit) return { ...explicit, periodSource: "question" };

  if (previousQuestion) {
    const previous = explicitPeriod(previousQuestion, now);
    if (previous) return { ...previous, label: `Follow-up: ${previous.label}`, periodSource: "follow-up" };
  }

  const normalized = normalizeFinanceQuestion(question);
  if (/\bwhich\s+month\b|\bmonthly\s+(?:trend|expenses|income)\b|\btrend\b/i.test(normalized)) {
    const period = getExpensePeriod("this-year", now);
    return { ...period, periodType: "year", periodSource: "default" };
  }

  return { ...getExpensePeriod("this-month", now), periodType: "month", periodSource: "default" };
}