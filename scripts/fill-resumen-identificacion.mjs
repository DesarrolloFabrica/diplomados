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

function fillLabelInNextCell(section, label, value) {
  const labelPos = section.indexOf(label);
  if (labelPos === -1) return section;

  const cellEnd = section.indexOf("</w:tc>", labelPos);
  if (cellEnd === -1) return section;

  const nextCellStart = section.indexOf("<w:tc", cellEnd);
  if (nextCellStart === -1) return section;
  const nextCellEnd = section.indexOf("</w:tc>", nextCellStart);
  if (nextCellEnd === -1) return section;

  const nextCell = section.slice(nextCellStart, nextCellEnd);
  let filledCell;

  if (/<w:t(?:\s[^>]*)?>/.test(nextCell)) {
    filledCell = nextCell.replace(
      /<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/,
      `<w:t xml:space="preserve">${escapeXml(value)}</w:t>`
    );
  } else {
    filledCell = nextCell.replace(
      /(<w:p[^>]*>[\s\S]*?<w:pPr>[\s\S]*?<\/w:pPr>)/,
      `$1<w:r><w:rPr/><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r>`
    );
  }

  return section.slice(0, nextCellStart) + filledCell + section.slice(nextCellEnd);
}

function fillSection(xml, startMarker, endMarker, fields) {
  const start = xml.indexOf(startMarker);
  const end = xml.indexOf(endMarker, start + startMarker.length);
  if (start === -1 || end === -1) {
    throw new Error(`No se encontró la sección entre "${startMarker}" y "${endMarker}"`);
  }

  let section = xml.slice(start, end);
  for (const [label, value] of fields) {
    section = fillLabelInNextCell(section, label, value);
  }

  return xml.slice(0, start) + section + xml.slice(end);
}

const resumenEjecutivo = [
  ["Nombre de la iniciativa", "Plataforma Empresarial de Formación Autoguiada — Diplomados CUN"],
  [
    "Problema principal",
    "No existe una plataforma digital propia de la CUN para ofrecer diplomados y cursos autoguiados a empresas aliadas, con trazabilidad de progreso, evaluaciones y aislamiento multiempresa.",
  ],
  [
    "Objetivo",
    "Implementar una plataforma SaaS multiempresa que permita crear, administrar, inscribir y consumir cursos y diplomados autoguiados para colaboradores de empresas clientes.",
  ],
  [
    "Beneficio esperado",
    "Centralizar la oferta de formación corporativa B2B, mejorar la experiencia del estudiante, habilitar reportes de avance por empresa y escalar la operación sin depender de herramientas externas.",
  ],
  ["Solicitante", "Iron Alexander Fuentes Rodríguez"],
  ["Área solicitante", "Fábrica de Contenido"],
  ["Prioridad", "P1 — Alta"],
  ["Estado", "En desarrollo — Etapa 2 completada, Etapa 3 en curso"],
  ["Fecha objetivo", "Q4 2026 (octubre–diciembre 2026)"],
  [
    "Riesgo principal",
    "Funcionalidades críticas pendientes (certificados, pagos, asignaciones forzadas) y dependencia de servicios GCP/SendGrid.",
  ],
  [
    "Dependencia crítica",
    "Infraestructura GCP (Cloud SQL, Cloud Storage, Cloud Run), SendGrid y secretos configurados en GitHub Actions.",
  ],
  [
    "Próximo hito",
    "Completar Etapa 3: paneles operativos admin/empresa, asignaciones forzadas y cierre funcional previo a UAT.",
  ],
  [
    "Próxima decisión necesaria",
    "Definir alcance final de certificados, pagos e integraciones externas para el cierre del MVP.",
  ],
];

const identificacion = [
  ["ID Solicitud", "SOL-DIP-2026-001"],
  ["Proyecto", "Diplomados"],
  ["Nombre solicitud", "Plataforma Empresarial de Formación Autoguiada — Diplomados CUN"],
  ["Fecha solicitud", "19/08/2026"],
  ["Solicitante", "Iron Alexander Fuentes Rodríguez"],
  ["Cargo", "Product Owner"],
  ["Área", "Fábrica de Contenido"],
  [
    "Stakeholder responsable",
    "Iron Alexander Fuentes Rodríguez; Raúl Valencia Cifuentes; Alberto Mario Valencia Zableh",
  ],
  ["Responsable funcional", "Iron Alexander Fuentes Rodríguez"],
  ["PM responsable", "Johan Sebastián Daza Sarmiento"],
  ["Líder técnico", "Haider Yessid Bello Melo"],
  ["Tipo solicitud", "Nuevo desarrollo"],
  ["Canal de recepción", "Solicitud interna — Dirección de Operaciones / Fábrica de Contenido"],
  ["Prioridad inicial", "P1 — Alta"],
  ["Deadline solicitado", "31/12/2026"],
  ["Estado", "En desarrollo"],
];

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-resumen-"));
const unzipped = unzipDocx(input, tmp);
const xmlPath = path.join(unzipped, "word", "document.xml");
let xml = fs.readFileSync(xmlPath, "utf8");

xml = fillSection(xml, "Nombre de la iniciativa", "ID Solicitud", resumenEjecutivo);
{
  const resumenStart = xml.indexOf("Nombre de la iniciativa");
  const resumenEnd = xml.indexOf("ID Solicitud", resumenStart);
  const resumen = xml
    .slice(resumenStart, resumenEnd)
    .replace("🟢 Verde   🟡 Amarillo   🔴 Rojo", "🟡 Amarillo");
  xml = xml.slice(0, resumenStart) + resumen + xml.slice(resumenEnd);
}
xml = fillSection(xml, "ID Solicitud", "Tipos de solicitud sugeridos", identificacion);

fs.writeFileSync(xmlPath, xml, "utf8");
const zipOut = path.join(tmp, "filled.zip");
zipFolder(unzipped, zipOut);
fs.copyFileSync(zipOut, output);
console.log(`Secciones 1 y 2 actualizadas en: ${output}`);
