"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dict, DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

type Theme = "dark" | "light";

interface AppCtx {
  theme: Theme;
  toggleTheme: () => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Sync from storage after mount (server renders defaults to avoid mismatch).
  useEffect(() => {
    const savedTheme = (localStorage.getItem("theme") as Theme) || "dark";
    const savedLocale = (localStorage.getItem("locale") as Locale) || DEFAULT_LOCALE;
    setTheme(savedTheme);
    setLocaleState(savedLocale);
    document.documentElement.dataset.theme = savedTheme;
    document.documentElement.lang = savedLocale;
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      document.documentElement.dataset.theme = next;
      return next;
    });
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string) => dict[locale][key] ?? dict.en[key] ?? key,
    [locale]
  );

  return (
    <Ctx.Provider value={{ theme, toggleTheme, locale, setLocale, t }}>
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

/** Shorthand translation hook. */
export function useT() {
  return useApp().t;
}
