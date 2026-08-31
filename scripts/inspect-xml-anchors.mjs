import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-inspect-"));
const zipCopy = path.join(tmp, "d.zip");
fs.copyFileSync(docx, zipCopy);
const unzipped = path.join(tmp, "u");
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${unzipped.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" },
);
const xml = fs.readFileSync(path.join(unzipped, "word", "document.xml"), "utf8");

const needles = [
  "Entonces se crea una inscripción",
  "10. REQUERIMIENTOS NO FUNCIONALES",
  "evitando decisiones subjetivas",
  "Revisó",
  "Aprobó",
  "Fenix",
];

for (const n of needles) {
  console.log(n, "=>", xml.indexOf(n));
}

const paragraphs = [...xml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)];
for (let i = 0; i < paragraphs.length; i++) {
  const texts = [...paragraphs[i][0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  const line = texts.join("");
  if (line.includes("Entonces se crea") || line.includes("10. REQUERIMIENTOS NO FUNCIONALES")) {
    console.log("P", i, ":", line.slice(0, 100));
  }
}
