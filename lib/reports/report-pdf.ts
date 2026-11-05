import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type ReportTransaction = { id: string; description: string; category: string; amount: number; type: "income" | "expense"; date: string };

export type ReportData = {
  generatedAt: string;
  reportId: string;
  period: { key: string; label: string };
  assessmentYear: string;
  user: { name: string; email: string };
  profile: { profession: string; incomeType: string; annualIncome: number; taxRegime: string; deductions: number } | null;
  transactions: ReportTransaction[];
  categories: { category: string; amount: number; percentage: number }[];
  trends: { month: string; income: number; expenses: number }[];
  summary: { income: number; expenses: number; netSavings: number; savingsRate: number; averageDailyExpense: number; highestCategory: string; highestExpense: ReportTransaction | null };
  tax: { annualIncome: number; deductions: number; taxableIncome: number; incomeTaxBeforeRebate: number; rebate: number; incomeTaxBeforeCess: number; cess: number; annualTax: number; slabs: { range: string; rate: number; taxableAmount: number; tax: number }[]; assessmentYear: string; calculationDate: string };
  loan: { profession: string; monthlyIncome: number; existingObligations: number; estimatedMonthlySurplus: number; projectCibilScore: number; estimates: { name: string; rate: number; tenureYears: number; eligibleAmount: number; monthlyEmi: number; estimatedInterest: number; totalRepayment: number; assumptions: string }[] };
  health: { overallScore: number; savingsScore: number; expenseManagementScore: number; debtManagementScore: number; incomeStabilityScore: number; planningScore: number; formula: string };
};

const BLUE: [number, number, number] = [19, 87, 166];
const DARK: [number, number, number] = [16, 42, 76];
const TEXT: [number, number, number] = [38, 52, 71];
const MUTED: [number, number, number] = [82, 97, 118];
const BORDER: [number, number, number] = [203, 213, 225];
const LIGHT: [number, number, number] = [241, 246, 252];
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const LEFT = 14;
const CONTENT_WIDTH = PAGE_WIDTH - LEFT * 2;
const TOP = 25;
const BOTTOM = 20;

function money(value: number) {
  return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
}

