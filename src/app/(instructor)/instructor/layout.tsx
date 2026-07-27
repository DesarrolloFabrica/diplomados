import { requerirRol } from "@/lib/auth/sesion";
import { ShellPanel } from "@/components/layout/shell-panel";

export default async function InstructorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("superadmin", "instructor");
  return (
    <ShellPanel rol={sesion.rol} nombre={sesion.nombreCompleto}>
      {children}
    </ShellPanel>
  );
}
