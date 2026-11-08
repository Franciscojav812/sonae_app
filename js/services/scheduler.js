/**
 * Runs each data source on its own interval and pauses everything while the tab
 * is hidden (no wasted requests, no battery drain). On return, any task whose
 * interval has elapsed runs immediately so the screen is never left stale.
 */
export function createScheduler({ doc = globalThis.document, now = Date.now, timers = globalThis } = {}) {
  const tasks = new Map();
  let running = false;

  const isHidden = () => doc?.visibilityState === 'hidden';

  async function run(task) {
    timers.clearTimeout(task.timer);
    task.timer = null;
    if (task.inFlight) return task.inFlight;
    task.inFlight = (async () => {
      try { await task.fn(); } catch (err) { task.onError?.(err); }
      task.lastRun = now();
      task.inFlight = null;
      schedule(task);
    })();
    return task.inFlight;
  }

  function schedule(task) {
    if (!running || isHidden() || task.timer) return;
    const wait = Math.max(0, task.lastRun + task.intervalMs - now());
    task.timer = timers.setTimeout(() => { task.timer = null; run(task); }, wait);
  }

  function onVisibility() {
    if (isHidden()) {
      for (const t of tasks.values()) { timers.clearTimeout(t.timer); t.timer = null; }
    } else {
      for (const t of tasks.values()) {
        if (now() - t.lastRun >= t.intervalMs) run(t);
        else schedule(t);
      }
    }
  }

  return {
    every(name, intervalMs, fn, onError) {
      tasks.set(name, { name, intervalMs, fn, onError, lastRun: 0, timer: null, inFlight: null });
      return this;
    },
    /** Runs every task now (or a single one by name) and resolves when done. */
    runNow(name) {
      const list = name ? [tasks.get(name)].filter(Boolean) : [...tasks.values()];
      return Promise.allSettled(list.map(run));
    },
    start() {
      if (running) return;
      running = true;
      doc?.addEventListener?.('visibilitychange', onVisibility);
      return this.runNow();
    },
    stop() {
      running = false;
      doc?.removeEventListener?.('visibilitychange', onVisibility);
      for (const t of tasks.values()) { timers.clearTimeout(t.timer); t.timer = null; }
    },
  };
}
