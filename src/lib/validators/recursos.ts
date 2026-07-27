import { z } from "zod";
import { numeroOpcional } from "./comunes";

export const tipoRecursoSchema = z.enum([
  "pdf",
  "video",
  "audio",
  "imagen",
  "presentacion",
  "enlace",
  "archivo",
]);

// Recurso como enlace externo (YouTube, sitios, etc.): no pasa por Storage.
export const recursoEnlaceSchema = z.object({
  nombre: z.string().min(1, "Escribe un nombre").max(200),
  tipo: tipoRecursoSchema,
  urlExterna: z.string().url("URL no válida"),
});

// Recurso subido a Google Cloud Storage: el binario ya viajó del navegador
// al bucket vía URL firmada; aquí solo se registra la ruta resultante.
export const recursoArchivoSchema = z.object({
  nombre: z.string().min(1, "Escribe un nombre").max(200),
  tipo: tipoRecursoSchema,
  storagePath: z.string().min(1),
  tamanoBytes: numeroOpcional(),
});

export type RecursoEnlaceInput = z.infer<typeof recursoEnlaceSchema>;
export type RecursoArchivoInput = z.infer<typeof recursoArchivoSchema>;
