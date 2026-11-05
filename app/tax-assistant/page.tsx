"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateTax } from "@/lib/tax/tax-calculator";
import type { TaxRegime } from "@/lib/tax/tax-types";
import { createTaxAssessmentPdf, type TaxCalculationSnapshot } from "@/lib/tax/tax-report-pdf";
import AuthGuard from "@/components/auth/auth-guard";
import AccountControls from "@/components/layout/account-controls";

const DISCLAIMER = "This tax calculation is an estimate provided for informational and educational purposes only. Actual tax liability may vary depending on applicable tax laws, income sources, deductions, exemptions, residency status, taxpayer-specific circumstances and changes in government regulations. FinanceAI does not file tax returns or determine official tax liability. Users should verify the calculation with the Income Tax Department or a qualified tax professional before making tax-related decisions.";
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value || 0);
const dateText = (date: Date) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(date);
const timeText = (date: Date) => new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(date);
const assessmentYear = (date: Date) => date.getMonth() >= 3 ? `${date.getFullYear()}-${String(date.getFullYear() + 1).slice(-2)}` : `${date.getFullYear() - 1}-${String(date.getFullYear()).slice(-2)}`;

export default function TaxAssistantPage() {
  const router = useRouter();
  const [profession, setProfession] = useState("");
  const [incomeType, setIncomeType] = useState("Salary");
  const [annualIncome, setAnnualIncome] = useState("");
  const [deductions, setDeductions] = useState("0");
  const [regime, setRegime] = useState<TaxRegime>("new");
  const [calculation, setCalculation] = useState<TaxCalculationSnapshot | null>(null);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        if (!response.ok) return;
        const profile = (await response.json()).profile;
        if (!active || !profile) return;
        if (profile.annualIncome > 0) setAnnualIncome(String(profile.annualIncome));
        setProfession(profile.profession || "");
        if (profile.taxRegime === "old" || profile.regime === "old") setRegime("old");
        if (profile.deductions !== undefined) setDeductions(String(profile.deductions));
        if (profile.incomeType) setIncomeType(profile.incomeType);
      } catch (error) { console.error("Unable to load financial profile", error); }
    };
    void loadProfile();
    return () => { active = false; };
  }, []);

  function calculate() {
    const result = calculateTax({ annualIncome: annualIncome || 0, deductions: deductions || 0, regime });
    setCalculation({ calculatedAt: new Date(), profession, incomeType, regime, result });
    setDownloadError("");
  }

  const result = calculation?.result;
  const ready = Boolean(result && result.annualIncome > 0);
  const regimeName = (calculation?.regime ?? regime) === "new" ? "New Tax Regime" : "Old Tax Regime";

  function downloadReport() {
    if (!ready || !calculation) return;

    try {
      const pdf = createTaxAssessmentPdf(calculation);
      pdf.save("FinanceAI-Tax-Assessment-Report.pdf");
      setDownloadError("");
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Unable to download the tax report PDF.");
    }
  }

  return <AuthGuard><main className="tax-page min-h-screen bg-slate-100 p-5 md:p-10"><div className="mx-auto max-w-7xl">
    <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-5"><div><p className="font-bold uppercase tracking-wide text-blue-600">Tax Assistant</p><h1 className="mt-2 text-4xl font-bold text-slate-900">Tax estimate</h1><p className="mt-3 text-lg text-slate-500">Plan your tax with a clear, personalized estimate.</p></div><div className="flex flex-wrap items-center gap-3"><AccountControls /><button onClick={() => router.push("/dashboard")} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700">← Dashboard</button><button onClick={() => window.print()} disabled={!ready} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 disabled:opacity-50">Print Report</button><button onClick={downloadReport} disabled={!ready} className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-50">Download PDF</button></div></div>
    <section className="tax-entry-panel no-print mb-8"><h2>Enter Your Financial Information</h2><p className="tax-entry-subtitle">Enter your income to calculate your estimated annual and monthly tax.</p><div className="tax-input-grid mt-6">
      <label className="font-semibold text-slate-700">Profession<select value={profession} onChange={(e) => { setProfession(e.target.value); setCalculation(null); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4"><option value="">Select profession</option>{["Private Employee", "Government Employee", "Software Engineer", "Doctor", "Business Owner", "Farmer", "Self Employed", "Other"].map(x => <option key={x}>{x}</option>)}</select></label>
      <label className="font-semibold text-slate-700">Income type<select value={incomeType} onChange={(e) => { setIncomeType(e.target.value); setCalculation(null); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4">{["Salary", "Business", "Professional", "Pension", "Other"].map(x => <option key={x}>{x}</option>)}</select></label>
      <label className="font-semibold text-slate-700">Annual income (₹)<input type="number" min="0" value={annualIncome} onChange={(e) => { setAnnualIncome(e.target.value); setCalculation(null); }} placeholder="Annual income" className="mt-2 w-full rounded-xl border border-slate-300 p-4" /></label>
      <label className="font-semibold text-slate-700">Tax regime<select value={regime} onChange={(e) => { setRegime(e.target.value as TaxRegime); setCalculation(null); }} className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-4"><option value="new">New Tax Regime</option><option value="old">Old Tax Regime</option></select></label>
      <label className="font-semibold text-slate-700">Eligible deductions (₹)<input type="number" min="0" value={deductions} onChange={(e) => { setDeductions(e.target.value); setCalculation(null); }} className="mt-2 w-full rounded-xl border border-slate-300 p-4" /></label>
    </div><button onClick={calculate} className="mt-6 rounded-xl bg-blue-700 px-7 py-3 font-bold text-white">Calculate Tax</button></section>
    {downloadError && <p role="alert" className="no-print mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{downloadError}</p>}
    {ready && calculation && result && <section className="tax-screen-results no-print" aria-live="polite">
      <div className="tax-screen-results-heading"><div><p className="tax-screen-eyebrow">Your estimate</p><h2>Tax overview</h2></div><p>{regimeName} <span aria-hidden="true">·</span> {calculation.incomeType}</p></div>
      <div className="tax-screen-cards">
        <div className="tax-screen-card tax-screen-card-primary"><span>Estimated annual tax</span><strong>{money(result.annualTax)}</strong><small>Based on your entered income and deductions</small></div>
        <div className="tax-screen-card"><span>Monthly tax provision</span><strong>{money(result.monthlyTax)}</strong><small>Set aside this amount each month</small></div>
        <div className="tax-screen-card tax-screen-card-green"><span>After-tax monthly income</span><strong>{money(result.afterTaxMonthlyIncome)}</strong><small>Estimated income remaining after tax</small></div>
      </div>
      <div className="tax-screen-breakdown"><h3>Calculation snapshot</h3><div className="tax-screen-breakdown-grid">
        <SummaryValue label="Annual income" value={money(result.annualIncome)} />
        <SummaryValue label="Eligible deductions" value={money(result.deductions)} />
        <SummaryValue label="Taxable income" value={money(result.taxableIncome)} />
        <SummaryValue label="Income tax before rebate" value={money(result.incomeTaxBeforeRebate)} />
        <SummaryValue label="Applicable rebate" value={`− ${money(result.rebate)}`} />
        <SummaryValue label="Health and education cess" value={money(result.cess)} />
      </div></div>
      <p className="tax-screen-footnote">This is an estimate for planning purposes. Use Print Report for a print-ready assessment or Download PDF for a saved copy.</p>
    </section>}
    {ready && calculation && result && <>
      <article className="tax-report-document tax-print-report" id="tax-report">
        <header className="tax-report-header">
          <div className="tax-brand-mark">F</div>
          <div className="tax-report-heading"><p className="tax-brand-name">FINANCEAI</p><h2>TAX ASSESSMENT REPORT</h2><p className="tax-report-kicker">Tax Calculation</p></div>
        </header>
        <div className="tax-report-info"><h3>Taxpayer Details</h3><div className="tax-info-grid">{[["Report Generated", `${dateText(calculation.calculatedAt)} ${timeText(calculation.calculatedAt)}`], ["Assessment Year", assessmentYear(calculation.calculatedAt)], ["Tax Regime", regimeName], ["Profession", calculation.profession || "Not provided"], ["Income Type", calculation.incomeType], ["Annual Income", money(result.annualIncome)]].map(([k, v]) => <Info key={k} title={k} value={v} />)}</div></div>

        <div className="tax-summary-cards">
          <SummaryCard variant="primary" title="Total Annual Tax" value={money(result.annualTax)} detail={<><span>Tax to keep aside every month</span><strong>{money(result.monthlyTax)}</strong></>} />
          <SummaryCard title="Taxable Income" value={money(result.taxableIncome)} detail="Annual income after eligible deductions." />
          <SummaryCard variant="success" title="After-Tax Monthly Income" value={money(result.afterTaxMonthlyIncome)} detail="Estimated monthly income remaining after tax." />
        </div>

        <ReportSection title="Tax Summary">
          <h4 className="tax-subsection-heading">Income Summary</h4>
          <div className="tax-summary-grid">
            <SummaryValue label="Annual Income" value={money(result.annualIncome)} />
            <SummaryValue label="Monthly Income" value={money(result.monthlyIncome)} />
            <SummaryValue label="Eligible Deductions" value={money(result.deductions)} />
            <SummaryValue label="Taxable Income" value={money(result.taxableIncome)} />
          </div>
          <h4 className="tax-subsection-heading tax-subsection-spaced">Tax Liability</h4>
          <div className="tax-summary-grid">
            <SummaryValue label="Income Tax Before Rebate" value={money(result.incomeTaxBeforeRebate)} />
            <SummaryValue label="Applicable Rebate" value={`− ${money(result.rebate)}`} />
            <SummaryValue label="Income Tax" value={money(result.incomeTaxBeforeCess)} />
            <SummaryValue label="Health & Education Cess" value={money(result.cess)} />
            <SummaryValue emphasized label="TOTAL ANNUAL TAX" value={money(result.annualTax)} />
            <SummaryValue emphasized label="MONTHLY TAX PROVISION" value={money(result.monthlyTax)} />
          </div>
        </ReportSection>

        <ReportSection title="Tax Breakdown">
          <DataTable highlightLast headers={["Particular", "Amount"]} rows={[
            ["Gross Annual Income", money(result.annualIncome)],
            ["Eligible Deductions", `− ${money(result.deductions)}`],
            ["Taxable Income", money(result.taxableIncome)],
            ["Income Tax Before Rebate", money(result.incomeTaxBeforeRebate)],
            ["Applicable Rebate", `− ${money(result.rebate)}`],
            ["Income Tax Before Cess", money(result.incomeTaxBeforeCess)],
            ["Health & Education Cess (4%)", money(result.cess)],
            ["Final Estimated Annual Tax", money(result.annualTax)],
          ]} />
        </ReportSection>

        <ReportSection title="Tax Slab Calculation"><DataTable headers={["Tax Slab", "Rate", "Taxable Amount", "Tax"]} rows={result.slabs.map((slab) => [slab.range, `${slab.rate}%`, money(slab.taxableAmount), money(slab.tax)])} /></ReportSection>

        <ReportSection title="How Your Tax Was Calculated">
          <div className="tax-formula"><strong>{money(result.annualIncome)}</strong> gross annual income <span>−</span> <strong>{money(result.deductions)}</strong> eligible deductions <span>=</span> <strong>{money(result.taxableIncome)}</strong> taxable income.</div>
          <p className="tax-notes">{result.slabs.some((slab) => slab.taxableAmount > 0) ? result.slabs.filter((slab) => slab.taxableAmount > 0).map((slab) => `${money(slab.taxableAmount)} in ${slab.range} taxed at ${slab.rate}% = ${money(slab.tax)}`).join("; ") : "No income falls within a taxable slab."} Slab tax totals {money(result.incomeTaxBeforeRebate)} before rebate. Subtracting the applicable rebate of {money(result.rebate)} leaves {money(result.incomeTaxBeforeCess)} before cess; adding {money(result.cess)} in health and education cess gives a final estimated annual tax of {money(result.annualTax)}.</p>
        </ReportSection>

        <section className="tax-report-section tax-disclaimer"><h3>Tax Calculation Disclaimer</h3><p>{DISCLAIMER}</p><div className="tax-calculation-datetime"><span>Calculation Date: {dateText(calculation.calculatedAt)}</span><span>Calculation Time: {timeText(calculation.calculatedAt)}</span></div></section>
      </article>
    </>}
  </div></main></AuthGuard>;
}

function Info({ title, value }: { title: string; value: string }) { return <div className="tax-info-item"><p className="tax-info-label">{title}</p><p className="tax-info-value">{value}</p></div>; }
function SummaryCard({ title, value, detail, variant = "default" }: { title: string; value: string; detail: React.ReactNode; variant?: "default" | "primary" | "success" }) { return <section className={`tax-summary-card tax-summary-card-${variant}`}><h3>{title}</h3><strong className="tax-summary-card-value">{value}</strong><div className="tax-summary-card-detail">{detail}</div></section>; }
function SummaryValue({ label, value, emphasized = false }: { label: string; value: string; emphasized?: boolean }) { return <div className={`tax-summary-value${emphasized ? " is-emphasized" : ""}`}><span>{label}</span><strong>{value}</strong></div>; }
function DataTable({ headers, rows, highlightLast = false }: { headers: string[]; rows: string[][]; highlightLast?: boolean }) { return <div className="tax-table-wrap"><table className="tax-report-table"><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i} className={highlightLast && i === rows.length - 1 ? "tax-total-row" : undefined}>{row.map((cell, j) => <td key={j} className={j > 0 ? "tax-numeric" : ""}>{cell}</td>)}</tr>)}</tbody></table></div>; }
function ReportSection({ title, children }: { title: string; children: React.ReactNode }) { return <section className="tax-report-section"><h3>{title}</h3>{children}</section>; }
