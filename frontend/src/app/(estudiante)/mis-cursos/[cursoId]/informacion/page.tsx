import { notFound, redirect } from "next/navigation";
import { BookOpen, Clock3, GraduationCap, Layers3, Target } from "lucide-react";
import { PortadaCurso } from "@/components/shared/portada-curso";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { ETIQUETAS_ESCUELA_VISUAL } from "@backend/config/escuelas";
import { cargarVistaCursoColaborador } from "@backend/server/queries/mis-cursos";
import { CtaCurso } from "./cta-curso";

interface InformacionCursoPageProps {
  params: Promise<{ cursoId: string }>;
}

const ETIQUETAS_NIVEL = {
  basico: "Nivel básico",
  intermedio: "Nivel intermedio",
  avanzado: "Nivel avanzado",
} as const;

function formatearDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

export default async function InformacionCursoPage({ params }: InformacionCursoPageProps) {
  const { cursoId } = await params;
  const sesion = await requerirSesion();
  const vista = await cargarVistaCursoColaborador(sesion.id, cursoId);

  if (!vista) notFound();

  const { curso, modulos, inscripcion } = vista;
  if (inscripcion) redirect(`/mis-cursos/${cursoId}`);

  const tipoPrograma = curso.esDiplomado ? "Diplomado" : "Curso";
  const escuela = ETIQUETAS_ESCUELA_VISUAL[curso.escuela];

  return (
    <main className="-mx-5 -mb-14 -mt-5 min-h-screen overflow-hidden bg-[#061120] text-white sm:-mx-6 sm:-mt-6 lg:-mx-8 lg:-mt-8">
      <section className="relative min-h-[540px] sm:min-h-[580px] lg:min-h-[620px]">
        <PortadaCurso
          cursoId={curso.id}
          imagenPortadaUrl={curso.imagenPortadaUrl}
          esDiplomado={curso.esDiplomado}
          titulo={curso.titulo}
          alt={`Portada de ${curso.titulo}`}
          fallback="abstract"
          sizes="100vw"
          className="absolute inset-0"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,17,32,0.98)_0%,rgba(6,17,32,0.88)_35%,rgba(6,17,32,0.42)_67%,rgba(6,17,32,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#061120_0%,rgba(6,17,32,0.18)_42%,rgba(6,17,32,0.22)_100%)]" />

        <div className="relative mx-auto flex min-h-[540px] max-w-7xl items-end px-5 pb-12 pt-24 sm:min-h-[580px] sm:px-8 sm:pb-14 lg:min-h-[620px] lg:px-12 lg:pb-16">
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase text-[#83E6D4]">
              {tipoPrograma} · {escuela}
            </p>
            <h1 className="mt-4 max-w-3xl font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              {curso.titulo}
            </h1>
            {curso.descripcion && (
              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-white/82 sm:text-lg">
                {curso.descripcion}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-white/88">
              {curso.duracionEstimadaMin !== null && (
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="size-4 text-[#83E6D4]" aria-hidden="true" />
                  {formatearDuracion(curso.duracionEstimadaMin)}
                </span>
              )}
              <span className="inline-flex items-center gap-2">
                <GraduationCap className="size-4 text-[#83E6D4]" aria-hidden="true" />
                {ETIQUETAS_NIVEL[curso.nivelDificultad]}
              </span>
              <span className="inline-flex items-center gap-2">
                <Layers3 className="size-4 text-[#83E6D4]" aria-hidden="true" />
                {modulos.length} {modulos.length === 1 ? "módulo" : "módulos"}
              </span>
            </div>

            <CtaCurso
              cursoId={curso.id}
              inscrito={false}
              className="mt-7 w-full sm:w-auto"
            />
          </div>
        </div>
      </section>

      <section className="bg-[#f2f8f6] text-[#102C49]">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:gap-20 lg:px-12 lg:py-20">
          <div>
            <p className="text-xs font-extrabold uppercase text-[#287f75]">El programa</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              Sobre este {curso.esDiplomado ? "diplomado" : "curso"}
            </h2>
            {curso.descripcion && (
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#365E68] sm:text-lg">
                {curso.descripcion}
              </p>
            )}

            {curso.objetivo && (
              <div className="mt-10 border-l-2 border-[#2BAF9B] pl-5 sm:pl-7">
                <div className="flex items-center gap-3">
                  <Target className="size-5 text-[#287f75]" aria-hidden="true" />
                  <h3 className="font-display text-xl font-extrabold">Objetivo</h3>
                </div>
                <p className="mt-3 leading-7 text-[#365E68]">{curso.objetivo}</p>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <BookOpen className="size-5 text-[#287f75]" aria-hidden="true" />
              <h2 className="font-display text-2xl font-extrabold">Contenido del programa</h2>
            </div>
            {modulos.length > 0 ? (
              <ol className="mt-6 border-t border-[#102C49]/15">
                {modulos.map((modulo, indice) => (
                  <li key={modulo.id} className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-[#102C49]/15 py-5">
                    <span className="font-display text-sm font-extrabold text-[#287f75]">
                      {String(indice + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-display font-extrabold leading-6">{modulo.titulo}</h3>
                      {modulo.descripcion && (
                        <p className="mt-2 text-sm leading-6 text-[#365E68]">{modulo.descripcion}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-6 text-sm text-[#365E68]">El contenido será publicado próximamente.</p>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0b2630]">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 px-5 py-12 sm:px-8 md:flex-row md:items-center lg:px-12">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase text-[#83E6D4]">{tipoPrograma}</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl">
              Empieza tu recorrido
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/70">{curso.titulo}</p>
          </div>
          <CtaCurso
            cursoId={curso.id}
            inscrito={false}
            className="w-full shrink-0 sm:w-auto"
          />
        </div>
      </section>
    </main>
  );
}
