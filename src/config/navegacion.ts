import type { Rol } from "@/types";
import {
  LayoutDashboard,
  Building2,
  Users,
  BookOpen,
  GraduationCap,
  ClipboardList,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export interface ItemNavegacion {
  titulo: string;
  href: string;
  icono: LucideIcon;
}

export const NAVEGACION_POR_ROL: Record<Rol, ItemNavegacion[]> = {
  superadmin: [
    { titulo: "Panel", href: "/admin", icono: LayoutDashboard },
    { titulo: "Empresas", href: "/admin/empresas", icono: Building2 },
    { titulo: "Usuarios", href: "/admin/usuarios", icono: Users },
    { titulo: "Cursos", href: "/admin/cursos", icono: BookOpen },
    { titulo: "Reportes", href: "/admin/reportes", icono: BarChart3 },
  ],
  admin_empresa: [
    { titulo: "Panel", href: "/empresa", icono: LayoutDashboard },
    { titulo: "Colaboradores", href: "/empresa/colaboradores", icono: Users },
    { titulo: "Asignaciones", href: "/empresa/asignaciones", icono: ClipboardList },
    { titulo: "Reportes", href: "/empresa/reportes", icono: BarChart3 },
  ],
  instructor: [
    { titulo: "Mis cursos", href: "/instructor/cursos", icono: BookOpen },
    { titulo: "Evaluaciones", href: "/instructor/evaluaciones", icono: ClipboardList },
  ],
  colaborador: [
    { titulo: "Mis cursos", href: "/mis-cursos", icono: GraduationCap },
  ],
};
