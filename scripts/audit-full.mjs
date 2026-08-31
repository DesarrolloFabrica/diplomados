import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "audit-full-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`,
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");

function plain(fragment) {
  return [...fragment.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("");
}

const text = plain(xml);

const sectionMarkers = [
  "CONTROL DOCUMENTAL",
  "RESUMEN EJECUTIVO",
  "IDENTIFICACIÓN",
  "AS IS",
  "TO BE",
  "STAKEHOLDERS",
  "RF-001",
  "REQUERIMIENTOS NO FUNCIONALES",
  "REQUERIMIENTOS DE PROCESO",
  "REGLAS DE NEGOCIO",
  "REQUERIMIENTOS TÉCNICOS",
  "ARQUITECTURA",
  "EXPERIENCIA DE USUARIO",
  "MATRIZ MAESTRA",
  "PRIORIZACIÓN",
  "FACTIBILIDAD",
  "ESTIMACIÓN",
  "CRONOGRAMA",
  "BACKLOG",
  "SPRINT",
  "DEFINITION OF DONE",
  "PLAN DE QA",
  "MATRIZ DE TRAZABILIDAD",
  "UAT",
  "PLAN DE RELEASE",
  "CHECKLIST DE GO-LIVE",
  "VALIDACIÓN POSTPRODUCCIÓN",
  "HYPERCARE",
  "RACI",
  "PLAN DE COMUNICACIONES",
  "CADENCIA DE GOBIERNO",
  "STATUS REPORT",
  "INDICADORES",
  "DASHBOARD EJECUTIVO",
  "EVIDENCIAS",
  "CIERRE DEL REQUERIMIENTO",
  "CIERRE DEL PROYECTO",
  "LECCIONES APRENDIDAS",
  "PENDIENTES",
  "ANEXOS",
  "CONTROL DE BLOQUEOS",
  "RAID",
  "WBS",
  "BPMN",
  "Insertar diagrama",
];

console.log("=== SECTION PRESENCE ===");
for (const m of sectionMarkers) {
  console.log(`${text.includes(m) ? "OK" : "MISSING"}: ${m}`);
}

console.log("\n=== PLACEHOLDER COUNTS ===");
const patterns = [
  "[Diligenciar]",
  "[Insertar",
  "RF-[XXX]",
  "RP-[XXX]",
  "CR-[XXX]",
  "BP-0",
  "☐",
  "☑",
  "Por definir",
  "Pendiente",
  "En elaboración",
  "N/A",
];
for (const p of patterns) {
  const count = (text.match(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
  if (count) console.log(`${p}: ${count}`);
}

function sliceBetween(start, end) {
  const s = text.indexOf(start);
  if (s === -1) return null;
  const e = text.indexOf(end, s + start.length);
  return e === -1 ? text.slice(s, s + 2500) : text.slice(s, e);
}

const checks = [
  ["35. DoD", "35.", "36."],
  ["36. QA", "36.", "37."],
  ["37. Trazabilidad", "37.", "38."],
  ["38. UAT", "38.", "39."],
  ["40. Go-live", "40.", "41."],
  ["41. Postprod", "41.", "42."],
  ["42. Hypercare", "42.", "43."],
  ["43. RACI", "43.", "44."],
  ["44. Comunicaciones", "44.", "45."],
  ["45. Gobierno", "45.", "46."],
  ["28. Bloqueos", "28.", "29."],
  ["49. Evidencias", "49.", "50."],
  ["52. Lecciones", "52.", "53."],
  ["53. Backlog", "53.", "54."],
  ["54. Anexos", "54.", "CONTROL DOCUMENTAL"],
];

console.log("\n=== SECTION SNIPPETS (first 200 chars) ===");
for (const [name, start, end] of checks) {
  const slice = sliceBetween(start, end);
  if (!slice) {
    console.log(`\n${name}: NOT FOUND`);
    continue;
  }
  const compact = slice.replace(/\s+/g, " ").trim().slice(0, 220);
  console.log(`\n${name}: ${compact}...`);
}

console.log("\n=== KPI ROWS (defectos/cumplimiento) ===");
const kpiIdx = text.indexOf("Defectos");
if (kpiIdx !== -1) console.log(text.slice(kpiIdx, kpiIdx + 400).replace(/\s+/g, " "));

console.log("\n=== CONTROL DOCUMENTAL ===");
const ctrl = sliceBetween("CONTROL DOCUMENTAL", "RESUMEN") || sliceBetween("Nombre documento", "RESUMEN");
if (ctrl) console.log(ctrl.slice(0, 800).replace(/\s+/g, " "));
