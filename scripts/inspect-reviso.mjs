import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2_corregido.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rev-"));
const zipCopy = path.join(tmp, "d.zip");
fs.copyFileSync(docx, zipCopy);
const unzipped = path.join(tmp, "u");
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${unzipped.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" },
);
const xml = fs.readFileSync(path.join(unzipped, "word", "document.xml"), "utf8");

const start = xml.indexOf("Nombre documento");
const end = xml.indexOf("Historial de versiones", start);
const section = xml.slice(start, end);

for (const label of ["Elaboró", "Revisó", "Aprobó", "Estado"]) {
  const exact = `<w:t>${label}</w:t>`;
  const pos = section.indexOf(exact);
  console.log(label, "exact pos", pos);
  if (pos === -1) {
    const alt = [...section.matchAll(new RegExp(`<w:t[^>]*>${label[0]}[^<]{0,10}<\\/w:t>`, "g"))];
    console.log("  alt matches", alt.length);
    continue;
  }
  const cellEnd = section.indexOf("</w:tc>", pos);
  const nextCellStart = section.indexOf("<w:tc", cellEnd);
  const nextCellEnd = section.indexOf("</w:tc>", nextCellStart);
  const nextCell = section.slice(nextCellStart, nextCellEnd);
  const texts = [...nextCell.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  console.log("  next cell text:", JSON.stringify(texts.join("")));
  if (label === "Revisó") fs.writeFileSync("scripts/_reviso-cell.xml", nextCell);
}
