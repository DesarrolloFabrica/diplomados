"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, UserRound, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAVEGACION_POR_ROL } from "@/config/navegacion";
import { ETIQUETA_ROL } from "@backend/config/roles";
import { CerrarSesion } from "@/components/layout/cerrar-sesion";
import type { Rol } from "@backend/types";

interface ShellPanelProps {
  rol: Rol;
  nombre: string | null;
  children: React.ReactNode;
}

function isRouteActive(pathname: string, href: string, exact = false) {
  if (exact) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ShellPanel({ rol, nombre, children }: ShellPanelProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const items = NAVEGACION_POR_ROL[rol];

  const contenidoNav = (
    <>
      <div className="flex items-center gap-2.5 px-2 py-1">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold">Formación</p>
          <p className="text-xs text-muted-foreground">{ETIQUETA_ROL[rol]}</p>
        </div>
      </div>

      <nav className="mt-6 flex-1 space-y-1">
        {items.map((item) => {
          const activo = isRouteActive(pathname, item.href, item.exact);
          const Icono = item.icono;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setAbierto(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm font-medium",
                "transition-[background-color,border-color,color,box-shadow] duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cun-green",
                "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                activo
                  ? [
                      "border-cun-green/70",
                      "bg-cun-blue",
                      "text-white",
                      "shadow-[0_0_14px_rgba(145,220,0,0.24)]",
                      "dark:border-cun-green/80",
                      "dark:bg-gradient-to-r dark:from-cun-green dark:via-[#74AF13] dark:to-[#36591e]",
                      "dark:text-white",
                      "dark:shadow-[0_0_14px_rgba(145,220,0,0.28)]",
                    ]
                  : [
                      "text-muted-foreground",
                      "hover:bg-muted",
                      "hover:text-foreground",
                    ],
              )}
            >
              <Icono className="size-5 shrink-0 text-current" aria-hidden="true" />
              {item.titulo}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border pt-3">
        <p className="flex items-center gap-2 truncate px-3 pb-2 text-xs text-muted-foreground">
          <UserRound className="size-4 shrink-0" aria-hidden="true" />
          {nombre ?? "Usuario"}
        </p>
        <CerrarSesion />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-transparent lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Barra lateral fija en escritorio */}
      <aside className="hidden border-r border-border bg-card lg:flex lg:flex-col lg:p-4">
        {contenidoNav}
      </aside>

      {/* Cabecera móvil */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </span>
          <span className="font-display text-sm font-semibold">Formación</span>
        </div>
        <button
          type="button"
          aria-label="Abrir menú"
          onClick={() => setAbierto(true)}
          className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Menú móvil (drawer) */}
      {abierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/40"
            onClick={() => setAbierto(false)}
          />
          <div className="absolute left-0 top-0 flex h-full w-64 flex-col bg-card p-4 shadow-xl">
            <button
              type="button"
              aria-label="Cerrar menú"
              onClick={() => setAbierto(false)}
              className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
            >
              <X className="h-5 w-5" />
            </button>
            {contenidoNav}
          </div>
        </div>
      )}

      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
