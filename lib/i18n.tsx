"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { LOCALE_KEY } from "@/lib/keys";
import type { Locale } from "@/lib/types";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
} | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const saved = window.localStorage.getItem(LOCALE_KEY);
    if (saved === "en" || saved === "zh") {
      setLocaleState(saved);
      document.documentElement.lang = saved === "zh" ? "zh-CN" : "en";
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_KEY, next);
    document.documentElement.lang = next === "zh" ? "zh-CN" : "en";
  };

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider missing");
  const tx = (zh: string, en: string) => (context.locale === "zh" ? zh : en);
  return { ...context, tx };
}
