import { requerirRol } from "@backend/lib/auth/sesion";
import { ShellPanelInstructor } from "@/components/layout/shell-panel-colaborador";

export default async function InstructorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const sesion = await requerirRol("superadmin", "instructor");
  return (
    <ShellPanelInstructor
      nombre={sesion.nombreCompleto}
      esSuperadmin={sesion.rol === "superadmin"}
    >
      <div className="admin-page">{children}</div>
    </ShellPanelInstructor>
  );
}
