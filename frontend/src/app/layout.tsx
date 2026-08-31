import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ThemeScript } from "@/components/providers/theme-script";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Plataforma de Formación",
  description: "Formación empresarial autoguiada: cursos y diplomados para tu equipo.",
  icons: {
    icon: "/images/Favicon.ico",
    shortcut: "/images/Favicon.ico",
    apple: "/images/Favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${montserrat.className} ${montserrat.variable} min-h-screen antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          {children}
          <ThemeSwitcher />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
