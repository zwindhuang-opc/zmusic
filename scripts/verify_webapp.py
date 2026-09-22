from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 900})
    page.goto('http://localhost:4720/')
    page.wait_for_load_state('networkidle', timeout=60000)
    page.wait_for_timeout(3000)
    page.screenshot(path='d:/AI_Projects/zmusic/screenshots/verify-localhost-4720.png', full_page=True)
    title = page.title()
    print(f"Page title: {title}")
    print(f"URL: {page.url}")
    body_text = page.inner_text('body')[:2000]
    print(f"Body text preview:\n{body_text}")
    browser.close()
