import { z } from "zod";
import { textoOpcional, booleanoDesdeFormData } from "./comunes";

export const tipoLeccionSchema = z.enum(["texto", "video", "archivo", "mixto"]);
export const tipoMarcadoSchema = z.enum(["automatico", "manual"]);

export const leccionSchema = z.object({
  titulo: z.string().min(1, "Escribe el título").max(200),
  tipoContenido: tipoLeccionSchema,
  contenido: textoOpcional(20000),
  esObligatoria: booleanoDesdeFormData(),
  marcado: tipoMarcadoSchema,
});

export type LeccionInput = z.infer<typeof leccionSchema>;
