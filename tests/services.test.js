import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fetchJSON, fetchWithCache, HttpError, isRetryable } from '../js/lib/http.js';
import { createStorage, memoryBackend } from '../js/lib/storage.js';
import { createRealtimeChannel } from '../js/services/realtime.js';
import { createScheduler } from '../js/services/scheduler.js';
import { createSources } from '../js/services/sources.js';
import { DEMO_ANCHOR } from '../js/config.js';

const noSleep = async () => {};
const jsonResponse = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

/** fetch double that replays a script of responses / errors. */
function scriptedFetch(script) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const step = script[Math.min(calls.length - 1, script.length - 1)];
    if (step instanceof Error) throw step;
    return step;
  };
  fn.calls = calls;
  return fn;
}

/* ---------- http ---------- */
test('fetchJSON retries transient failures, then succeeds', async () => {
  const f = scriptedFetch([new TypeError('network'), jsonResponse({}, 503), jsonResponse({ ok: 1 })]);
  const data = await fetchJSON('u', { fetchImpl: f, sleep: noSleep, retries: 2 });
  assert.deepEqual(data, { ok: 1 });
  assert.equal(f.calls.length, 3);
});

test('fetchJSON does not retry a 404', async () => {
  const f = scriptedFetch([jsonResponse({}, 404)]);
  await assert.rejects(fetchJSON('u', { fetchImpl: f, sleep: noSleep, retries: 3 }), HttpError);
  assert.equal(f.calls.length, 1);
  assert.equal(isRetryable(new HttpError(429, 'u')), true);
});

test('fetchJSON backs off exponentially between attempts', async () => {
  const waits = [];
  const f = scriptedFetch([new TypeError('x')]);
  await assert.rejects(fetchJSON('u', { fetchImpl: f, retries: 3, backoffMs: 100, random: () => 0.5, sleep: async (ms) => waits.push(ms) }));
  assert.deepEqual(waits, [100, 200, 400]);
});

test('fetchWithCache stores fresh data and serves it while offline', async () => {
  const storage = createStorage(memoryBackend());
  let t = 1_000;
  const now = () => t;
  const live = await fetchWithCache('k', 'u', { storage, maxStaleMs: 500, now, fetchImpl: scriptedFetch([jsonResponse([1])]), sleep: noSleep });
  assert.equal(live.status, 'live');

  t = 1_300;
  const offline = scriptedFetch([new TypeError('offline')]);
  const cached = await fetchWithCache('k', 'u', { storage, maxStaleMs: 500, now, fetchImpl: offline, sleep: noSleep, retries: 0 });
  assert.equal(cached.status, 'cached');
  assert.deepEqual(cached.data, [1]);
  assert.equal(cached.fetchedAt, 1_000);

  t = 2_000; // cache now too old
  await assert.rejects(fetchWithCache('k', 'u', { storage, maxStaleMs: 500, now, fetchImpl: offline, sleep: noSleep, retries: 0 }));
});

/* ---------- storage ---------- */
test('storage survives a backend that throws (quota / private mode)', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('x'); } };
  const s = createStorage(broken);
  assert.equal(s.set('a', 1), false);
  assert.equal(s.get('a', 'fallback'), 'fallback');
  assert.doesNotThrow(() => s.remove('a'));
});

/* ---------- realtime ---------- */
function fakeTimers() {
  const queue = [];
  return {
    queue,
    setTimeout: (fn, ms) => { const id = queue.length + 1; queue.push({ id, fn, ms }); return id; },
    clearTimeout: (id) => { const t = queue.find((x) => x.id === id); if (t) t.fn = null; },
    fireLast() { const t = queue.at(-1); t.fn?.(); },
  };
}

function FakeSocketFactory() {
  const sockets = [];
  class FakeSocket { constructor(url) { this.url = url; sockets.push(this); } close() { this.closed = true; } }
  return { FakeSocket, sockets };
}

