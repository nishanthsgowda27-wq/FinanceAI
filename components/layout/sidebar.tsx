"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  WalletCards,
  ArrowLeftRight,
  Target,
  PiggyBank,
  FileText,
  Landmark,
  Sparkles,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";
import AccountControls from "./account-controls";
import { useApp } from "@/components/providers/app-provider";

const navigation = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: WalletCards,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Budgets",
    href: "/budgets",
    icon: Target,
  },
  {
    label: "Savings",
    href: "/savings",
    icon: PiggyBank,
  },
];

const assistants = [
  {
    label: "Tax Assistant",
    href: "/tax-assistant",
    icon: FileText,
  },
  {
    label: "Loan Assistant",
    href: "/loan-assistant",
    icon: Landmark,
  },
  {
    label: "Finance AI",
    href: "/finance-ai",
    icon: Sparkles,
  },
];

export default function Sidebar() {
  const { t } = useApp();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-xl border bg-white p-3 shadow-sm lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-300 ${
          open
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
              F
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                FinanceAI
              </p>

              <p className="text-[11px] text-gray-400">
                Smart money management
              </p>
            </div>
          </Link>

          <button
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {t("nav.dashboard")}
          </p>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={19} />
                  {item.href === "/dashboard" ? t("nav.dashboard") : item.href === "/accounts" ? t("nav.accounts") : item.href === "/transactions" ? t("nav.transactions") : item.href === "/budgets" ? t("nav.budgets") : item.href === "/savings" ? t("nav.savings") : item.label}
                </Link>
              );
            })}
          </nav>

          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {t("nav.financeAi")}
          </p>

          <nav className="space-y-1">
            {assistants.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    active
                      ? "bg-purple-50 text-purple-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={19} />
                  {item.href === "/tax-assistant" ? t("nav.tax") : item.href === "/loan-assistant" ? t("nav.loan") : t("nav.financeAi")}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom */}
        <div className="border-t p-4">
          <AccountControls />
        </div>
      </aside>
    </>
  );
}