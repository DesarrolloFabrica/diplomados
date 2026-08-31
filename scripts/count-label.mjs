import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2];
const label = process.argv[3];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "x-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`
);
const x = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
let pos = 0;
let n = 0;
while (true) {
  const i = x.indexOf(label, pos);
  if (i === -1) break;
  n++;
  console.log(n, x.slice(Math.max(0, i - 80), i + label.length + 80).replace(/<[^>]+>/g, "|"));
  pos = i + label.length;
}
