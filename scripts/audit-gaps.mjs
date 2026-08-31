import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kw2-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`,
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");

const checks = [
  ["RF-002", "Ficha RF-002"],
  ["RF-003", "Ficha RF-003"],
  ["RF-004", "Ficha RF-004"],
  ["RF-006", "RF-006"],
  ["RNF-02", "NFR CI/CD"],
  ["RNF-03", "NFR UX"],
  ["RNF-04", "NFR disponibilidad"],
  ["17.", "Sección 17 priorización"],
  ["ponderación", "Matriz ponderada sec 17"],
  ["34.", "Sección 34 sprint"],
  ["11/08/2026", "Fecha sprint 3 inicio"],
  ["Defectos postproducción", "KPI defectos postprod"],
  ["Cumplimiento sprint", "KPI cumplimiento sprint"],
  ["Cambios de alcance", "KPI cambios alcance"],
  ["Revisó", "Campo Revisó control doc"],
  ["Johan Sebastián Daza Sarmiento (PM)", "Revisó Johan explícito"],
  ["Iron Alexander Fuentes Rodríguez (PO)", "Aprobó Iron explícito"],
  ["Aprobó", "Campo Aprobó"],
  ["BPMN", "Diagramas BPMN"],
  ["RAID", "Sección RAID"],
  ["CR-002", "Change request UX"],
  ["CR-004", "Change request contenido"],
  ["Diagrama C4", "Referencia diagrama C4"],
  ["c4-context", "Link/path diagrama"],
  ["Capturas UX", "Evidencia UX pendiente"],
  ["Acta UAT", "Acta UAT"],
  ["WBS", "WBS"],
  ["Cronograma", "Cronograma sección"],
  ["Backlog", "Backlog sección 32"],
  ["☐ UAT aprobado", "Go-live UAT checkbox"],
  ["Mitigado", "Estado bloqueo"],
  ["Steering Committee", "Cadencia gobierno steering"],
  ["Performance", "QA performance pendiente"],
  ["En medición", "KPIs en medición"],
];

console.log("STATUS | CHECK");
for (const [needle, label] of checks) {
  console.log(`${text.includes(needle) ? "YES" : "NO "} | ${label} (${needle})`);
}

// Count empty checklist patterns in go-live
const goLiveStart = text.indexOf("40. CHECKLIST");
const goLiveEnd = text.indexOf("41.", goLiveStart);
const goLive = goLiveStart > -1 ? text.slice(goLiveStart, goLiveEnd) : "";
console.log("\nGo-live section length:", goLive.length);
console.log("Go-live contains 'QA aprobado':", goLive.includes("QA aprobado"));
console.log("Go-live unchecked count (☐):", (goLive.match(/☐/g) || []).length);
console.log("Go-live checked count (☑):", (goLive.match(/☑/g) || []).length);
