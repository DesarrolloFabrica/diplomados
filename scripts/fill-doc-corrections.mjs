import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";
import { rfFichasBlock, sec17IniciativasBlock, anexosGitHubBlock } from "./rf-fichas-content.mjs";

const input = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const output = process.argv[3] || input;

function unzipDocx(docxPath, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const zipCopy = path.join(dest, "doc.zip");
  fs.copyFileSync(docxPath, zipCopy);
  const unzipped = path.join(dest, "unzipped");
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${unzipped.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" },
  );
  return unzipped;
}

function zipFolder(folder, outZip) {
  if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
  execSync(
    `powershell -NoProfile -Command "Compress-Archive -Path '${path.join(folder, "*").replace(/'/g, "''")}' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force"`,
    { stdio: "inherit" },
  );
}

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setCellText(cellXml, text) {
  const value = `<w:t xml:space="preserve">${escapeXml(text)}</w:t>`;
  if (/<w:t(?:\s[^>]*)?>/.test(cellXml)) {
    let first = true;
    return cellXml.replace(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g, () => {
      if (first) {
        first = false;
        return value;
      }
      return `<w:t xml:space="preserve"></w:t>`;
    });
  }
  if (/<w:p[^>]*\/>/.test(cellXml)) {
    return cellXml.replace(
      /<w:p([^>]*)\/>/,
      `<w:p$1><w:r><w:rPr/>${value}</w:r></w:p>`,
    );
  }
  if (/<w:r/.test(cellXml)) {
    return cellXml.replace(
      /(<w:r[^>]*>[\s\S]*?<\/w:rPr>)(\s*<\/w:r>)/,
      `$1${value}$2`,
    );
  }
  if (/<w:p[^>]*>/.test(cellXml)) {
    return cellXml.replace(
      /(<w:p[^>]*>[\s\S]*?<\/w:pPr>[\s\S]*?<\/w:pPr>)/,
      `$1<w:r><w:rPr/>${value}</w:r>`,
    );
  }
  return cellXml.replace(/(<w:tcPr>[\s\S]*?<\/w:tcPr>)/, `$1<w:p><w:r><w:rPr/>${value}</w:r></w:p>`);
}

function fillLabelInNextCell(section, label, value) {
  const exact = `<w:t>${label}</w:t>`;
  let labelPos = section.indexOf(exact);
  if (labelPos === -1) return section;

  const cellEnd = section.indexOf("</w:tc>", labelPos);
  if (cellEnd === -1) return section;

  const nextCellStart = section.indexOf("<w:tc", cellEnd);
  if (nextCellStart === -1) return section;
  const nextCellEnd = section.indexOf("</w:tc>", nextCellStart);
  if (nextCellEnd === -1) return section;

  const nextCell = section.slice(nextCellStart, nextCellEnd);
  const filledCell = setCellText(nextCell, value);
  return section.slice(0, nextCellStart) + filledCell + section.slice(nextCellEnd);
}

function replaceAll(xml, find, replace) {
  if (!xml.includes(find)) return xml;
  return xml.split(find).join(replace);
}

function plainLinesToWordXml(text) {
  return text
    .split("\n")
    .map(
      (line) =>
        `<w:p><w:r><w:rPr/><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`,
    )
    .join("");
}

function paragraphText(pXml) {
  return [...pXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)]
    .map((m) => m[1])
    .join("");
}

function insertAfterParagraphMatching(xml, matchFn, insertText) {
  const paragraphs = [...xml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)];
  for (const match of paragraphs) {
    const pXml = match[0];
    if (!matchFn(paragraphText(pXml))) continue;
    const insertXml = plainLinesToWordXml(insertText);
    const idx = match.index + pXml.length;
    return xml.slice(0, idx) + insertXml + xml.slice(idx);
  }
  console.warn("WARN: párrafo ancla no encontrado");
  return xml;
}

function insertBeforeParagraphExact(xml, exactText, insertText) {
  const paragraphs = [...xml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)];
  for (const match of paragraphs) {
    const pXml = match[0];
    if (paragraphText(pXml) !== exactText) continue;
    const insertXml = plainLinesToWordXml(insertText);
    return xml.slice(0, match.index) + insertXml + xml.slice(match.index);
  }
  console.warn(`WARN: no párrafo exacto: ${exactText.slice(0, 50)}`);
  return xml;
}

