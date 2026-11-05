import { jsPDF } from "jspdf";
import type { TaxCalculationResult, TaxRegime } from "./tax-types";

export type TaxCalculationSnapshot = {
  calculatedAt: Date;
  profession: string;
  incomeType: string;
  regime: TaxRegime;
  result: TaxCalculationResult;
};

const DISCLAIMER = "This tax calculation is an estimate provided for informational and educational purposes only. Actual tax liability may vary depending on applicable tax laws, income sources, deductions, exemptions, residency status, taxpayer-specific circumstances and changes in government regulations. FinanceAI does not file tax returns or determine official tax liability. Users should verify the calculation with the Income Tax Department or a qualified tax professional before making tax-related decisions.";
const BLUE: [number, number, number] = [19, 87, 166];
const DARK: [number, number, number] = [16, 42, 76];
const TEXT: [number, number, number] = [38, 52, 71];
const MUTED: [number, number, number] = [82, 97, 118];
const BORDER: [number, number, number] = [190, 204, 220];
const LIGHT: [number, number, number] = [243, 248, 253];

function amount(value: number) {
  return `INR ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;
}

function assessmentYear(date: Date) {
  return date.getMonth() >= 3
    ? `${date.getFullYear()}-${String(date.getFullYear() + 1).slice(-2)}`
    : `${date.getFullYear() - 1}-${String(date.getFullYear()).slice(-2)}`;
}

function safeText(value: string) {
  return value.replaceAll("₹", "INR ").replace(/[–—]/g, "-");
}

export function createTaxAssessmentPdf(calculation: TaxCalculationSnapshot) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  const width = pageWidth - margin * 2;
  const innerWidth = width - 12;
  const rowHeight = 7.5;
  let y = margin;
  const result = calculation.result;
  const regimeName = calculation.regime === "new" ? "New Tax Regime" : "Old Tax Regime";
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" }).format(calculation.calculatedAt);
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(calculation.calculatedAt);
  const boxContentY = (boxY: number) => boxY + 16;

  function newPage() {
    pdf.addPage();
    y = margin;
  }

  function drawPanel(title: string, height: number, drawContent: (contentY: number) => void) {
    if (y + height > pageHeight - 18) newPage();
    const top = y;
    pdf.setLineWidth(0.28);
    pdf.setDrawColor(...BORDER);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, top, width, height, 1.8, 1.8, "FD");
    pdf.setFillColor(...LIGHT);
    pdf.rect(margin + 0.3, top + 0.3, width - 0.6, 11, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(...BLUE);
    pdf.text(title, margin + 5, top + 7.4);
    drawContent(boxContentY(top));
    y = top + height + 5;
  }

  function wrap(text: string, size: number, maxWidth: number) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(size);
    return pdf.splitTextToSize(safeText(text), maxWidth) as string[];
  }

  function rowLayouts(rows: { label: string; value: string; emphasis?: boolean }[]) {
    const labelWidth = 91;
    const valueWidth = innerWidth - labelWidth;
    return rows.map((row) => {
      const labels = wrap(row.label, 9, labelWidth);
      const values = wrap(row.value, 9, valueWidth);
      return { ...row, labels, values, height: Math.max(labels.length, values.length, 1) * 4.1 + 2.4 };
    });
  }

  function drawRows(rows: { label: string; value: string; emphasis?: boolean }[], contentY: number, valueAlign: "left" | "right" = "right") {
    const layouts = rowLayouts(rows);
    const labelX = margin + 6;
    const valueX = margin + 6 + 93;
    let rowY = contentY;

    for (const row of layouts) {
      if (row.emphasis) {
        pdf.setFillColor(239, 246, 253);
        pdf.rect(margin + 1, rowY, width - 2, row.height, "F");
      }
      pdf.setFont("helvetica", row.emphasis ? "bold" : "normal");
      pdf.setFontSize(row.emphasis ? 9.4 : 9);
      pdf.setTextColor(...(row.emphasis ? DARK : TEXT));
      const lineHeight = 4.1;
      const lineStart = rowY + (row.height - Math.max(row.labels.length, row.values.length) * lineHeight) / 2 + 3.2;
      row.labels.forEach((line, index) => pdf.text(line, labelX, lineStart + index * lineHeight));
      row.values.forEach((line, index) => {
        const options = valueAlign === "right" ? { align: "right" as const } : undefined;
        const x = valueAlign === "right" ? margin + width - 6 : valueX;
        pdf.text(line, x, lineStart + index * lineHeight, options);
      });
      rowY += row.height;
      pdf.setDrawColor(229, 235, 242);
      pdf.setLineWidth(0.18);
      pdf.line(margin + 5, rowY, margin + width - 5, rowY);
    }
    return rowY;
  }

  function drawRowsPanel(title: string, rows: { label: string; value: string; emphasis?: boolean }[], valueAlign: "left" | "right" = "right") {
    const layouts = rowLayouts(rows);
    const height = 17 + layouts.reduce((total, row) => total + row.height, 0) + 5;
    drawPanel(title, height, (contentY) => drawRows(rows, contentY, valueAlign));
  }

  function drawIncomeAnalysisPanel() {
    const rows = [
      { label: "Gross Annual Income", value: amount(result.annualIncome) },
      { label: "Less: Eligible Deductions", value: amount(result.deductions) },
      { label: "Estimated Taxable Income", value: amount(result.taxableIncome), emphasis: true },
    ];
    const layouts = rowLayouts(rows);
    const analysis = `The recorded gross annual income of ${amount(result.annualIncome)} is reduced by eligible deductions of ${amount(result.deductions)} to arrive at estimated taxable income of ${amount(result.taxableIncome)}.`;
    const analysisLines = wrap(analysis, 8.8, innerWidth - 2);
    const analysisHeight = 9 + analysisLines.length * 4.2;
    const height = 17 + layouts.reduce((total, row) => total + row.height, 0) + analysisHeight + 5;
    drawPanel("3. TAXABLE INCOME ANALYSIS", height, (contentY) => {
      const rowsEnd = drawRows(rows, contentY);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.8);
      pdf.setTextColor(...BLUE);
      pdf.text("Analysis", margin + 6, rowsEnd + 6);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.8);
      pdf.setTextColor(...TEXT);
      analysisLines.forEach((line, index) => pdf.text(line, margin + 6, rowsEnd + 11 + index * 4.2));
    });
  }

  function drawParagraphPanel(title: string, paragraphs: string[], fontSize = 9) {
    const lineHeight = fontSize * 0.46;
    const wrapped = paragraphs.map((paragraph) => wrap(paragraph, fontSize, innerWidth - 2));
    const contentHeight = wrapped.reduce((total, lines) => total + lines.length * lineHeight + 2.5, 0);
    drawPanel(title, 17 + contentHeight + 5, (contentY) => {
      let textY = contentY + 3;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...TEXT);
      for (const lines of wrapped) {
        for (const line of lines) {
          pdf.text(line, margin + 6, textY);
          textY += lineHeight;
        }
        textY += 2.5;
      }
    });
  }

  function drawTablePanel(title: string, headers: string[], rows: string[][], columnWidths: number[]) {
    const headerHeight = 9;
    const dataRowHeight = 8;
    const renderedRows = Math.max(rows.length, 1);
    const height = 17 + headerHeight + renderedRows * dataRowHeight + 5;
    drawPanel(title, height, (contentY) => {
      const tableX = margin + 6;
      const tableWidth = innerWidth;
      let columnX = tableX;
      pdf.setFillColor(...BLUE);
      pdf.rect(tableX, contentY, tableWidth, headerHeight, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(7.8);
      pdf.setTextColor(255, 255, 255);
      headers.forEach((header, index) => {
        const lines = wrap(header, 7.8, columnWidths[index] - 3);
        const lineStart = contentY + (headerHeight - lines.length * 3.1) / 2 + 2.8;
        lines.forEach((line, lineIndex) => pdf.text(line, columnX + 1.5, lineStart + lineIndex * 3.1));
        columnX += columnWidths[index];
      });
      let rowY = contentY + headerHeight;
      const tableRows = rows.length ? rows : [["No taxable slab applied", "-", "-", "INR 0"]];
      tableRows.forEach((row, rowIndex) => {
        if (rowIndex % 2 === 1) {
          pdf.setFillColor(248, 250, 252);
          pdf.rect(tableX, rowY, tableWidth, dataRowHeight, "F");
        }
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.8);
        pdf.setTextColor(...TEXT);
        columnX = tableX;
        row.forEach((cell, index) => {
          const cellText = wrap(cell, 7.8, columnWidths[index] - 4)[0] ?? "";
          const isFirst = index === 0;
          const x = isFirst ? columnX + 1.5 : columnX + columnWidths[index] - 1.5;
          pdf.text(cellText, x, rowY + 5.2, isFirst ? undefined : { align: "right" });
          columnX += columnWidths[index];
        });
        pdf.setDrawColor(229, 235, 242);
        pdf.setLineWidth(0.18);
        pdf.line(tableX, rowY + dataRowHeight, tableX + tableWidth, rowY + dataRowHeight);
        rowY += dataRowHeight;
      });
      pdf.setDrawColor(216, 224, 234);
      pdf.rect(tableX, contentY, tableWidth, headerHeight + renderedRows * dataRowHeight, "S");
    });
  }

  function drawBulletPanel(title: string, points: string[]) {
    const lineHeight = 4.4;
    const wrapped = points.map((point) => wrap(point, 9.2, innerWidth - 12));
    const contentHeight = wrapped.reduce((total, lines) => total + Math.max(lines.length * lineHeight, 7) + 1.5, 0);
    drawPanel(title, 17 + contentHeight + 5, (contentY) => {
      let textY = contentY + 4;
      for (const lines of wrapped) {
        pdf.setFillColor(...BLUE);
        pdf.circle(margin + 7, textY - 1, 0.8, "F");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9.2);
        pdf.setTextColor(...TEXT);
        lines.forEach((line, index) => pdf.text(line, margin + 11, textY + index * lineHeight));
        textY += Math.max(lines.length * lineHeight, 7) + 1.5;
      }
    });
  }

  function drawDisclaimerPanel() {
    const lines = wrap(DISCLAIMER, 8.7, innerWidth - 2);
    const lineHeight = 4.1;
    const height = 17 + lines.length * lineHeight + 17;
    drawPanel("IMPORTANT DISCLAIMER", height, (contentY) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.7);
      pdf.setTextColor(...TEXT);
      lines.forEach((line, index) => pdf.text(line, margin + 6, contentY + 3 + index * lineHeight));
      const dateY = contentY + 6 + lines.length * lineHeight;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.4);
      pdf.setTextColor(...MUTED);
      pdf.text(`Calculation Date: ${date}`, margin + 6, dateY);
      pdf.text(`Calculation Time: ${time}`, margin + 6 + innerWidth / 2, dateY);
    });
  }

  function drawHeader() {
    const height = 37;
    const top = y;
    pdf.setLineWidth(0.28);
    pdf.setDrawColor(...BORDER);
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(margin, top, width, height, 1.8, 1.8, "FD");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...BLUE);
    pdf.text("FINANCEAI", margin + 6, top + 7);
    pdf.setFontSize(15);
    pdf.setTextColor(...DARK);
    pdf.text("TAX ASSESSMENT & ANALYSIS REPORT", margin + 6, top + 15);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...MUTED);
    pdf.text(`Report Generated: ${date}, ${time}`, margin + 6, top + 25);
    pdf.text(`Assessment Year: ${assessmentYear(calculation.calculatedAt)}`, margin + 6, top + 32);
    y = top + height + 5;
  }

  pdf.setProperties({ title: "FinanceAI Tax Assessment & Analysis Report", subject: "Estimated tax calculation" });
  drawHeader();
  drawRowsPanel("1. EXECUTIVE TAX SUMMARY", [
    { label: "Annual Income", value: amount(result.annualIncome) },
    { label: "Taxable Income", value: amount(result.taxableIncome) },
    { label: "Estimated Annual Tax", value: amount(result.annualTax), emphasis: true },
    { label: "Monthly Tax Provision", value: amount(result.monthlyTax) },
    { label: "After-Tax Monthly Income", value: amount(result.afterTaxMonthlyIncome) },
  ]);
  drawRowsPanel("2. TAXPAYER & INCOME PROFILE", [
    { label: "Profession", value: calculation.profession || "Not provided" },
    { label: "Income Type", value: calculation.incomeType },
    { label: "Assessment Year", value: assessmentYear(calculation.calculatedAt) },
    { label: "Tax Regime", value: regimeName },
    { label: "Annual Income", value: amount(result.annualIncome) },
    { label: "Eligible Deductions", value: amount(result.deductions) },
  ], "left");
  drawIncomeAnalysisPanel();

  newPage();
  drawTablePanel("4. TAX SLAB CALCULATION", ["Tax Slab", "Rate", "Taxable Amount", "Tax"], result.slabs.map((slab) => [
    slab.range,
    `${slab.rate}%`,
    amount(slab.taxableAmount),
    amount(slab.tax),
  ]), [65, 19, 51, 35]);
  drawRowsPanel("5. TAX LIABILITY CALCULATION", [
    { label: "Income Tax Before Rebate", value: amount(result.incomeTaxBeforeRebate) },
    { label: "Less: Applicable Rebate", value: amount(result.rebate) },
    { label: "Income Tax Before Cess", value: amount(result.incomeTaxBeforeCess) },
    { label: "Health & Education Cess", value: amount(result.cess) },
    { label: "FINAL ESTIMATED ANNUAL TAX", value: amount(result.annualTax), emphasis: true },
  ]);
  drawRowsPanel("6. MONTHLY FINANCIAL IMPACT", [
    { label: "Monthly Income", value: amount(result.monthlyIncome) },
    { label: "Monthly Tax Provision", value: amount(result.monthlyTax) },
    { label: "Estimated After-Tax Income", value: amount(result.afterTaxMonthlyIncome), emphasis: true },
  ]);

  newPage();
  drawBulletPanel("7. TAX ANALYSIS & INTERPRETATION", [
    `Taxable income is ${amount(result.taxableIncome)} under the ${regimeName}.`,
    `Estimated annual tax is ${amount(result.annualTax)} (${result.effectiveTaxRate.toFixed(2)}% effective tax rate).`,
    `Monthly tax provision is ${amount(result.monthlyTax)}.`,
    `Estimated after-tax monthly income is ${amount(result.afterTaxMonthlyIncome)}.`,
  ]);
  const activeSlabs = result.slabs.filter((slab) => slab.taxableAmount > 0);
  const calculationNotes = [
    `${amount(result.annualIncome)} gross annual income less ${amount(result.deductions)} eligible deductions equals ${amount(result.taxableIncome)} taxable income.`,
    ...(activeSlabs.length
      ? activeSlabs.map((slab) => `${amount(slab.taxableAmount)} in ${slab.range} taxed at ${slab.rate}% produces ${amount(slab.tax)} tax.`)
      : ["No income falls within a taxable slab."]),
    `Tax before rebate of ${amount(result.incomeTaxBeforeRebate)} less rebate of ${amount(result.rebate)} equals ${amount(result.incomeTaxBeforeCess)} before cess.`,
    `Adding health and education cess of ${amount(result.cess)} results in final estimated annual tax of ${amount(result.annualTax)}.`,
  ];
  drawParagraphPanel("8. CALCULATION NOTES", calculationNotes);
  drawDisclaimerPanel();

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setLineWidth(0.3);
    pdf.setDrawColor(184, 201, 220);
    pdf.roundedRect(6, 6, pageWidth - 12, pageHeight - 12, 1.5, 1.5, "S");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    pdf.text(`FINANCEAI  |  Tax Assessment  |  Page ${page} of ${pageCount}`, pageWidth / 2, pageHeight - 9, { align: "center" });
  }

  return pdf;
}