import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const doc = process.argv[2] || "scripts/Diplomados_Requerimientos_v2_actualizado.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-inspect-"));
const zipCopy = path.join(tmp, "d.zip");
fs.copyFileSync(doc, zipCopy);
const unzipped = path.join(tmp, "u");
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${unzipped.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" },
);
const xml = fs.readFileSync(path.join(unzipped, "word", "document.xml"), "utf8");

for (const label of ["18. ANÁLISIS DE IMPACTO", "Negocio", "Dimensión", "Sin impacto", "20. ESTIMACIÓN", "Componente", "Análisis"]) {
  console.log(`${label}: index ${xml.indexOf(label)}`);
}

function rowsNear(label, count = 12) {
  const i = xml.indexOf(label);
  const start = Math.max(0, i - 500);
  const slice = xml.slice(start, i + 20000);
  const rows = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
  console.log(`\nRows near '${label}' (${rows.length} total):`);
  rows.slice(0, count).forEach((r, idx) => {
    const texts = [...r[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]);
    console.log(`R${idx}: ${texts.join(" | ")}`);
  });
}

function rowsAt(index, before = 2000, after = 40000, count = 15) {
  const start = Math.max(0, index - before);
  const slice = xml.slice(start, index + after);
  const rows = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
  console.log(`\nRows at index ${index} (${rows.length} total):`);
  rows.slice(0, count).forEach((r, idx) => {
    const texts = [...r[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]);
    console.log(`R${idx}: ${texts.join(" | ")}`);
  });
}

rowsAt(469296, 15);
rowsAt(501908, 10);
