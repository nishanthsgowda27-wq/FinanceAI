export type TaxSlab = {
  min: number;
  max: number | null;
  rate: number;
  label: string;
};

/*
 * NEW TAX REGIME
 *
 * Financial Year: 2025-26
 * Assessment Year: 2026-27
 *
 * Slabs:
 *
 * Up to ₹4,00,000       → 0%
 * ₹4,00,001 - ₹8,00,000 → 5%
 * ₹8,00,001 - ₹12,00,000 → 10%
 * ₹12,00,001 - ₹16,00,000 → 15%
 * ₹16,00,001 - ₹20,00,000 → 20%
 * ₹20,00,001 - ₹24,00,000 → 25%
 * Above ₹24,00,000       → 30%
 */

export const NEW_TAX_REGIME_SLABS: TaxSlab[] = [
  {
    min: 0,
    max: 400000,
    rate: 0,
    label: "₹0 - ₹4,00,000",
  },

  {
    min: 400000,
    max: 800000,
    rate: 5,
    label: "₹4,00,001 - ₹8,00,000",
  },

  {
    min: 800000,
    max: 1200000,
    rate: 10,
    label: "₹8,00,001 - ₹12,00,000",
  },

  {
    min: 1200000,
    max: 1600000,
    rate: 15,
    label: "₹12,00,001 - ₹16,00,000",
  },

  {
    min: 1600000,
    max: 2000000,
    rate: 20,
    label: "₹16,00,001 - ₹20,00,000",
  },

  {
    min: 2000000,
    max: 2400000,
    rate: 25,
    label: "₹20,00,001 - ₹24,00,000",
  },

  {
    min: 2400000,
    max: null,
    rate: 30,
    label: "Above ₹24,00,000",
  },
];

/*
 * OLD TAX REGIME
 *
 * This is kept in the project so the user
 * can compare the two regimes.
 *
 * These are simplified slabs for the
 * educational tax assistant.
 */

export const OLD_TAX_REGIME_SLABS: TaxSlab[] = [
  {
    min: 0,
    max: 250000,
    rate: 0,
    label: "₹0 - ₹2,50,000",
  },

  {
    min: 250000,
    max: 500000,
    rate: 5,
    label: "₹2,50,001 - ₹5,00,000",
  },

  {
    min: 500000,
    max: 1000000,
    rate: 20,
    label: "₹5,00,001 - ₹10,00,000",
  },

  {
    min: 1000000,
    max: null,
    rate: 30,
    label: "Above ₹10,00,000",
  },
];

/*
 * Health and Education Cess
 */

export const HEALTH_EDUCATION_CESS = 4;

/*
 * New-regime Section 87A rebate limit.
 *
 * Rebate is available when taxable income
 * does not exceed ₹12,00,000.
 */

export const NEW_REGIME_REBATE_INCOME_LIMIT = 1200000;

/*
 * Maximum rebate under the new regime.
 */

export const NEW_REGIME_MAX_REBATE = 60000;

/*
 * Old regime Section 87A rebate.
 */

export const OLD_REGIME_REBATE_INCOME_LIMIT = 500000;

export const OLD_REGIME_MAX_REBATE = 12500;