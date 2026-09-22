/**
 * Web app smoke verification (Puppeteer).
 *
 * Loads the running frontend, enters via the guest button, then walks EVERY
 * navigation page (all sidebar buttons / groups), capturing one screenshot per
 * page and collecting console + page errors. Exits non-zero if any page fails
 * to render (pageerror) so it can gate releases.
 *
 * Usage: node scripts/verify_webapp.cjs   (optional env FRONTEND_URL)
 *
 * The screenshots are written to `screenshots/<version>/` as required by
 * .trae/RULES.md ("Screenshots go under project-local screenshots/<version>/
 * subfolders"), so verification evidence stays grouped per release.
 *
 * @module scripts/verify_webapp
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:4720/';

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

/**
 * Click the first element whose trimmed text equals `text` (button or a).
 * @param {import('puppeteer').Page} page
 * @param {string} text - Exact visible label
 * @returns {Promise<boolean>} clicked or not
 */
async function clickByText(page, text) {
  const clicked = await page.evaluate((label) => {
    const nodes = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    const target = nodes.find((n) => (n.innerText || '').trim() === label);
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, text);
  if (clicked) await new Promise((r) => setTimeout(r, 1200));
  return clicked;
}

(async () => {
  let browser;
  const results = [];
  const consoleErrors = [];

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    // Collect console errors and uncaught exceptions globally.
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 300));
    });
    page.on('pageerror', (err) => consoleErrors.push(`PAGEERROR: ${err.message.substring(0, 300)}`));

    console.log(`Navigating to ${BASE_URL} ...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 3000));
    console.log(`Page title: ${await page.title()}`);
    console.log(`Final URL: ${page.url()}`);

    // Enter the app via guest mode so every page becomes reachable.
    const guestClicked = await clickByText(page, '无需账号继续浏览') || await clickByText(page, 'Continue without account');
    results.push({ name: 'guest-entry', ok: guestClicked });
    console.log(`${guestClicked ? 'PASS' : 'FAIL'}  guest entry`);
    await new Promise((r) => setTimeout(r, 2000));

    const screenshotDir = path.join(__dirname, '..', 'screenshots', `v${getAppVersion()}`);
    fs.mkdirSync(screenshotDir, { recursive: true });

    // Every navigation target, in sidebar order (zh labels from src/i18n/locales/zh.json "nav").
    const navPages = [
      ['dashboard', '仪表盘'],
      ['music-create', '音乐创作'],
      ['muse', 'Muse AI'],
      ['suno', 'Suno AI'],
      ['melo', 'Melo AI'],
      ['mv-muse', 'Muse MV'],
      ['mv-suno', 'Suno MV'],
      ['mv-melo', 'Melo MV'],
      ['lyrics', '歌词生成'],
      ['notebook', '创作构思记录簿'],
      ['image-lyrics', '图片作词'],
      ['remix', 'Remix 工作室'],
      ['publish', '发布工坊'],
      ['library', '歌曲库'],
      ['quality', '质量分析器'],
      ['batch', '批量生成'],
      ['analytics', '数据分析'],
      ['settings', '设置'],
    ];

    for (const [id, label] of navPages) {
      const errorsBefore = consoleErrors.length;
      let clicked = await clickByText(page, label);
      if (!clicked) {
        // Group child may be collapsed — expand the group first, then retry.
        const groupLabel = {
          'mv-muse': 'MV视频', 'mv-suno': 'MV视频', 'mv-melo': 'MV视频',
          'remix': '工作室', 'publish': '工作室',
          'quality': '工作台', 'batch': '工作台', 'analytics': '工作台',
        }[id];
        if (groupLabel) await clickByText(page, groupLabel);
        clicked = await clickByText(page, label);
      }
      await new Promise((r) => setTimeout(r, 2500));
      const newErrors = consoleErrors.slice(errorsBefore);
      // A page "works" if its nav button was clickable AND no uncaught error
      // fired while rendering it. Plain console.error noise (e.g. failed
      // upstream API probes) is recorded but not fatal.
      const fatal = newErrors.filter((e) => e.startsWith('PAGEERROR:'));
      const ok = clicked && fatal.length === 0;
      results.push({ name: `${id} (${label})`, ok, clicked, consoleErrors: newErrors.length });
      console.log(`${ok ? 'PASS' : 'FAIL'}  ${id.padEnd(14)} clicked=${clicked} consoleErr=${newErrors.length}`);
      await page.screenshot({
        path: path.join(screenshotDir, `walkthrough-${id}.png`),
        fullPage: false
      }).catch(() => {});
    }

    // Landing-page screenshot for the release evidence folder.
    await page.screenshot({
      path: path.join(screenshotDir, 'verify-localhost-4720.png'),
      fullPage: true
    });

    const failed = results.filter((r) => !r.ok);
    console.log(`\n${'='.repeat(50)}`);
    console.log(`Walkthrough: ${results.length - failed.length}/${results.length} pages OK`);
    if (consoleErrors.length) {
      console.log(`Console errors (${consoleErrors.length}) — first 5:`);
      consoleErrors.slice(0, 5).forEach((e) => console.log(`   - ${e}`));
    }
    if (failed.length) {
      console.log('Failed pages:');
      failed.forEach((r) => console.log(`   - ${r.name} (clicked=${r.clicked})`));
    }
    console.log('='.repeat(50));
    process.exitCode = failed.length ? 1 : 0;
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
