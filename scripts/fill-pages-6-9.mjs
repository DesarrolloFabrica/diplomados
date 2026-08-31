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
  if (labelPos === -1) {
    labelPos = section.indexOf(label);
    if (labelPos === -1) return section;
  }

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

function fillSectionLabels(xml, startMarker, endMarker, labels) {
  const start = xml.indexOf(startMarker);
  const end = xml.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) {
    throw new Error(`Sección no encontrada: ${startMarker}`);
  }

  let section = xml.slice(start, end);
  for (const [label, value] of labels) {
    const exact = `<w:t>${label}</w:t>`;
    const labelPos = section.indexOf(exact);
    if (labelPos === -1) continue;
    const before = section.slice(0, labelPos);
    const after = section.slice(labelPos);
    section = before + fillLabelInNextCell(after, label, value);
  }
  return xml.slice(0, start) + section + xml.slice(end);
}

function replaceExact(xml, find, value) {
  return xml.split(find).join(escapeXml(value));
}

const asIsRows = [
  [
    "1",
    "Fábrica de Contenido / Operaciones",
    "Recibe solicitud de capacitación corporativa de una empresa aliada",
    "Correo, hojas de cálculo, carpetas compartidas",
    "Necesidad de formación y listado de colaboradores",
    "Contenido preparado de forma manual fuera de una plataforma integrada",
    "No hay trazabilidad centralizada ni registro único del avance",
  ],
  [
    "2",
    "Instructor / área académica",
    "Crea o adapta contenidos de diplomados de forma manual",
    "Documentos, Drive, herramientas externas",
    "Material académico y estructura del curso",
    "Archivos sueltos o repositorios no conectados a inscripción y evaluación",
    "Dificultad para reutilizar contenidos y controlar versiones",
  ],
  [
    "3",
    "Administrador de empresa",
    "Gestiona colaboradores e inscripciones sin plataforma propia",
    "Correo, listados manuales",
    "Listado de empleados y cursos requeridos",
    "Confirmación manual de participación",
    "Sin aislamiento multiempresa ni reportes automatizados",
  ],
  [
    "4",
    "Colaborador / estudiante",
    "Accede a formación por canales dispersos",
    "Correo, PDF, enlaces externos",
    "Credenciales o enlaces compartidos manualmente",
    "Consumo parcialmente registrado o no registrado",
    "Mala experiencia de usuario y baja visibilidad del progreso",
  ],
];

const toBeRows = [
  [
    "1",
    "Superadmin / Admin empresa",
    "Crea empresas, usuarios y asigna roles en la plataforma",
    "Plataforma Diplomados",
    "Solo usuarios autenticados con rol autorizado",
    "Tenants, usuarios activos y permisos RLS aplicados",
  ],
  [
    "2",
    "Instructor",
    "Publica cursos, módulos, lecciones, recursos y evaluaciones",
    "Plataforma Diplomados + GCS",
    "Curso en borrador hasta publicación",
    "Curso publicado visible para empresas autorizadas",
  ],
  [
    "3",
    "Colaborador",
    "Inicia sesión, se inscribe y consume la ruta de aprendizaje",
    "Plataforma Diplomados",
    "Curso publicado visible para su empresa o global",
    "Inscripción creada y progreso registrado por lección",
  ],
  [
    "4",
    "Admin empresa / Superadmin",
    "Consulta reportes de avance por colaborador y empresa",
    "Plataforma Diplomados",
    "Inscripciones y progreso persistidos en PostgreSQL",
    "Reportes de avance disponibles para seguimiento operativo",
  ],
];

const stakeholderRows = [
  [
    "Iron Alexander Fuentes Rodríguez",
    "Fábrica de Contenido",
    "Product Owner",
    "Alta",
    "Alta",
    "Definición funcional, priorización y validación de negocio",
  ],
  [
    "Johan Sebastián Daza Sarmiento",
    "Operaciones",
    "Project Manager",
    "Alta",
    "Alta",
    "Gestión del proyecto, cronograma y gobierno",
  ],
  [
    "Haider Yessid Bello Melo",
    "Operaciones / TI",
    "Líder de desarrollo",
    "Alta",
    "Alta",
    "Arquitectura, desarrollo, despliegue y soporte técnico",
  ],
  [
    "Colaboradores de empresas clientes",
    "Empresas aliadas",
    "Usuario final",
    "Alta",
    "Baja",
    "Consumo de cursos y evaluaciones autoguiadas",
  ],
];

const rf001Labels = [
  ["ID", "RF-001"],
  ["Nombre", "Autenticación y gestión de sesión por rol"],
  [
    "Descripción",
    "Permitir el acceso seguro a la plataforma mediante credenciales propias, generando sesión JWT en cookie httpOnly y redirigiendo al panel correspondiente según el rol del usuario.",
  ],
  ["Actor", "Superadmin, admin_empresa, instructor y colaborador"],
  ["Prioridad", "P1 — Alta"],
  ["Fuente", "SOL-DIP-2026-001 / Análisis funcional y técnico del repositorio"],
  ["Dependencias", "PostgreSQL, JWT_SECRET, SendGrid para recuperación de clave"],
  ["Responsable funcional", "Iron Alexander Fuentes Rodríguez"],
  ["Estado", "Implementado"],
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-pages-"));
const unzipped = unzipDocx(input, tmp);
const xmlPath = path.join(unzipped, "word", "document.xml");
let xml = fs.readFileSync(xmlPath, "utf8");

xml = fillRowsAfterHeader(xml, ["Paso", "Problema actual"], asIsRows);
xml = fillRowsAfterHeader(xml, ["Paso", "Actividad futura"], toBeRows);
xml = fillRowsAfterHeader(xml, ["Stakeholder", "Responsabilidad"], stakeholderRows);

xml = fillSectionLabels(
  xml,
  "Diligenciar una ficha por cada requerimiento funcional identificado",
  "Precondiciones",
  rf001Labels
);

xml = replaceExact(
  xml,
  "1. [Paso]",
  "1. El usuario ingresa correo y contraseña en /login."
);
xml = replaceExact(
  xml,
  "2. [Paso]",
  "2. El sistema valida credenciales, verifica cuenta activa y crea JWT en cookie httpOnly."
);
xml = replaceExact(
  xml,
  "3. [Paso]",
  "3. El middleware redirige al panel inicial según rol: /admin, /empresa, /instructor/cursos o /mis-cursos."
);

fs.writeFileSync(xmlPath, xml, "utf8");
const zipOut = path.join(tmp, "filled.zip");
zipFolder(unzipped, zipOut);
fs.copyFileSync(zipOut, output);
console.log(`Secciones 6-9 actualizadas en: ${output}`);
