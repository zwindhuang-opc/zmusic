"""Web app smoke verification (Playwright).

Loads the running frontend, prints the page title / URL / visible text and saves
a full-page screenshot.

Usage: python scripts/verify_webapp.py

The screenshot is written to ``screenshots/<version>/`` as required by
.trae/RULES.md ("Screenshots go under project-local screenshots/<version>/
subfolders"). The path is resolved relative to this file, so the script works
from any checkout location.
"""

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

PROJECT_ROOT = Path(__file__).resolve().parent.parent


def get_app_version() -> str:
    """Read the current app version from VERSION.json, falling back to 'dev'."""
    try:
        with open(PROJECT_ROOT / "VERSION.json", encoding="utf-8") as fh:
            return json.load(fh).get("version") or "dev"
    except (OSError, ValueError):
        return "dev"


screenshot_dir = PROJECT_ROOT / "screenshots" / f"v{get_app_version()}"
screenshot_dir.mkdir(parents=True, exist_ok=True)
screenshot_path = screenshot_dir / "verify-localhost-4720.png"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto("http://localhost:4720/")
    page.wait_for_load_state("networkidle", timeout=60000)
    page.wait_for_timeout(3000)
    page.screenshot(path=str(screenshot_path), full_page=True)
    title = page.title()
    print(f"Page title: {title}")
    print(f"URL: {page.url}")
    body_text = page.inner_text("body")[:2000]
    print(f"Body text preview:\n{body_text}")
    print(f"Screenshot saved to: {screenshot_path}")
    browser.close()
