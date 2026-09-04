"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FocusEvent,
  type MouseEvent,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  House,
  Loader2,
  LogOut,
  Menu,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMarcaFormacion } from "@/components/layout/logo-marca-formacion";
import { DashboardParticles } from "@/components/shared/dashboard-particles";
import { NAVEGACION_POR_ROL } from "@/config/navegacion";
import { cerrarSesion } from "@backend/server/actions/auth";

type TemaSidebar = "colaborador" | "superadmin";
type OrientacionNav = "vertical" | "bottom";

interface ItemNavLateral {
  id: string;
  titulo: string;
  href: string;
  icono: LucideIcon;
  activo: (pathname: string) => boolean;
}

interface ShellPanelLateralProps {
  nombre: string | null;
  children: React.ReactNode;
  items: ItemNavLateral[];
  subtitulo: string;
  tema: TemaSidebar;
}

const TEMAS_SIDEBAR = {
  colaborador: {
    clasesSidebar:
      "collaborator-sidebar border border-white/40 bg-[rgba(238,247,246,0.72)] text-[#123238] shadow-[0_12px_40px_rgba(0,28,34,0.12),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-[18px] backdrop-saturate-[1.2]",
    clasesEnlaceActivo:
      "border-[#00896F]/30 bg-[#00896F]/10 text-[#006F5A] shadow-[0_0_0_1px_rgba(0,145,108,0.03),0_4px_14px_rgba(0,110,90,0.08)]",
    clasesEnlaceInactivo:
      "border-transparent text-[#39575B] hover:-translate-y-px hover:border-[#095348]/10 hover:bg-[#095348]/[0.06] hover:text-[#123238]",
    clasesBotonSecundario:
      "bg-white/30 text-[#17343A] hover:border-[#095348]/10 hover:bg-[#095348]/[0.06] hover:text-[#006F5A]",
    clasesBotonLogout:
      "text-[#39575B] hover:border-[#00896F]/15 hover:bg-[#00896F]/[0.06] hover:text-[#006F5A]",
    clasesTooltip: "border-white/45 bg-[#eef7f6]/90 text-[#123238] backdrop-blur-md",
    focusRing: "focus-visible:ring-[#00896F]/50 focus-visible:ring-offset-[#eef7f6]",
  },
  superadmin: {
    clasesSidebar:
      "admin-sidebar border border-white/40 bg-[rgba(231,241,243,0.72)] text-[#123238] shadow-[0_12px_40px_rgba(0,28,34,0.12),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-[18px] backdrop-saturate-[1.2]",
    clasesEnlaceActivo:
      "border-[#00896F]/30 bg-[#00896F]/10 text-[#006F5A] shadow-[0_0_0_1px_rgba(0,145,108,0.03),0_4px_14px_rgba(0,110,90,0.08)]",
    clasesEnlaceInactivo:
      "border-transparent text-[#39575B] hover:-translate-y-px hover:border-[#095348]/10 hover:bg-[#095348]/[0.06] hover:text-[#123238]",
    clasesBotonSecundario:
      "bg-white/30 text-[#17343A] hover:border-[#095348]/10 hover:bg-[#095348]/[0.06] hover:text-[#006F5A]",
    clasesBotonLogout:
      "text-[#39575B] hover:border-[#00896F]/15 hover:bg-[#00896F]/[0.06] hover:text-[#006F5A]",
    clasesTooltip: "border-white/45 bg-[#eef7f6]/90 text-[#123238] backdrop-blur-md",
    focusRing: "focus-visible:ring-[#00896F]/50 focus-visible:ring-offset-[#eef7f6]",
  },
} as const satisfies Record<
  TemaSidebar,
  {
    clasesSidebar: string;
    clasesEnlaceActivo: string;
    clasesEnlaceInactivo: string;
    clasesBotonSecundario: string;
    clasesBotonLogout: string;
    clasesTooltip: string;
    focusRing: string;
  }
