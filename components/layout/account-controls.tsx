"use client";

import Link from "next/link";
import { ChevronDown, Globe2, LogOut, Settings, UserRound } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Language } from "@/lib/i18n/translations";
import { useApp } from "@/components/providers/app-provider";

function initials(name: string, email: string) {
  const source = name.trim() || email.split("@")[0] || "FinanceAI";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)).toUpperCase();
}

export function LanguageSelector() {
  const { language, setLanguage, t } = useApp();
  return (
    <label className="relative inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm">
      <Globe2 className="h-4 w-4 text-indigo-600" />
      <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t("nav.language")} className="appearance-none bg-transparent pr-5 outline-none">
        <option value="en">{t("language.english")}</option>
        <option value="kn">{t("language.kannada")}</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-400" />
    </label>
  );
}

export default function AccountControls({ dark = false }: { dark?: boolean }) {
  const { user, t } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const displayName = user?.name || user?.email?.split("@")[0] || "FinanceAI";
  const email = user?.email || "";
  const avatar = initials(displayName, email);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-3">
      <LanguageSelector />
      <div className="relative">
        <button type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} className={`flex items-center gap-3 rounded-2xl border px-2.5 py-2 text-left transition ${dark ? "border-slate-700 bg-slate-800 text-white hover:bg-slate-700" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"}`}>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">{avatar}</span>
          <span className="hidden min-w-0 max-w-36 md:block">
            <span className="block truncate text-sm font-semibold">{displayName}</span>
            <span className={`block truncate text-xs ${dark ? "text-slate-400" : "text-slate-500"}`}>{email}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        {open && <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 text-slate-700 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">{avatar}</span>
            <div className="min-w-0"><p className="truncate font-semibold">{displayName}</p><p className="truncate text-xs text-slate-500">{email}</p></div>
          </div>
          <Link href="/profile" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"><UserRound className="h-4 w-4" />{t("account.profile")}</Link>
          <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-slate-50"><Settings className="h-4 w-4" />{t("account.settings")}</Link>
          <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />{t("account.logout")}</button>
        </div>}
      </div>
    </div>
  );
}
