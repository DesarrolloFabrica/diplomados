import { z } from "zod";
import { textoOpcional } from "./comunes";

export const rolSchema = z.enum(["superadmin", "admin_empresa", "instructor", "colaborador"]);

const nuloComoVacio = (v: unknown) => (v === null ? "" : v);

export const usuarioSchema = z
  .object({
    email: z.string().min(1, "Escribe el correo").email("Correo no válido"),
    nombreCompleto: z.string().min(1, "Escribe el nombre completo").max(200),
    rol: rolSchema,
    empresaId: z.preprocess(nuloComoVacio, z.string().uuid().optional().or(z.literal(""))),
    cargo: textoOpcional(200),
    area: textoOpcional(200),
  })
  .refine((data) => data.rol === "superadmin" || !!data.empresaId, {
    message: "Selecciona una empresa",
    path: ["empresaId"],
  });

export type UsuarioInput = z.infer<typeof usuarioSchema>;
