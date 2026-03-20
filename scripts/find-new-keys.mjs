import fs from 'fs';

const files = [
  'app/(marketing)/page.tsx',
  'components/ui/course-card.tsx',
  'components/ui/navbar.tsx',
  'app/(teacher)/teacher/courses/page.tsx',
  'app/(teacher)/teacher/exams/page.tsx'
];

const keySet = new Set();
for (const f of files) {
  const code = fs.readFileSync(f, 'utf-8');
  const re = /t\(\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    keySet.add(m[1]);
  }
}

// Read current all_t_keys_utf8.txt
let existing = new Set();
try {
  const txt = fs.readFileSync('scripts/all_t_keys_utf8.txt', 'utf-8');
  txt.split('\n').forEach(k => { if (k.trim()) existing.add(k.trim()); });
} catch(e) {}

const newKeys = [...keySet].filter(k => !existing.has(k)).sort();
console.log(`NEW KEYS (${newKeys.length}):`);
newKeys.forEach(k => console.log(k));

// Append to all_t_keys file
if (newKeys.length > 0) {
  const appendStr = '\n' + newKeys.join('\n') + '\n';
  fs.appendFileSync('scripts/all_t_keys_utf8.txt', appendStr, 'utf-8');
  console.log(`\nAppended ${newKeys.length} new keys to all_t_keys_utf8.txt`);
}