function findSectionBounds(xml, startMarker, endMarker, anchorText) {
  let searchFrom = 0;
  while (true) {
    const start = xml.indexOf(startMarker, searchFrom);
    if (start === -1) break;
    const end = xml.indexOf(endMarker, start + startMarker.length);
    if (end === -1) break;
    const section = xml.slice(start, end);
    if (!anchorText || section.includes(anchorText)) {
      return { start, end, section };
    }
    searchFrom = start + startMarker.length;
  }
  return null;
}

function patchControlSection(xml) {
  const bounds = findSectionBounds(
    xml,
    "CONTROL DOCUMENTAL",
    "Historial de versiones",
    "Nombre documento",
  );
  if (!bounds) return xml;

  let section = bounds.section;
  section = fillLabelInNextCell(section, "Nombre documento", "Gestión de Requerimientos — Diplomados CUN (Diplomados_Requerimientos_v2)");
  section = fillLabelInNextCell(section, "Proyecto", "Plataforma Empresarial de Formación Autoguiada — Diplomados CUN");
  section = fillLabelInNextCell(section, "Código", "Pendiente de asignación PMO");
  section = fillLabelInNextCell(section, "Fecha creación", "20/08/2026");
  section = fillLabelInNextCell(
    section,
    "Elaboró",
    "Iron Alexander Fuentes Rodríguez (PO) / Haider Yessid Bello Melo (Tech Lead) / Juan Andrés Hermida Vargas (co-elaborador QA)",
  );
  section = fillLabelInNextCell(section, "Revisó", "Johan Sebastián Daza Sarmiento (PM)");
  section = fillLabelInNextCell(
    section,
    "Aprobó",
    "Iron Alexander Fuentes Rodríguez (PO) — firma formal al cierre del documento",
  );
  section = fillLabelInNextCell(section, "Estado", "En elaboración — Etapa 3 / Sprint 3 en curso; requerimiento no cerrado (Secc. 50)");
  section = fillLabelInNextCell(section, "Clasificación", "Uso interno CUN");

  return xml.slice(0, bounds.start) + section + xml.slice(bounds.end);
}

function patchPortada(xml) {
  const start = xml.indexOf("DOCUMENTO DE GESTIÓN");
  const end = xml.indexOf("CONTROL DOCUMENTAL", start > -1 ? start : 0);
  if (start === -1 || end === -1) return xml;

  let section = xml.slice(start, end);
  section = fillLabelInNextCell(
    section,
    "Proyecto",
    "Diplomados — Plataforma Empresarial de Formación Autoguiada",
  );
  section = fillLabelInNextCell(section, "Plataforma", "Nexus");

  let out = xml.slice(0, start) + section + xml.slice(end);

  out = replaceAll(
    out,
    "Gestión de Requerimientos — Fenix (Diplomados_Requerimientos_v2)",
    "Gestión de Requerimientos — Diplomados CUN (Diplomados_Requerimientos_v2)",
  );
  out = replaceAll(
    out,
    "Plataforma Empresarial de Formación Autoguiada — Fenix",
    "Plataforma Empresarial de Formación Autoguiada — Diplomados CUN",
  );
  out = replaceAll(
    out,
    "Plataforma Empresarial de Formacion Autoguiada — Fenix",
    "Plataforma Empresarial de Formación Autoguiada — Diplomados CUN",
  );
  out = replaceAll(out, "Pendiente Codigo de asignación PMO", "Pendiente de asignación PMO");
  out = replaceAll(out, "19/08/2026 (fecha solicitud SOL-DIP-2026-001 — Secc. 2)", "20/08/2026");
  out = replaceAll(
    out,
    "Iron Alexander Fuentes Rodríguez (pendiente firma formal)",
    "Iron Alexander Fuentes Rodríguez (PO) — firma formal al cierre del documento",
  );
  out = replaceAll(
    out,
    "Iron Alexander Fuentes Rodríguez\u00a0(pendiente firma formal)",
    "Iron Alexander Fuentes Rodríguez (PO) — firma formal al cierre del documento",
  );
  out = out.replace(
    /Iron Alexander Fuentes Rodríguez[\s\u00a0\u2007\u202f]*\(pendiente firma formal\)/gi,
    "Iron Alexander Fuentes Rodríguez (PO) — firma formal al cierre del documento",
  );

  if (!out.includes("Co-elaborador")) {
    out = insertAfterParagraphMatching(
      out,
      (line) => line.includes("Alberto Mario Valencia Zableh"),
      "Co-elaborador\nJuan Andrés Hermida Vargas (QA — Secc. 35–54)",
    );
  }

  return out;
}

