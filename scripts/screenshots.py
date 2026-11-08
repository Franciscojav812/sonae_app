"""Captures README screenshots and a short demo GIF from demo mode.

Usage: python3 -m http.server 5173 &  then  python3 scripts/screenshots.py
Requires: playwright (Chromium), ffmpeg for the GIF.
"""
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
OUT = Path("docs/screenshots")
OUT.mkdir(parents=True, exist_ok=True)
FRAMES = Path("/tmp/sonae-frames")
FRAMES.mkdir(exist_ok=True)


def settle(page):
    page.wait_for_selector("#map [data-quake]", timeout=15000)
    page.wait_for_timeout(1200)  # web fonts


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
    errors = []

    def watch(page):
        page.on("console", lambda m: m.type == "error" and errors.append(m.text))
        page.on("pageerror", lambda e: errors.append(str(e)))

    # Desktop, Japanese
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light", locale="ja-JP", device_scale_factor=1)
    page = ctx.new_page(); watch(page)
    page.goto(f"{BASE}/?demo#overview"); settle(page)
    page.screenshot(path=str(OUT / "overview-ja.png"))
    page.click("#tab-quakes"); page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "quakes-ja.png"))

    # Demo GIF: tab tour + selecting a quake
    steps = ["#tab-overview", "#tab-quakes", ".qi >> nth=0", ".sm-zoom [data-z=\"-1\"]", "#tab-weather", "#tab-typhoon", "#tab-sources", "#tab-overview"]
    n = 0
    for sel in steps:
        page.click(sel); page.wait_for_timeout(350)
        for _ in range(4):
            page.screenshot(path=str(FRAMES / f"f{n:03d}.png")); n += 1
    ctx.close()

    # Desktop, Spanish, Sources tab (dark theme)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="dark", locale="es-ES")
    page = ctx.new_page(); watch(page)
    page.goto(f"{BASE}/?demo#sources"); settle(page)
    page.click("[data-lang=es]"); page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "sources-es-dark.png"))
    ctx.close()

    # Phone
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark", locale="en-US", device_scale_factor=2, is_mobile=True, has_touch=True)
    page = ctx.new_page(); watch(page)
    page.goto(f"{BASE}/?demo#overview"); settle(page)
    page.click("[data-lang=en]"); page.wait_for_timeout(300)
    page.screenshot(path=str(OUT / "mobile-en.png"))
    ctx.close()
    browser.close()

subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-framerate", "4", "-i", str(FRAMES / "f%03d.png"),
    "-vf", "scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
    str(OUT / "demo.gif"),
], check=True)

print("console errors:", errors or "none")
for f in sorted(OUT.iterdir()):
    print(f.name, f.stat().st_size // 1024, "KB")
