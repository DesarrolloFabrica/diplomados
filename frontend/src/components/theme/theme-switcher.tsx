"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Seleccionar tema de la aplicación"
      className={cn(
        "fixed bottom-3 right-3 z-50",
        "flex items-center gap-1 rounded-full",
        "border border-border bg-card/95 p-1",
        "shadow-lg backdrop-blur-md",
        "sm:bottom-5 sm:right-5",
      )}
    >
      <button
        type="button"
        aria-label="Activar modo claro"
        aria-pressed={theme === "light"}
        onClick={() => setTheme("light")}
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          "transition-[background-color,color,box-shadow] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          theme === "light"
            ? "bg-cun-blue text-white shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Sun className="size-4" aria-hidden="true" />
      </button>

      <button
        type="button"
        aria-label="Activar modo oscuro"
        aria-pressed={theme === "dark"}
        onClick={() => setTheme("dark")}
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          "transition-[background-color,color,box-shadow] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          theme === "dark"
            ? "bg-cun-green text-cun-blue shadow-sm"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Moon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
