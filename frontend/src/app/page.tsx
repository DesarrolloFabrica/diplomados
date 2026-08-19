import { redirect } from "next/navigation";
import { obtenerSesion } from "@backend/lib/auth/sesion";
import { RUTA_INICIO_POR_ROL } from "@backend/config/roles";

export default async function Home() {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/login");
  redirect(RUTA_INICIO_POR_ROL[sesion.rol]);
}
