export type TaxRegime = "new" | "old";

export type TaxSlabResult = {
  range: string;
  taxableAmount: number;
  rate: number;
  tax: number;
};

export type TaxCalculationResult = {
  annualIncome: number;

  deductions: number;

  taxableIncome: number;

  incomeTaxBeforeRebate: number;

  rebate: number;

  incomeTaxBeforeCess: number;

  cess: number;

  annualTax: number;

  monthlyTax: number;

  monthlyIncome: number;

  afterTaxAnnualIncome: number;

  afterTaxMonthlyIncome: number;

  effectiveTaxRate: number;

  slabs: TaxSlabResult[];
};