import { requerirRol } from "@/lib/auth/sesion";
import { ShellPanel } from "@/components/layout/shell-panel";

export default async function EmpresaLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("superadmin", "admin_empresa");
  return (
    <ShellPanel rol={sesion.rol} nombre={sesion.nombreCompleto}>
      {children}
    </ShellPanel>
  );
}
