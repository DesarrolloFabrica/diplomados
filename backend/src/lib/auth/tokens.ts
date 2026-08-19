import { randomBytes, createHash } from "node:crypto";

// El token viaja en el enlace del correo; solo su hash se guarda en la
// base (password_reset_tokens.token_hash), igual que se hace con
// contraseñas: si la tabla se filtra, no expone tokens usables.
export function generarTokenRecuperacion(): { token: string; hash: string } {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashearToken(token) };
}

export function hashearToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
