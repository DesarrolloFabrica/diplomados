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

function fillRowsAfterHeader(xml, headers, dataRows) {
  const rowMatches = [...xml.matchAll(/<w:tr[\s\S]*?<\/w:tr>/g)];
  const headerIdx = findHeaderRowIndex(rowMatches, headers);
  if (headerIdx === -1) {
    throw new Error(`No se encontró encabezado: ${headers.join(", ")}`);
  }

  let result = xml;
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

function findSectionBounds(xml, startMarker, endMarker, anchorText) {
  let searchFrom = 0;
  while (true) {
    const start = xml.indexOf(startMarker, searchFrom);
    if (start === -1) {
      throw new Error(`Sección no encontrada: ${startMarker}`);
    }
    const end = xml.indexOf(endMarker, start + startMarker.length);
    if (end === -1) {
      throw new Error(`Fin no encontrado: ${endMarker}`);
    }
    const section = xml.slice(start, end);
    if (!anchorText || section.includes(anchorText)) {
      return { start, end };
    }
    searchFrom = start + startMarker.length;
  }
}

function fillSectionLabels(xml, startMarker, endMarker, labels, anchorText) {
  const { start, end } = findSectionBounds(xml, startMarker, endMarker, anchorText);
  let section = xml.slice(start, end);
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

const nfrRows = [
  [
    "RNF-01",
    "Seguridad",
    "Aislamiento multiempresa con RLS en PostgreSQL y sesión JWT en cookie httpOnly",
    "Pruebas QA confirman que un tenant no accede a datos de otro; JWT no accesible desde JS",
    "P1",
  ],
  [
    "RNF-02",
    "Disponibilidad",
    "Servicio desplegado en Cloud Run con pipeline CI/CD automatizado",
    "Deploy exitoso post-merge a main; health check post-deploy en GitHub Actions",
    "P1",
  ],
  [
    "RNF-03",
    "Rendimiento",
    "Middleware valida JWT sin consulta a base de datos en cada navegación",
    "Navegación fluida en paneles principales; TTFB aceptable en Cloud Run",
    "P2",
  ],
  [
    "RNF-04",
    "Integridad de datos",
    "Todas las mutaciones validadas con esquemas Zod antes de persistir",
    "Datos inválidos rechazados con mensaje controlado; sin escrituras parciales",
    "P1",
  ],
];

const rp001Labels = [
  ["Nombre proceso", "Gestión de inscripciones y progreso del colaborador"],
  [
    "Objetivo",
    "Permitir que el colaborador se inscriba de forma autónoma en cursos publicados visibles para su empresa (o globales) y registre su avance lección a lección, habilitando reportes de seguimiento.",
  ],
  [
    "Responsable",
    "Iron Alexander Fuentes Rodríguez (funcional) / Haider Yessid Bello Melo (técnico)",
  ],
  [
    "Participantes",
    "Colaborador, Administrador de empresa, Instructor, Superadmin",
  ],
  [
    "Trigger",
    "El colaborador solicita inscripción desde el catálogo o completa una lección en la ruta de aprendizaje",
  ],
  [
    "Entrada",
    "Usuario autenticado con rol colaborador, empresa activa, curso publicado y visible según RLS (global o del tenant)",
  ],
  [
    "Actividad",
    "1) Colaborador selecciona inscribirme. 2) Server Action inscribirme() valida sesión y empresa. 3) RLS verifica puede_ver_curso() y crea inscripción. 4) Colaborador consume la ruta de aprendizaje. 5) Al completar lección, marcarLeccionCompletada() invoca registrar_progreso_leccion() en PostgreSQL. 6) Progreso visible en UI y reportes.",
  ],
  [
    "Reglas",
    "Inscripción libre (RN-03); sin duplicados; progreso solo con inscripción válida; aislamiento multiempresa vía RLS; cursos globales visibles para tenants autorizados",
  ],
  [
    "Salida",
    "Inscripción activa, progreso por lección persistido y porcentaje de avance visible en catálogo y reportes",
  ],
  [
    "Evidencia",
    "Tablas inscripciones y progreso_lecciones; función registrar_progreso_leccion; consultas de reportes admin/empresa",
  ],
  ["Sistema", "Plataforma Diplomados (Next.js 15 + PostgreSQL 16 / Drizzle ORM)"],
  [
    "SLA / tiempo esperado",
    "Inscripción en línea < 3 s bajo carga normal; registro de progreso inmediato al completar lección (< 2 s)",
  ],
  [
    "Excepción",
    "Ya inscrito → mensaje controlado; sin empresa → bloqueo; inscripción inválida al marcar progreso → error y re-login; fallos BD → error sin corrupción de datos",
  ],
  [
    "Escalamiento",
    "Colaborador → Admin empresa → Haider Yessid Bello Melo / Operaciones TI ante incidentes de RLS, BD o Cloud Run",
  ],
];

const arquitecturaLabels = [
  [
    "Arquitectura actual",
    "Sin plataforma integrada previa; operación manual o con herramientas no multiempresa.",
  ],
  [
    "Arquitectura propuesta",
    "Monorepo Next.js 15 + PostgreSQL (Drizzle) en Cloud Run, con GCS, SendGrid y RLS multiempresa.",
  ],
  [
    "Servicios involucrados",
    "Cloud Run, Cloud SQL, GCS, SendGrid, Artifact Registry, GitHub Actions.",
  ],
  [
    "Sistemas impactados",
    "Nuevo sistema Diplomados; procesos de Fábrica de Contenido y Operaciones.",
  ],
  ["APIs", "Server Actions Next.js; route handler GET /api/imagenes/google-drive."],
  ["Bases de datos", "PostgreSQL 16 — esquema plataforma_formacion."],
  ["Integraciones", "GCS, SendGrid, proxy Google Drive, importación GIFT."],
  ["Ambientes", "Local (Docker Postgres 5433); producción Cloud Run."],
  [
    "Seguridad",
    "JWT httpOnly, RLS, bcrypt, URLs firmadas GCS, secretos en GCP/GitHub.",
  ],
  [
    "Consideraciones técnicas",
    "Migración Supabase→GCP completada; app_user sujeto a RLS; deploy automático en main.",
  ],
];

const uxLabels = [
  ["Usuarios", "Superadmin, admin empresa, instructor, colaborador."],
  ["Roles", "Cuatro roles con paneles dedicados y redirección post-login."],
  [
    "Flujos",
    "Login, gestión académica, consumo de curso, evaluaciones, reportes.",
  ],
  [
    "Pantallas afectadas",
    "/admin, /empresa, /instructor, /mis-cursos y flujos de autenticación.",
  ],
  [
    "Diseño Figma",
    "No aplica — diseño implementado directamente en código con identidad gráfica CUN.",
  ],
  [
    "Prototipo",
    "Plataforma funcional desplegada en Cloud Run; validación UX en pantallas principales.",
  ],
  [
    "Accesibilidad",
    "Componentes shadcn/ui; revisión formal WCAG pendiente.",
  ],
  [
    "Responsive",
    "Sí — Tailwind responsive en catálogo, ruta de aprendizaje y paneles.",
  ],
  ["Aprobador UX", "Iron Alexander Fuentes Rodríguez"],
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-pages-"));
const unzipped = unzipDocx(input, tmp);
const xmlPath = path.join(unzipped, "word", "document.xml");
let xml = fs.readFileSync(xmlPath, "utf8");

xml = fillRowsAfterHeader(
  xml,
  ["ID", "Categoría", "Requerimiento", "Métrica / criterio", "Prioridad"],
  nfrRows
);

xml = fillSectionLabels(
  xml,
  "11. REQUERIMIENTOS DE PROCESO",
  "12. REGLAS DE NEGOCIO",
  rp001Labels,
  "Nombre proceso"
);

xml = fillSectionLabels(
  xml,
  "14. ARQUITECTURA",
  "15. EXPERIENCIA DE USUARIO",
  arquitecturaLabels,
  "Arquitectura actual"
);

xml = fillSectionLabels(
  xml,
  "15. EXPERIENCIA DE USUARIO",
  "16.",
  uxLabels,
  "Pantallas afectadas"
);

fs.writeFileSync(xmlPath, xml, "utf8");
const zipOut = path.join(tmp, "filled.zip");
zipFolder(unzipped, zipOut);
fs.copyFileSync(zipOut, output);
console.log(`Secciones 10-11-14-15 actualizadas en: ${output}`);