>;

function isRouteActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const DOCK_AUTO_HIDE_MS = 8000;

const ITEMS_NAV_COLABORADOR: ItemNavLateral[] = [
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

const ITEMS_NAV_SUPERADMIN: ItemNavLateral[] = NAVEGACION_POR_ROL.superadmin.map((item) => ({
  id: item.href,
  titulo: item.titulo,
  href: item.href,
  icono: item.icono,
  activo: (pathname) => isRouteActive(pathname, item.href, item.exact),
}));

function TooltipEtiqueta({
  etiqueta,
  visible,
  clasesTooltip,
  orientacion = "vertical",
}: {
  etiqueta: string;
  visible: boolean;
  clasesTooltip: string;
  orientacion?: OrientacionNav;
}) {
  if (!visible) return null;

  return (
    <span
      className={cn(
        "pointer-events-none absolute z-50",
        orientacion === "bottom"
          ? "bottom-full left-1/2 mb-3 -translate-x-1/2"
          : "left-full top-1/2 ml-3 -translate-y-1/2",
        "whitespace-nowrap rounded-md border px-3 py-1.5",
        clasesTooltip,
        "text-xs font-medium text-current opacity-0 shadow-[0_8px_24px_rgba(0,28,34,0.12)]",
        "transition-opacity duration-150",
        "group-hover:opacity-100 group-focus-within:opacity-100",
      )}
    >
      {etiqueta}
    </span>
  );
}

function clasesEnlace(activo: boolean, tema: TemaSidebar) {
  const config = TEMAS_SIDEBAR[tema];
  return activo ? config.clasesEnlaceActivo : config.clasesEnlaceInactivo;
}

function EnlaceNav({
  item,
  pathname,
  isExpanded,
  onNavigate,
  tema,
  orientacion = "vertical",
}: {
  item: ItemNavLateral;
  pathname: string;
  isExpanded: boolean;
  onNavigate?: () => void;
  tema: TemaSidebar;
  orientacion?: OrientacionNav;
}) {
  const activo = item.activo(pathname);
  const Icono = item.icono;
  const config = TEMAS_SIDEBAR[tema];
  const esBottom = orientacion === "bottom";

  return (
    <div className={cn("group relative", esBottom ? "w-auto shrink-0" : "w-full")}>
      <Link
        href={item.href}
        title={item.titulo}
        aria-label={item.titulo}
        aria-current={activo ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "relative flex items-center overflow-visible rounded-xl border",
          "transition-[background-color,border-color,color,box-shadow,transform] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          config.focusRing,
          esBottom
            ? isExpanded
              ? "min-h-14 shrink-0 gap-3 rounded-2xl px-5 py-3"
              : "size-12 justify-center rounded-2xl"
            : isExpanded
              ? "w-full gap-3 px-3 py-2.5"
              : "mx-auto size-11 justify-center rounded-[13px]",
          clasesEnlace(activo, tema),
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center">
          <Icono className="size-[1.125rem] shrink-0" aria-hidden="true" />
        </span>
        {isExpanded && (
          <span className={cn("text-sm font-medium", esBottom ? "whitespace-nowrap" : "truncate")}>
            {item.titulo}
          </span>
        )}
      </Link>
      <TooltipEtiqueta
        etiqueta={item.titulo}
        visible={!isExpanded}
        clasesTooltip={config.clasesTooltip}
        orientacion={orientacion}
      />
    </div>
  );
}

function BotonCerrarSesion({
  isExpanded,
  tema,
  orientacion = "vertical",
}: {
  isExpanded: boolean;
  tema: TemaSidebar;
  orientacion?: OrientacionNav;
}) {
  const [saliendo, iniciar] = useTransition();
  const config = TEMAS_SIDEBAR[tema];
  const esBottom = orientacion === "bottom";

  return (
    <div className={cn("group relative", esBottom ? "w-auto shrink-0" : "w-full")}>
      <button
        type="button"
        title="Cerrar sesión"
        aria-label="Cerrar sesión"
        disabled={saliendo}
        onClick={() => iniciar(async () => void (await cerrarSesion()))}
        className={cn(
          "flex items-center overflow-visible rounded-xl border border-transparent transition-[background-color,border-color,color,transform] duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          config.focusRing,
          config.clasesBotonLogout,
          esBottom
            ? isExpanded
              ? "min-h-14 shrink-0 gap-3 rounded-2xl px-5 py-3 text-sm"
              : "size-12 justify-center rounded-2xl"
            : isExpanded
              ? "w-full gap-3 px-3 py-2.5 text-sm"
              : "mx-auto size-11 justify-center rounded-[13px]",
        )}
      >
        <span className="grid size-8 shrink-0 place-items-center">
          {saliendo ? (
            <Loader2 className="size-[1.125rem] shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-[1.125rem] shrink-0" aria-hidden="true" />
          )}
        </span>
        {isExpanded && (
          <span className={cn(esBottom && "whitespace-nowrap")}>Cerrar sesión</span>
        )}
      </button>
      <TooltipEtiqueta
        etiqueta="Cerrar sesión"
        visible={!isExpanded}
        clasesTooltip={config.clasesTooltip}
        orientacion={orientacion}
      />
    </div>
  );
}

function BarraLateral({
  pathname,
  isExpanded,
  nombre,
  items,
  subtitulo,
  tema,
  onToggle,
  onNavigate,
  orientacion = "vertical",
}: {
  pathname: string;
  isExpanded: boolean;
  nombre: string | null;
  items: ItemNavLateral[];
  subtitulo: string;
  tema: TemaSidebar;
  onToggle?: () => void;
  onNavigate?: () => void;
  orientacion?: OrientacionNav;
}) {
  const config = TEMAS_SIDEBAR[tema];
  const esBottom = orientacion === "bottom";

  return (
    <div
      className={cn(
        "flex",
        esBottom
          ? cn(
              "h-auto max-w-[calc(100vw-2rem)] items-center overflow-visible rounded-[26px]",
              isExpanded ? "w-[min(1040px,calc(100vw-2rem))] gap-4 px-5 py-4" : "w-auto gap-2 px-3 py-2",
            )
          : "h-full min-h-0 flex-col px-2 py-4",
        config.clasesSidebar,
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2",
          esBottom ? (isExpanded ? "mr-1 shrink-0 gap-3 pr-1" : "shrink-0") : isExpanded ? "mb-4 px-1" : "mb-4 flex-col",
        )}
      >
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Contraer menú" : "Expandir menú"}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-2xl border border-transparent transition-[background-color,border-color,color,transform] duration-200 hover:-translate-y-px",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              config.focusRing,
              config.clasesBotonSecundario,
              !isExpanded && !esBottom && "mx-auto",
            )}
          >
            {isExpanded ? (
              <ChevronLeft className="size-[1.125rem]" aria-hidden="true" />
            ) : (
              <ChevronRight className="size-[1.125rem]" aria-hidden="true" />
            )}
          </button>
        )}

        <div
          className={cn(
            "flex min-w-0 items-center",
            isExpanded ? "flex-1 gap-2.5" : "mx-auto justify-center",
            esBottom && !isExpanded && "hidden sm:flex",
          )}
        >
          <LogoMarcaFormacion className={isExpanded ? "size-8 p-1" : undefined} />
          {isExpanded && (
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-sm font-semibold text-[#123238]">Formación</p>
              <p className="truncate text-xs text-[#39575B]">{subtitulo}</p>
            </div>
          )}
        </div>
      </div>

      <nav
        className={cn(
          "flex min-w-0 flex-1 gap-3",
          esBottom
            ? cn(
                "sidebar-scrollbar-hidden min-h-14 flex-row items-center justify-center overflow-x-auto overflow-y-visible",
                isExpanded ? "gap-3 px-2" : "gap-2 px-1",
              )
            : [
                "min-h-0 flex-col",
                isExpanded ? "sidebar-scrollbar overflow-y-auto" : "sidebar-scrollbar-hidden overflow-y-hidden",
              ],
        )}
      >
        {items.map((item) => (
          <EnlaceNav
            key={item.id}
            item={item}
            pathname={pathname}
            isExpanded={isExpanded}
            onNavigate={onNavigate}
            tema={tema}
            orientacion={orientacion}
          />
        ))}
      </nav>

      <div
        className={cn(
          "shrink-0",
          esBottom
            ? cn(
                "flex items-center border-l border-[#12353c]/10",
                isExpanded ? "ml-2 gap-3 pl-4" : "ml-1 gap-2 pl-2",
              )
            : "mt-auto space-y-2 border-t border-[#12353c]/10 pt-3",
        )}
      >
        {isExpanded && nombre && (
          <p className={cn("flex items-center gap-2.5 text-xs text-[#39575B]", esBottom ? "max-w-56 shrink-0 whitespace-nowrap px-1" : "truncate px-3")}>
            <UserRound className="size-4 shrink-0 stroke-[2.25px]" aria-hidden="true" />
            <span className="truncate">{nombre}</span>
          </p>
        )}
        <BotonCerrarSesion isExpanded={isExpanded} tema={tema} orientacion={orientacion} />
      </div>
    </div>
  );
}

