import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const scanDirs = ['app', 'components'];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.next' || name === '.git') continue;
      walk(p, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const files = scanDirs.flatMap((d) => walk(join(root, d)));
const usedKeys = new Set();
const re = /\bt\(\s*['"]([^'"]+)['"]/g;

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  let m;
  while ((m = re.exec(content)) !== null) {
    usedKeys.add(m[1]);
  }
}

const trans = readFileSync(join(root, 'lib', 'i18n', 'translations.ts'), 'utf-8');
const missing = [...usedKeys].filter((k) => !new RegExp(`\\b${k.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*:`).test(trans));

missing.sort();
console.log(`Missing keys: ${missing.length}`);
for (const k of missing) console.log(k);
