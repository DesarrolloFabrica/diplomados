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

function sectionRows(start, end) {
  const s = xml.indexOf(start);
  const e = xml.indexOf(end, s);
  const slice = xml.slice(s, e);
  for (const row of slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)) {
    const texts = [...row[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1].trim()).filter(Boolean);
    if (texts.length >= 2) console.log(texts.join("  →  "));
  }
}

console.log("=== RESUMEN EJECUTIVO ===");
sectionRows("Nombre de la iniciativa", "ID Solicitud");
console.log("\n=== IDENTIFICACIÓN ===");
sectionRows("ID Solicitud", "Tipos de solicitud sugeridos");
