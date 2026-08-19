import { z } from "zod";
import { textoOpcional, urlOpcional, numeroOpcional, booleanoDesdeFormData } from "./comunes";

export const nivelDificultadSchema = z.enum(["basico", "intermedio", "avanzado"]);
export const navegacionSchema = z.enum(["obligatoria", "libre"]);

export const cursoSchema = z.object({
  titulo: z.string().min(1, "Escribe el título").max(200),
  descripcion: textoOpcional(2000),
  objetivo: textoOpcional(2000),
  imagenPortadaUrl: urlOpcional(),
  duracionEstimadaMin: numeroOpcional(),
  nivelDificultad: nivelDificultadSchema,
  porcentajeAprobacion: z.coerce.number().min(0).max(100),
  maxIntentos: z.coerce.number().int().min(1),
  navegacion: navegacionSchema,
  esDiplomado: booleanoDesdeFormData(),
  // vacío = catálogo global; con valor = curso privado de esa empresa.
  empresaId: z.preprocess(
    (v) => (v === null ? "" : v),
    z.string().uuid().optional().or(z.literal("")),
  ),
});

export type CursoInput = z.infer<typeof cursoSchema>;
