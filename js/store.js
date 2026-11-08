/**
 * Minimal observable store. State is replaced immutably on every update so
 * subscribers can compare references; renders are batched to one per frame.
 */
export function createStore(initial, { schedule = (fn) => (globalThis.requestAnimationFrame ?? setTimeout)(fn) } = {}) {
  let state = initial;
  const listeners = new Set();
  let pending = false;

  function notify() {
    pending = false;
    for (const fn of listeners) fn(state);
  }

  return {
    get: () => state,
    set(patch) {
      const next = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...next };
      if (!pending) { pending = true; schedule(notify); }
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
