import { z } from "zod";
import { textoOpcional, urlOpcional } from "./comunes";

export const empresaSchema = z.object({
  nombre: z.string().min(1, "Escribe el nombre").max(200),
  nit: textoOpcional(50),
  logoUrl: urlOpcional(),
});

export type EmpresaInput = z.infer<typeof empresaSchema>;
