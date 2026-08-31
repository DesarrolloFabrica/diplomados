import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "x-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const checks = [
  "Recibe solicitud de capacitación",
  "Iron Alexander Fuentes Rodríguez",
  "RF-001",
  "Autenticación y gestión de sesión por rol",
  "1. El usuario ingresa",
];
for (const c of checks) console.log(c, "=>", xml.includes(c));
