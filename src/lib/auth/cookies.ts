export const COOKIE_SESION = "sesion";

// maxAge igual a la expiración del JWT (ver DURACION_SESION en jwt.ts).
export const OPCIONES_COOKIE_SESION = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24, // 1 día
};

export const OPCIONES_COOKIE_BORRADO = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};
