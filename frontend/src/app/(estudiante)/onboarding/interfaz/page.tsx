import { redirect } from "next/navigation";
import { requerirSesion } from "@backend/lib/auth/sesion";
import { RUTA_INICIO_POR_ROL } from "@backend/config/roles";
import { obtenerPreferenciaInterfazUsuario } from "@backend/server/queries/preferencia-interfaz";
import { OnboardingInterfaz } from "./onboarding-interfaz";

export default async function OnboardingInterfazPage() {
  const sesion = await requerirSesion();

  if (sesion.rol !== "colaborador") {
    redirect(RUTA_INICIO_POR_ROL[sesion.rol]);
  }

  const preferencia = await obtenerPreferenciaInterfazUsuario(sesion.id);
  if (preferencia?.interfaceOnboardingCompletedAt) {
    redirect("/mis-cursos");
  }

  return <OnboardingInterfaz />;
}
