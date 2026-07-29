import { PanelMarca } from "@/components/layout/panel-marca";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="grid min-h-screen bg-transparent md:grid-cols-[minmax(0,48%)_minmax(0,1fr)] lg:grid-cols-[minmax(0,50%)_minmax(0,1fr)]">
      <PanelMarca />
      <main className="flex items-center justify-center bg-transparent px-5 py-10 dark:bg-[#061120] sm:px-8 md:px-10 lg:px-12 lg:py-12">
        <div className="w-full max-w-[440px]">{children}</div>
      </main>
    </div>
  );
}
