import { requerirRol } from "@/lib/auth/sesion";
import { ShellPanel } from "@/components/layout/shell-panel";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("superadmin");
  return (
    <ShellPanel rol={sesion.rol} nombre={sesion.nombreCompleto}>
      {children}
    </ShellPanel>
  );
}
