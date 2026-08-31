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
const rows = [...xml.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];

function show(headerParts, count = 4) {
  const idx = rows.findIndex((r) => {
    const t = [...r[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    return headerParts.every((h) => t.some((x) => x.includes(h)));
  });
  console.log(`\n=== ${headerParts.join(" / ")} ===`);
  for (let i = 1; i <= count; i++) {
    const t = [...rows[idx + i][0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    console.log(`${i}: ${t.join(" | ")}`);
  }
}

show(["ID", "Categoría", "Requerimiento"]);

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

function showSectionLabels(start, end, labels, anchor) {
  const slice = sectionSlice(start, end, anchor);
  console.log(`\n=== ${start} ===`);
  for (const label of labels) {
    let i = slice.indexOf(`<w:t>${label}</w:t>`);
    if (i === -1 && label.includes(" ")) {
      const partial = label.split(" ").at(-1);
      i = slice.indexOf(`<w:t>${partial}</w:t>`);
    }
    if (i === -1) {
      console.log(`${label}: MISSING`);
      continue;
    }
    const chunk = slice.slice(i, i + 1200);
    const texts = [...chunk.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    console.log(`${label}: ${texts[1] ?? "(empty)"}`);
  }
}

showSectionLabels("11. REQUERIMIENTOS DE PROCESO", "12. REGLAS DE NEGOCIO", [
  "Nombre proceso",
  "Objetivo",
  "Actividad",
  "Excepción",
], "Nombre proceso");

showSectionLabels("14. ARQUITECTURA", "15. EXPERIENCIA DE USUARIO", [
  "Arquitectura actual",
  "Arquitectura propuesta",
  "APIs",
  "Seguridad",
], "Arquitectura actual");

showSectionLabels("15. EXPERIENCIA DE USUARIO", "16.", [
  "Usuarios",
  "Diseño Figma",
  "Responsive",
  "Aprobador UX",
], "Pantallas afectadas");
