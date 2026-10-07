import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Clock3,
  FileQuestion,
  GraduationCap,
  Layers3,
  Lock,
  PlayCircle,
  Target,
} from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { ETIQUETAS_ESCUELA_VISUAL } from "@backend/config/escuelas";
import { cargarVistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import { obtenerPreferenciaInterfazUsuario } from "@backend/server/queries/preferencia-interfaz";
import { asignarEvaluacionesPorModulo } from "@/lib/ruta-curso";
import { cn } from "@/lib/utils";
import { CtaCurso } from "./cta-curso";
import { obtenerPreviewCursoPorTitulo } from "./preview-config";
import { PreviewCurso } from "./preview-curso";

interface InformacionCursoPageProps {
  params: Promise<{ cursoId: string }>;
}

const ETIQUETAS_NIVEL = {
  basico: "Basico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
} as const;

function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} horas` : `${horas} h ${resto} min`;
}

function resumirTexto(texto: string | null | undefined, max = 230): string | null {
  if (!texto) return null;
  const limpio = texto.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.lastIndexOf(" ", max);
  return `${limpio.slice(0, corte > 120 ? corte : max).trim()}...`;
}

function derivarAprendizajes(...fuentes: Array<string | null | undefined>): string[] {
  const segmentos = fuentes
    .flatMap((fuente) =>
      (fuente ?? "")
        .split(/\n|;|(?:\.\s+)/)
        .map((item) => item.replace(/^[-*•\d.)\s]+/, "").trim())
        .filter((item) => item.length >= 28 && item.length <= 180),
    )
    .filter((item, indice, lista) => lista.indexOf(item) === indice);

  if (segmentos.length < 4) return [];
  return segmentos.slice(0, 6);
}

function etiquetaTipoCurso(esDiplomado: boolean) {
  return esDiplomado ? "Diplomado" : "Curso";
}

function claseEstadoNodo({
  inscrito,
  completado,
  bloqueado,
}: {
  inscrito: boolean;
  completado: boolean;
  bloqueado: boolean;
}) {
  if (!inscrito) {
    return "border-[var(--interface-border)] bg-[var(--interface-surface)] text-[var(--interface-text-muted)]";
  }
  if (completado) {
    return "border-[var(--interface-accent)] bg-[color-mix(in_srgb,var(--interface-accent)_12%,transparent)] text-[var(--interface-text)]";
  }
  if (bloqueado) {
    return "border-[var(--interface-border)] bg-[var(--interface-surface)] text-[var(--interface-text-muted)] opacity-70";
  }
  return "border-[var(--interface-accent-secondary)] bg-[color-mix(in_srgb,var(--interface-accent-secondary)_12%,transparent)] text-[var(--interface-text)]";
}

export default async function InformacionCursoPage({ params }: InformacionCursoPageProps) {
  const { cursoId } = await params;
  const sesion = await requerirSesion();
  const [vista, preferenciaInterfaz] = await Promise.all([
    cargarVistaCursoColaborador(sesion.id, cursoId),
    obtenerPreferenciaInterfazUsuario(sesion.id),
  ]);

  if (!vista) notFound();

  const { curso, modulosConLecciones, inscripcion, evaluaciones } = vista;
  // La interfaz creativa tiene un fondo siempre oscuro (sin versión clara),
  // pero el tema global (claro/oscuro) sí trae una regla que oscurece el
  // texto en modo claro — pensada para otras pantallas, no para esta, que
  // sigue siendo oscura siempre. Sin este ajuste, con el tema del sitio en
  // claro el texto queda oscuro sobre fondo oscuro. Se fija explícitamente
  // en vez de tocar el token compartido (lo usan otras pantallas que sí
  // dependen de ese comportamiento).
  const esCreativa =
    !preferenciaInterfaz?.interfaceVariant || preferenciaInterfaz.interfaceVariant === "creative";
  const estiloTextoCreativa: CSSProperties | undefined = esCreativa
    ? ({
        "--interface-text": "#ffffff",
        "--interface-text-muted": "rgba(255, 255, 255, 0.72)",
      } as CSSProperties)
    : undefined;
  const inscrito = Boolean(inscripcion);
  const completado = inscripcion?.estado === "finalizado";
  const tipoPrograma = etiquetaTipoCurso(curso.esDiplomado);
  const escuela = ETIQUETAS_ESCUELA_VISUAL[curso.escuela];
  const cantidadClases = modulosConLecciones.reduce(
    (total, modulo) => total + modulo.lecciones.length,
    0,
  );
  // Mismo destino que el resto de CTAs "Continuar" de la app (hero del
  // catálogo, etc.): la página /mis-cursos/[cursoId] ya resuelve el nodo
  // activo real del roadmap — no se reimplementa esa lógica aquí saltando
  // directo a `ultimaLeccionId`, que podría apuntar a una lección ya
  // completada en vez de la siguiente pendiente real.
  const hrefContinuar = `/mis-cursos/${curso.id}`;
  const descripcionHero = resumirTexto(curso.descripcion);
  const aprendizajes = derivarAprendizajes(curso.objetivo, curso.descripcion);
  const preview = obtenerPreviewCursoPorTitulo(curso.titulo);
  const evaluacionesPorModulo = asignarEvaluacionesPorModulo(
    evaluaciones,
    modulosConLecciones.length,
  );
  const chips = [
    curso.duracionEstimadaMin !== null
      ? {
          icono: Clock3,
          texto: formatearDuracion(curso.duracionEstimadaMin),
        }
      : null,
    { icono: GraduationCap, texto: ETIQUETAS_NIVEL[curso.nivelDificultad] },
    modulosConLecciones.length > 0
      ? {
          icono: Layers3,
          texto: `${modulosConLecciones.length} ${
            modulosConLecciones.length === 1 ? "modulo" : "modulos"
          }`,
        }
      : null,
    cantidadClases > 0
      ? {
          icono: PlayCircle,
          texto: `${cantidadClases} ${cantidadClases === 1 ? "clase" : "clases"}`,
        }
      : null,
  ].filter(Boolean) as Array<{ icono: typeof Clock3; texto: string }>;

  let previoCompletado = true;

  return (
    <main
      className="-mx-5 -mb-14 -mt-5 min-h-screen overflow-hidden bg-[var(--interface-bg)] text-[var(--interface-text)] sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8"
      style={estiloTextoCreativa}
    >
      <section className="relative isolate overflow-hidden">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          alt={`Portada de ${curso.titulo}`}
          fallback="abstract"
          sizes="100vw"
          className="absolute inset-0 -z-20"
        />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(6,17,32,0.98)_0%,rgba(6,17,32,0.9)_38%,rgba(6,17,32,0.52)_68%,rgba(6,17,32,0.18)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,#061120_0%,rgba(6,17,32,0.18)_46%,rgba(6,17,32,0.24)_100%)]" />

        <div className="mx-auto grid min-h-[720px] max-w-7xl items-end gap-8 px-5 pb-14 pt-24 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.78fr)] lg:px-12 lg:pb-20">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--interface-accent-secondary,#83E6D4)]">
              {tipoPrograma} · {escuela}
            </p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              {curso.titulo}
            </h1>
            {descripcionHero && (
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/90 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:text-lg">
                {descripcionHero}
              </p>
            )}

            {chips.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-3">
                {chips.map(({ icono: Icono, texto }) => (
                  <span
                    key={texto}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 text-sm font-bold text-white/90 backdrop-blur-md"
                  >
                    <Icono
                      className="size-4 text-[var(--interface-accent-secondary,#83E6D4)]"
                      aria-hidden="true"
                    />
                    {texto}
                  </span>
                ))}
              </div>
            )}

            {completado && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--interface-accent-secondary)] bg-[color-mix(in_srgb,var(--interface-accent-secondary)_16%,transparent)] px-4 py-2 text-sm font-bold text-white">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                Completado
              </p>
            )}

            <CtaCurso
              cursoId={curso.id}
              inscrito={inscrito}
              completado={completado}
              hrefContinuar={hrefContinuar}
              preview={preview}
              sobreImagen
              className="mt-7"
            />
          </div>

          <div className="hidden overflow-hidden rounded-[32px] border border-white/20 bg-white/10 p-3 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-md lg:block">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[24px] bg-[#061120]">
              <PortadaCurso
                cursoId={curso.id}
                imagenPortadaUrl={curso.imagenPortadaUrl}
                esDiplomado={curso.esDiplomado}
                titulo={curso.titulo}
                alt=""
                fallback="abstract"
                sizes="420px"
                className="absolute inset-0"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--interface-bg)]">
        <div className="mx-auto max-w-7xl space-y-12 px-5 py-14 sm:px-8 lg:px-12 lg:py-20">
          {aprendizajes.length > 0 && (
            <section className="rounded-[28px] border border-[var(--interface-border)] bg-[var(--interface-surface)] p-6 [box-shadow:var(--interface-shadow)] backdrop-blur-md sm:p-8">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--interface-accent-secondary)]">
                Que aprenderas
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {aprendizajes.map((item) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-4"
                  >
                    <Check className="mt-0.5 size-5 shrink-0 text-[var(--interface-accent)]" aria-hidden="true" />
                    <p className="text-sm leading-6 text-[var(--interface-text-muted)]">{item}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {preview && <PreviewCurso cursoId={curso.id} preview={preview} />}

          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.36fr)]">
            <div className="rounded-[28px] border border-[var(--interface-border)] bg-[var(--interface-surface)] p-5 [box-shadow:var(--interface-shadow)] backdrop-blur-md sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--interface-accent-secondary)]">
                    Temario
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-extrabold text-[var(--interface-text)]">
                    Contenido del {curso.esDiplomado ? "diplomado" : "curso"}
                  </h2>
                </div>
                {inscrito ? (
                  <span className="text-sm font-bold text-[var(--interface-text-muted)]">Mapa real de avance</span>
                ) : (
                  <span className="text-sm font-bold text-[var(--interface-text-muted)]">
                    Inscribete para acceder a las clases
                  </span>
                )}
              </div>

              {modulosConLecciones.length > 0 ? (
                <ol className="mt-8 space-y-5">
                  {modulosConLecciones.map((modulo, indiceModulo) => {
                    const evaluacionesModulo = evaluacionesPorModulo[indiceModulo] ?? [];
                    const totalContenido =
                      modulo.lecciones.length + (evaluacionesModulo.length > 0 ? 1 : 0);

                    return (
                      <li
                        key={modulo.id}
                        className="rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface-strong)] p-5"
                      >
                        <div className="grid gap-4 sm:grid-cols-[3rem_1fr_auto] sm:items-start">
                          <span className="font-display text-xl font-extrabold text-[var(--interface-accent-secondary)]">
                            {String(indiceModulo + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <h3 className="font-display text-xl font-extrabold text-[var(--interface-text)]">
                              {modulo.titulo}
                            </h3>
                            {modulo.descripcion && (
                              <p className="mt-2 text-sm leading-6 text-[var(--interface-text-muted)]">
                                {modulo.descripcion}
                              </p>
                            )}
                          </div>
                          {totalContenido > 0 && (
                            <span className="rounded-full border border-[var(--interface-border)] bg-[var(--interface-surface)] px-3 py-1 text-xs font-bold text-[var(--interface-text-muted)]">
                              {totalContenido} contenidos
                            </span>
                          )}
                        </div>

                        <div className="mt-5 space-y-2">
                          {modulo.lecciones.map((leccion) => {
                            const bloqueado = curso.navegacion === "obligatoria" && !previoCompletado;
                            const completada = leccion.completada;
                            previoCompletado = leccion.completada;
                            const contenido = (
                              <span
                                className={cn(
                                  "flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition-colors",
                                  claseEstadoNodo({ inscrito, completado: completada, bloqueado }),
                                  inscrito &&
                                    !bloqueado &&
                                    "hover:border-[var(--interface-accent-secondary)] hover:bg-[color-mix(in_srgb,var(--interface-accent-secondary)_14%,transparent)] hover:text-[var(--interface-text)]",
                                )}
                              >
                                {completada ? (
                                  <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                                ) : !inscrito || bloqueado ? (
                                  <Lock className="size-4 shrink-0" aria-hidden="true" />
                                ) : (
                                  <PlayCircle className="size-4 shrink-0" aria-hidden="true" />
                                )}
                                <span className="min-w-0 flex-1 truncate">{leccion.titulo}</span>
                                <span className="hidden text-xs font-bold uppercase text-current/62 sm:inline">
                                  Clase
                                </span>
                              </span>
                            );

                            return inscrito && !bloqueado ? (
                              <Link
                                key={leccion.id}
                                href={`/mis-cursos/${curso.id}/lecciones/${leccion.id}`}
                              >
                                {contenido}
                              </Link>
                            ) : (
                              <div key={leccion.id}>{contenido}</div>
                            );
                          })}

                          {evaluacionesModulo.length > 0 &&
                            (() => {
                              const bloqueado = curso.navegacion === "obligatoria" && !previoCompletado;
                              const completada = evaluacionesModulo.every((e) => e.aprobado);
                              previoCompletado = completada;
                              const primeraPendiente =
                                evaluacionesModulo.find((e) => !e.aprobado) ?? evaluacionesModulo[0]!;
                              const contenido = (
                                <span
                                  className={cn(
                                    "flex min-h-11 items-center gap-3 rounded-xl border px-3 text-sm font-semibold transition-colors",
                                    claseEstadoNodo({ inscrito, completado: completada, bloqueado }),
                                    inscrito &&
                                      !bloqueado &&
                                      "hover:border-[var(--interface-accent-secondary)] hover:bg-[color-mix(in_srgb,var(--interface-accent-secondary)_14%,transparent)] hover:text-[var(--interface-text)]",
                                  )}
                                >
                                  {completada ? (
                                    <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
                                  ) : !inscrito || bloqueado ? (
                                    <Lock className="size-4 shrink-0" aria-hidden="true" />
                                  ) : (
                                    <FileQuestion className="size-4 shrink-0" aria-hidden="true" />
                                  )}
                                  <span className="min-w-0 flex-1 truncate">Evaluacion</span>
                                </span>
                              );

                              return inscrito && !bloqueado ? (
                                <Link href={`/mis-cursos/${curso.id}/evaluaciones/${primeraPendiente.id}`}>
                                  {contenido}
                                </Link>
                              ) : (
                                <div>{contenido}</div>
                              );
                            })()}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <p className="mt-8 rounded-2xl border border-[var(--interface-border)] bg-[var(--interface-surface)] p-5 text-sm text-[var(--interface-text-muted)]">
                  El contenido sera publicado proximamente.
                </p>
              )}
            </div>

            {(curso.descripcion || curso.objetivo) && (
              <aside className="h-fit rounded-[28px] border border-[var(--interface-border)] bg-[var(--interface-surface)] p-6 [box-shadow:var(--interface-shadow)] backdrop-blur-md">
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--interface-accent-secondary)]">
                  Sobre este {curso.esDiplomado ? "diplomado" : "curso"}
                </p>
                {curso.descripcion && (
                  <p className="mt-4 text-sm leading-7 text-[var(--interface-text-muted)]">{curso.descripcion}</p>
                )}
                {curso.objetivo && (
                  <div className="mt-6 border-t border-[var(--interface-border)] pt-5">
                    <div className="flex items-center gap-2 text-[var(--interface-text)]">
                      <Target className="size-4 text-[var(--interface-accent)]" aria-hidden="true" />
                      <h3 className="font-display text-base font-extrabold">Objetivo</h3>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[var(--interface-text-muted)]">{curso.objetivo}</p>
                  </div>
                )}
              </aside>
            )}
          </section>
        </div>
      </section>

      <section className="border-t border-[var(--interface-border)] bg-[var(--interface-surface)]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--interface-accent-secondary)]">
              {inscrito ? "Continua tu aprendizaje" : "Listo para comenzar"}
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-[var(--interface-text)] sm:text-3xl">
              {curso.titulo}
            </h2>
          </div>
          <CtaCurso
            cursoId={curso.id}
            inscrito={inscrito}
            completado={completado}
            hrefContinuar={hrefContinuar}
            preview={preview}
            className="w-full shrink-0 sm:w-auto"
          />
        </div>
      </section>
    </main>
  );
}
