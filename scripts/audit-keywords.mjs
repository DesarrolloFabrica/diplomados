import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "kw-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`,
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");

const groups = {
  "Scripts auto (secc 6-20, 39, 46-48)": [
    "SOL-DIP-2026-001",
    "RNF-01",
    "RN-01",
    "RP-001",
    "RF-001",
    "RF-005",
    "Haider Yessid Bello Melo",
    "Johan Sebastián Daza Sarmiento",
    "Iron Alexander Fuentes Rodríguez",
    "Viable con condiciones",
    "Release R1",
    "Cimientos técnicos completos",
    "70%",
  ],
  "Chat diligenciado (35-54, 28)": [
    "QA-001",
    "BL-001",
    "HU-001",
    "Sprint 3",
    "T-S3",
    "github.com",
    "Juan Andrés Hermida Vargas",
    "miércoles",
    "BP-001",
    "EV-001",
    "Automatizar la migración",
    "Lecciones aprendidas",
    "Hypercare post go-live",
    "Gestión del proyecto y cronograma",
  ],
  "Control documental / portada": [
    "Fenix",
    "Nexus",
    "Uso interno CUN",
    "Pendiente Codigo",
    "co-elaborador",
    "1.1",
    "20/08/2026",
    "19/08/2026",
  ],
  "Pendientes plantilla": [
    "Insertar diagrama",
    "Diseño Figma",
    "RF-[XXX]",
    "[Diligenciar]",
    "WBS",
  ],
};

for (const [group, keys] of Object.entries(groups)) {
  console.log(`\n=== ${group} ===`);
  for (const k of keys) {
    console.log(`${text.includes(k) ? "YES" : "NO "} | ${k}`);
  }
}

console.log("\nText length:", text.length);
