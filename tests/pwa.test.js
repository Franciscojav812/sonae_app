import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const swSource = readFileSync(join(root, 'sw.js'), 'utf8');
const shell = [...swSource.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);

function walk(dir) {
  return readdirSync(join(root, dir)).flatMap((f) => {
    const rel = `${dir}/${f}`;
    return statSync(join(root, rel)).isDirectory() ? walk(rel) : [rel];
  });
}

test('every file the service worker precaches exists', () => {
  for (const f of shell) assert.ok(existsSync(join(root, f)), `missing ${f}`);
});

test('every JS module and fixture is precached, so the app works offline', () => {
  const needed = [...walk('js'), ...walk('fixtures')];
  const missing = needed.filter((f) => !shell.includes(f));
  assert.deepEqual(missing, []);
});

test('manifest icons exist', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  for (const icon of manifest.icons) assert.ok(existsSync(join(root, icon.src)), icon.src);
});
