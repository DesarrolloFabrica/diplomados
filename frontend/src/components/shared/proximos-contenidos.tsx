import Link from "next/link";
import { ArrowRight, LockKeyhole, PartyPopper } from "lucide-react";
import { CLASE_PANEL_GLASS_LEGIBLE } from "@/config/paneles-glass";
import {
  IconoTipoContenido,
  MiniaturaContenido,
} from "@/components/shared/miniatura-contenido";
import type { ItemRutaContenido, ProximosContenidosResultado } from "@/lib/ruta-curso";
import { cn } from "@/lib/utils";

interface ProximosContenidosProps {
  portadaCursoUrl: string | null;
  proximos: ProximosContenidosResultado;
}

function TarjetaPrincipal({
  item,
  portadaCursoUrl,
}: {
  item: ItemRutaContenido;
  portadaCursoUrl: string | null;
}) {
  const esEvaluacion = item.tipo === "evaluacion";
  const etiquetaSeccion = esEvaluacion ? "Siguiente desafio" : "Siguiente clase";
  const etiquetaContenido = esEvaluacion ? "Evaluacion" : item.etiquetaTipo;

  const contenido = (
    <>
      <MiniaturaContenido
        portadaUrl={item.portadaUrl}
        portadaCursoUrl={esEvaluacion ? null : portadaCursoUrl}
        titulo={item.titulo}
        tipo={item.tipo}
        categoriasContenido={item.categoriasContenido}
        variante="grande"
        className={cn(
          "min-h-[180px] sm:min-h-[190px]",
          esEvaluacion &&
            "bg-[linear-gradient(135deg,rgba(216,168,59,0.28),rgba(6,17,32,0.74))] text-amber-200",
        )}
      />

      <div className="flex min-w-0 flex-col justify-center p-5 sm:px-7 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold backdrop-blur-md",
              esEvaluacion
                ? "border-amber-300/45 bg-amber-300/20 text-amber-100"
                : "border-teal-200/40 bg-teal-300/20 text-teal-50",
            )}
          >
            <IconoTipoContenido
              tipo={item.tipo}
              categoriasContenido={item.categoriasContenido}
              className="size-3.5"
            />
            {etiquetaContenido}
          </span>

          {item.bloqueado && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-100">
              <LockKeyhole className="size-3.5" aria-hidden="true" />
              Bloqueado
            </span>
          )}
        </div>

        <h3 className="mt-3 max-w-3xl font-display text-xl font-extrabold leading-snug text-white sm:text-2xl">
          {item.titulo}
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-medium text-white">
          <span>Modulo {item.moduloIndice + 1}</span>
          <span aria-hidden="true" className="text-white/70">
            &middot;
          </span>
          <span>{item.moduloTitulo}</span>
          {item.duracionTexto && (
            <>
              <span aria-hidden="true" className="text-white/70">
                &middot;
              </span>
              <span className="tabular-nums">{item.duracionTexto}</span>
            </>
          )}
        </p>
      </div>

      <div className="flex items-center justify-end px-5 pb-5 sm:px-6 sm:py-6">
        <span
          className={cn(
            "inline-flex size-12 items-center justify-center rounded-full border shadow-[0_10px_24px_rgba(6,17,32,0.22)] transition-[transform,background-color,border-color] duration-300",
            item.bloqueado
              ? "border-white/20 bg-white/10 text-white/45"
              : esEvaluacion
                ? "border-amber-200/70 bg-amber-300 text-[#32230A] group-hover:bg-amber-200"
                : "border-white/70 bg-white text-[#061120] group-hover:bg-[#91DC00]",
          )}
        >
          {item.bloqueado ? (
            <LockKeyhole className="size-5" aria-hidden="true" />
          ) : (
            <ArrowRight
              className="size-5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            />
          )}
        </span>
      </div>
    </>
  );

  const clases = cn(
    "group grid w-full overflow-hidden rounded-[24px] border bg-[#061120]/48 shadow-[0_16px_46px_rgba(6,17,32,0.2),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300",
    "sm:grid-cols-[minmax(190px,28%)_minmax(0,1fr)_84px]",
    esEvaluacion
      ? "border-amber-300/40 bg-[#261F13]/55 hover:border-amber-200/70 hover:shadow-[0_20px_54px_rgba(92,62,10,0.28),inset_0_1px_0_rgba(255,244,194,0.2)]"
      : "border-white/30 hover:border-white/60 hover:shadow-[0_20px_54px_rgba(6,17,32,0.28),inset_0_1px_0_rgba(255,255,255,0.24)]",
    !item.bloqueado &&
      "hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#061120]",
    item.bloqueado && "cursor-not-allowed opacity-75",
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-white/75">
        {etiquetaSeccion}
      </p>

      {item.bloqueado ? (
        <div className={clases} aria-label={`${etiquetaSeccion}: ${item.titulo}`}>
          {contenido}
        </div>
      ) : (
        <Link
          href={item.href}
          aria-label={`${etiquetaSeccion}: ${item.titulo}`}
          className={clases}
        >
          {contenido}
        </Link>
      )}
    </div>
  );
}

export function ProximosContenidos({
  portadaCursoUrl,
  proximos,
}: ProximosContenidosProps) {
  const { principal, cursoCompletado } = proximos;

  if (cursoCompletado) {
    return (
      <section className="mt-6 border-t border-white/20 pt-5">
        <div className={cn("rounded-[24px] px-5 py-6", CLASE_PANEL_GLASS_LEGIBLE)}>
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold text-slate-950">Has completado el curso</h2>
              <p className="mt-1 text-sm text-slate-600">
                No hay mas contenidos por revisar en este recorrido.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!principal) return null;

  return (
    <section className="mt-8 border-t border-white/20 pt-6">
      <TarjetaPrincipal item={principal} portadaCursoUrl={portadaCursoUrl} />
    </section>
  );
}
