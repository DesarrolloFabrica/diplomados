import Link from "next/link";
import { ArrowRight, LockKeyhole, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
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
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{item.etiquetaTipo}</span>
          {item.duracionTexto && (
            <span className="font-medium tabular-nums">{item.duracionTexto}</span>
          )}
          {item.bloqueado && (
            <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
              <LockKeyhole className="h-3.5 w-3.5" />
              Bloqueado
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold leading-snug text-foreground">{item.titulo}</h3>
        <p className="text-sm text-muted-foreground">
          Módulo {item.moduloIndice + 1}: {item.moduloTitulo}
        </p>
      </div>

      <div className="flex items-center justify-end p-4 sm:p-5">
        {!item.bloqueado && (
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowRight className="h-5 w-5" />
          </span>
        )}
      </div>
    </>
  );

  const clases = cn(
    "group grid overflow-hidden rounded-2xl border border-border bg-card transition-[border-color,box-shadow,transform]",
    "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg",
    "sm:grid-cols-[190px_minmax(0,1fr)_auto]",
    item.bloqueado && "cursor-not-allowed opacity-75 hover:translate-y-0 hover:border-border hover:shadow-none",
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
        <p className="truncate text-sm font-medium text-foreground">{item.titulo}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{item.etiquetaTipo}</span>
          {item.duracionTexto && (
            <span className="tabular-nums">· {item.duracionTexto}</span>
          )}
          {item.bloqueado && (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <LockKeyhole className="h-3 w-3" />
              Bloqueado
            </span>
          )}
        </p>
      </div>
    </>
  );

  const clases = cn(
    "flex items-center gap-3 rounded-xl border border-border/70 bg-card/80 px-3 py-2.5 transition-colors",
    !item.bloqueado && "hover:border-primary/30 hover:bg-card",
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
      <section className="mt-10 border-t border-border/70 pt-8">
        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-5 py-6 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <div>
              <h2 className="text-lg font-bold text-foreground">¡Has llegado al final del curso!</h2>
              <p className="mt-1 text-sm text-muted-foreground">
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
    <section className="mt-10 border-t border-border/70 pt-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          {etiqueta && (
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {etiqueta}
            </p>
          )}
          <h2 className="mt-1 text-xl font-bold">Continúa tu aprendizaje</h2>
        </div>
      </div>

      <div className="space-y-5">
        <TarjetaPrincipal item={principal} portadaCursoUrl={portadaCursoUrl} />

        {secundarios.length > 0 && (
          <div className="hidden md:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
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
