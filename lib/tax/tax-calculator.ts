import {
  HEALTH_EDUCATION_CESS,
  NEW_REGIME_REBATE_INCOME_LIMIT,
  NEW_REGIME_MAX_REBATE,
  NEW_TAX_REGIME_SLABS,
  OLD_REGIME_REBATE_INCOME_LIMIT,
  OLD_REGIME_MAX_REBATE,
  OLD_TAX_REGIME_SLABS,
  TaxSlab,
} from "./tax-rules";

import {
  TaxCalculationResult,
  TaxRegime,
  TaxSlabResult,
} from "./tax-types";


/* ==========================================
   SAFE NUMBER
========================================== */

function safeNumber(
  value: number | string
): number {

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, numberValue);
}


/* ==========================================
   CALCULATE TAX FROM SLABS
========================================== */

function calculateSlabs(
  taxableIncome: number,
  slabs: TaxSlab[]
): {
  totalTax: number;
  breakdown: TaxSlabResult[];
} {

  let totalTax = 0;

  const breakdown: TaxSlabResult[] = [];

  for (const slab of slabs) {

    let taxableAmount = 0;

    /*
     * Find how much income falls
     * inside this particular slab.
     */

    if (taxableIncome > slab.min) {

      const upperLimit =
        slab.max === null
          ? taxableIncome
          : Math.min(
              taxableIncome,
              slab.max
            );

      taxableAmount = Math.max(
        0,
        upperLimit - slab.min
      );
    }

    const slabTax =
      taxableAmount *
      (slab.rate / 100);

    totalTax += slabTax;

    breakdown.push({
      range: slab.label,

      taxableAmount:
        Math.round(taxableAmount),

      rate: slab.rate,

      tax:
        Math.round(slabTax),
    });
  }

  return {
    totalTax,
    breakdown,
  };
}


/* ==========================================
   CALCULATE TAX
========================================== */

export function calculateTax({
  annualIncome,
  regime = "new",
  deductions = 0,
}: {
  annualIncome: number | string;
  regime?: TaxRegime;
  deductions?: number | string;
}): TaxCalculationResult {

  /*
   * 1. Get income
   */

  const income =
    safeNumber(annualIncome);


  /*
   * 2. Get deductions
   */

  const deductionAmount =
    Math.min(
      safeNumber(deductions),
      income
    );


  /*
   * 3. Calculate taxable income
   */

  const taxableIncome =
    Math.max(
      0,
      income - deductionAmount
    );


  /*
   * 4. Select tax regime
   */

  const slabs =
    regime === "old"
      ? OLD_TAX_REGIME_SLABS
      : NEW_TAX_REGIME_SLABS;


  /*
   * 5. Calculate tax from slabs
   */

  const {
    totalTax:
      calculatedTax,
    breakdown,
  } = calculateSlabs(
    taxableIncome,
    slabs
  );


  /*
   * This is the tax BEFORE rebate.
   *
   * Example:
   *
   * ₹6,00,000 income
   *
   * ₹0 - ₹4L       = ₹0
   * ₹4L - ₹6L      = ₹10,000
   *
   * Tax before rebate = ₹10,000
   */

  const incomeTaxBeforeRebate =
    calculatedTax;


  /* ==========================================
     SECTION 87A REBATE
  ========================================== */

  let rebate = 0;


  /*
   * NEW REGIME
   *
   * Taxable income up to ₹12 lakh
   * can receive rebate up to ₹60,000.
   */

  if (
    regime === "new" &&
    taxableIncome <=
      NEW_REGIME_REBATE_INCOME_LIMIT
  ) {

    rebate = Math.min(
      incomeTaxBeforeRebate,
      NEW_REGIME_MAX_REBATE
    );
  }


  /*
   * OLD REGIME
   */

  if (
    regime === "old" &&
    taxableIncome <=
      OLD_REGIME_REBATE_INCOME_LIMIT
  ) {

    rebate = Math.min(
      incomeTaxBeforeRebate,
      OLD_REGIME_MAX_REBATE
    );
  }


  /*
   * Tax after rebate
   */

  const taxAfterRebate =
    Math.max(
      0,
      incomeTaxBeforeRebate -
        rebate
    );


  /* ==========================================
     HEALTH & EDUCATION CESS
  ========================================== */

  const cess =
    taxAfterRebate *
    (HEALTH_EDUCATION_CESS / 100);


  /*
   * FINAL ANNUAL TAX
   */

  const annualTax =
    taxAfterRebate +
    cess;


  /*
   * MONTHLY TAX
   */

  const monthlyTax =
    annualTax / 12;


  /*
   * MONTHLY INCOME
   */

  const monthlyIncome =
    income / 12;


  /*
   * AFTER-TAX ANNUAL INCOME
   */

  const afterTaxAnnualIncome =
    Math.max(
      0,
      income - annualTax
    );


  /*
   * AFTER-TAX MONTHLY INCOME
   */

  const afterTaxMonthlyIncome =
    afterTaxAnnualIncome / 12;


  /*
   * EFFECTIVE TAX RATE
   */

  const effectiveTaxRate =
    income > 0
      ? (annualTax / income) * 100
      : 0;


  /* ==========================================
     RETURN RESULT
  ========================================== */

  return {

    annualIncome:
      Math.round(income),

    deductions:
      Math.round(
        deductionAmount
      ),

    taxableIncome:
      Math.round(
        taxableIncome
      ),

    incomeTaxBeforeRebate:
      Math.round(
        incomeTaxBeforeRebate
      ),

    rebate:
      Math.round(rebate),

    /*
     * IMPORTANT:
     *
     * This value is the tax AFTER
     * Section 87A rebate.
     *
     * Your existing UI calls this
     * incomeTaxBeforeCess.
     */

    incomeTaxBeforeCess:
      Math.round(
        taxAfterRebate
      ),

    cess:
      Math.round(
        cess
      ),

    annualTax:
      Math.round(
        annualTax
      ),

    monthlyTax:
      Math.round(
        monthlyTax
      ),

    monthlyIncome:
      Math.round(
        monthlyIncome
      ),

    afterTaxAnnualIncome:
      Math.round(
        afterTaxAnnualIncome
      ),

    afterTaxMonthlyIncome:
      Math.round(
        afterTaxMonthlyIncome
      ),

    effectiveTaxRate:
      Number(
        effectiveTaxRate.toFixed(2)
      ),

    slabs:
      breakdown,
  };
}