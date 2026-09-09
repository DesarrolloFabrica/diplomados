"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  enviarIntento,
  iniciarIntento,
  obtenerPreguntasDeIntento,
} from "@backend/server/actions/evaluacion-colaborador";
import type { PreguntaPresentacion } from "@backend/server/queries/evaluacion-colaborador";

interface PresentarEvaluacionProps {
  titulo: string;
  descripcion?: string | null;
  cursoId: string;
  evaluacionId: string;
  inscripcionId: string;
  intentoInicial: string | null;
  intentosUsados: number;
  maxIntentos: number;
  puntajeMinimo: number;
}

export function PresentarEvaluacion({
  titulo,
  descripcion,
  cursoId,
  evaluacionId,
  inscripcionId,
  intentoInicial,
  intentosUsados,
  maxIntentos,
  puntajeMinimo,
}: PresentarEvaluacionProps) {
  const router = useRouter();
  const [intentoId, setIntentoId] = useState(intentoInicial);
  const [preguntas, setPreguntas] = useState<PreguntaPresentacion[] | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [resultado, setResultado] = useState<{
    puntaje: number;
    aprobado: boolean;
  } | null>(null);
  const [preguntaActual, setPreguntaActual] = useState(0);
  const [direccion, setDireccion] = useState<"adelante" | "atras">("adelante");
  const [enviando, iniciar] = useTransition();

  // El intento sigue siendo la semilla estable para la seleccion y el orden.
  useEffect(() => {
    if (!intentoId || preguntas) return;
    let cancelado = false;

    obtenerPreguntasDeIntento(intentoId).then((res) => {
      if (cancelado) return;
      if (!res.ok || !res.preguntas) {
        toast.error(res.mensaje ?? "No se pudieron cargar las preguntas");
        return;
      }
      setPreguntas(res.preguntas);
    });

    return () => {
      cancelado = true;
    };
  }, [intentoId, preguntas]);

  function comenzar() {
    iniciar(async () => {
      const res = await iniciarIntento(evaluacionId, inscripcionId);
      if (!res.ok || !res.intentoId) {
        toast.error(res.mensaje ?? "No se pudo iniciar el intento");
        return;
      }
      setIntentoId(res.intentoId);
    });
  }

  function enviar() {
    if (!intentoId || !preguntas) return;
    const listaRespuestas = Object.entries(respuestas).map(
      ([preguntaId, opcionId]) => ({
        preguntaId,
        opcionId,
      }),
    );

    if (listaRespuestas.length < preguntas.length) {
      toast.error("Responde todas las preguntas antes de enviar.");
      return;
    }

    iniciar(async () => {
      const res = await enviarIntento(
        cursoId,
        evaluacionId,
        intentoId,
        listaRespuestas,
      );
      if (!res.ok || res.puntaje === undefined) {
        toast.error(res.mensaje ?? "No se pudo enviar el intento");
        return;
      }
      setResultado({ puntaje: res.puntaje, aprobado: !!res.aprobado });
      router.refresh();
    });
  }

  function irAPregunta(indice: number) {
    if (!preguntas || indice < 0 || indice >= preguntas.length) return;
    setDireccion(indice >= preguntaActual ? "adelante" : "atras");
    setPreguntaActual(indice);
  }

  function volverAlCursoDesdeResultado() {
    const parametro = resultado?.aprobado
      ? "roadmapTransition"
      : "roadmapFocus";
    router.push(
      `/mis-cursos/${cursoId}?${parametro}=${encodeURIComponent(evaluacionId)}`,
      { scroll: false },
    );
  }

  if (resultado) {
    return (
      <section className="rounded-lg border border-white/15 bg-[#061120]/72 px-5 py-10 text-center text-white shadow-[0_20px_60px_rgba(2,10,24,0.34)] backdrop-blur-md sm:px-8">
        <div className="flex flex-col items-center gap-3">
          {resultado.aprobado ? (
            <CheckCircle2 className="h-10 w-10 text-[#91DC00]" />
          ) : (
            <XCircle className="h-10 w-10 text-red-300" />
          )}
          <p className="text-3xl font-bold">{Math.round(resultado.puntaje)}%</p>
          <p className="text-white/70">
            {resultado.aprobado
              ? "Aprobaste esta evaluacion."
              : `No alcanzaste el minimo de ${puntajeMinimo}% para aprobar.`}
          </p>
          <Button
            type="button"
            onClick={volverAlCursoDesdeResultado}
            className="mt-4 bg-[#91DC00] font-bold text-[#061120] hover:bg-[#a7eb2f]"
          >
            Volver al curso
          </Button>
        </div>
      </section>
    );
  }

  if (!intentoId) {
    if (intentosUsados >= maxIntentos) {
      return (
        <section className="rounded-lg border border-white/15 bg-[#061120]/70 px-5 py-10 text-center text-white/80 shadow-[0_20px_60px_rgba(2,10,24,0.3)] backdrop-blur-md">
          <p className="text-xs font-semibold uppercase text-teal-100/65">
            Evaluacion
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">
            {titulo}
          </h1>
          <p className="mt-5">
            Ya usaste tus {maxIntentos} intento(s) permitidos.
          </p>
        </section>
      );
    }

    return (
      <section className="rounded-lg border border-white/15 bg-[#061120]/70 px-5 py-8 text-white shadow-[0_20px_60px_rgba(2,10,24,0.3)] backdrop-blur-md sm:px-8 sm:py-10">
        <p className="text-xs font-semibold uppercase text-teal-100/65">
          Evaluacion
        </p>
        <h1 className="mt-2 max-w-3xl font-display text-2xl font-bold sm:text-3xl">
          {titulo}
        </h1>
        {descripcion && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/68">
            {descripcion}
          </p>
        )}
        <p className="mt-7 text-sm text-white/72">
          Intentos usados: {intentosUsados}/{maxIntentos}. Necesitas{" "}
          {puntajeMinimo}% para aprobar.
        </p>
        <Button
          onClick={comenzar}
          disabled={enviando}
          className="mt-4 bg-[#91DC00] font-bold text-[#061120] hover:bg-[#a7eb2f]"
        >
          {enviando && <Loader2 className="animate-spin" />}
          Comenzar intento
        </Button>
      </section>
    );
  }

  if (!preguntas) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-white/15 bg-[#061120]/65 py-16 text-white/78 backdrop-blur-md">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando preguntas...
      </div>
    );
  }

  if (preguntas.length === 0) {
    return (
      <div className="rounded-lg border border-white/15 bg-[#061120]/70 px-5 py-12 text-center text-white/75 backdrop-blur-md">
        Esta evaluacion no tiene preguntas disponibles.
      </div>
    );
  }

  const pregunta = preguntas[preguntaActual]!;
  const respondidas = preguntas.filter((item) =>
    Boolean(respuestas[item.id]),
  ).length;
  const esUltimaPregunta = preguntaActual === preguntas.length - 1;

  return (
    <section className="overflow-hidden rounded-lg border border-white/15 bg-[#061120]/72 p-4 text-white shadow-[0_24px_70px_rgba(2,10,24,0.38)] backdrop-blur-md sm:p-7 lg:p-8">
      <header>
        <div className="flex min-w-0 items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-teal-100/70">
              Pregunta {preguntaActual + 1} de {preguntas.length}
            </p>
            <p className="mt-1 text-[11px] font-medium text-white/48">
              {respondidas} de {preguntas.length} respondidas
            </p>
          </div>
          <p className="max-w-[50%] truncate text-right text-xs font-semibold text-white/60">
            {titulo}
          </p>
        </div>

        <div
          className="mt-4 flex w-full gap-1.5 overflow-x-auto pb-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/25"
          aria-label="Progreso de la evaluacion"
        >
          {preguntas.map((item, indice) => {
            const actual = indice === preguntaActual;
            const respondida = Boolean(respuestas[item.id]);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => irAPregunta(indice)}
                aria-label={`Ir a la pregunta ${indice + 1}${
                  respondida ? ", respondida" : ""
                }`}
                aria-current={actual ? "step" : undefined}
                className={cn(
                  "h-2 min-w-6 flex-1 rounded-full border border-transparent transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#91DC00]",
                  actual
                    ? "bg-[#91DC00] shadow-[0_0_12px_rgba(145,220,0,0.65)]"
                    : respondida
                      ? "bg-teal-200/85 hover:bg-teal-100"
                      : "bg-white/18 hover:bg-white/30",
                )}
              />
            );
          })}
        </div>
      </header>

      <div
        key={pregunta.id}
        className={cn(
          "mt-6 motion-reduce:animate-none sm:mt-8",
          direccion === "adelante"
            ? "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-3 motion-safe:duration-300"
            : "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-3 motion-safe:duration-300",
        )}
      >
        <h1 className="max-w-3xl font-display text-xl font-bold leading-snug text-white sm:text-2xl">
          <span className="mr-2 text-[#a7eb2f]">{preguntaActual + 1}.</span>
          {pregunta.enunciado}
        </h1>

        <div className="mt-7 space-y-2.5 sm:mt-8">
          {pregunta.opciones.map((opcion, indiceOpcion) => {
            const seleccionada = respuestas[pregunta.id] === opcion.id;
            const etiqueta =
              indiceOpcion < 26
                ? String.fromCharCode(65 + indiceOpcion)
                : String(indiceOpcion + 1);

            return (
              <label
                key={opcion.id}
                className={cn(
                  "group flex min-h-14 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm transition-all duration-200 sm:gap-4 sm:px-4",
                  "motion-reduce:transform-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#91DC00]",
                  seleccionada
                    ? "translate-x-0.5 border-[#91DC00]/85 bg-[#91DC00]/12 text-white shadow-[0_0_20px_rgba(145,220,0,0.12)]"
                    : "border-white/15 bg-white/7 text-white/78 hover:translate-x-0.5 hover:border-teal-200/45 hover:bg-white/12 hover:text-white",
                )}
              >
                <input
                  type="radio"
                  name={pregunta.id}
                  checked={seleccionada}
                  onChange={() =>
                    setRespuestas((prev) => ({
                      ...prev,
                      [pregunta.id]: opcion.id,
                    }))
                  }
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-colors",
                    seleccionada
                      ? "border-[#b4f044] bg-[#91DC00] text-[#061120]"
                      : "border-white/20 bg-white/8 text-white/65 group-hover:border-teal-100/45 group-hover:text-white",
                  )}
                >
                  {etiqueta}
                </span>
                <span className="min-w-0 leading-relaxed">{opcion.texto}</span>
              </label>
            );
          })}
        </div>
      </div>

      <footer className="mt-7 grid grid-cols-2 gap-3 border-t border-white/12 pt-5 sm:mt-9">
        <button
          type="button"
          onClick={() => irAPregunta(preguntaActual - 1)}
          disabled={preguntaActual === 0 || enviando}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/8 px-3 text-sm font-semibold text-white/80 backdrop-blur-sm transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-35 max-sm:text-xs"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Anterior
        </button>
        <button
          type="button"
          onClick={() =>
            esUltimaPregunta
              ? enviar()
              : irAPregunta(preguntaActual + 1)
          }
          disabled={enviando}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#91DC00] px-3 text-center text-sm font-bold text-[#061120] shadow-[0_8px_24px_rgba(145,220,0,0.18)] transition-colors hover:bg-[#a7eb2f] disabled:cursor-not-allowed disabled:opacity-60 max-sm:text-xs"
        >
          {enviando ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : esUltimaPregunta ? (
            "Finalizar evaluacion"
          ) : (
            <>
              <span>Siguiente pregunta</span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </>
          )}
        </button>
      </footer>
    </section>
  );
}
