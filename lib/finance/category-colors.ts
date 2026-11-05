export type CategoryColorInfo = {
  strong: string;
  soft: string;
  text: string;
  border: string;
};

export const CATEGORY_COLORS: Record<string, CategoryColorInfo> = {
  Rent: { strong: "#7c3aed", soft: "#f3e8ff", text: "#4c1d95", border: "#c4b5fd" },
  Food: { strong: "#16a34a", soft: "#dcfce7", text: "#166534", border: "#86efac" },
  Groceries: { strong: "#16a34a", soft: "#dcfce7", text: "#166534", border: "#86efac" },
  Shopping: { strong: "#ec4899", soft: "#fce7f3", text: "#9d174d", border: "#f9a8d4" },
  Transportation: { strong: "#f59e0b", soft: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  Fuel: { strong: "#f59e0b", soft: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  Travel: { strong: "#f97316", soft: "#ffedd5", text: "#9a4d00", border: "#fdba74" },
  Entertainment: { strong: "#ef4444", soft: "#fee2e2", text: "#991b1b", border: "#fca5a5" },
  Utilities: { strong: "#06b6d4", soft: "#cffafe", text: "#0f766e", border: "#67e8f9" },
  Electricity: { strong: "#06b6d4", soft: "#cffafe", text: "#0f766e", border: "#67e8f9" },
  Water: { strong: "#06b6d4", soft: "#cffafe", text: "#0f766e", border: "#67e8f9" },
  Internet: { strong: "#06b6d4", soft: "#cffafe", text: "#0f766e", border: "#67e8f9" },
  "Mobile Recharge": { strong: "#06b6d4", soft: "#cffafe", text: "#0f766e", border: "#67e8f9" },
  Healthcare: { strong: "#10b981", soft: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  Savings: { strong: "#059669", soft: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  Education: { strong: "#3b82f6", soft: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  Insurance: { strong: "#6366f1", soft: "#e0e7ff", text: "#3730a3", border: "#a5b4fc" },
  EMI: { strong: "#f59e0b", soft: "#fef3c7", text: "#92400e", border: "#fcd34d" },
  "Loan Payment": { strong: "#f97316", soft: "#ffedd5", text: "#9a4d00", border: "#fdba74" },
  Investments: { strong: "#059669", soft: "#d1fae5", text: "#065f46", border: "#6ee7b7" },
  "House Maintenance": { strong: "#a16207", soft: "#fef3c7", text: "#854d0e", border: "#fcd34d" },
  "Personal Care": { strong: "#f43f5e", soft: "#ffe4e6", text: "#9f1239", border: "#fda4af" },
  Family: { strong: "#84cc16", soft: "#ecfccb", text: "#3f6212", border: "#bef264" },
  Gifts: { strong: "#fb7185", soft: "#ffe4e6", text: "#9f1239", border: "#fda4af" },
  Subscriptions: { strong: "#8b5cf6", soft: "#f3e8ff", text: "#4c1d95", border: "#c4b5fd" },
  Other: { strong: "#64748b", soft: "#e2e8f0", text: "#334155", border: "#cbd5e1" },
};

const CATEGORY_ALIASES: Record<string, string> = {
  "House Rent": "Rent",
  "Monthly Rent": "Rent",
  "Grocery": "Food",
  "Groceries": "Food",
  "Food & Dining": "Food",
  "Bills": "Utilities",
  "Bill": "Utilities",
  "Maintenance": "House Maintenance",
  "Household": "Utilities",
  "Transport": "Transportation",
  "Taxi": "Transportation",
  "Ride": "Transportation",
  "Movie": "Entertainment",
  "Movies": "Entertainment",
  "Health": "Healthcare",
  "Medical": "Healthcare",
  "Tuition": "Education",
  "School": "Education",
  "Study": "Education",
  "Insurance Premium": "Insurance",
  "Loan EMI": "EMI",
  "EMI Payment": "EMI",
  "Home Loan": "Loan Payment",
  "Personal Loan": "Loan Payment",
  "Savings": "Savings",
  "Investment": "Investments",
  "Subscription": "Subscriptions",
  "Streaming": "Subscriptions",
};

export function normalizeCategoryKey(category?: string | null): string {
  const raw = String(category ?? "Other").trim();
  if (!raw) return "Other";
  return CATEGORY_ALIASES[raw] ?? raw;
}

export function getCategoryColor(category?: string | null): CategoryColorInfo {
  return CATEGORY_COLORS[normalizeCategoryKey(category)] ?? CATEGORY_COLORS.Other;
}

export function getCategoryBadgeStyle(category?: string | null) {
  const resolved = getCategoryColor(category);
  return {
    backgroundColor: resolved.soft,
    borderColor: resolved.border,
    color: resolved.text,
  };
}

export function getCategoryChartColor(category?: string | null): string {
  return getCategoryColor(category).strong;
}

export const CATEGORY_OPTIONS = Object.keys(CATEGORY_COLORS).sort();
