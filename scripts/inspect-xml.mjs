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
const start = xml.indexOf("Diligenciar una ficha por cada requerimiento funcional identificado");
const end = xml.indexOf("Precondiciones", start);
const slice = xml.slice(start, end);
const rows = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
rows.forEach((row, i) => {
  const texts = [...row[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1].trim()).filter(Boolean);
  if (texts.length) console.log(`${i}: ${texts.join(" | ")}`);
});
