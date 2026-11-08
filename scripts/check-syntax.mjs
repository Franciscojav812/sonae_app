// Parses every JS module in the project with `node --check` so CI fails fast on syntax errors.
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const roots = ['js', 'tests', 'scripts', 'sw.js'];
const files = [];

function walk(path) {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) walk(join(path, entry));
  } else if (/\.(m?js)$/.test(path)) {
    files.push(path);
  }
}

for (const root of roots) if (existsSync(root)) walk(root);

let failed = 0;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (err) {
    failed++;
    console.error(`✗ ${file}\n${err.stderr}`);
  }
}

console.log(`${files.length - failed}/${files.length} files parsed`);
process.exit(failed ? 1 : 0);
