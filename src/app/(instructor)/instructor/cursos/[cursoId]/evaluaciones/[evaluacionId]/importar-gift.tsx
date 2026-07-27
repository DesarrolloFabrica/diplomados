"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importarPreguntasGift } from "@/server/actions/evaluaciones";

const EJEMPLO = `::Pregunta 1::\n¿Enunciado de la pregunta?\n{~Opción incorrecta #Retroalimentación. ~Otra incorrecta #Retro. =Opción correcta #Retro.}`;

interface ImportarGiftProps {
  cursoId: string;
  evaluacionId: string;
}

export function ImportarGift({ cursoId, evaluacionId }: ImportarGiftProps) {
  const router = useRouter();
  const [texto, setTexto] = useState("");
  const [enviando, iniciar] = useTransition();

  function importar() {
    if (!texto.trim()) {
      toast.error("Pega el texto en formato GIFT primero");
      return;
    }
    const datos = new FormData();
    datos.set("texto", texto);

    iniciar(async () => {
      const res = await importarPreguntasGift(cursoId, evaluacionId, null, datos);
      if (!res.ok) {
        toast.error(res.mensaje ?? "No se pudo importar");
        return;
      }
      toast.success(`${res.preguntasImportadas} pregunta(s) importada(s)`);
      setTexto("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h3 className="font-medium">Importar preguntas (formato GIFT de Moodle)</h3>
        <p className="text-sm text-muted-foreground">
          Pega el texto exportado de Moodle (selección única). Ejemplo:
        </p>
        <pre className="mt-1 overflow-x-auto rounded-md bg-muted p-2 text-xs">{EJEMPLO}</pre>
      </div>
      <Textarea
        rows={8}
        placeholder="Pega aquí el texto en formato GIFT..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      <Button onClick={importar} disabled={enviando}>
        {enviando && <Loader2 className="animate-spin" />}
        Importar preguntas
      </Button>
    </div>
  );
}
