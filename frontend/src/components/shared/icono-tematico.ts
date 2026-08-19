import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Calculator,
  Code,
  Compass,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  HardHat,
  HeartHandshake,
  Headset,
  Languages,
  Leaf,
  Lightbulb,
  LineChart,
  Megaphone,
  MessagesSquare,
  Palette,
  PiggyBank,
  Rocket,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Target,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Cuando no hay portada (o la URL está rota) se muestra un icono en su
// lugar. Primero se busca un tema en el título; si no coincide ninguno se
// reparte un icono de la reserva por hash, para que dos contenidos
// distintos no terminen con el mismo símbolo genérico.
const POR_TEMA: ReadonlyArray<{ claves: readonly string[]; icono: LucideIcon }> = [
  { claves: ["servicio al cliente", "atencion al cliente", "postventa"], icono: Headset },
  { claves: ["venta", "comercial", "negociacion"], icono: TrendingUp },
  { claves: ["marketing", "publicidad", "marca", "redes sociales"], icono: Megaphone },
  { claves: ["finanza", "contab", "presupuesto", "costos", "tesoreria"], icono: Calculator },
  { claves: ["credito", "cartera", "cobranza", "ahorro"], icono: PiggyBank },
  { claves: ["liderazgo", "equipo", "trabajo en equipo", "coaching"], icono: Users },
  { claves: ["talento", "recursos humanos", "seleccion", "onboarding"], icono: UserCog },
  { claves: ["comunicacion", "oratoria", "escritura"], icono: MessagesSquare },
  { claves: ["seguridad", "sst", "riesgo", "prevencion"], icono: ShieldCheck },
  { claves: ["obra", "construccion", "industrial", "operario"], icono: HardHat },
  { claves: ["calidad", "auditoria", "norma", "iso"], icono: BadgeCheck },
  { claves: ["legal", "juridic", "normativ", "contrato"], icono: Scale },
  { claves: ["salud", "bienestar", "enfermeria", "clinic"], icono: Stethoscope },
  { claves: ["ambiental", "sostenib", "ecolog", "residuos"], icono: Leaf },
  { claves: ["logistica", "transporte", "inventario", "almacen"], icono: Truck },
  { claves: ["dato", "analitica", "base de datos", "bi"], icono: Database },
  { claves: ["programacion", "desarrollo", "software", "web"], icono: Code },
  { claves: ["tecnolog", "digital", "informatica", "sistemas"], icono: Cpu },
  { claves: ["diseno", "creativ", "grafic"], icono: Palette },
  { claves: ["idioma", "ingles", "frances", "portugues"], icono: Languages },
  { claves: ["innovacion", "creatividad", "idea"], icono: Lightbulb },
  { claves: ["proyecto", "planeacion", "estrategia", "objetivo"], icono: Target },
  { claves: ["emprend", "negocio", "empresa"], icono: Briefcase },
  { claves: ["mantenimiento", "tecnico", "herramienta"], icono: Wrench },
  { claves: ["internacional", "global", "exportacion"], icono: Globe },
  { claves: ["induccion", "iniciacion", "primeros pasos"], icono: Compass },
  { claves: ["cultura", "valores", "convivencia"], icono: HeartHandshake },
  { claves: ["productividad", "mejora", "eficiencia"], icono: LineChart },
];

const RESERVA: readonly LucideIcon[] = [
  BookOpen,
  Lightbulb,
  Target,
  Compass,
  Rocket,
  Sparkles,
  Briefcase,
  LineChart,
  Users,
  Globe,
];

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function iconoTematico(titulo: string, esDiplomado = false): LucideIcon {
  const texto = normalizar(titulo).trim();
  if (!texto) return esDiplomado ? GraduationCap : BookOpen;

  for (const { claves, icono } of POR_TEMA) {
    if (claves.some((clave) => texto.includes(clave))) return icono;
  }

  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 31 + texto.charCodeAt(i)) >>> 0;
  }
  return RESERVA[hash % RESERVA.length] ?? BookOpen;
}
