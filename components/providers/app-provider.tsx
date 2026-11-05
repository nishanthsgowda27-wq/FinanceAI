"use client";

import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Language } from "@/lib/i18n/translations";
import { translate } from "@/lib/i18n/translations";

type AuthUser = { id: string; name: string; email: string; emailVerified: boolean };
type AppContextValue = {
  user: AuthUser | null;
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

const AppContext = createContext<AppContextValue | null>(null);
const LANGUAGE_KEY = "financeai-language";
const languageEvent = "financeai-language-change";
const subscribeToLanguage = (onChange: () => void) => {
  window.addEventListener(languageEvent, onChange);
  return () => window.removeEventListener(languageEvent, onChange);
};
const serverLanguage = () => "en" as Language;
const clientLanguage = () => {
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return stored === "kn" ? "kn" : "en";
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(subscribeToLanguage, clientLanguage, serverLanguage);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setUser(data?.user ?? null))
      .catch(() => setUser(null));
  }, []);

  function setLanguage(nextLanguage: Language) {
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(languageEvent));
  }

  const value = useMemo(() => ({ user, language, setLanguage, t: (key: string) => translate(language, key) }), [user, language]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
