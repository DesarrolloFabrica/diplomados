import { requerirRol } from "@backend/lib/auth/sesion";
import { redirect } from "next/navigation";
import { ShellPanel } from "@/components/layout/shell-panel";
import { ShellPanelColaborador } from "@/components/layout/shell-panel-colaborador";
import { InterfaceVariantProvider } from "@/components/providers/interface-variant-provider";
import { obtenerPreferenciaInterfazUsuario } from "@backend/server/queries/preferencia-interfaz";
import { resolveInterfaceVariant } from "@backend/config/interface-variants";

export default async function EstudianteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("colaborador", "admin_empresa", "instructor", "superadmin");

  if (sesion.rol === "colaborador") {
    const preferencia = await obtenerPreferenciaInterfazUsuario(sesion.id);
    if (!preferencia?.interfaceOnboardingCompletedAt) {
      redirect("/onboarding/interfaz");
    }

    const interfaceVariant = resolveInterfaceVariant(preferencia.interfaceVariantRaw);

    return (
      <InterfaceVariantProvider initialVariant={interfaceVariant}>
        <ShellPanelColaborador nombre={sesion.nombreCompleto}>{children}</ShellPanelColaborador>
      </InterfaceVariantProvider>
    );
  }

  return (
    <ShellPanel rol={sesion.rol} nombre={sesion.nombreCompleto}>
      {children}
    </ShellPanel>
  );
}
