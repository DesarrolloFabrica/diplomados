import { z } from "zod";
import { textoOpcional, numeroOpcional, booleanoDesdeFormData } from "./comunes";

export const visibilidadResultadosSchema = z.enum(["inmediato", "al_cerrar", "nunca"]);

export const evaluacionSchema = z.object({
  titulo: z.string().min(1, "Escribe el título").max(200),
  descripcion: textoOpcional(2000),
  tiempoLimiteMin: numeroOpcional(),
  maxIntentos: z.coerce.number().int().min(1),
  puntajeMinimo: z.coerce.number().min(0).max(100),
  preguntasAleatorias: booleanoDesdeFormData(),
  numPreguntasMostrar: numeroOpcional(),
  mostrarResultados: visibilidadResultadosSchema,
});

export type EvaluacionInput = z.infer<typeof evaluacionSchema>;

export const importarGiftSchema = z.object({
  texto: z.string().min(1, "Pega el texto en formato GIFT"),
});
