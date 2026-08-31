import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const input = process.argv[2];
const output = process.argv[3] || input;

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

function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getRowTexts(rowXml) {
  return [...rowXml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1].trim()).filter(Boolean);
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
      `<w:p$1><w:r><w:rPr/>${value}</w:r></w:p>`
    );
  }
  if (/<w:r/.test(cellXml)) {
    return cellXml.replace(/(<w:r[^>]*>[\s\S]*?<\/w:rPr>)(\s*<\/w:r>)/, `$1${value}$2`);
  }
  return cellXml.replace(
    /(<w:p[^>]*>[\s\S]*?<w:pPr>[\s\S]*?<\/w:pPr>)/,
    `$1<w:r><w:rPr/>${value}</w:r>`
  );
}

function fillRowCells(rowXml, values) {
  const cellMatches = [...rowXml.matchAll(/<w:tc[\s\S]*?<\/w:tc>/g)];
  let updated = rowXml;
  let offset = 0;
  for (let i = 0; i < values.length && i < cellMatches.length; i++) {
    const match = cellMatches[i];
    const cell = match[0];
    const filled = setCellText(cell, values[i]);
    const pos = match.index + offset;
    updated = updated.slice(0, pos) + filled + updated.slice(pos + cell.length);
    offset += filled.length - cell.length;
  }
  return updated;
}

function findHeaderRowIndex(rows, headers) {
  return rows.findIndex((row) => {
    const texts = getRowTexts(row[0]);
    return headers.every((header) => texts.some((text) => text.includes(header)));
  });
}

