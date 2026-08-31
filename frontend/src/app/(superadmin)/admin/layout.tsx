import { requerirRol } from "@backend/lib/auth/sesion";
import { ShellPanelSuperadmin } from "@/components/layout/shell-panel-colaborador";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("superadmin");
  return (
    <ShellPanelSuperadmin nombre={sesion.nombreCompleto}>
      {children}
    </ShellPanelSuperadmin>
  );
}
