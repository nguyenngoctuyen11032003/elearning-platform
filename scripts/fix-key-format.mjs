import fs from 'fs';
import { explicit3 } from './explicit-translations-3.mjs';

const keyFile = 'scripts/all_t_keys_utf8.txt';
let txt = fs.readFileSync(keyFile, 'utf-8');

// Read existing keys with tab
const existing = new Set();
for (const line of txt.split('\n')) {
  const t = line.trim();
  if (!t) continue;
  const i = t.indexOf('\t');
  if (i > 0) existing.add(t.substring(0, i).trim());
}

// Also scan source files for any t() keys with fallbacks
const files = [
  'app/(marketing)/page.tsx',
  'components/ui/course-card.tsx',
  'components/ui/navbar.tsx',
  'app/(teacher)/teacher/courses/page.tsx',
  'app/(teacher)/teacher/exams/page.tsx'
];

const keyFallbacks = {};
for (const f of files) {
  const code = fs.readFileSync(f, 'utf-8');
  // Match t("key", "fallback") patterns
  const re = /t\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']\s*\)/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    if (!existing.has(m[1])) {
      keyFallbacks[m[1]] = m[2];
    }
  }
}

// Also add keys from explicit3 that are missing
for (const [key, val] of Object.entries(explicit3)) {
  if (!existing.has(key) && val.vi) {
    keyFallbacks[key] = val.vi;
  }
}

// Remove any lines without tabs (the old no-tab entries) and re-append with proper format
const lines = txt.split('\n');
const cleanedLines = lines.filter(l => {
  const t = l.trim();
  if (!t) return false;
  return t.includes('\t');
});

// Add new key\tvietnamese entries
const newEntries = [];
for (const [key, fallback] of Object.entries(keyFallbacks)) {
  if (!existing.has(key)) {
    newEntries.push(`${key}\t${fallback}`);
    existing.add(key);
  }
}

newEntries.sort();
const finalContent = cleanedLines.join('\n') + '\n' + newEntries.join('\n') + '\n';
fs.writeFileSync(keyFile, finalContent, 'utf-8');

console.log(`Fixed ${newEntries.length} keys with proper tab+Vietnamese format`);
console.log(`Total keys in file now: ${existing.size}`);
