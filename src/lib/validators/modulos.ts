import { z } from "zod";
import { textoOpcional } from "./comunes";

export const moduloSchema = z.object({
  titulo: z.string().min(1, "Escribe el título").max(200),
  descripcion: textoOpcional(2000),
});

export type ModuloInput = z.infer<typeof moduloSchema>;
