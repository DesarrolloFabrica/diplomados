"use client";

import * as React from "react";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/components/providers/theme-constants";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export function ThemeProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [theme, setThemeState] = React.useState<Theme>(DEFAULT_THEME);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const resolved: Theme = isTheme(stored) ? stored : DEFAULT_THEME;
      setThemeState(resolved);
      applyThemeClass(resolved);
    } catch {
      applyThemeClass(DEFAULT_THEME);
    }
  }, []);

  function setTheme(next: Theme) {
    setThemeState(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage no disponible (modo privado estricto, etc.)
    }
    applyThemeClass(next);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }
  return context;
}

export type { Theme };
