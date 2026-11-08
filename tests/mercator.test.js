import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toWorld, fromWorld, visibleTiles, fitBounds, pixelsPerKm, tileUrl, worldSize } from '../js/lib/mercator.js';

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('origin and corners of the Mercator world', () => {
  assert.deepEqual(toWorld(0, 0, 0), [128, 128]);
  const [x, y] = toWorld(-180, 85.05112878, 1);
  close(x, 0); close(y, 0, 1e-3);
});

test('toWorld and fromWorld are inverse', () => {
  for (const [lon, lat] of [[139.69, 35.68], [127.68, 26.21], [141.35, 43.06]]) {
    const [x, y] = toWorld(lon, lat, 9);
    const [lon2, lat2] = fromWorld(x, y, 9);
    close(lon, lon2); close(lat, lat2);
  }
});

test('Tokyo falls in the expected z5 tile (28, 12)', () => {
  const [x, y] = toWorld(139.69, 35.68, 5);
  assert.deepEqual([Math.floor(x / 256), Math.floor(y / 256)], [28, 12]);
});

test('visibleTiles covers the viewport and wraps x', () => {
  const tiles = visibleTiles([139.69, 35.68], 5, 512, 512);
  assert.ok(tiles.length >= 4 && tiles.length <= 9);
  assert.ok(tiles.some((t) => t.left <= 0 && t.left > -256));
  const wrap = visibleTiles([179.9, 0], 2, 600, 200);
  assert.ok(wrap.every((t) => t.x >= 0 && t.x < 4));
  assert.ok(visibleTiles([0, 85], 1, 256, 2000).every((t) => t.y >= 0 && t.y < 2), 'no rows outside the world');
});

test('fitBounds picks the largest zoom that fits Japan', () => {
  const japan = [[122, 24], [148, 46]];
  const { zoom, center } = fitBounds(japan, 700, 700, 3, 12);
  assert.equal(zoom, 5); // 592×619 px at z5, 1183×1238 px at z6
  close(center[0], 135, 1e-6);
  assert.ok(center[1] > 34 && center[1] < 37);
  assert.equal(fitBounds(japan, 3000, 3000, 3, 12).zoom, 7);
});

test('scale helpers', () => {
  close(pixelsPerKm(0, 0), 1000 / 156543.03392);
  assert.ok(pixelsPerKm(60, 5) > pixelsPerKm(0, 5), 'Mercator stretches towards the poles');
  assert.equal(worldSize(2), 1024);
  assert.equal(tileUrl('https://{s}.t/{z}/{x}/{y}.png', { x: 1, y: 1, z: 3 }), 'https://c.t/3/1/1.png');
});
