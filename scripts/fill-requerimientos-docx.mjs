import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const source = process.argv[2];
const output = process.argv[3];
const contentPath = process.argv[4];

if (!source || !output || !contentPath) {
  console.error("Usage: node fill-requerimientos-docx.mjs <source.docx> <output.docx> <content.json>");
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync(contentPath, "utf8"));

function unzipDocx(docxPath, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const zipCopy = path.join(dest, "doc.zip");
  fs.copyFileSync(docxPath, zipCopy);
  const unzipped = path.join(dest, "unzipped");
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${unzipped.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" }
  );
  return unzipped;
}

function zipFolder(folder, outZip) {
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${path.join(folder, "*").replace(/'/g, "''")}' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" }
  );
}

function normalizeSplitPlaceholders(xml) {
  return xml
    .replace(/\[<\/w:t><\/w:r><w:r[^>]*><w:t>Diligenciar\]/g, "[Diligenciar]")
    .replace(/\[<\/w:t><\/w:r><w:r w:rsidDel[^>]*><w:t>Diligenciar\]/g, "[Diligenciar]");
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function replaceSequential(xml, find, values) {
  let result = xml;
  for (const value of values) {
    const idx = result.indexOf(find);
    if (idx === -1) break;
    result = result.slice(0, idx) + escapeXml(value) + result.slice(idx + find.length);
  }
  return result;
}

function replaceExact(xml, find, value) {
  return xml.split(find).join(escapeXml(value));
}

function fillLabelCellOnce(xml, label, value) {
  const anchor = `${label}</w:t></w:r></w:p></w:tc><w:tc>`;
  const idx = xml.indexOf(anchor);
  if (idx === -1) return xml;

  const rowStart = xml.lastIndexOf("<w:tr", idx);
  const rowEnd = xml.indexOf("</w:tr>", idx);
  if (rowStart === -1 || rowEnd === -1) return xml;

  const row = xml.slice(rowStart, rowEnd);
  if (row.includes("☐") || row.includes("☑")) return xml;

  const cellStart = idx + anchor.length - 6;
  const nextCellEnd = xml.indexOf("</w:tc>", cellStart);
  if (nextCellEnd === -1) return xml;

  const cell = xml.slice(cellStart, nextCellEnd);
  const filledCell = cell.replace(
    /<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/,
    `<w:t>${escapeXml(value)}</w:t>`
  );

  return xml.slice(0, cellStart) + filledCell + xml.slice(nextCellEnd);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-fill-"));
const unzipped = unzipDocx(source, tmp);
const xmlPath = path.join(unzipped, "word", "document.xml");
let xml = fs.readFileSync(xmlPath, "utf8");
xml = normalizeSplitPlaceholders(xml);

for (const section of content.applicableSections) {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(${escaped}[\\s\\S]{0,120}?<w:t>)☐(</w:t>[\\s\\S]{0,120}?<w:t>)☐`, "u");
  xml = xml.replace(re, "$1☑$2☐");
}

const specificKeys = Object.keys(content.replacements).filter((k) => k !== "[Diligenciar]");
for (const find of specificKeys) {
  xml = replaceExact(xml, find, content.replacements[find]);
}

if (Array.isArray(content.replacements["[Diligenciar]"])) {
  xml = replaceSequential(xml, "[Diligenciar]", content.replacements["[Diligenciar]"]);
}

for (const [label, value] of Object.entries(content.tableLabels)) {
  xml = fillLabelCellOnce(xml, label, value);
}

// Campos con etiquetas repetidas en varias tablas
const repeatedLabels = {
  Estado: "En desarrollo — Etapa 2 completada, Etapa 3 en curso",
  Prioridad: "P1 — Alta",
  Objetivo: "Implementar plataforma SaaS multiempresa para crear, administrar, inscribir y consumir cursos y diplomados autoguiados.",
  Solicitante: "Iron Alexander Fuentes Rodríguez",
  Proyecto: "Diplomados",
  Clasificación: "Uso interno",
};
for (const [label, value] of Object.entries(repeatedLabels)) {
  xml = fillLabelCellOnce(xml, label, value);
}

fs.writeFileSync(xmlPath, xml, "utf8");
const zipOut = path.join(tmp, "filled.zip");
zipFolder(unzipped, zipOut);
fs.copyFileSync(zipOut, output);

const remaining = (xml.match(/\[Diligenciar\]/g) || []).length;
console.log(`Documento generado: ${output}`);
console.log(`Placeholders restantes: ${remaining}`);
