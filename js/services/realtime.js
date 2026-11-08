/**
 * Push channel to P2P地震情報 (wss://api.p2pquake.net/v2/ws).
 * - reconnects with exponential backoff + jitter, reset after a stable connection
 * - de-duplicates messages (the server may resend on reconnect)
 * - degrades silently to polling when WebSocket is unavailable
 */
export function createRealtimeChannel({
  url,
  onMessage,
  onStatus = () => {},
  WebSocketImpl = globalThis.WebSocket,
  baseDelayMs = 1000,
  maxDelayMs = 60_000,
  timers = globalThis,
  random = Math.random,
}) {
  let socket = null;
  let attempts = 0;
  let retryTimer = null;
  let stableTimer = null;
  let stopped = true;
  const seen = new Set();
  const seenOrder = [];

  const status = (s, extra) => onStatus({ state: s, attempts, ...extra });

  function remember(id) {
    if (seen.has(id)) return false;
    seen.add(id);
    seenOrder.push(id);
    if (seenOrder.length > 500) seen.delete(seenOrder.shift());
    return true;
  }

  function connect() {
    if (stopped) return;
    if (!WebSocketImpl) { status('unsupported'); return; }
    status('connecting');
    try {
      socket = new WebSocketImpl(url);
    } catch {
      scheduleReconnect();
      return;
    }

    socket.onopen = () => {
      status('open');
      // Only reset the backoff once the link has stayed up for a while.
      stableTimer = timers.setTimeout(() => { attempts = 0; }, 30_000);
    };
    socket.onmessage = (event) => {
      let msg;
      try { msg = JSON.parse(event.data); } catch { return; }
      const id = msg?._id ?? msg?.id;
      if (id != null && !remember(String(id))) return;
      onMessage(msg);
    };
    socket.onerror = () => { /* onclose follows and handles the retry */ };
    socket.onclose = () => {
      timers.clearTimeout(stableTimer);
      socket = null;
      scheduleReconnect();
    };
  }

  function scheduleReconnect() {
    if (stopped) return;
    const delay = Math.min(maxDelayMs, baseDelayMs * 2 ** attempts) * (0.5 + random() * 0.5);
    attempts++;
    status('closed', { retryInMs: Math.round(delay) });
    retryTimer = timers.setTimeout(connect, delay);
  }

  return {
    start() { if (!stopped) return; stopped = false; connect(); },
    stop() {
      stopped = true;
      timers.clearTimeout(retryTimer);
      timers.clearTimeout(stableTimer);
      if (socket) { socket.onclose = null; socket.close(); socket = null; }
      status('stopped');
    },
  };
}
