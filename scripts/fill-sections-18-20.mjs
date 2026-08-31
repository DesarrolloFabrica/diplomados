import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const input = process.argv[2] || "scripts/Diplomados_Requerimientos_v2_actualizado.docx";
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
      `<w:p$1><w:r><w:rPr/>${value}</w:r></w:p>`,
    );
  }
  if (/<w:r/.test(cellXml)) {
    return cellXml.replace(/(<w:r[^>]*>[\s\S]*?<\/w:rPr>)(\s*<\/w:r>)/, `$1${value}$2`);
  }
  return cellXml.replace(
    /(<w:p[^>]*>[\s\S]*?<w:pPr>[\s\S]*?<\/w:pPr>)/,
    `$1<w:r><w:rPr/>${value}</w:r>`,
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

function findAnchorIndex(xml, anchor, requiredNearby = []) {
  let searchFrom = 0;
  while (true) {
    const idx = xml.indexOf(`<w:t>${anchor}</w:t>`, searchFrom);
    if (idx === -1) return -1;
    const slice = xml.slice(idx, idx + 4000);
    if (requiredNearby.every((text) => slice.includes(`<w:t>${text}</w:t>`))) {
      return idx;
    }
    searchFrom = idx + 1;
  }
}

function fillTableByAnchor(xml, anchor, requiredNearby, headers, dataRows, sliceBefore = 500, sliceAfter = 50000) {
  const anchorIdx = findAnchorIndex(xml, anchor, requiredNearby);
  if (anchorIdx === -1) {
    throw new Error(`Ancla no encontrada: ${anchor}`);
  }
  const start = Math.max(0, anchorIdx - sliceBefore);
  const end = Math.min(xml.length, anchorIdx + sliceAfter);
  const slice = xml.slice(start, end);
  const updatedSlice = fillRowsAfterHeaderInSlice(slice, headers, dataRows);
  return xml.slice(0, start) + updatedSlice + xml.slice(end);
}

function impactRow(dimension, level, comment) {
  const marks = ["", "", "", ""];
  const levelIndex = { sin: 0, bajo: 1, medio: 2, alto: 3 }[level];
  marks[levelIndex] = "☑";
  return [dimension, ...marks, comment];
}

const impactoRows = [
  impactRow(
    "Negocio",
    "medio",
    "Nueva línea B2B de diplomados para empresas aliadas; ingresos y operación comercial por tenant.",
  ),
  impactRow(
    "Operación",
    "medio",
    "Fábrica de Contenido gestiona catálogo, inscripciones, evaluaciones y reportes por empresa.",
  ),
  impactRow(
    "Usuarios",
    "alto",
    "Cuatro roles con experiencias distintas: superadmin, admin empresa, instructor y colaborador.",
  ),
  impactRow(
    "Frontend",
    "alto",
    "Next.js 15, roadmap gamificado, hero con CTA, embeds Adobe/Drive y paneles responsive.",
  ),
  impactRow(
    "Backend",
    "alto",
    "Server Actions, Drizzle ORM, RLS multiempresa, progreso, evaluaciones y auth JWT.",
  ),
  impactRow(
    "Base de datos",
    "medio",
    "PostgreSQL 16 con 11 migraciones, políticas RLS y rol app_user dedicado.",
  ),
  impactRow(
    "Integraciones",
    "medio",
    "GCS, SendGrid, proxy Google Drive y piloto Adobe Publish Online para contenidos.",
  ),
  impactRow(
    "Seguridad",
    "alto",
    "JWT httpOnly, bcrypt, RLS por empresa, URLs firmadas y validación Zod.",
  ),
  impactRow(
    "Infraestructura",
    "medio",
    "Cloud Run, Cloud SQL, Artifact Registry y CI/CD con GitHub Actions.",
  ),
  impactRow(
    "QA",
    "medio",
    "Pruebas funcionales por rol; UAT formal pendiente para cierre MVP Q4 2026.",
  ),
  impactRow(
    "Documentación",
    "bajo",
    "README técnico, plantilla PMO y scripts de soporte documental del proyecto.",
  ),
];

const estimacionRows = [
  [
    "Análisis",
    "Iron Alexander Fuentes Rodríguez",
    "80 h",
    "Media",
    "Definición de alcance MVP, priorización PMO y criterios de aceptación",
  ],
  [
    "UX/UI",
    "Iron Alexander Fuentes Rodríguez",
    "120 h",
    "Alta",
    "Identidad CUN, roadmap gamificado, hero, lecciones y accesibilidad responsive",
  ],
  [
    "Backend",
    "Haider Yessid Bello Melo",
    "320 h",
    "Alta",
    "Cloud SQL, RLS multiempresa, Server Actions, auth JWT y evaluaciones",
  ],
  [
    "Frontend",
    "Haider Yessid Bello Melo",
    "280 h",
    "Alta",
    "Next.js 15 App Router, paneles por rol, roadmap, embeds de contenido",
  ],
  [
    "Data",
    "Haider Yessid Bello Melo",
    "80 h",
    "Media",
    "11 migraciones SQL, carga de contenidos y rol app_user",
  ],
  [
    "QA",
    "Johan Sebastián Daza Sarmiento",
    "120 h",
    "Media",
    "Pruebas funcionales por rol; ambientes local (Docker) y Cloud Run",
  ],
  [
    "DevOps",
    "Haider Yessid Bello Melo",
    "60 h",
    "Media",
    "Docker Compose, GitHub Actions CI/CD y despliegue Cloud Run",
  ],
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-18-20-"));
const unzipped = unzipDocx(input, tmp);
const xmlPath = path.join(unzipped, "word", "document.xml");
let xml = fs.readFileSync(xmlPath, "utf8");

xml = fillTableByAnchor(
  xml,
  "Dimensión",
  ["Sin impacto", "Alto", "Comentario"],
  ["Dimensión", "Sin impacto"],
  impactoRows,
);

xml = fillTableByAnchor(
  xml,
  "Componente",
  ["Responsable", "Estimación", "Complejidad"],
  ["Componente", "Responsable", "Estimación"],
  estimacionRows,
);

fs.writeFileSync(xmlPath, xml, "utf8");
const zipOut = path.join(tmp, "filled.zip");
zipFolder(unzipped, zipOut);
fs.copyFileSync(zipOut, output);

console.log(`Secciones 18 y 20 actualizadas en: ${output}`);
