import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const docx = process.argv[2];
if (!docx) {
  console.error('Usage: node extract-docx.mjs <path-to-docx>');
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-'));
const zipCopy = path.join(tmp, 'document.zip');
fs.copyFileSync(docx, zipCopy);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, 'unzipped').replace(/'/g, "''")}' -Force"`,
  { stdio: 'inherit' }
);
const xmlPath = path.join(tmp, 'unzipped', 'word', 'document.xml');

const xml = fs.readFileSync(xmlPath, 'utf8');
const paragraphs = [...xml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)];

for (const match of paragraphs) {
  const p = match[0];
  const texts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  const line = texts.join('');
  if (line.trim()) console.log(line);
}