function ShellPanelLateral({
  nombre,
  children,
  items,
  subtitulo,
  tema,
}: ShellPanelLateralProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [dockOpen, setDockOpen] = useState(false);
  const capsulaRef = useRef<HTMLDivElement>(null);
  const ocultarTimeoutRef = useRef<number | null>(null);
  const esDashboardColaborador = tema === "colaborador" && pathname === "/mis-cursos";

  const cancelarOcultamientoDock = useCallback(() => {
    if (ocultarTimeoutRef.current !== null) {
      window.clearTimeout(ocultarTimeoutRef.current);
      ocultarTimeoutRef.current = null;
    }
  }, []);

  const mantenerDockActivo = useCallback(() => {
    setDockOpen(true);
    cancelarOcultamientoDock();
  }, [cancelarOcultamientoDock]);

  const programarOcultamientoDock = useCallback(() => {
    cancelarOcultamientoDock();
    ocultarTimeoutRef.current = window.setTimeout(() => {
      setDockOpen(false);
      ocultarTimeoutRef.current = null;
    }, DOCK_AUTO_HIDE_MS);
  }, [cancelarOcultamientoDock]);

  const manejarSalidaCapsula = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const destino = event.relatedTarget;
      if (destino instanceof Node && capsulaRef.current?.contains(destino)) {
        return;
      }
      programarOcultamientoDock();
    },
    [programarOcultamientoDock],
  );

  const manejarBlurCapsula = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const destino = event.relatedTarget;
      if (destino instanceof Node && capsulaRef.current?.contains(destino)) {
        return;
      }
      programarOcultamientoDock();
    },
    [programarOcultamientoDock],
  );

  useEffect(() => () => cancelarOcultamientoDock(), [cancelarOcultamientoDock]);

  return (
    <div className="flex min-h-dvh w-full">
      <aside className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center overflow-visible px-3 pb-3 sm:px-4">
        <div
          ref={capsulaRef}
          onMouseEnter={mantenerDockActivo}
          onMouseLeave={manejarSalidaCapsula}
          onFocusCapture={mantenerDockActivo}
          onBlurCapture={manejarBlurCapsula}
          onPointerDown={mantenerDockActivo}
          className={cn(
            "pointer-events-auto flex flex-col items-center transition-[opacity,transform] duration-300 ease-out motion-reduce:duration-0",
            dockOpen
              ? "translate-y-0 opacity-100"
              : "translate-y-[calc(100%-1.75rem)] opacity-95 lg:translate-y-[65%] lg:opacity-90",
          )}
        >
          <button
            type="button"
            aria-label="Mostrar navegacion"
            aria-expanded={dockOpen}
            onClick={mantenerDockActivo}
            className={cn(
              "-mb-1 flex h-6 min-w-12 items-center justify-center rounded-full border border-white/45 bg-[#eef7f6]/80 px-3 text-[#123238] shadow-[0_6px_20px_rgba(0,28,34,0.10),inset_0_1px_0_rgba(255,255,255,0.55)] backdrop-blur-[18px]",
              "transition-[background-color,color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/90 hover:text-[#006F5A]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00896F]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#eef7f6]",
              dockOpen && "pointer-events-none opacity-0",
            )}
          >
            {!dockOpen && <ChevronUp className="size-4" aria-hidden="true" />}
          </button>
          <BarraLateral
            pathname={pathname}
            isExpanded={isExpanded}
            nombre={nombre}
            items={items}
            subtitulo={subtitulo}
            tema={tema}
            onToggle={() => setIsExpanded((value) => !value)}
            orientacion="bottom"
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <LogoMarcaFormacion />
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
              className="absolute left-0 top-0 flex h-full w-64 flex-col shadow-xl"
            >
              <button
                type="button"
                aria-label="Cerrar menú"
                onClick={() => setDrawerAbierto(false)}
                className="absolute right-3 top-3 rounded-md p-1.5 text-[#39575B] hover:bg-[#095348]/[0.06] hover:text-[#123238]"
              >
                <X className="size-5" />
              </button>
              <BarraLateral
                pathname={pathname}
                isExpanded
                nombre={nombre}
                items={items}
                subtitulo={subtitulo}
                tema={tema}
                onNavigate={() => setDrawerAbierto(false)}
              />
            </div>
          </div>
        )}

        <main
          className={cn(
            "relative min-w-0 flex-1 overflow-x-clip",
            esDashboardColaborador
              ? [
                  "isolate min-h-dvh bg-[#061120]",
                  "p-4 sm:p-5 lg:p-7 lg:pb-28 xl:p-8 xl:pb-28",
                  "before:pointer-events-none before:absolute before:inset-0 before:z-20 before:bg-[linear-gradient(90deg,rgba(6,17,32,0.78)_0%,rgba(6,17,32,0.42)_34%,rgba(6,17,32,0.08)_62%,rgba(6,17,32,0.22)_100%)]",
                  "after:pointer-events-none after:absolute after:inset-0 after:z-20 after:bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.02)_28%,rgba(6,17,32,0.28)_100%)]",
                ]
              : "p-5 pb-24 sm:p-6 sm:pb-24 lg:p-8 lg:pb-28 xl:p-10 xl:pb-28",
          )}
        >
          {esDashboardColaborador && (
            <video
              src="/images/Dashboard_fondo.mp4"
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 size-full object-cover object-left"
            />
          )}
          {esDashboardColaborador && <DashboardParticles preset="fireflies" accent="#74CFC4" />}
          <div className={cn(esDashboardColaborador && "relative z-30")}>{children}</div>
        </main>
      </div>
    </div>
  );
}

export function ShellPanelColaborador({
  nombre,
  children,
}: {
  nombre: string | null;
  children: React.ReactNode;
}) {
  return (
    <ShellPanelLateral
      nombre={nombre}
      items={ITEMS_NAV_COLABORADOR}
      subtitulo="Colaborador"
      tema="colaborador"
    >
      {children}
    </ShellPanelLateral>
  );
}

export function ShellPanelSuperadmin({
  nombre,
  children,
}: {
  nombre: string | null;
  children: React.ReactNode;
}) {
  return (
    <ShellPanelLateral
      nombre={nombre}
      items={ITEMS_NAV_SUPERADMIN}
      subtitulo="Superadmin"
      tema="superadmin"
    >
      {children}
    </ShellPanelLateral>
  );
}
