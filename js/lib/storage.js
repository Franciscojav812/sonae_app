/**
 * JSON storage over localStorage with an in-memory fallback. localStorage can be
 * missing (Node, some webviews), blocked (private mode) or full (quota): none of
 * those may break the app, so every access is guarded.
 */
export function memoryBackend() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => void map.set(k, String(v)),
    removeItem: (k) => void map.delete(k),
  };
}

function browserBackend() {
  try {
    const probe = '__sonae_probe__';
    globalThis.localStorage.setItem(probe, probe);
    globalThis.localStorage.removeItem(probe);
    return globalThis.localStorage;
  } catch {
    return memoryBackend();
  }
}

export function createStorage(backend = browserBackend(), prefix = 'sonae:') {
  return {
    get(key, fallback = null) {
      try {
        const raw = backend.getItem(prefix + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        backend.setItem(prefix + key, JSON.stringify(value));
        return true;
      } catch {
        return false; // quota exceeded: the app keeps working without persistence
      }
    },
    remove(key) {
      try { backend.removeItem(prefix + key); } catch { /* ignore */ }
    },
  };
}
