import { requerirRol } from "@/lib/auth/sesion";
import { ShellPanel } from "@/components/layout/shell-panel";

export default async function EstudianteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("colaborador", "admin_empresa", "instructor", "superadmin");
  return (
    <ShellPanel rol={sesion.rol} nombre={sesion.nombreCompleto}>
      {children}
    </ShellPanel>
  );
}
