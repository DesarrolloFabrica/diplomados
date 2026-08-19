"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  House,
  Loader2,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cerrarSesion } from "@backend/server/actions/auth";

interface ShellPanelColaboradorProps {
  nombre: string | null;
  children: React.ReactNode;
}

interface ItemNavColaborador {
  id: string;
  titulo: string;
  href: string;
  icono: typeof House;
  activo: (pathname: string) => boolean;
}

const ITEMS_NAV: ItemNavColaborador[] = [
  {
    id: "home",
    titulo: "Menú principal",
    href: "/mis-cursos",
    icono: House,
    activo: (pathname) => pathname === "/mis-cursos",
  },
  {
    id: "cursos",
    titulo: "Mis cursos",
    href: "/mis-cursos",
    icono: BookOpen,
    activo: (pathname) =>
      pathname.startsWith("/mis-cursos/") && !pathname.startsWith("/mis-cursos/perfil"),
  },
  {
    id: "perfil",
    titulo: "Mi perfil",
    href: "/mis-cursos/perfil",
    icono: UserRound,
    activo: (pathname) => pathname.startsWith("/mis-cursos/perfil"),
  },
];

const CLASES_SIDEBAR =
  "collaborator-sidebar bg-[linear-gradient(180deg,#071019_0%,#0b1f22_30%,#0f2d2b_65%,#123a32_100%)] text-slate-100";

function TooltipEtiqueta({ etiqueta, visible }: { etiqueta: string; visible: boolean }) {
  if (!visible) return null;

  return (
    <span
      className={cn(
        "pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2",
        "whitespace-nowrap rounded-md border border-emerald-400/25 bg-[#0a1818] px-3 py-1.5",
        "text-xs font-medium text-white opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
        "transition-opacity duration-150",
        "group-hover:opacity-100 group-focus-within:opacity-100",
      )}
    >
      {etiqueta}
    </span>
  );
}

function clasesEnlace(activo: boolean) {
  if (activo) {
    return cn(
      "border-emerald-400/45 bg-[#0f2424]/90 text-white",
      "shadow-[0_0_16px_rgba(47,185,165,0.28),inset_0_1px_0_rgba(255,255,255,0.06)]",
    );
  }
  return cn(
    "border-transparent text-slate-300",
    "hover:border-emerald-400/20 hover:bg-emerald-500/10 hover:text-white",
    "hover:shadow-[0_0_12px_rgba(47,185,165,0.14)]",
  );
}

function EnlaceNav({
  item,
  pathname,
  isExpanded,
  onNavigate,
}: {
  item: ItemNavColaborador;
  pathname: string;
  isExpanded: boolean;
  onNavigate?: () => void;
}) {
  const activo = item.activo(pathname);
  const Icono = item.icono;

  return (
    <div className="group relative w-full">
      <Link
        href={item.href}
        title={item.titulo}
        aria-label={item.titulo}
        aria-current={activo ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "relative flex items-center rounded-xl border",
          "transition-[background-color,border-color,color,box-shadow] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1f22]",
          isExpanded ? "w-full gap-3 px-3 py-2.5" : "mx-auto size-11 justify-center",
          clasesEnlace(activo),
        )}
      >
        <Icono className="size-5 shrink-0" aria-hidden="true" />
        {isExpanded && <span className="truncate text-sm font-medium">{item.titulo}</span>}
      </Link>
      <TooltipEtiqueta etiqueta={item.titulo} visible={!isExpanded} />
    </div>
  );
}

