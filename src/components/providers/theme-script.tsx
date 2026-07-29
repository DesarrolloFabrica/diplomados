import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from "@/components/providers/theme-constants";

/**
 * Script bloqueante (Server Component): aplica el tema antes del paint
 * para evitar el destello del tema claro. Renderizar dentro de <head>.
 */
export function ThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var d=${JSON.stringify(DEFAULT_THEME)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark")t=d;var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(t);}catch(e){document.documentElement.classList.add(${JSON.stringify(DEFAULT_THEME)});}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
