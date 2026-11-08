/**
 * Interruptive alerts: bottom banner, optional tone (Web Audio, enabled by the
 * user because browsers block autoplay) and a system notification when allowed.
 */
export function createAlerter({ banner, title, body, isSoundOn }) {
  let audio = null;

  function ensureAudio() {
    try {
      audio = audio ?? new (globalThis.AudioContext ?? globalThis.webkitAudioContext)();
      return audio.resume?.().then(() => audio) ?? Promise.resolve(audio);
    } catch {
      return Promise.resolve(null);
    }
  }

  /** Generic two-tone pattern; EEW uses a faster, higher sequence. */
  function tone(kind) {
    if (!isSoundOn() || !audio) return;
    const seq = kind === 'eew' ? [988, 1319, 988, 1319, 988, 1319] : [740, 988, 740];
    const step = kind === 'eew' ? 0.18 : 0.32;
    seq.forEach((freq, i) => {
      const t = audio.currentTime + i * step;
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + step * 0.85);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + step);
    });
  }

  function notify(text, detail) {
    try {
      if (globalThis.Notification?.permission === 'granted') new Notification(`Sonae 備え — ${text}`, { body: detail, tag: 'sonae' });
    } catch { /* notifications unavailable in this context */ }
  }

  return {
    enableSound() {
      ensureAudio();
      try { if (globalThis.Notification?.permission === 'default') Notification.requestPermission().catch(() => {}); } catch { /* ignore */ }
    },
    show({ kind, heading, detail }) {
      banner.dataset.kind = kind;
      title.textContent = heading;
      body.textContent = detail;
      banner.hidden = false;
      tone(kind);
      notify(heading, detail);
    },
    dismiss() { banner.hidden = true; },
    test() { ensureAudio().then(() => tone('quake')); },
  };
}
