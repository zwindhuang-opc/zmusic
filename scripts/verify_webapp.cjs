/**
 * Web app smoke verification (Puppeteer).
 *
 * Loads the running frontend, prints the page title / URL / visible text and
 * saves a full-page screenshot.
 *
 * Usage: node scripts/verify_webapp.cjs
 *
 * The screenshot is written to `screenshots/<version>/` as required by
 * .trae/RULES.md ("Screenshots go under project-local screenshots/<version>/
 * subfolders"), so verification evidence stays grouped per release.
 *
 * @module scripts/verify_webapp
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Read the current app version, falling back to 'dev'.
 * @returns {string}
 */
function getAppVersion() {
  try {
    const versionFile = path.join(__dirname, '..', 'VERSION.json');
    return JSON.parse(fs.readFileSync(versionFile, 'utf-8')).version || 'dev';
  } catch {
    return 'dev';
  }
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    console.log('Navigating to http://localhost:4720/ ...');
    await page.goto('http://localhost:4720/', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    await new Promise(r => setTimeout(r, 3000));
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Final URL: ${url}`);
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log(`Body text preview:\n${bodyText}`);

    const screenshotDir = path.join(__dirname, '..', 'screenshots', `v${getAppVersion()}`);
    fs.mkdirSync(screenshotDir, { recursive: true });
    const screenshotPath = path.join(screenshotDir, 'verify-localhost-4720.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
