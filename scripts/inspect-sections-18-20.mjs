import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const files = process.argv.slice(2);
if (files.length === 0) {
  files.push(
    "Diplomados_Requerimientos_v2.docx",
    "scripts/Diplomados_Requerimientos_v2_actualizado.docx",
  );
}

for (const doc of files) {
  if (!fs.existsSync(doc)) {
    console.log(`SKIP missing: ${doc}`);
    continue;
  }
  console.log(`\n######## ${doc} ########`);
  inspectDoc(doc);
}

function inspectDoc(doc) {
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-inspect-"));
fs.mkdirSync(tmp, { recursive: true });
const zipCopy = path.join(tmp, "d.zip");
fs.copyFileSync(doc, zipCopy);
const unzipped = path.join(tmp, "u");
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${unzipped.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" },
);

const xml = fs.readFileSync(path.join(unzipped, "word", "document.xml"), "utf8");

function dumpSection(title) {
  const markers = [title, title.replace("Á", "&#193;"), "IMPACTO", "ESTIMACI"];
  let i = -1;
  let used = title;
  for (const m of markers) {
    i = xml.indexOf(m);
    if (i >= 0) {
      used = m;
      break;
    }
  }
  if (i < 0) {
    console.log(`NOT FOUND: ${title}`);
    return;
  }
  const slice = xml.slice(i, i + 50000);
  const rows = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)].slice(0, 15);
  console.log(`\n=== ${used} (rows: ${rows.length}) ===`);
  rows.forEach((r, idx) => {
    const texts = [...r[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((x) => x[1]);
    console.log(`R${idx}: ${texts.join(" | ")}`);
  });
}

dumpSection("18. ANÁLISIS DE IMPACTO");
dumpSection("20. ESTIMACIÓN");
for (const label of ["Negocio", "Dimensión", "Sin impacto", "Análisis", "Componente", "Responsable"]) {
  console.log(`  contains '${label}':`, xml.includes(label));
}
}
