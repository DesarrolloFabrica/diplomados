import { z } from "zod";
import { ESCUELA_VISUAL_DEFAULT, ESCUELAS_VISUALES } from "@/config/escuelas";
import { textoOpcional, urlOpcional, numeroOpcional, booleanoDesdeFormData } from "./comunes";

export const nivelDificultadSchema = z.enum(["basico", "intermedio", "avanzado"]);
export const navegacionSchema = z.enum(["obligatoria", "libre"]);
export const escuelaVisualSchema = z.enum(ESCUELAS_VISUALES);

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
  escuela: z.preprocess(
    (v) => (v === null || v === "" || v === undefined ? ESCUELA_VISUAL_DEFAULT : v),
    escuelaVisualSchema,
  ),
  // vacío = catálogo global; con valor = curso privado de esa empresa.
  empresaId: z.preprocess(
    (v) => (v === null ? "" : v),
    z.string().uuid().optional().or(z.literal("")),
  ),
});

export type CursoInput = z.infer<typeof cursoSchema>;
