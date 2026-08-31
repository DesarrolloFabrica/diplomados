import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2_corregido.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pf-"));
fs.copyFileSync(docx, path.join(tmp, "d.zip"));
execSync(`powershell -NoProfile -Command "Expand-Archive -LiteralPath '${path.join(tmp, "d.zip").replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const idx = xml.indexOf("pendiente firma");
console.log("idx", idx);
if (idx > -1) {
  const slice = xml.slice(idx - 80, idx + 60);
  console.log(slice);
  console.log([...slice].map((c) => c.charCodeAt(0)));
}
