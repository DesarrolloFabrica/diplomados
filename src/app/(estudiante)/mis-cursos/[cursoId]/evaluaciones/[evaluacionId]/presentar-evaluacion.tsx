"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  iniciarIntento,
  enviarIntento,
  obtenerPreguntasDeIntento,
} from "@/server/actions/evaluacion-colaborador";
import type { PreguntaPresentacion } from "@/server/queries/evaluacion-colaborador";

interface PresentarEvaluacionProps {
  cursoId: string;
  evaluacionId: string;
  inscripcionId: string;
  intentoInicial: string | null;
  intentosUsados: number;
  maxIntentos: number;
  puntajeMinimo: number;
}

export function PresentarEvaluacion({
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
  const [resultado, setResultado] = useState<{ puntaje: number; aprobado: boolean } | null>(null);
  const [enviando, iniciar] = useTransition();

  // Las preguntas se piden recién cuando hay un intento (nuevo o retomado):
  // el propio id del intento es la semilla de aleatorización en el
  // servidor, así que no tiene sentido pedirlas antes de que exista uno.
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
    const listaRespuestas = Object.entries(respuestas).map(([preguntaId, opcionId]) => ({
      preguntaId,
      opcionId,
    }));
    if (listaRespuestas.length < preguntas.length) {
      toast.error("Responde todas las preguntas antes de enviar.");
      return;
    }

    iniciar(async () => {
      const res = await enviarIntento(cursoId, evaluacionId, intentoId, listaRespuestas);
      if (!res.ok || res.puntaje === undefined) {
        toast.error(res.mensaje ?? "No se pudo enviar el intento");
        return;
      }
      setResultado({ puntaje: res.puntaje, aprobado: !!res.aprobado });
      router.refresh();
    });
  }

  if (resultado) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          {resultado.aprobado ? (
            <CheckCircle2 className="h-10 w-10 text-success" />
          ) : (
            <XCircle className="h-10 w-10 text-destructive" />
          )}
          <p className="text-2xl font-semibold">{Math.round(resultado.puntaje)}%</p>
          <p className="text-muted-foreground">
            {resultado.aprobado
              ? "¡Aprobaste esta evaluación!"
              : `No alcanzaste el mínimo de ${puntajeMinimo}% para aprobar.`}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!intentoId) {
    if (intentosUsados >= maxIntentos) {
      return (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
          Ya usaste tus {maxIntentos} intento(s) permitidos.
        </p>
      );
    }
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Intentos usados: {intentosUsados}/{maxIntentos}. Necesitas {puntajeMinimo}% para
          aprobar.
        </p>
        <Button onClick={comenzar} disabled={enviando}>
          {enviando && <Loader2 className="animate-spin" />}
          Comenzar intento
        </Button>
      </div>
    );
  }

  if (!preguntas) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Cargando preguntas...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {preguntas.map((pregunta, indice) => (
        <Card key={pregunta.id}>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              {indice + 1}. {pregunta.enunciado}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pregunta.opciones.map((opcion) => (
              <label
                key={opcion.id}
                className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-secondary"
              >
                <input
                  type="radio"
                  name={pregunta.id}
                  checked={respuestas[pregunta.id] === opcion.id}
                  onChange={() =>
                    setRespuestas((prev) => ({ ...prev, [pregunta.id]: opcion.id }))
                  }
                />
                {opcion.texto}
              </label>
            ))}
          </CardContent>
        </Card>
      ))}
      <Button onClick={enviar} disabled={enviando} className="w-full">
        {enviando && <Loader2 className="animate-spin" />}
        Enviar evaluación
      </Button>
    </div>
  );
}
