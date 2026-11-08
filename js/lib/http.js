/**
 * Network layer: timeouts, bounded retries with exponential backoff + jitter,
 * and a stale-while-error cache so the last good answer survives outages.
 * Dependencies (fetch, sleep, clock) are injectable for deterministic tests.
 */
export class HttpError extends Error {
  constructor(status, url) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

const defaultSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** 4xx (except 408/429) will not fix itself: fail fast instead of retrying. */
export const isRetryable = (err) =>
  !(err instanceof HttpError) || err.status >= 500 || err.status === 408 || err.status === 429;

export async function fetchJSON(url, {
  timeoutMs = 9000,
  retries = 2,
  backoffMs = 800,
  fetchImpl = globalThis.fetch,
  sleep = defaultSleep,
  random = Math.random,
} = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, { signal: controller.signal, cache: 'no-store' });
      if (!res.ok) throw new HttpError(res.status, url);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt === retries || !isRetryable(err)) break;
      await sleep(backoffMs * 2 ** attempt * (0.75 + random() * 0.5));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

/**
 * Fetches fresh data and persists it. If the network fails, serves the last
 * stored copy while it is younger than `maxStaleMs`.
 * Resolves to { data, status: 'live' | 'cached', fetchedAt, error? }.
 */
export async function fetchWithCache(key, url, { storage, maxStaleMs, now = Date.now, ...httpOptions }) {
  try {
    const data = await fetchJSON(url, httpOptions);
    const fetchedAt = now();
    storage.set(`cache:${key}`, { fetchedAt, data });
    return { data, status: 'live', fetchedAt };
  } catch (error) {
    const hit = storage.get(`cache:${key}`);
    if (hit && now() - hit.fetchedAt <= maxStaleMs) {
      return { data: hit.data, status: 'cached', fetchedAt: hit.fetchedAt, error };
    }
    throw error;
  }
}
