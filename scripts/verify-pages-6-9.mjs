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
    const t = [...r[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1].trim()).filter(Boolean);
    return headerParts.every((h) => t.some((x) => x.includes(h)));
  });
  console.log(`\n=== ${headerParts.join(" / ")} ===`);
  for (let i = 1; i <= count; i++) {
    const t = [...rows[idx + i][0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1].trim()).filter(Boolean);
    console.log(`${i}: ${t.join(" | ")}`);
  }
}

show(["Paso", "Problema actual"]);
show(["Paso", "Actividad futura"]);
show(["Stakeholder", "Responsabilidad"]);

const start = xml.indexOf("Autenticación y gestión de sesión por rol");
const end = xml.indexOf("Precondiciones", start);
const slice = xml.slice(start, end);
for (const label of ["ID", "Nombre", "Descripción", "Actor", "Prioridad", "Estado"]) {
  const i = slice.indexOf(label);
  const chunk = slice.slice(i, i + 800);
  const texts = [...chunk.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1].trim()).filter(Boolean);
  if (texts.length >= 2) console.log(`${label}: ${texts[1]}`);
}

for (const step of ["1. El usuario", "2. El sistema", "3. El middleware"]) {
  console.log(xml.includes(step) ? `OK ${step}` : `MISSING ${step}`);
}