function patchBpmnPlaceholder(xml) {
  return replaceAll(
    xml,
    "[Diagrama de flujo actual (AS IS)]",
    "Diagrama BPMN AS IS insertado en este documento (Secc. 6).",
  ).replace(
    "[Diagrama de flujo futuro (TO BE)]",
    "Diagrama BPMN TO BE insertado en este documento (Secc. 7).",
  );
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-corrections-"));
const unzipped = unzipDocx(input, tmp);
const xmlPath = path.join(unzipped, "word", "document.xml");
let xml = fs.readFileSync(xmlPath, "utf8");

console.log("→ Corrigiendo control documental y portada...");
xml = patchPortada(xml);
xml = patchControlSection(xml);

console.log("→ Insertando fichas RF-002 a RF-006...");
if (!xml.includes("RF-002 — Gestión de empresas")) {
  xml = insertAfterParagraphMatching(
    xml,
    (line) =>
      line.includes("Entonces se crea una inscripción") &&
      line.includes("ruta de aprendizaje del curso"),
    rfFichasBlock,
  );
} else {
  console.log("  (RF-002+ ya presentes, omitido)");
}

console.log("→ Insertando tabla de iniciativas Secc. 17...");
if (!xml.includes("UI interactiva — roadmap gamificado")) {
  xml = insertAfterParagraphMatching(
    xml,
    (line) => line.includes("evitando decisiones subjetivas"),
    sec17IniciativasBlock,
  );
} else {
  console.log("  (Iniciativas ya presentes, omitido)");
}

console.log("→ Actualizando anexos GitHub / pendientes...");
if (!xml.includes("EV-007 Capturas QA localhost")) {
  xml = insertAfterParagraphMatching(
    xml,
    (line) =>
      line.includes("Espacio para adjuntar o referenciar material complementario"),
    anexosGitHubBlock,
  );
}

console.log("→ BPMN placeholders...");
xml = patchBpmnPlaceholder(xml);

xml = replaceAll(
  xml,
  "Resultado de priorización — iniciativas evaluadas (26/08/2026)",
  "Resultado de priorización ponderada — iniciativas evaluadas (26/08/2026)",
);
xml = replaceAll(
  xml,
  "Iniciativa | VN (20%) | UX (25%) | Urg (15%) | Viab (15%) | Riesgo (15%) | Esf (10%) | Total | Prioridad",
  "Iniciativa | VN (20%) | UX (25%) | Urg (15%) | Viab (15%) | Riesgo (15%) | Esf (10%) | Total ponderado | Prioridad",
);
xml = replaceAll(
  xml,
  "Nota: escala 1–5 por factor. Total = suma ponderada.",
  "Nota: escala 1–5 por factor. Total = suma ponderada (metodología de ponderación Secc. 17).",
);
xml = replaceAll(xml, "(pendiente firma formal)", "(PO) — firma formal al cierre del documento");

fs.writeFileSync(xmlPath, xml, "utf8");
const zipOut = path.join(tmp, "filled.zip");
zipFolder(unzipped, zipOut);
try {
  fs.copyFileSync(zipOut, output);
} catch (err) {
  if (err.code === "EBUSY") {
    const alt = output.replace(/\.docx$/i, "_corregido.docx");
    fs.copyFileSync(zipOut, alt);
    console.warn(`\nArchivo bloqueado; guardado como: ${alt}`);
    console.warn("Cierra Word y vuelve a ejecutar para sobrescribir el original.");
  } else {
    throw err;
  }
  process.exit(0);
}

console.log(`\nDocumento corregido: ${output}`);
