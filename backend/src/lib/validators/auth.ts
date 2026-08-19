import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Escribe tu correo").email("Correo no válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});

export const recuperarSchema = z.object({
  email: z.string().min(1, "Escribe tu correo").email("Correo no válido"),
});

export const restablecerSchema = z
  .object({
    password: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Za-z]/, "Incluye al menos una letra")
      .regex(/[0-9]/, "Incluye al menos un número"),
    confirmar: z.string(),
  })
  .refine((data) => data.password === data.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RecuperarInput = z.infer<typeof recuperarSchema>;
export type RestablecerInput = z.infer<typeof restablecerSchema>;
