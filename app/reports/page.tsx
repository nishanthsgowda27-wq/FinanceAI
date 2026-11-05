"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import AuthGuard from "@/components/auth/auth-guard";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { createReportPdf, type ReportData, type ReportTransaction } from "@/lib/reports/report-pdf";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateLabel = (value: string | Date) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(value instanceof Date ? value : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value));
const timeLabel = (value: string) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(value));
const periodDateRange = (month: string) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    start: dateLabel(new Date(year, monthNumber - 1, 1)),
    end: dateLabel(new Date(year, monthNumber, 0)),
  };
};
const colors = ["#1357a6", "#2e7d9b", "#d97706", "#64748b", "#0f766e", "#7c3aed"];

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null); const [period, setPeriod] = useState(""); const [query, setQuery] = useState(""); const [type, setType] = useState("all"); const [category, setCategory] = useState("all"); const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [error, setError] = useState(""); const [pdfLoading, setPdfLoading] = useState(false); const [reportLoading, setReportLoading] = useState(false);
  const reportRequestId = useRef(0);

  async function loadReport(month?: string) {
    const requestId = ++reportRequestId.current;
    setError("");
    setReportLoading(true);
    try {
      const response = await fetch(`/api/reports${month ? `?month=${month}` : ""}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to load report data.");
      if (requestId !== reportRequestId.current) return;
      setReport(data);
      setPeriod(data.period.key);
    } catch (loadError) {
      if (requestId === reportRequestId.current) setError(loadError instanceof Error ? loadError.message : "Unable to load report data.");
    } finally {
      if (requestId === reportRequestId.current) setReportLoading(false);
    }
  }
  useEffect(() => { void Promise.resolve().then(() => loadReport()); }, []);
  const filteredTransactions = useMemo(() => report?.transactions.filter((item) => { const haystack = `${item.description} ${item.category}`.toLowerCase(); return (!query || haystack.includes(query.toLowerCase())) && (type === "all" || item.type === type) && (category === "all" || item.category === category) && (!from || item.date >= from) && (!to || item.date <= to); }) ?? [], [report, query, type, category, from, to]);
  function downloadReportPDF() {
    if (!report || pdfLoading) return;
    setPdfLoading(true);
    setError("");
    try {
      const pdf = createReportPdf(report, filteredTransactions as ReportTransaction[]);
      pdf.save(`FinanceAI-Personal-Financial-Report-${report.period.key}.pdf`);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "Unable to download the report PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  if (!report) return <AuthGuard><main className="report-page"><div className="report-loading">{error || "Preparing your report..."}</div></main></AuthGuard>;
  const periodIncomeExpense = [{ name: "Income", value: report.summary.income }, { name: "Expenses", value: report.summary.expenses }];
  const periodDates = periodDateRange(report.period.key);
  const hasFinancialData = report.transactions.length > 0 || Boolean(report.profile) || report.loan.existingObligations > 0;
  const professionalDisclaimer = "This report is generated for informational and educational purposes using information provided by the user and calculations implemented in FinanceAI. Financial, tax, loan and financial-health figures are estimates and may not represent official tax liabilities, lender decisions, credit-bureau scores or other official determinations. Users should verify important financial and tax information with the relevant authority or qualified professional.";
  const taxDisclaimer = "This tax calculation is an estimate for informational and educational purposes only. Actual tax liability may vary based on applicable tax laws, income sources, deductions, exemptions, residency status and taxpayer-specific circumstances. Users should verify tax information with the relevant tax authority or a qualified tax professional.";
  return <AuthGuard><main className="report-page"><div className="report-toolbar no-print"><Link href="/dashboard" className="report-back">Back to dashboard</Link><div className="toolbar-actions"><label>Reporting period <input type="month" value={period} onChange={(event) => { setPeriod(event.target.value); void loadReport(event.target.value); }} /></label><button type="button" onClick={() => void loadReport(period)} disabled={reportLoading}>{reportLoading ? "Loading Report..." : "Generate Report"}</button><button type="button" onClick={() => window.print()}>Print Report</button><button type="button" onClick={downloadReportPDF} disabled={pdfLoading || reportLoading || !report}>{pdfLoading ? "Generating PDF..." : "Download Report"}</button></div></div>
    <article className="report-document">
      <header className="report-header">
        <div>
          <div className="brand-mark"><span>F</span> FinanceAI</div>
          <p className="eyebrow">Personal Financial Report</p>
          <h1>Personal Financial Report</h1>
          <p className="muted">Prepared for {report.user.name} - {report.user.email}</p>
        </div>
        <div className="report-meta">
          <p><b>Report Generated</b><span>{dateLabel(report.generatedAt)} {timeLabel(report.generatedAt)}</span></p>
          <p><b>Reporting Period</b><span>{periodDates.start} - {periodDates.end}</span></p>
          <p><b>Assessment year</b><span>{report.assessmentYear}</span></p>
          <p><b>Report ID</b><span>{report.reportId}</span></p>
        </div>
      </header>
      {report.transactions.length === 0 && <p className="report-empty-state">No financial records are available for the selected reporting period.</p>}
      {hasFinancialData && <div className="report-data">
      <Section number="01" title="Financial Profile"><div className="detail-grid"><Detail label="Name" value={report.user.name} /><Detail label="Profession" value={report.profile?.profession || "Not provided"} /><Detail label="Income type" value={report.profile?.incomeType || "Not provided"} /><Detail label="Annual income" value={report.profile ? money(report.profile.annualIncome) : "Not provided"} /><Detail label="Tax regime" value={report.profile?.taxRegime === "old" ? "Old regime" : report.profile ? "New regime" : "Not provided"} /><Detail label="Other deductions entered" value={report.profile ? money(report.profile.deductions) : "Not provided"} /></div></Section>
      <Section number="02" title="Financial Summary"><div className="metric-grid"><Metric label="Total income" value={money(report.summary.income)} tone="positive" /><Metric label="Total expenses" value={money(report.summary.expenses)} tone="negative" /><Metric label="Net savings" value={money(report.summary.netSavings)} /><Metric label="Savings rate" value={`${report.summary.savingsRate.toFixed(1)}%`} /><Metric label="Financial health" value={`${report.health.overallScore}/100`} /><Metric label="Estimated annual tax" value={money(report.tax.annualTax)} /><Metric label="Estimated loan eligibility" value={money(report.loan.estimates[0]?.eligibleAmount || 0)} /></div></Section>
      <Section number="03" title="Income & Expense Analysis"><div className="chart-grid"><ChartCard title="Income vs expense"><ResponsiveContainer width="100%" height={240}><BarChart data={periodIncomeExpense}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" /><YAxis tickFormatter={(value) => `INR ${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="value" fill="#1357a6" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></ChartCard><ChartCard title="Expense categories"><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={report.categories.slice(0, 6)} dataKey="amount" nameKey="category" innerRadius={55} outerRadius={86} paddingAngle={3}>{report.categories.slice(0, 6).map((entry, index) => <Cell key={entry.category} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /><Legend /></PieChart></ResponsiveContainer></ChartCard><ChartCard title="Six-month spending trend"><ResponsiveContainer width="100%" height={240}><LineChart data={report.trends}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis tickFormatter={(value) => `INR ${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => money(Number(value))} /><Legend /><Line type="monotone" dataKey="income" stroke="#1357a6" strokeWidth={2} name="Income" /><Line type="monotone" dataKey="expenses" stroke="#d97706" strokeWidth={2} name="Expenses" /></LineChart></ResponsiveContainer></ChartCard></div><div className="fact-row"><Fact label="Average daily expense" value={money(report.summary.averageDailyExpense)} /><Fact label="Highest category" value={report.summary.highestCategory} /><Fact label="Highest individual expense" value={report.summary.highestExpense ? `${report.summary.highestExpense.description} - ${money(report.summary.highestExpense.amount)}` : "No recorded expenses"} /></div></Section>
      <Section number="05" title="Spending by Category"><Table headers={["Category", "Amount", "% of expenses"]}>{report.categories.map((item) => <tr key={item.category}><td>{item.category}</td><td className="numeric">{money(item.amount)}</td><td className="numeric">{item.percentage.toFixed(1)}%</td></tr>)}{report.categories.length === 0 && <EmptyRow text="No expense records in this reporting period." />}</Table></Section>
      <Section number="06" title="Tax Analysis"><div className="detail-grid"><Detail label="Taxpayer / profession" value={`${report.user.name} - ${report.profile?.profession || "Not provided"}`} /><Detail label="Income type" value={report.profile?.incomeType || "Not provided"} /><Detail label="Annual gross income" value={money(report.tax.annualIncome)} /><Detail label="Assessment year" value={report.tax.assessmentYear} /><Detail label="Tax regime" value={report.profile?.taxRegime === "old" ? "Old regime" : report.profile ? "New regime" : "Not provided"} /><Detail label="Other deductions entered" value={money(report.tax.deductions)} /><Detail label="Estimated taxable income" value={money(report.tax.taxableIncome)} /></div><Table headers={["Tax slab", "Rate", "Taxable amount", "Tax"]}>{report.tax.slabs.map((slab) => <tr key={slab.range}><td>{slab.range}</td><td>{slab.rate}%</td><td className="numeric">{money(slab.taxableAmount)}</td><td className="numeric">{money(slab.tax)}</td></tr>)}</Table><div className="calculation-list"><Fact label="Tax before rebate" value={money(report.tax.incomeTaxBeforeRebate)} /><Fact label="Applicable rebate" value={money(report.tax.rebate)} /><Fact label="Tax after rebate" value={money(report.tax.incomeTaxBeforeCess)} /><Fact label="Health and Education Cess" value={money(report.tax.cess)} /><Fact label="Estimated total tax liability" value={money(report.tax.annualTax)} strong /></div><p className="small muted">Calculation date: {dateLabel(report.tax.calculationDate)} {timeLabel(report.tax.calculationDate)}</p><p className="disclaimer">{taxDisclaimer}</p></Section>
      <Section number="07" title="Loan Analysis"><div className="detail-grid"><Detail label="Profession" value={report.loan.profession} /><Detail label="Monthly income" value={money(report.loan.monthlyIncome)} /><Detail label="Existing obligations" value={money(report.loan.existingObligations)} /><Detail label="Estimated monthly surplus" value={money(report.loan.estimatedMonthlySurplus)} /><Detail label="Project CIBIL Score (Simulated)" value={String(report.loan.projectCibilScore)} /><Detail label="Estimated monthly payment capacity" value={money(Math.max(0, report.loan.estimatedMonthlySurplus * 0.4))} /></div><p className="notice"><b>Project CIBIL Score (Simulated)</b> This is a simulated project score calculated using FinanceAI&apos;s internal rules. It is not an actual CIBIL/credit-bureau score.</p><div className="loan-grid">{report.loan.estimates.map((loan) => <div className="loan-card" key={loan.name}><h3>{loan.name}</h3><p className="loan-amount">{money(loan.eligibleAmount)}</p><p className="muted">Estimated eligible amount</p><dl><Detail label="Tenure" value={`${loan.tenureYears} years`} /><Detail label="Estimated EMI" value={money(loan.monthlyEmi)} /><Detail label="Estimated interest" value={money(loan.estimatedInterest)} /><Detail label="Total repayment" value={money(loan.totalRepayment)} /></dl><p className="small muted">Assumption: {loan.assumptions}</p></div>)}</div><p className="disclaimer">Actual loan approval, interest rate, eligible amount and tenure are determined by the lender based on its policies and the applicant&apos;s verified financial and credit information.</p></Section>
      <Section number="08" title="Financial Health Analysis"><div className="health-score"><strong>{report.health.overallScore}</strong><span>/ 100 overall score</span></div><div className="score-grid"><Score label="Savings score" value={report.health.savingsScore} max={40} /><Score label="Expense management" value={report.health.expenseManagementScore} max={30} /><Score label="Debt management" value={report.health.debtManagementScore} max={15} /><Score label="Income stability" value={report.health.incomeStabilityScore} max={10} /><Score label="Financial planning" value={report.health.planningScore} max={5} /></div><p className="formula">Calculation: {report.health.formula}</p></Section>
      <Section number="04" title="Expense / Transaction Details"><div className="filters no-print"><input placeholder="Search description or category" value={query} onChange={(event) => setQuery(event.target.value)} /><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{Array.from(new Set(report.transactions.map((item) => item.category))).sort().map((item) => <option key={item}>{item}</option>)}</select><select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option><option value="income">Income</option><option value="expense">Expense</option></select></div><Table headers={["Date", "Description", "Category", "Type", "Amount"]}>{filteredTransactions.map((item) => <tr key={item.id}><td>{dateLabel(item.date)}</td><td>{item.description}</td><td>{item.category}</td><td><span className={`type-pill ${item.type}`}>{item.type}</span></td><td className="numeric">{money(item.amount)}</td></tr>)}{filteredTransactions.length === 0 && <EmptyRow text="No transactions match the selected filters." />}</Table></Section>
      </div>}
      <Section number="09" title="Disclaimer"><p className="report-disclaimer">Disclaimer: {professionalDisclaimer}</p></Section>
      <footer className="report-footer"><b>FinanceAI</b><span>Generated {dateLabel(report.generatedAt)} {timeLabel(report.generatedAt)}</span><span>{periodDates.start} - {periodDates.end}</span><span>{report.reportId}</span></footer>
    </article></main></AuthGuard>;
}

function Section({ number, title, children }: { number: string; title: string; children: ReactNode }) { return <section className="report-section" data-section={number}><div className="section-title"><span>{number}</span><h2>{title}</h2></div>{children}</section>; }
function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) { return <div className={`metric-card ${tone || ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function Fact({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) { return <div className={strong ? "fact strong" : "fact"}><span>{label}</span><b>{value}</b></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="detail"><dt>{label}</dt><dd>{value}</dd></div>; }
function ChartCard({ title, children }: { title: string; children: ReactNode }) { return <div className="chart-card"><h3>{title}</h3>{children}</div>; }
function Score({ label, value, max }: { label: string; value: number; max: number }) { return <div className="score-item"><div><span>{label}</span><b>{value}/{max}</b></div><div className="score-track"><i style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div></div>; }
function Table({ headers, children }: { headers: string[]; children: ReactNode }) { return <div className="table-wrap"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>; }
function EmptyRow({ text }: { text: string }) { return <tr><td colSpan={5} className="empty-row">{text}</td></tr>; }
