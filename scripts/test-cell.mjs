import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = "c:/Users/juan_hermida/Downloads/Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "x-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const rows = [...xml.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
const idx = rows.findIndex((row) => row[0].includes("Problema actual") && row[0].includes(">Paso<"));
const cell = [...rows[idx + 1][0].matchAll(/<w:tc[\s\S]*?<\/w:tc>/g)][0][0];

function escapeXml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function setCellText(cellXml, text) {
  const value = `<w:t xml:space="preserve">${escapeXml(text)}</w:t>`;
  console.log("w:t", /<w:t/.test(cellXml));
  console.log("self p", /<w:p[^>]*\/>/.test(cellXml));
  console.log("w:r tag", /<w:r[^>]*>/.test(cellXml));
  if (/<w:t/.test(cellXml)) return cellXml.replace(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/, value);
  if (/<w:p[^>]*\/>/.test(cellXml)) {
    const out = cellXml.replace(/<w:p([^>]*)\/>/, `<w:p$1><w:r><w:rPr/>${value}</w:r></w:p>`);
    console.log("self p out changed", out !== cellXml);
    return out;
  }
  if (/<w:r[^>]*>/.test(cellXml)) {
    return cellXml.replace(/(<w:r[^>]*>[\s\S]*?<\/w:rPr>)(\s*<\/w:r>)/, `$1${value}$2`);
  }
  return cellXml;
}
const filled = setCellText(cell, "1");
console.log([...filled.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" | "));