function BotonCerrarSesion({ isExpanded }: { isExpanded: boolean }) {
  const [saliendo, iniciar] = useTransition();

  return (
    <div className="group relative w-full">
      <button
        type="button"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        disabled={saliendo}
        onClick={() => iniciar(async () => void (await cerrarSesion()))}
        className={cn(
          "flex items-center rounded-xl border border-transparent text-slate-400 transition-colors",
          "hover:border-emerald-400/20 hover:bg-emerald-500/10 hover:text-white",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1f22]",
          isExpanded ? "w-full gap-3 px-3 py-2.5 text-sm" : "mx-auto size-11 justify-center",
        )}
      >
        {saliendo ? (
          <Loader2 className="size-5 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
        )}
        {isExpanded && <span>Cerrar sesión</span>}
      </button>
      <TooltipEtiqueta etiqueta="Cerrar sesión" visible={!isExpanded} />
    </div>
  );
}

function BarraLateral({
  pathname,
  isExpanded,
  nombre,
  onToggle,
  onNavigate,
}: {
  pathname: string;
  isExpanded: boolean;
  nombre: string | null;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col px-2 py-4", CLASES_SIDEBAR)}>
      <div className={cn("mb-4 flex items-center gap-2", isExpanded ? "px-1" : "flex-col")}>
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Contraer menú" : "Expandir menú"}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-slate-300 transition-colors",
              "hover:border-emerald-400/20 hover:bg-emerald-500/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1f22]",
              !isExpanded && "mx-auto",
            )}
          >
            {isExpanded ? (
              <ChevronLeft className="size-5" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-5" aria-hidden="true" />
            )}
          </button>
        )}

        <div
          className={cn(
            "flex min-w-0 items-center",
            isExpanded ? "flex-1 gap-2.5" : "mx-auto justify-center",
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/25">
            <GraduationCap className="size-5" aria-hidden="true" />
          </span>
          {isExpanded && (
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-sm font-semibold text-white">Formación</p>
              <p className="truncate text-xs text-slate-400">Colaborador</p>
            </div>
          )}
        </div>
      </div>

      <nav
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-1.5",
          isExpanded ? "sidebar-scrollbar overflow-y-auto" : "sidebar-scrollbar-hidden overflow-y-hidden",
        )}
      >
        {ITEMS_NAV.map((item) => (
          <EnlaceNav
            key={item.id}
            item={item}
            pathname={pathname}
            isExpanded={isExpanded}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-auto shrink-0 space-y-2 border-t border-white/10 pt-3">
        {isExpanded && nombre && (
          <p className="flex items-center gap-2 truncate px-3 text-xs text-slate-400">
            <UserRound className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{nombre}</span>
          </p>
        )}
        <BotonCerrarSesion isExpanded={isExpanded} />
      </div>
    </div>
  );
}

export function ShellPanelColaborador({ nombre, children }: ShellPanelColaboradorProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  return (
    <div className="flex min-h-dvh w-full">
      <aside
        className={cn(
          "sticky top-0 z-40 hidden h-dvh shrink-0 self-start overflow-hidden border-r border-white/10 transition-[width] duration-200 lg:flex lg:flex-col",
          isExpanded ? "w-64" : "w-[5.5rem]",
        )}
      >
        <BarraLateral
          pathname={pathname}
          isExpanded={isExpanded}
          nombre={nombre}
          onToggle={() => setIsExpanded((value) => !value)}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="size-4" aria-hidden="true" />
            </span>
            <span className="font-display text-sm font-semibold">Formación</span>
          </div>
          <button
            type="button"
            aria-label="Abrir menú"
            onClick={() => setDrawerAbierto(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
          >
            <Menu className="size-5" />
          </button>
        </header>

        {drawerAbierto && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-foreground/40"
              onClick={() => setDrawerAbierto(false)}
              aria-hidden="true"
            />
            <div
              className={cn(
                "absolute left-0 top-0 flex h-full w-64 flex-col shadow-xl",
                CLASES_SIDEBAR,
              )}
            >
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setDrawerAbierto(false)}
                className="absolute right-3 top-3 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
              <BarraLateral
                pathname={pathname}
                isExpanded
                nombre={nombre}
                onNavigate={() => setDrawerAbierto(false)}
              />
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-clip p-5 sm:p-6 lg:p-8 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
