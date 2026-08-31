import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2];
const startText = process.argv[3];
const endText = process.argv[4];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "x-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const start = xml.indexOf(startText);
const end = xml.indexOf(endText, start);
const slice = xml.slice(start, end);
const rows = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
console.log(`Section ${startText} -> ${endText}: ${rows.length} rows`);
rows.forEach((row, i) => {
  const texts = [...row[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1].trim()).filter(Boolean);
  console.log(`${i}: [${texts.length} cells] ${texts.join(" | ")}`);
});
