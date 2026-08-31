import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "audit-detail-"));
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

function sectionContent(num, titlePart) {
  const re = new RegExp(`${num}\\.\\s*${titlePart}[\\s\\S]*?(?=\\d+\\.\\s+[A-ZÁÉÍÓÚ]|$)`, "i");
  const m = text.match(re);
  return m ? m[0] : null;
}

function analyzeSection(num, titlePart, keywords = []) {
  const content = sectionContent(num, titlePart);
  if (!content) return { num, titlePart, status: "NOT_FOUND", len: 0, keywords: [] };
  const found = keywords.filter((k) => content.includes(k));
  const missing = keywords.filter((k) => !content.includes(k));
  const len = content.length;
  let status = "EMPTY";
  if (len > 800) status = "LIKELY_FILLED";
  else if (len > 200) status = "PARTIAL";
  return { num, titlePart, status, len, found, missing, preview: content.replace(/\s+/g, " ").slice(0, 180) };
}

const sections = [
  [1, "RESUMEN", ["SOL-DIP", "Q4 2026", "Iron"]],
  [2, "IDENTIFICACIÓN", ["SOL-DIP-2026-001", "Johan", "Haider"]],
  [6, "AS IS", ["manual", "correo"]],
  [7, "TO BE", ["Cloud Run", "PostgreSQL"]],
  [9, "RF-001", ["JWT", "Implementado"]],
  [10, "NO FUNCIONALES", ["RNF-01", "Seguridad"]],
  [11, "PROCESO", ["RP-001"]],
  [12, "REGLAS", ["RN-01"]],
  [14, "ARQUITECTURA", ["Cloud Run", "C4", "Insertar"]],
  [15, "EXPERIENCIA", ["Figma", "responsive"]],
  [16, "MATRIZ MAESTRA", ["RF-001", "RF-005"]],
  [17, "PRIORIZACIÓN", ["P1", "P2", "ponder"]],
  [19, "FACTIBILIDAD", ["Viable", "Alta"]],
  [20, "ESTIMACIÓN", ["320 h", "Juan", "Haider"]],
  [28, "BLOQUEOS", ["BL-001", "UAT"]],
  [34, "SPRINT", ["Sprint 3", "T-S3"]],
  [35, "DEFINITION", ["QA aprobado", "Pruebas unitarias"]],
  [36, "PLAN DE QA", ["QA-001", "localhost"]],
  [37, "TRAZABILIDAD", ["SOL-DIP", "HU-001"]],
  [38, "UAT", ["Iron", "Por definir"]],
  [39, "RELEASE", ["R1", "Cloud Run"]],
  [40, "GO-LIVE", ["Smoke tests", "UAT aprobado"]],
  [41, "POSTPRODUCCIÓN", ["Disponibilidad", "Cloud Run"]],
  [42, "HYPERCARE", ["Pendiente", "Johan"]],
  [43, "RACI", ["Responsible", "Juan"]],
  [44, "COMUNICACIONES", ["Status report", "go-live"]],
  [45, "GOBIERNO", ["Sprint Planning", "miércoles"]],
  [46, "STATUS REPORT", ["Amarillo", "Etapa 3"]],
  [47, "INDICADORES", ["Defectos", "Throughput", "70%"]],
  [48, "DASHBOARD", ["Requerimientos totales", "Amarillo"]],
  [49, "EVIDENCIAS", ["EV-001", "github.com"]],
  [50, "CIERRE DEL REQUERIMIENTO", ["Requerimiento cerrado", "UAT aprobado"]],
  [51, "CIERRE DEL PROYECTO", ["Deuda técnica", "En curso"]],
  [52, "LECCIONES", ["Automatizar", "Cloud Run"]],
  [53, "BACKLOG", ["BP-001", "RF-006"]],
  [54, "ANEXOS", ["github.com", "diagrams"]],
];

console.log("NUM | STATUS | LEN | FOUND/MISSING KEYWORDS | PREVIEW");
for (const [num, title, keys] of sections) {
  const r = analyzeSection(num, title, keys);
  console.log(`\n${r.num} | ${r.status} | ${r.len}`);
  if (r.found?.length) console.log("  found:", r.found.join(", "));
  if (r.missing?.length) console.log("  missing:", r.missing.join(", "));
  if (r.preview) console.log("  preview:", r.preview);
}

console.log("\n=== INCONSISTENCIES ===");
const checks = [
  ["Fenix vs Nexus/Diplomados", /Fenix|Nexus|Diplomados/g],
  ["Fecha creación 19 vs 20", /19\/08\/2026|20\/08\/2026/g],
  ["Aprobó Iron", /Aprobó.*Iron|Aprobó.*Pendiente/g],
  ["Revisó Johan", /Revisó.*Johan|RevisóRevisó/g],
  ["Insertar diagrama", /Insertar diagrama/gi],
  ["BPMN placeholder", /BPMN|\[Insertar\]/gi],
  ["RF-002 ficha", /RF-002.*Autenticación|RF-002.*Gestión/g],
  ["github links", /github\.com/g],
];
for (const [name, re] of checks) {
  const m = text.match(re);
  console.log(`${name}: ${m ? m.length + " hits -> " + [...new Set(m)].slice(0,3).join(" | ") : "none"}`);
}
