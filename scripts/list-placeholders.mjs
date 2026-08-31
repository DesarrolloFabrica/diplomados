import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';

const docx = process.argv[2];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'docx-'));
const zipCopy = path.join(tmp, 'document.zip');
fs.copyFileSync(docx, zipCopy);
execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${path.join(tmp, 'unzipped').replace(/'/g, "''")}' -Force"`,
  { stdio: 'inherit' }
);
const xml = fs.readFileSync(path.join(tmp, 'unzipped', 'word', 'document.xml'), 'utf8');
const paragraphs = [...xml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)];
let idx = 0;
for (const match of paragraphs) {
  const p = match[0];
  const texts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  const line = texts.join('');
  if (line.includes('[Diligenciar]') || line.includes('RF-[XXX]') || line.includes('RP-[XXX]') || line.includes('CR-[XXX]')) {
    idx++;
    console.log(`${idx}. ${line.slice(0, 200)}`);
  }
}
console.log(`\nTotal placeholders: ${idx}`);
