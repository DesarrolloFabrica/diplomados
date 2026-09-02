import Link from "next/link";
import { ArrowRight, LockKeyhole, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASE_HERO_PANEL, CLASE_PANEL_GLASS } from "@/config/paneles-glass";
import type { ItemRutaContenido, ProximosContenidosResultado } from "@/lib/ruta-curso";
import { MiniaturaContenido } from "@/components/shared/miniatura-contenido";

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
  const contenido = (
    <>
      <MiniaturaContenido
        portadaUrl={item.portadaUrl}
        portadaCursoUrl={portadaCursoUrl}
        titulo={item.titulo}
        tipo={item.tipo}
        categoriasContenido={item.categoriasContenido}
        variante="grande"
        className="sm:min-h-[120px]"
      />

      <div className="flex min-w-0 flex-col justify-center gap-2 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
          <span className="rounded-full bg-white/15 px-2 py-0.5 font-medium">{item.etiquetaTipo}</span>
          {item.duracionTexto && (
            <span className="font-medium tabular-nums">{item.duracionTexto}</span>
          )}
          {item.bloqueado && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-200">
              <LockKeyhole className="h-3.5 w-3.5" />
              Bloqueado
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold leading-snug text-white">{item.titulo}</h3>
        <p className="text-sm text-white/70">
          Módulo {item.moduloIndice + 1}: {item.moduloTitulo}
        </p>
      </div>

      <div className="flex items-center justify-end p-4 sm:p-5">
        {!item.bloqueado && (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white group-hover:text-[#061120]">
            <ArrowRight className="h-5 w-5" />
          </span>
        )}
      </div>
    </>
  );

  const clases = cn(
    "group grid overflow-hidden rounded-[24px] transition-[border-color,box-shadow,transform]",
    CLASE_PANEL_GLASS,
    "hover:-translate-y-0.5 hover:border-white/65 hover:shadow-[0_18px_48px_rgba(6,17,32,0.24),inset_0_1px_0_rgba(255,255,255,0.5)]",
    "sm:grid-cols-[190px_minmax(0,1fr)_auto]",
    item.bloqueado && "cursor-not-allowed opacity-75 hover:translate-y-0 hover:border-white/45 hover:shadow-none",
  );

  if (item.bloqueado) {
    return <div className={clases}>{contenido}</div>;
  }

  return (
    <Link href={item.href} className={clases}>
      {contenido}
    </Link>
  );
}

function FilaCompacta({
  item,
  portadaCursoUrl,
}: {
  item: ItemRutaContenido;
  portadaCursoUrl: string | null;
}) {
  const contenido = (
    <>
      <MiniaturaContenido
        portadaUrl={item.portadaUrl}
        portadaCursoUrl={portadaCursoUrl}
        titulo={item.titulo}
        tipo={item.tipo}
        categoriasContenido={item.categoriasContenido}
        variante="compacta"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{item.titulo}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/70">
          <span>{item.etiquetaTipo}</span>
          {item.duracionTexto && (
            <span className="tabular-nums">· {item.duracionTexto}</span>
          )}
          {item.bloqueado && (
            <span className="inline-flex items-center gap-1 text-amber-200">
              <LockKeyhole className="h-3 w-3" />
              Bloqueado
            </span>
          )}
        </p>
      </div>
    </>
  );

  const clases = cn(
    "flex items-center gap-3 rounded-[20px] px-3 py-2.5 transition-colors",
    CLASE_HERO_PANEL,
    !item.bloqueado && "hover:border-white/55 hover:bg-white/24",
    item.bloqueado && "cursor-not-allowed opacity-70",
  );

  if (item.bloqueado) {
    return <div className={clases}>{contenido}</div>;
  }

  return (
    <Link href={item.href} className={clases}>
      {contenido}
    </Link>
  );
}

export function ProximosContenidos({
  portadaCursoUrl,
  proximos,
}: ProximosContenidosProps) {
  const { etiqueta, principal, secundarios, cursoCompletado } = proximos;

  if (cursoCompletado) {
    return (
      <section className="mt-10 border-t border-white/20 pt-8">
        <div className={cn("rounded-[24px] px-5 py-6", CLASE_PANEL_GLASS)}>
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h2 className="text-lg font-bold text-white">¡Has llegado al final del curso!</h2>
              <p className="mt-1 text-sm text-white/75">
                No hay más contenidos por revisar en este recorrido.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!principal) return null;

  return (
    <section className="mt-10 border-t border-white/20 pt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          {etiqueta && (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#91DC00]">
              {etiqueta}
            </p>
          )}
          <h2 className="mt-1 text-xl font-bold text-white">Continúa tu aprendizaje</h2>
        </div>
      </div>

      <div className="space-y-5">
        <TarjetaPrincipal item={principal} portadaCursoUrl={portadaCursoUrl} />

        {secundarios.length > 0 && (
          <div className="hidden md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
              Después
            </p>
            <div className="space-y-2">
              {secundarios.slice(0, 2).map((item) => (
                <FilaCompacta
                  key={`${item.tipo}-${item.id}`}
                  item={item}
                  portadaCursoUrl={portadaCursoUrl}
                />
              ))}
              {secundarios[2] && (
                <div className="hidden lg:block">
                  <FilaCompacta item={secundarios[2]} portadaCursoUrl={portadaCursoUrl} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