function dateLabel(value: string | Date) {
  const date = value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

function timeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function reportingPeriod(periodKey: string) {
  const [year, month] = periodKey.split("-").map(Number);
  return `${dateLabel(new Date(year, month - 1, 1))} - ${dateLabel(new Date(year, month, 0))}`;
}

export function createReportPdf(report: ReportData, transactions: ReportTransaction[]) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  let y = TOP;

  const newPage = () => {
    pdf.addPage();
    y = TOP;
  };

  const ensureSpace = (height: number) => {
    if (y + height > PAGE_HEIGHT - BOTTOM) newPage();
  };

  const section = (title: string) => {
    ensureSpace(67);
    pdf.setDrawColor(...BORDER);
    pdf.setFillColor(...LIGHT);
    pdf.roundedRect(LEFT, y, CONTENT_WIDTH, 9, 1.2, 1.2, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...BLUE);
    pdf.text(title.toUpperCase(), LEFT + 4, y + 6.1);
    y += 13;
  };

  const table = (headers: string[], rows: string[][], options: { columnStyles?: Record<number, { cellWidth: number }>; fontSize?: number } = {}) => {
    autoTable(pdf, {
      head: [headers],
      body: rows.length ? rows : [["No data available for this period.", ...Array(Math.max(0, headers.length - 1)).fill("")]],
      startY: y,
      margin: { left: LEFT, right: LEFT, top: TOP, bottom: BOTTOM },
      theme: "grid",
      showHead: "everyPage",
      rowPageBreak: "avoid",
      styles: { font: "helvetica", fontSize: options.fontSize ?? 8, textColor: TEXT, lineColor: BORDER, lineWidth: 0.15, cellPadding: 2.2, overflow: "linebreak", valign: "middle" },
      headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [249, 251, 253] },
      columnStyles: options.columnStyles,
      tableWidth: CONTENT_WIDTH,
      didDrawPage: () => {},
    });
    y = (pdf as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  };

  const detailRows = (items: Array<[string, string]>) => table(["Particulars", "Details"], items, {
    columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: CONTENT_WIDTH - 65 } },
  });

  const drawComparisonChart = () => {
    ensureSpace(54);
    const chartTop = y;
    const chartHeight = 43;
    if (report.summary.income === 0 && report.summary.expenses === 0) {
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(LEFT, chartTop, CONTENT_WIDTH, chartHeight, 1.2, 1.2, "S");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...MUTED);
      pdf.text("No data available for this period.", PAGE_WIDTH / 2, chartTop + 23, { align: "center" });
      y += chartHeight + 6;
      return;
    }
    const baseline = chartTop + chartHeight - 10;
    pdf.setDrawColor(...BORDER);
    pdf.line(LEFT + 8, baseline, LEFT + CONTENT_WIDTH - 8, baseline);
    const values = [report.summary.income, report.summary.expenses];
    const maxValue = Math.max(...values, 1);
    const barWidth = 28;
    const positions = [LEFT + 48, LEFT + 112];
    values.forEach((value, index) => {
      const height = Math.max(1, (value / maxValue) * 25);
      pdf.setFillColor(...(index === 0 ? BLUE : [217, 119, 6] as [number, number, number]));
      pdf.roundedRect(positions[index], baseline - height, barWidth, height, 1, 1, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...DARK);
      pdf.text(money(value), positions[index] + barWidth / 2, baseline - height - 2, { align: "center" });
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(...MUTED);
      pdf.text(index === 0 ? "Income" : "Expenses", positions[index] + barWidth / 2, baseline + 5, { align: "center" });
    });
    pdf.setDrawColor(...BORDER);
    pdf.roundedRect(LEFT, chartTop, CONTENT_WIDTH, chartHeight, 1.2, 1.2, "S");
    y += chartHeight + 6;
  };

  const drawCategoryChart = () => {
    const categories = report.categories.slice(0, 6);
    const height = Math.max(20, categories.length * 6 + 8);
    ensureSpace(height + 5);
    if (categories.length === 0) {
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(LEFT, y - 2, CONTENT_WIDTH, height, 1.2, 1.2, "S");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...MUTED);
      pdf.text("No data available for this period.", PAGE_WIDTH / 2, y + height / 2 + 1, { align: "center" });
      y += height + 5;
      return;
    }
    const maxValue = Math.max(...categories.map((item) => item.amount), 1);
    categories.forEach((item, index) => {
      const rowY = y + index * 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(...TEXT);
      pdf.text(item.category, LEFT + 3, rowY + 4);
      const barLeft = LEFT + 50;
      const barMaxWidth = 82;
      pdf.setFillColor(237, 242, 248);
      pdf.roundedRect(barLeft, rowY + 1, barMaxWidth, 3.2, 1, 1, "F");
      pdf.setFillColor(...BLUE);
      pdf.roundedRect(barLeft, rowY + 1, Math.max(1, item.amount / maxValue * barMaxWidth), 3.2, 1, 1, "F");
      pdf.setTextColor(...MUTED);
      pdf.text(`${money(item.amount)} (${item.percentage.toFixed(1)}%)`, LEFT + CONTENT_WIDTH - 3, rowY + 4, { align: "right" });
    });
    pdf.setDrawColor(...BORDER);
    pdf.roundedRect(LEFT, y - 2, CONTENT_WIDTH, height, 1.2, 1.2, "S");
    y += height + 5;
  };

  const drawTrendChart = () => {
    const points = report.trends;
    ensureSpace(45);
    const chartTop = y;
    const chartHeight = 36;
    if (points.length === 0 || points.every((item) => item.income === 0 && item.expenses === 0)) {
      pdf.setDrawColor(...BORDER);
      pdf.roundedRect(LEFT, chartTop, CONTENT_WIDTH, chartHeight, 1.2, 1.2, "S");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...MUTED);
      pdf.text("No data available for this period.", PAGE_WIDTH / 2, chartTop + 20, { align: "center" });
      y += chartHeight + 6;
      return;
    }
    const chartLeft = LEFT + 10;
    const chartWidth = CONTENT_WIDTH - 20;
    const baseline = chartTop + 25;
    const maxValue = Math.max(...points.flatMap((item) => [item.income, item.expenses]), 1);
    pdf.setDrawColor(...BORDER);
    pdf.line(chartLeft, baseline, chartLeft + chartWidth, baseline);
    const dx = points.length > 1 ? chartWidth / (points.length - 1) : 0;
    const drawSeries = (key: "income" | "expenses", color: [number, number, number]) => {
      pdf.setDrawColor(...color);
      pdf.setFillColor(...color);
      points.forEach((point, index) => {
        const x = chartLeft + index * dx;
        const value = key === "income" ? point.income : point.expenses;
        const pointY = baseline - value / maxValue * 19;
        if (index > 0) {
          const prev = points[index - 1];
          const prevValue = key === "income" ? prev.income : prev.expenses;
          const prevY = baseline - prevValue / maxValue * 19;
          pdf.line(chartLeft + (index - 1) * dx, prevY, x, pointY);
        }
        pdf.circle(x, pointY, 0.8, "F");
      });
    };
    drawSeries("income", BLUE);
    drawSeries("expenses", [217, 119, 6]);
    points.forEach((point, index) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.5);
      pdf.setTextColor(...MUTED);
      pdf.text(point.month, chartLeft + index * dx, baseline + 5, { align: "center" });
    });
    pdf.setDrawColor(...BORDER);
    pdf.roundedRect(LEFT, chartTop, CONTENT_WIDTH, chartHeight, 1.2, 1.2, "S");
    y += chartHeight + 6;
  };

  const paragraphBox = (title: string, content: string) => {
    section(title);
    const lines = pdf.splitTextToSize(content, CONTENT_WIDTH - 12) as string[];
    const lineHeight = 4.4;
    let cursor = 0;
    while (cursor < lines.length) {
      const availableLines = Math.floor((PAGE_HEIGHT - BOTTOM - y - 12) / lineHeight);
      if (availableLines < 1) newPage();
      const count = Math.max(1, Math.min(lines.length - cursor, Math.floor((PAGE_HEIGHT - BOTTOM - y - 12) / lineHeight)));
      const block = lines.slice(cursor, cursor + count);
      const boxHeight = block.length * lineHeight + 8;
      pdf.setDrawColor(...BORDER);
      pdf.setFillColor(248, 251, 255);
      pdf.roundedRect(LEFT, y, CONTENT_WIDTH, boxHeight, 1.2, 1.2, "FD");
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);
      pdf.setTextColor(...TEXT);
      pdf.text(block, LEFT + 5, y + 5.5);
      y += boxHeight + 6;
      cursor += count;
      if (cursor < lines.length) newPage();
    }
  };

  pdf.setProperties({ title: "FinanceAI Personal Financial Report", subject: `${report.period.label} financial report` });
  pdf.setDrawColor(...BLUE);
  pdf.setLineWidth(1.4);
  pdf.line(LEFT, y, LEFT + 24, y);
  y += 6;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...BLUE);
  pdf.text("FINANCEAI", LEFT, y);
  y += 7;
  pdf.setFontSize(19);
  pdf.setTextColor(...DARK);
  pdf.text("Personal Financial Report", LEFT, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...MUTED);
  pdf.text(`Report Generated: ${dateLabel(report.generatedAt)} ${timeLabel(report.generatedAt)}`, LEFT, y + 3);
  pdf.text(`Reporting Period: ${reportingPeriod(report.period.key)}`, LEFT, y + 8);
  pdf.text(`Report ID: ${report.reportId}`, LEFT, y + 13);
  y += 19;
  pdf.setDrawColor(...BORDER);
  pdf.line(LEFT, y, LEFT + CONTENT_WIDTH, y);
  y += 6;

  section("Financial Profile");
  detailRows([
    ["Name", report.user.name],
    ["Email", report.user.email],
    ["Profession", report.profile?.profession || "Not provided"],
    ["Income Type", report.profile?.incomeType || "Not provided"],
    ["Annual Income", report.profile ? money(report.profile.annualIncome) : "Not provided"],
    ["Tax Regime", report.profile?.taxRegime === "old" ? "Old Tax Regime" : report.profile ? "New Tax Regime" : "Not provided"],
    ["Other Deductions", report.profile ? money(report.profile.deductions) : "Not provided"],
  ]);

  section("Financial Summary");
  table(["Financial Metric", "Amount / Result"], [
    ["Total Income", money(report.summary.income)],
    ["Total Expenses", money(report.summary.expenses)],
    ["Net Savings", money(report.summary.netSavings)],
    ["Savings Rate", `${report.summary.savingsRate.toFixed(1)}%`],
    ["Financial Health", `${report.health.overallScore}/100`],
    ["Estimated Annual Tax", money(report.tax.annualTax)],
    ["Estimated Loan Eligibility", money(report.loan.estimates[0]?.eligibleAmount ?? 0)],
  ], { columnStyles: { 0: { cellWidth: 92 }, 1: { cellWidth: CONTENT_WIDTH - 92 } } });

  section("Income & Expense Analysis");
  drawComparisonChart();
  drawCategoryChart();
  drawTrendChart();
  detailRows([
    ["Average Daily Expense", money(report.summary.averageDailyExpense)],
    ["Highest Spending Category", report.summary.highestCategory],
    ["Highest Individual Expense", report.summary.highestExpense ? `${report.summary.highestExpense.description} - ${money(report.summary.highestExpense.amount)}` : "No recorded expenses"],
  ]);

  section("Expense / Transaction Details");
  table(["Date", "Description", "Category", "Type", "Amount"], transactions.map((item) => [dateLabel(item.date), item.description, item.category, item.type, money(item.amount)]), {
    fontSize: 7.5,
    columnStyles: { 0: { cellWidth: 27 }, 1: { cellWidth: 64 }, 2: { cellWidth: 35 }, 3: { cellWidth: 20 }, 4: { cellWidth: 36 } },
  });

  section("Spending by Category");
  table(["Category", "Amount", "Percentage of Expenses"], report.categories.map((item) => [item.category, money(item.amount), `${item.percentage.toFixed(1)}%`]), {
    columnStyles: { 0: { cellWidth: 75 }, 1: { cellWidth: 52 }, 2: { cellWidth: 55 } },
  });

  section("Tax Analysis");
  detailRows([
    ["Taxpayer / Profession", `${report.user.name} / ${report.profile?.profession || "Not provided"}`],
    ["Income Type", report.profile?.incomeType || "Not provided"],
    ["Annual Gross Income", money(report.tax.annualIncome)],
    ["Assessment Year", report.tax.assessmentYear],
    ["Tax Regime", report.profile?.taxRegime === "old" ? "Old Tax Regime" : report.profile ? "New Tax Regime" : "Not provided"],
    ["Eligible Deductions", money(report.tax.deductions)],
    ["Estimated Taxable Income", money(report.tax.taxableIncome)],
  ]);
  table(["Tax Slab", "Rate", "Taxable Amount", "Tax"], report.tax.slabs.map((item) => [item.range, `${item.rate}%`, money(item.taxableAmount), money(item.tax)]), {
    columnStyles: { 0: { cellWidth: 68 }, 1: { cellWidth: 22 }, 2: { cellWidth: 49 }, 3: { cellWidth: 43 } },
  });
  table(["Tax Calculation", "Amount"], [
    ["Tax Before Rebate", money(report.tax.incomeTaxBeforeRebate)],
    ["Applicable Rebate", money(report.tax.rebate)],
    ["Tax After Rebate", money(report.tax.incomeTaxBeforeCess)],
    ["Health & Education Cess", money(report.tax.cess)],
    ["Estimated Total Tax Liability", money(report.tax.annualTax)],
    ["Calculation Date", dateLabel(report.tax.calculationDate)],
  ], { columnStyles: { 0: { cellWidth: 92 }, 1: { cellWidth: CONTENT_WIDTH - 92 } } });

  section("Loan Analysis");
  detailRows([
    ["Profession", report.loan.profession],
    ["Monthly Income", money(report.loan.monthlyIncome)],
    ["Existing Obligations", money(report.loan.existingObligations)],
    ["Estimated Monthly Surplus", money(report.loan.estimatedMonthlySurplus)],
    ["Project CIBIL Score (Simulated)", String(report.loan.projectCibilScore)],
    ["Estimated Monthly Payment Capacity", money(Math.max(0, report.loan.estimatedMonthlySurplus * 0.4))],
  ]);
  table(["Loan Option", "Eligible Amount", "Tenure", "Estimated EMI", "Interest", "Total Repayment"], report.loan.estimates.map((loan) => [loan.name, money(loan.eligibleAmount), `${loan.tenureYears} years`, money(loan.monthlyEmi), money(loan.estimatedInterest), money(loan.totalRepayment)]), {
    fontSize: 7,
    columnStyles: { 0: { cellWidth: 33 }, 1: { cellWidth: 34 }, 2: { cellWidth: 23 }, 3: { cellWidth: 33 }, 4: { cellWidth: 30 }, 5: { cellWidth: 29 } },
  });
  paragraphBox("Loan Estimate Disclaimer", "Project CIBIL Score (Simulated): This is a simulated project score calculated using FinanceAI's internal rules. It is not an actual CIBIL or credit-bureau score. Actual loan approval, interest rate, eligible amount and tenure are determined by the lender based on its policies and the applicant's verified financial and credit information.");

  section("Financial Health Analysis");
  detailRows([
    ["Overall Score", `${report.health.overallScore} / 100`],
    ["Savings Score", `${report.health.savingsScore} / 40`],
    ["Expense Management", `${report.health.expenseManagementScore} / 30`],
    ["Debt Management", `${report.health.debtManagementScore} / 15`],
    ["Income Stability", `${report.health.incomeStabilityScore} / 10`],
    ["Financial Planning", `${report.health.planningScore} / 5`],
  ]);
  paragraphBox("Financial Health Calculation", report.health.formula);

  paragraphBox("Disclaimer", "This report is generated for informational and educational purposes using information provided by the user and calculations implemented in FinanceAI. Financial, tax, loan and financial-health figures are estimates and may not represent official tax liabilities, lender decisions, credit-bureau scores or other official determinations. Users should verify important financial and tax information with the relevant authority or a qualified professional. Tax estimates should be verified with the relevant tax authority or a qualified tax professional.");

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.25);
    pdf.line(LEFT, 18, PAGE_WIDTH - LEFT, 18);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...BLUE);
    pdf.text("FINANCEAI | PERSONAL FINANCIAL REPORT", LEFT, 13);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED);
    pdf.text(`${report.period.label}  |  Page ${page} of ${pageCount}`, PAGE_WIDTH - LEFT, PAGE_HEIGHT - 10, { align: "right" });
    pdf.line(LEFT, PAGE_HEIGHT - 16, PAGE_WIDTH - LEFT, PAGE_HEIGHT - 16);
    pdf.setDrawColor(...BORDER);
    pdf.roundedRect(6, 6, PAGE_WIDTH - 12, PAGE_HEIGHT - 12, 1.4, 1.4, "S");
  }
  return pdf;
}