function fillRowsAfterHeaderInSlice(slice, headers, dataRows) {
  const rowMatches = [...slice.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
  const headerIdx = findHeaderRowIndex(rowMatches, headers);
  if (headerIdx === -1) {
    throw new Error(`No se encontró encabezado: ${headers.join(", ")}`);
  }

  let result = slice;
  let offset = 0;
  for (let i = 0; i < dataRows.length; i++) {
    const match = rowMatches[headerIdx + 1 + i];
    if (!match) break;
    const row = match[0];
    const filled = fillRowCells(row, dataRows[i]);
    const pos = match.index + offset;
    result = result.slice(0, pos) + filled + result.slice(pos + row.length);
    offset += filled.length - row.length;
  }
  return result;
}

function findSectionBounds(xml, startMarker, endMarker, anchorText) {
  let searchFrom = 0;
  let best = null;
  while (true) {
    const start = xml.indexOf(startMarker, searchFrom);
    if (start === -1) break;
    const end = xml.indexOf(endMarker, start + startMarker.length);
    if (end === -1) break;
    const section = xml.slice(start, end);
    const match = { start, end, section };
    if (!anchorText || section.includes(anchorText)) {
      return match;
    }
    if (!best || section.length > best.section.length) {
      best = match;
    }
    searchFrom = start + startMarker.length;
  }
  if (best) return best;
  throw new Error(`Sección no encontrada: ${startMarker}`);
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

function fillSectionLabels(xml, startMarker, endMarker, labels, anchorText) {
  const { start, end, section: initial } = findSectionBounds(xml, startMarker, endMarker, anchorText);
  let section = initial;
  for (const [label, value] of labels) {
    const exact = `<w:t>${label}</w:t>`;
    let labelPos = section.indexOf(exact);
    if (labelPos === -1 && label.includes(" ")) {
      const partial = label.split(" ").at(-1);
      labelPos = section.indexOf(`<w:t>${partial}</w:t>`);
    }
    if (labelPos === -1) continue;
    const before = section.slice(0, labelPos);
    const after = section.slice(labelPos);
    const searchLabel = section.slice(labelPos, labelPos + 120).includes(exact)
      ? label
      : label.split(" ").at(-1);
    section = before + fillLabelInNextCell(after, searchLabel, value);
  }
  return xml.slice(0, start) + section + xml.slice(end);
}

function fillHeadingNextParagraph(section, heading, value) {
  const headingPos = section.indexOf(`<w:t>${heading}</w:t>`);
  if (headingPos === -1) return section;

  const paraStart = section.indexOf("<w:p", headingPos + heading.length);
  if (paraStart === -1) return section;
  const paraEnd = section.indexOf("</w:p>", paraStart);
  if (paraEnd === -1) return section;

  const para = section.slice(paraStart, paraEnd);
  const filledPara = setCellText(para, value);
  return section.slice(0, paraStart) + filledPara + section.slice(paraEnd);
}

function fillSectionHeadings(xml, startMarker, endMarker, entries, anchorText) {
  const { start, end, section: initial } = findSectionBounds(xml, startMarker, endMarker, anchorText);
  let section = initial;
  for (const [heading, value] of entries) {
    section = fillHeadingNextParagraph(section, heading, value);
  }
  return xml.slice(0, start) + section + xml.slice(end);
}

function replaceInSection(xml, startMarker, endMarker, find, value, anchorText) {
  const { start, end, section } = findSectionBounds(xml, startMarker, endMarker, anchorText);
  const updated = section.split(find).join(escapeXml(value));
  return xml.slice(0, start) + updated + xml.slice(end);
}

function fillTableInSection(xml, startMarker, endMarker, anchorText, headers, rows) {
  const { start, end, section } = findSectionBounds(xml, startMarker, endMarker, anchorText);
  const updated = fillRowsAfterHeaderInSlice(section, headers, rows);
  return xml.slice(0, start) + updated + xml.slice(end);
}

const reglasRows = [
  [
    "RN-01",
    "Superadmin no tiene empresa_id; demás roles requieren empresa activa.",
    "Política RLS",
    "Superadmin",
    "N/A",
    "Vigente",
  ],
  [
    "RN-02",
    "Curso con empresa_id nulo es global; con valor es privado del tenant.",
    "Modelo catálogo",
    "Instructor",
    "N/A",
    "Vigente",
  ],
  [
    "RN-03",
    "Colaborador puede auto-inscribirse en cursos publicados visibles.",
    "Inscripción libre",
    "Colaborador",
    "Asignación forzada",
    "Vigente",
  ],
  [
    "RN-04",
    "Solo autor o superadmin puede editar un curso.",
    "Autorización curso",
    "Instructor",
    "N/A",
    "Vigente",
  ],
];

const matrizRows = [
  ["RF-001", "Autenticación y sesión por rol", "Funcional", "P1", "Haider Y. Bello Melo", "Implementado", "1.0", "Etapa 2", "R1"],
  ["RF-002", "Gestión de empresas y usuarios", "Funcional", "P1", "Haider Y. Bello Melo", "Implementado", "1.0", "Etapa 2-3", "R1"],
  ["RF-003", "Autoría de cursos y evaluaciones", "Funcional", "P1", "Haider Y. Bello Melo", "Implementado", "1.0", "Etapa 2-3", "R1"],
  ["RF-004", "Consumo estudiante e inscripción", "Funcional", "P1", "Haider Y. Bello Melo", "Implementado", "1.0", "Etapa 2-3", "R1"],
  ["RF-005", "Reportes superadmin/empresa", "Funcional", "P2", "Haider Y. Bello Melo", "Implementado", "1.0", "Etapa 3", "R1"],
];

const kpiRows = [
  ["% avance", "(Completados / Total) × 100", "≥ 85% al cierre MVP", "~70%", "↑"],
  ["Cumplimiento de hitos", "Hitos cumplidos / Hitos planificados", "≥ 90%", "75%", "→"],
  ["Lead Time", "Fecha fin − Fecha inicio por HU", "≤ 10 días HU promedio", "En medición", "→"],
  ["Cycle Time", "Tiempo en desarrollo activo", "≤ 7 días", "En medición", "→"],
  ["Throughput", "HU completadas por sprint", "≥ 8 por sprint", "En medición", "→"],
  ["Aging", "Días en estado Bloqueado", "≤ 3 días", "0", "→"],
  ["Requerimientos bloqueados", "Req. con estado Bloqueado", "0 al cierre sprint", "0", "→"],
  ["Requerimientos reabiertos", "Req. reabiertos / Total", "≤ 5%", "0%", "→"],
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-remaining-"));
const unzipped = unzipDocx(input, tmp);
const xmlPath = path.join(unzipped, "word", "document.xml");
let xml = fs.readFileSync(xmlPath, "utf8");

xml = fillTableInSection(
  xml,
  "12. REGLAS DE NEGOCIO",
  "13. REQUERIMIENTOS TÉCNICOS",
  "Regla",
  ["ID", "Regla"],
  reglasRows
);

xml = fillTableInSection(
  xml,
  "16. MATRIZ MAESTRA",
  "17. PRIORIZACIÓN",
  "Consolidado de todos los requerimientos",
  ["ID", "Nombre", "Tipo"],
  matrizRows
);

xml = fillSectionHeadings(
  xml,
  "19. FACTIBILIDAD",
  "20. ESTIMACIÓN",
  [
    ["Factibilidad funcional", "Alta — núcleo académico y multiempresa ya implementado."],
    ["Factibilidad técnica", "Alta — stack probado, CI/CD y producción activa en Cloud Run."],
    ["Factibilidad operativa", "Media — pendiente UAT formal, certificados y pagos."],
    ["Factibilidad de tiempo", "Media — meta Q4 2026 viable con alcance MVP acotado."],
    [
      "Clasificación final",
      "Viable con condiciones — pendiente cierre de certificados, pagos y UAT.",
    ],
  ],
  "Factibilidad funcional"
);

xml = fillSectionLabels(
  xml,
  "39. PLAN DE RELEASE",
  "40. CHECKLIST DE GO-LIVE",
  [
    ["Release ID", "R1"],
    ["Versión", "1.0"],
    ["Fecha", "Q4 2026"],
    ["Ambiente", "Producción Cloud Run"],
    ["Componentes", "Frontend + Backend monorepo Next.js"],
    ["Requerimientos incluidos", "RF-001 a RF-005, RNF-01 a RNF-04"],
    ["Responsable", "Haider Yessid Bello Melo"],
    ["Riesgo", "Medio — dependencia GCP/SendGrid y alcance pendiente certificados"],
    ["Ventana despliegue", "Post-UAT, ventana acordada con Operaciones"],
    ["Rollback", "Revertir revisión Cloud Run + rollback migraciones documentado"],
  ],
  "Rollback"
);

xml = fillSectionHeadings(
  xml,
  "46. STATUS REPORT",
  "47. INDICADORES",
  [
    ["Estado general", "🟡 Amarillo"],
    [
      "Logros del período",
      "Cimientos técnicos completos, migración a GCP, flujo estudiante/instructor operativo y CI/CD activo.",
    ],
    [
      "Trabajo en curso",
      "Etapa 3: paneles admin/empresa, asignaciones forzadas, certificados y pagos en definición.",
    ],
    [
      "Próximos pasos",
      "Cerrar MVP funcional, ejecutar UAT y preparar go-live Q4 2026.",
    ],
    [
      "Riesgos",
      "1) Dependencia Cloud SQL, GCS y SendGrid. 2) Retraso en certificados y pagos.",
    ],
    [
      "Bloqueos",
      "Ninguno crítico reportado; pendiente definición de certificados y pagos.",
    ],
    [
      "Decisiones requeridas",
      "Alcance final certificados/pagos; URL oficial de producción; código documental PMO.",
    ],
  ],
  "Logros del"
);

xml = fillSectionHeadings(
  xml,
  "48. DASHBOARD EJECUTIVO",
  "49. EVIDENCIAS",
  [
    ["Estado", "🟡 Amarillo"],
    [
      "Top riesgos",
      "1) Dependencia Cloud SQL, GCS y SendGrid. 2) Retraso en certificados y pagos.",
    ],
    [
      "Próximos hitos",
      "Completar Etapa 3 y ejecutar UAT — meta Q4 2026.",
    ],
    [
      "Decisiones pendientes",
      "Alcance MVP vs Fase 2; URL producción; código documental PMO.",
    ],
  ],
  "Top riesgos"
);

xml = fillTableInSection(
  xml,
  "47. INDICADORES",
  "48. DASHBOARD",
  "KPI",
  ["KPI", "Fórmula"],
  kpiRows
);

for (const [find, value] of [
  ["🟢 Verde   🟡 Amarillo   🔴 Rojo", "🟡 Amarillo"],
]) {
  xml = xml.split(find).join(escapeXml(value));
}

fs.writeFileSync(xmlPath, xml, "utf8");
const zipOut = path.join(tmp, "filled.zip");
zipFolder(unzipped, zipOut);
fs.copyFileSync(zipOut, output);

const remaining = (xml.match(/\[Diligenciar\]/g) || []).length;
console.log(`Secciones restantes actualizadas en: ${output}`);
console.log(`Placeholders [Diligenciar] restantes: ${remaining}`);
