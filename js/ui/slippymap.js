/**
 * Minimal slippy map: XYZ raster tiles + an SVG overlay redrawn by the caller.
 * Mouse, touch (pan + pinch) and keyboard; no dependencies.
 *
 * When no tile has loaded and several have failed (offline, blocked network),
 * the map switches to `offline` mode and the caller draws vector land instead,
 * so the map never shows an empty frame.
 */
import { TILE_SIZE, toWorld, fromWorld, visibleTiles, fitBounds, tileUrl } from '../lib/mercator.js';

export function createSlippyMap(container, {
  basemaps,
  base,
  bounds,
  minZoom = 4,
  maxZoom = 12,
  drawOverlay, // (project, view) => SVG markup string
  onChange = () => {},
  labels = { zoomIn: '+', zoomOut: '−' },
}) {
  container.classList.add('sm');
  container.tabIndex = 0;
  container.innerHTML = `
    <div class="sm-tiles" aria-hidden="true"></div>
    <svg class="sm-overlay" xmlns="http://www.w3.org/2000/svg"></svg>
    <div class="sm-zoom"><button type="button" data-z="1" aria-label="${labels.zoomIn}">+</button><button type="button" data-z="-1" aria-label="${labels.zoomOut}">−</button></div>
    <div class="sm-attrib"></div>`;
  const tilePane = container.querySelector('.sm-tiles');
  const overlay = container.querySelector('.sm-overlay');
  const attrib = container.querySelector('.sm-attrib');

  let width = container.clientWidth || 600;
  let height = container.clientHeight || 500;
  let { center, zoom } = fitBounds(bounds, width, height, minZoom, maxZoom);
  let baseId = base;
  let loaded = 0;
  let failed = 0;
  let offline = false;
  let frame = 0;
  const imgs = new Map();

  const layerFor = (z) => basemaps[baseId].layers.find((l) => z >= (l.minZoom ?? 0) && z <= (l.maxZoom ?? 22));

  function project(lon, lat) {
    const [cx, cy] = toWorld(center[0], center[1], zoom);
    const [x, y] = toWorld(lon, lat, zoom);
    return [x - cx + width / 2, y - cy + height / 2];
  }

  function setOffline(value) {
    if (offline === value) return;
    offline = value;
    container.classList.toggle('sm-offline', offline);
    draw();
  }

  function renderTiles() {
    const layer = layerFor(zoom);
    const wanted = new Set();
    if (layer && !offline) {
      for (const t of visibleTiles(center, zoom, width, height)) {
        const url = tileUrl(layer.url, t, layer.subdomains);
        wanted.add(url);
        let img = imgs.get(url);
        if (!img) {
          img = new Image(TILE_SIZE, TILE_SIZE);
          img.alt = '';
          img.decoding = 'async';
          img.referrerPolicy = 'strict-origin-when-cross-origin';
          img.onload = () => { loaded++; img.classList.add('ok'); setOffline(false); };
          img.onerror = () => { failed++; img.remove(); imgs.delete(url); if (!loaded && failed >= 4) setOffline(true); };
          img.src = url;
          imgs.set(url, img);
          tilePane.append(img);
        }
        img.style.transform = `translate(${t.left}px, ${t.top}px)`;
      }
    }
    for (const [url, img] of imgs) if (!wanted.has(url)) { img.remove(); imgs.delete(url); }
    attrib.innerHTML = offline ? basemaps.offlineAttribution : basemaps[baseId].attribution;
  }

  function draw() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      renderTiles();
      overlay.setAttribute('viewBox', `0 0 ${width} ${height}`);
      overlay.innerHTML = drawOverlay(project, { zoom, width, height, offline });
    });
  }

  function setView(c, z) {
    zoom = Math.max(minZoom, Math.min(maxZoom, Math.round(z)));
    center = [((c[0] + 540) % 360) - 180, Math.max(-85, Math.min(85, c[1]))];
    draw();
    onChange({ center, zoom });
  }

  /** Zooms by `dz` keeping the geographic point under (px, py) fixed on screen. */
  function zoomAt(px, py, dz) {
    const nz = Math.max(minZoom, Math.min(maxZoom, zoom + dz));
    if (nz === zoom) return;
    const [cx, cy] = toWorld(center[0], center[1], zoom);
    const anchor = fromWorld(cx + px - width / 2, cy + py - height / 2, zoom);
    const [ax, ay] = toWorld(anchor[0], anchor[1], nz);
    setView(fromWorld(ax - px + width / 2, ay - py + height / 2, nz), nz);
  }

  function panBy(dx, dy) {
    const [cx, cy] = toWorld(center[0], center[1], zoom);
    setView(fromWorld(cx - dx, cy - dy, zoom), zoom);
  }

  /* ---------- pointer: pan with one pointer, pinch with two ---------- */
  const pointers = new Map();
  let pinchStart = 0;
  let dragged = false;

  const local = (e) => {
    const r = container.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };

  container.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.sm-zoom, .sm-attrib') || e.button > 0) return;
    pointers.set(e.pointerId, local(e));
    dragged = false;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStart = Math.hypot(a[0] - b[0], a[1] - b[1]);
    }
  });

  addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const p = local(e);
    pointers.set(e.pointerId, p);
    if (pointers.size === 1) {
      const dx = p[0] - prev[0];
      const dy = p[1] - prev[1];
      if (Math.abs(dx) + Math.abs(dy) > 0) {
        dragged = dragged || Math.hypot(dx, dy) > 3;
        panBy(dx, dy);
      }
    } else if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const ratio = dist / pinchStart;
      if (ratio > 1.5 || ratio < 0.66) {
        dragged = true;
        zoomAt((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ratio > 1 ? 1 : -1);
        pinchStart = dist;
      }
    }
  });

  const release = (e) => { pointers.delete(e.pointerId); if (pointers.size < 2) pinchStart = 0; };
  addEventListener('pointerup', release);
  addEventListener('pointercancel', release);

  // A drag must not count as a click on the marker it started on.
  container.addEventListener('click', (e) => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);

  container.addEventListener('dblclick', (e) => { const [x, y] = local(e); zoomAt(x, y, e.shiftKey ? -1 : 1); });

  // Wheel zooms only with Ctrl/⌘ so the page keeps scrolling normally over the map.
  let wheelAcc = 0;
  container.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 60) {
      const [x, y] = local(e);
      zoomAt(x, y, wheelAcc < 0 ? 1 : -1);
      wheelAcc = 0;
    }
  }, { passive: false });

  container.querySelector('.sm-zoom').addEventListener('click', (e) => {
    const b = e.target.closest('[data-z]');
    if (b) zoomAt(width / 2, height / 2, Number(b.dataset.z));
  });

  container.addEventListener('keydown', (e) => {
    if (e.target !== container) return;
    const step = 80;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) { e.preventDefault(); panBy(...moves[e.key]); }
    if (e.key === '+' || e.key === '=') zoomAt(width / 2, height / 2, 1);
    if (e.key === '-' || e.key === '_') zoomAt(width / 2, height / 2, -1);
  });

  new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w && h && (w !== width || h !== height)) { width = w; height = h; draw(); }
  }).observe(container);

  draw();

  return {
    redraw: draw,
    setBase(id) {
      if (!basemaps[id] || id === baseId) return;
      baseId = id;
      for (const img of imgs.values()) img.remove();
      imgs.clear();
      loaded = 0; failed = 0;
      setOffline(false);
      draw();
    },
    flyTo(lonlat, z = zoom) { setView(lonlat, Math.max(z, zoom)); },
    reset() { const v = fitBounds(bounds, width, height, minZoom, maxZoom); setView(v.center, v.zoom); },
    get view() { return { center, zoom, offline, base: baseId }; },
  };
}
