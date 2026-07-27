"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eliminarPregunta } from "@/server/actions/evaluaciones";
import type { PreguntaConOpciones } from "@/server/queries/evaluaciones";

interface TablaPreguntasProps {
  cursoId: string;
  evaluacionId: string;
  preguntas: PreguntaConOpciones[];
}

export function TablaPreguntas({ cursoId, evaluacionId, preguntas }: TablaPreguntasProps) {
  const router = useRouter();
  const [, iniciar] = useTransition();

  function eliminar(preguntaId: string, enunciado: string) {
    if (!confirm(`¿Eliminar la pregunta "${enunciado.slice(0, 60)}..."?`)) return;
    iniciar(async () => {
      const res = await eliminarPregunta(cursoId, evaluacionId, preguntaId);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo eliminar");
        return;
      }
      toast.success("Pregunta eliminada");
      router.refresh();
    });
  }

  if (preguntas.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border py-8 text-center text-muted-foreground">
        Todavía no hay preguntas. Impórtalas desde texto GIFT arriba.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {preguntas.map((pregunta, indice) => (
        <Card key={pregunta.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">
              {indice + 1}. {pregunta.enunciado}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => eliminar(pregunta.id, pregunta.enunciado)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {pregunta.opciones.map((opcion) => (
              <div key={opcion.id} className="flex items-start gap-2 text-sm">
                {opcion.esCorrecta ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className={opcion.esCorrecta ? "font-medium" : "text-muted-foreground"}>
                  {opcion.texto}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
