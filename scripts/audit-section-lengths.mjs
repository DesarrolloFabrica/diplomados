import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const docx = process.argv[2] || "Diplomados_Requerimientos_v2.docx";
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sec-"));
const z = path.join(tmp, "d.zip");
fs.copyFileSync(docx, z);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${z.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, "u").replace(/'/g, "''")}' -Force"`,
);
const xml = fs.readFileSync(path.join(tmp, "u", "word", "document.xml"), "utf8");
const text = [...xml.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("");

// Find all "NN. TITLE" occurrences with positions
const headings = [];
for (const m of text.matchAll(/(\d{1,2})\.\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ\s\/\-—]{4,80})/g)) {
  headings.push({ num: Number(m[1]), title: m[2].trim(), pos: m.index });
}

// dedupe by num+pos close
const unique = [];
for (const h of headings) {
  if (!unique.some((u) => u.num === h.num && Math.abs(u.pos - h.pos) < 5)) unique.push(h);
}
unique.sort((a, b) => a.pos - b.pos);

console.log("NUM | LEN | TITLE");
for (let i = 0; i < unique.length; i++) {
  const cur = unique[i];
  const nextPos = unique[i + 1]?.pos ?? text.length;
  const body = text.slice(cur.pos, nextPos);
  const bodyLen = body.length;
  // skip TOC duplicates: content sections usually longer than 80 if filled
  if (i > 0 && unique[i - 1].num === cur.num) continue;
  console.log(`${String(cur.num).padStart(2)} | ${String(bodyLen).padStart(5)} | ${cur.title.slice(0, 55)}`);
}

console.log("\n=== SECTIONS WITH BODY < 150 chars (likely empty) ===");
const seen = new Set();
for (let i = 0; i < unique.length; i++) {
  const cur = unique[i];
  if (seen.has(cur.num)) continue;
  seen.add(cur.num);
  const next = unique.find((h, idx) => idx > i && h.num > cur.num && h.pos > cur.pos);
  const nextPos = next?.pos ?? text.length;
  const bodyLen = text.slice(cur.pos, nextPos).length;
  if (bodyLen < 150) console.log(`${cur.num}. ${cur.title.slice(0, 50)} (${bodyLen} chars)`);
}

console.log("\n=== PORTADA / CONTROL ===");
for (const s of ["Nexus", "Fenix", "Plataforma", "Diplomados", "Revisó", "Aprobó", "Pendiente Codigo", "19/08/2026", "20/08/2026"]) {
  console.log(`${text.includes(s) ? "YES" : "NO "} ${s}`);
}
