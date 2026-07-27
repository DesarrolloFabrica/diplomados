import { z } from "zod";

// FormData.get() devuelve null cuando el campo no se envía (los formularios
// del cliente solo hacen `datos.set(...)` para los campos opcionales que sí
// tienen valor). Sin este preprocess, z.literal("") no acepta null y el
// parseo falla con "Invalid input" aunque el campo sea legítimamente opcional.
const nuloComoVacio = (v: unknown) => (v === null ? "" : v);

export function textoOpcional(maxLength: number) {
  return z
    .preprocess(nuloComoVacio, z.string().max(maxLength).optional().or(z.literal("")))
    .transform((v) => (v ? v : undefined));
}

export function urlOpcional() {
  return z
    .preprocess(nuloComoVacio, z.string().url("URL no válida").optional().or(z.literal("")))
    .transform((v) => (v ? v : undefined));
}

// z.coerce.number().optional() NO sirve para FormData: null se convierte en
// 0 (Number(null) === 0) en vez de saltarse la validación. Aquí null/""
// se vuelven undefined antes de coercionar.
export function numeroOpcional() {
  return z.preprocess(
    (v) => (v === null || v === "" ? undefined : v),
    z.coerce.number().optional(),
  );
}

// El mismo schema valida dos orígenes distintos: en el cliente, un
// Controller de react-hook-form atado a un Switch guarda un boolean real;
// en el servidor, se parsea FormData.get(), que siempre es string ("true"/
// "false", nunca un checkbox nativo: Boolean("false") sería true). Por eso
// acepta ambas formas en vez de una sola.
export function booleanoDesdeFormData() {
  return z.union([z.boolean(), z.enum(["true", "false"]).transform((v) => v === "true")]);
}
