import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const KEY_FILE = join(ROOT, 'scripts', 'all_t_keys_utf8.txt');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (['node_modules', '.next', '.git'].includes(name)) continue;
      walk(p, out);
    } else if (/\.(tsx|ts|jsx|js)$/.test(name)) {
      out.push(p);
    }
  }
  return out;
}

const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components')), ...walk(join(ROOT, 'lib'))];

const raw = readFileSync(KEY_FILE, 'utf-8');
const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
const map = new Map();
for (const line of lines) {
  const i = line.indexOf('\t');
  if (i < 0) continue;
  map.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
}

const re = /\bt\(\s*['"]([^'"]+)['"]\s*,\s*([`'"])([\s\S]*?)\2\s*\)/g;
let added = 0;
for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  let m;
  while ((m = re.exec(content)) !== null) {
    const key = m[1].trim();
    const fallback = m[3].replace(/\s+/g, ' ').trim();
    if (!key || !fallback) continue;
    if (!map.has(key)) {
      map.set(key, fallback);
      added++;
    }
  }
}

const out = [...map.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, v]) => `${k}\t${v}`)
  .join('\n') + '\n';

writeFileSync(KEY_FILE, out, 'utf-8');
console.log(`Added ${added} new keys.`);
console.log(`Total keys: ${map.size}`);
