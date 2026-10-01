"use client";

import { usePathname } from "next/navigation";
import { PanelMarca } from "@/components/layout/panel-marca";

export function AuthShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  if (pathname !== "/login") {
    return (
      <div className="grid min-h-screen bg-transparent md:grid-cols-[minmax(0,48%)_minmax(0,1fr)] lg:grid-cols-[minmax(0,50%)_minmax(0,1fr)]">
        <PanelMarca />
        <main className="flex items-center justify-center bg-transparent px-5 py-10 dark:bg-[#061120] sm:px-8 md:px-10 lg:px-12 lg:py-12">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#061120]">
      <div className="absolute inset-0">
        <PanelMarca variant="login" />
      </div>
      <main className="relative z-10 ml-auto flex min-h-screen w-full items-center justify-center bg-[linear-gradient(80deg,rgba(6,17,32,0.70)_0%,rgba(10,25,38,0.70)_100%)] px-6 py-10 sm:px-10 sm:py-12 md:w-[40%] md:px-9 lg:px-12 xl:px-16">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 -left-48 hidden w-48 bg-[linear-gradient(90deg,transparent_0%,rgba(6,17,32,0.18)_34%,rgba(6,17,32,0.52)_72%,rgba(6,17,32,0.70)_100%)] md:block"
        />
        <div className="relative z-10 w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