test('realtime channel delivers messages once and reconnects with growing backoff', () => {
  const { FakeSocket, sockets } = FakeSocketFactory();
  const timers = fakeTimers();
  const got = [];
  const states = [];
  const ch = createRealtimeChannel({
    url: 'wss://x', WebSocketImpl: FakeSocket, timers, random: () => 1,
    onMessage: (m) => got.push(m.code), onStatus: (s) => states.push(s),
  });
  ch.start();
  sockets[0].onopen();
  sockets[0].onmessage({ data: JSON.stringify({ _id: 'a', code: 551 }) });
  sockets[0].onmessage({ data: JSON.stringify({ _id: 'a', code: 551 }) }); // duplicate
  sockets[0].onmessage({ data: 'not json' });
  assert.deepEqual(got, [551]);

  sockets[0].onclose();
  assert.equal(states.at(-1).state, 'closed');
  assert.equal(states.at(-1).retryInMs, 1000);
  timers.fireLast(); // reconnect
  assert.equal(sockets.length, 2);
  sockets[1].onclose();
  assert.equal(states.at(-1).retryInMs, 2000, 'second failure waits twice as long');

  ch.stop();
  assert.equal(states.at(-1).state, 'stopped');
});

test('realtime channel reports unsupported environments instead of throwing', () => {
  const states = [];
  createRealtimeChannel({ url: 'x', WebSocketImpl: null, onMessage() {}, onStatus: (s) => states.push(s.state) }).start();
  assert.deepEqual(states, ['unsupported']);
});

/* ---------- scheduler ---------- */
test('scheduler pauses while hidden and catches up when visible again', async () => {
  const listeners = {};
  const doc = { visibilityState: 'visible', addEventListener: (e, fn) => { listeners[e] = fn; }, removeEventListener() {} };
  const timers = fakeTimers();
  let t = 0;
  let runs = 0;
  const s = createScheduler({ doc, timers, now: () => t }).every('a', 1000, () => { runs++; });

  await s.start();
  assert.equal(runs, 1);
  assert.equal(timers.queue.at(-1).ms, 1000);

  doc.visibilityState = 'hidden';
  listeners.visibilitychange();
  assert.equal(timers.queue.at(-1).fn, null, 'pending timer cancelled while hidden');

  t = 5000;
  doc.visibilityState = 'visible';
  listeners.visibilitychange();
  await new Promise((r) => setImmediate(r));
  assert.equal(runs, 2, 'overdue task runs as soon as the tab is visible');
  s.stop();
});

/* ---------- sources ---------- */
const loadFixture = async (name) => JSON.parse(readFileSync(new URL(`../fixtures/${name}`, import.meta.url)));

test('sources fall back to demo data, re-anchored to the current time', async () => {
  const now = () => DEMO_ANCHOR + 5 * 86_400_000;
  const offline = scriptedFetch([new TypeError('offline')]);
  const src = createSources({
    storage: createStorage(memoryBackend()), now, loadFixture,
    http: { fetchImpl: offline, sleep: noSleep, retries: 0 },
  });
  const q = await src.quakes();
  assert.equal(q.status, 'demo');
  assert.ok(q.data.length > 30);
  assert.ok(Math.max(...q.data.map((x) => x.time)) <= now());
  assert.ok(Math.max(...q.data.map((x) => x.time)) > now() - 3_600_000, 'newest example is recent');

  const w = await src.weather();
  assert.equal(w.status, 'demo');
  assert.equal(w.data[0].daily[0].date, new Date(now() + 9 * 3_600_000).toISOString().slice(0, 10));
});

test('sources report partial outages per upstream', async () => {
  const fetchImpl = async (url) => {
    if (url.includes('p2pquake')) return jsonResponse(await loadFixture('p2p-551.json'));
    throw new TypeError('usgs down');
  };
  const src = createSources({ storage: createStorage(memoryBackend()), now: () => DEMO_ANCHOR, loadFixture, http: { fetchImpl, sleep: noSleep, retries: 0 } });
  const q = await src.quakes();
  assert.equal(q.status, 'live');
  assert.deepEqual(q.parts, { JMA: 'live', USGS: 'error' });
});
