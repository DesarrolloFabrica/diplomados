import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "final-audit-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`,
);
const text = [...fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8").matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
  .map((m) => m[1])
  .join("");

function between(start, end) {
  const s = text.indexOf(start);
  if (s === -1) return "";
  const e = text.indexOf(end, s + start.length);
  return e === -1 ? text.slice(s, s + 3000) : text.slice(s, e);
}

console.log("=== CONTROL DOCUMENTAL (snippet) ===");
console.log(between("CONTROL DOCUMENTAL", "1. RESUMEN").replace(/\s+/g, " ").slice(0, 900));

console.log("\n=== PORTADA TABLE (snippet) ===");
console.log(between("Proyecto", "1. RESUMEN").replace(/\s+/g, " ").slice(0, 500));

console.log("\n=== RF FICHAS ===");
for (const rf of ["RF-001", "RF-002", "RF-003", "RF-004", "RF-005", "RF-006"]) {
  const idx = text.indexOf(`ID${rf}`) > -1 || text.includes(`${rf} —`) || text.includes(`${rf} –`);
  const state = (() => {
    const pos = text.indexOf(rf);
    return pos > -1 ? text.slice(pos, pos + 120).replace(/\s+/g, " ") : "missing";
  })();
  console.log(`${rf}: ${state}`);
}

console.log("\n=== MATRIZ RF rows ===");
for (const rf of ["RF-001", "RF-002", "RF-003", "RF-004", "RF-005", "RF-006", "RF-007", "RNF-01"]) {
  console.log(`${rf}: ${text.includes(rf) ? "present" : "missing"}`);
}

console.log("\n=== ARQUITECTURA / UX ===");
console.log("Insertar diagrama:", text.match(/Insertar diagrama/gi)?.length ?? 0);
console.log("c4-context path:", text.includes("c4-context"));
console.log("BPMN filled text:", between("BPMN", "TO BE").slice(0, 200).replace(/\s+/g, " "));
console.log("Figma:", text.includes("Figma") ? "mentioned" : "missing");
console.log("Capturas UX:", text.includes("Capturas UX") || text.includes("capturas UX"));

function afterAnchor(anchor, len = 700) {
  const i = text.indexOf(anchor);
  if (i === -1) return `(anchor not found: ${anchor})`;
  return text.slice(i, i + len).replace(/\s+/g, " ");
}

console.log("\n=== SEC 17 PRIORIZACION ===");
console.log(afterAnchor("17. PRIORIZACIÓN  OBLIGATORIO", 900));

console.log("\n=== SEC 43 RACI ===");
console.log(afterAnchor("43. RACI  OBLIGATORIO", 600));

console.log("\n=== SEC 40 GO-LIVE ===");
console.log(afterAnchor("40. CHECKLIST DE GO-LIVE  OBLIGATORIO", 900));

console.log("\n=== SEC 14 ARQUITECTURA ===");
console.log(afterAnchor("14. ARQUITECTURA  CONDICIONAL", 800));

console.log("\n=== SEC 9 RF (fichas) ===");
console.log(afterAnchor("9. REQUERIMIENTOS FUNCIONALES  OBLIGATORIO", 1200));

console.log("\n=== RF FICHAS (detailed headers) ===");
for (const rf of ["RF-001 —", "RF-002 —", "RF-003 —", "RF-004 —", "RF-005 —", "RF-006 —"]) {
  console.log(`${rf} ${text.includes(rf) ? "YES" : "NO"}`);
}

console.log("\n=== SEC 17 - iniciativas priorizadas ===");
for (const k of ["UI interactiva", "video", "Credenciales", "4,35", "4,60", "Iniciativa"]) {
  console.log(`${k}: ${text.includes(k) ? "YES" : "NO"}`);
}

console.log("\n=== BPMN / diagramas embebidos ===");
console.log("[Diagrama de flujo", text.includes("[Diagrama de flujo"));
console.log("Deployment", text.includes("Deployment") || text.includes("deployment"));
console.log("imagen C4 embebida:", text.includes("c4-context-transparent") || text.includes("image"));

console.log("\n=== Co-elaborador portada ===");
console.log("Co-elaborador en portada:", text.includes("Co-elaborador") || text.includes("co-elaborador"));
console.log("Juan Andrés en portada:", between("Product Owner", "Estado del documento").includes("Juan"));

console.log("\n=== COUNTS ===");
console.log("Por definir:", (text.match(/Por definir/g) || []).length);
console.log("Pendiente:", (text.match(/Pendiente/g) || []).length);
console.log("☐:", (text.match(/☐/g) || []).length);
console.log("☑:", (text.match(/☑/g) || []).length);
