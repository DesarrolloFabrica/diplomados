import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const docx = process.argv[2] || path.join(root, "Diplomados_Requerimientos_v2.docx");
const tmp = path.join(root, "scripts", "_docx_work.docx");

const node = process.execPath;
const scripts = path.join(root, "scripts");

const steps = [
  ["fill-resumen-identificacion.mjs", null, "Secciones 1-2"],
  ["fill-pages-6-9.mjs", null, "Secciones 6-9"],
  ["fill-pages-10-15.mjs", null, "Secciones 10-11-14-15"],
  ["fill-remaining-sections.mjs", null, "Secciones 12, 16, 19, 39, 46-48"],
];

console.log(`Diligenciando: ${docx}\n`);

let current = docx;
for (let i = 0; i < steps.length; i++) {
  const [script, extra, label] = steps[i];
  const out = i === steps.length - 1 ? docx : tmp;
  const args = extra
    ? `"${node}" "${path.join(scripts, script)}" "${current}" "${out}" "${extra}"`
    : `"${node}" "${path.join(scripts, script)}" "${current}" "${out}"`;
  console.log(`→ ${label}`);
  execSync(args, { stdio: "inherit", cwd: root });
  current = out;
}

console.log(`\nDocumento final: ${docx}`);
