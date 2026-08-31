import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "ins-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`,
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");

const i17 = text.indexOf("17. PRIORIZACIÓN  OBLIGATORIO");
console.log("SEC17:", text.slice(i17, i17 + 2000).replace(/\s+/g, " "));

const i9 = text.indexOf("9. REQUERIMIENTOS FUNCIONALES  OBLIGATORIO");
const i10 = text.indexOf("10. REQUERIMIENTOS NO FUNCIONALES");
console.log("\nSEC9 tail:", text.slice(i9, i10).slice(-1500).replace(/\s+/g, " "));

// control doc labels
for (const label of ["Nombre documento", "Proyecto", "Revisó", "Aprobó", "Fecha creación", "Plataforma", "Co-elaborador"]) {
  const idx = text.indexOf(label);
  console.log(`\n${label}:`, text.slice(idx, idx + 120).replace(/\s+/g, " "));
}
