import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "x-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");

function sectionSlice(start, end, anchor) {
  let searchFrom = 0;
  while (true) {
    const s = xml.indexOf(start, searchFrom);
    if (s === -1) return "";
    const e = xml.indexOf(end, s + start.length);
    if (e === -1) return "";
    const slice = xml.slice(s, e);
    if (!anchor || slice.includes(anchor)) return slice;
    searchFrom = s + start.length;
  }
}

function cellTexts(rowXml) {
  return [...rowXml.matchAll(/<w:tc[\s\S]*?<\/w:tc>/g)].map((m) =>
    [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((x) => x[1])
      .join("")
      .trim()
  );
}

function showTable(title, start, end, anchor, headers) {
  const slice = sectionSlice(start, end, anchor);
  const rows = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
  const idx = rows.findIndex((r) => {
    const t = cellTexts(r[0]);
    return headers.every((h) => t.some((x) => x.includes(h)));
  });
  console.log(`\n=== ${title} ===`);
  if (idx === -1) {
    console.log("HEADER NOT FOUND");
    return;
  }
  console.log("HEADER:", cellTexts(rows[idx][0]).join(" | "));
  for (let i = 1; i <= 8; i++) {
    const row = rows[idx + i];
    if (!row) break;
    const cells = cellTexts(row[0]);
    if (!cells.some(Boolean)) {
      console.log(`${i}: (empty)`);
      continue;
    }
    console.log(`${i}: ${cells.join(" | ")}`);
  }
}

showTable("NFR", "10. REQUERIMIENTOS NO FUNCIONALES", "11. REQUERIMIENTOS DE PROCESO", "RNF-01", [
  "ID",
  "Categoría",
]);
showTable("RN", "12. REGLAS DE NEGOCIO", "13. REQUERIMIENTOS TÉCNICOS", "Regla", ["ID", "Regla"]);
showTable("Matriz", "16. MATRIZ MAESTRA", "17. PRIORIZACIÓN", "Tipo", ["ID", "Nombre"]);

function showLabel(sectionStart, sectionEnd, anchor, labels) {
  const slice = sectionSlice(sectionStart, sectionEnd, anchor);
  console.log(`\n=== Labels ${sectionStart} ===`);
  for (const label of labels) {
    const i = slice.indexOf(`<w:t>${label}</w:t>`);
    if (i === -1) {
      console.log(`${label}: MISSING`);
      continue;
    }
    const rowStart = slice.lastIndexOf("<w:tr", i);
    const rowEnd = slice.indexOf("</w:tr>", i);
    const cells = cellTexts(slice.slice(rowStart, rowEnd));
    console.log(`${label}: ${cells[1] ?? "(empty)"}`);
  }
}

showLabel("14. ARQUITECTURA", "15. EXPERIENCIA DE USUARIO", "Arquitectura actual", [
  "Arquitectura propuesta",
  "Servicios involucrados",
  "Seguridad",
]);

showLabel(
  "Diligenciar una ficha por cada requerimiento funcional identificado",
  "Precondiciones",
  "RF-001",
  ["ID", "Nombre", "Descripción", "Estado"]
);

console.log("\n[Diligenciar] count:", (xml.match(/\[Diligenciar\]/g) || []).length);

showTable("Release", "39. PLAN DE RELEASE", "40. CHECKLIST", "Release ID", ["Release ID", "Versión"]);
showTable("KPI", "47. INDICADORES", "48. DASHBOARD", "KPI", ["KPI", "Fórmula"]);

function showStatus46() {
  const slice = sectionSlice("46. STATUS REPORT", "47. INDICADORES", "Logros del");
  console.log("\n=== Status Report 46 ===");
  for (const label of [
    "Estado general",
    "Logros del período",
    "Trabajo en curso",
    "Próximos pasos",
    "Riesgos",
    "Bloqueos",
    "Decisiones requeridas",
  ]) {
    const i = slice.indexOf(label);
    if (i === -1) {
      console.log(`${label}: MISSING LABEL`);
      continue;
    }
    const rowStart = slice.lastIndexOf("<w:tr", i);
    const rowEnd = slice.indexOf("</w:tr>", i);
    const cells = cellTexts(slice.slice(rowStart, rowEnd));
    console.log(`${label}: ${cells[1] ?? "(empty)"}`);
  }
}
showStatus46();
