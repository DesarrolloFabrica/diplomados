import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "docx-"));
const zipCopy = path.join(tmp, "document.zip");
fs.copyFileSync(docx, zipCopy);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "unzipped").replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" }
);
const xml = fs.readFileSync(path.join(tmp, "unzipped", "word", "document.xml"), "utf8");
const idx = [];
let pos = 0;
while (true) {
  const i = xml.indexOf("[Diligenciar]", pos);
  if (i === -1) break;
  idx.push(xml.slice(Math.max(0, i - 120), i + 40));
  pos = i + 1;
}
console.log("Restantes:", idx.length);
for (const s of idx) {
  console.log("---");
  console.log(s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}
