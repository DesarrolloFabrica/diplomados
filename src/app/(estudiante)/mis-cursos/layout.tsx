import { requerirRol } from "@/lib/auth/sesion";
import { ShellPanel } from "@/components/layout/shell-panel";
import { ShellPanelColaborador } from "@/components/layout/shell-panel-colaborador";

export default async function EstudianteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("colaborador", "admin_empresa", "instructor", "superadmin");

  if (sesion.rol === "colaborador") {
    return <ShellPanelColaborador nombre={sesion.nombreCompleto}>{children}</ShellPanelColaborador>;
  }

  return (
    <ShellPanel rol={sesion.rol} nombre={sesion.nombreCompleto}>
      {children}
    </ShellPanel>
  );
}
