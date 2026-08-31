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

function show(title, headerParts, count = 8) {
  const idx = rows.findIndex((r) => {
    const t = [...r[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    return headerParts.every((h) => t.some((x) => x.includes(h)));
  });
  console.log(`\n=== ${title} (row ${idx}) ===`);
  if (idx === -1) return;
  console.log("HEADER:", [...rows[idx][0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" | "));
  for (let i = 1; i <= count; i++) {
    const row = rows[idx + i];
    if (!row) break;
    const t = [...row[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    console.log(`${i}: ${t.join(" | ") || "(empty)"}`);
  }
}

show("NFR", ["ID", "Categoría", "Requerimiento"], 8);

const markers = [
  "10. REQUERIMIENTOS NO FUNCIONALES",
  "11. REQUERIMIENTOS DE PROCESO",
  "RP-001",
  "12.",
  "13.",
  "14. ARQUITECTURA",
  "15. EXPERIENCIA DE USUARIO",
  "16.",
];
console.log("\n=== Markers ===");
for (const m of markers) console.log(m, xml.indexOf(m));

const rpStart = xml.indexOf("Nombre proceso");
const rpEnd = xml.indexOf("14. ARQUITECTURA", rpStart);
const rpSlice = xml.slice(rpStart, rpEnd);
const rpRows = [...rpSlice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
console.log("\n=== RP-001 rows ===");
rpRows.forEach((row, i) => {
  const t = [...row[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1].trim())
    .filter(Boolean);
  if (t.length) console.log(`${i}: ${t.join(" | ")}`);
});

function showLabels(sectionStart, sectionEnd, title) {
  const start = xml.indexOf(sectionStart);
  const end = xml.indexOf(sectionEnd, start);
  const slice = xml.slice(start, end);
  const labelRows = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
  console.log(`\n=== ${title} ===`);
  labelRows.forEach((row, i) => {
    const t = [...row[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
      .map((m) => m[1].trim())
      .filter(Boolean);
    if (t.length <= 2) console.log(`${i}: ${t.join(" | ") || "(empty)"}`);
  });
}

showLabels("14. ARQUITECTURA", "15. EXPERIENCIA DE USUARIO", "Arquitectura labels");
showLabels("15. EXPERIENCIA DE USUARIO", "17.", "UX labels");
