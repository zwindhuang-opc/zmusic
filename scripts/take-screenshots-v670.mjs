/**
 * ZMusic v6.7.0 Full-Screen Desktop Screenshots
 *
 * Captures every page, AUTO button, GLOBAL AUTO modal, and AI chat panel
 * at 1920x1080 desktop resolution (real Edge browser viewport).
 *
 * Usage:
 *   1. Start dev server: npm run dev  (port 4200)
 *   2. Run: node scripts/take-screenshots-v670.mjs
 *
 * Output: screenshots/v6.7.0/
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:4200';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/v6.7.0');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function snap(page, name, opts = {}) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: opts.fullPage !== false });
  const stat = fs.statSync(filePath);
  console.log(`  ✓ ${name}.png  (${(stat.size / 1024).toFixed(1)} KB)`);
}

async function clickByText(page, selector, text) {
  const els = await page.$$(selector);
  for (const el of els) {
    const t = (await page.evaluate((e) => e.textContent || '', el)).trim();
    if (t.includes(text)) {
      await el.click();
      return true;
    }
  }
  return false;
}

async function run() {
  console.log('\n=== ZMusic v6.7.0 Full-Screen Desktop Screenshots ===\n');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Output: ${SCREENSHOT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--window-size=1920,1080',
      '--force-device-scale-factor=1',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  try {
    // ==========================================
    // 01. Dashboard (desktop, full page)
    // ==========================================
    console.log('--- 01 Dashboard ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(4000);
    await snap(page, '01_dashboard_full');
    await snap(page, '01_dashboard_viewport', { fullPage: false });

    // Click GLOBAL AUTO button + capture modal
    console.log('--- 01 Dashboard GLOBAL AUTO modal ---');
    const globalAutoClicked = await clickByText(page, 'button', 'GLOBAL AUTO');
    if (globalAutoClicked) {
      await sleep(1500);
      await snap(page, '01_dashboard_global_auto_modal_step1', { fullPage: false });
      // Try to advance steps
      const next1 = await clickByText(page, 'button', '下一步');
      if (next1) { await sleep(1000); await snap(page, '01_dashboard_global_auto_modal_step2', { fullPage: false }); }
      const next2 = await clickByText(page, 'button', '下一步');
      if (next2) { await sleep(1000); await snap(page, '01_dashboard_global_auto_modal_step3', { fullPage: false }); }
      // Close modal (don't actually launch — just capture)
      await clickByText(page, 'button', '取消');
      await sleep(800);
    }

    // Open AI chat panel — capture new agent colors + fixed floating ball position
    console.log('--- 01 Dashboard AI Chat Panel ---');
    const chatBall = await page.$('button[title*="AI"], button.fixed.rounded-full');
    if (chatBall) {
      await chatBall.click();
      await sleep(1500);
      await snap(page, '01_dashboard_ai_chat_panel', { fullPage: false });
      // Click through each agent to show distinct colors
      const agents = ['Suno', 'Muse', 'Melo', 'FSM', 'Network'];
      for (const agent of agents) {
        const clicked = await clickByText(page, 'button', agent);
        if (clicked) {
          await sleep(600);
          await snap(page, `01_dashboard_ai_chat_${agent.toLowerCase()}`, { fullPage: false });
        }
      }
      // Close chat
      const closeBtn = await page.$('button svg path[d*="M18 6L6 18"]');
      if (closeBtn) { await closeBtn.click(); } else { await chatBall.click(); }
      await sleep(500);
    }

    // ==========================================
    // 02. Muse AI page
    // ==========================================
    console.log('--- 02 Muse AI ---');
    await page.goto(`${BASE_URL}/muse`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(4000);
    await snap(page, '02_muse_full');
    await snap(page, '02_muse_viewport', { fullPage: false });

    // Click AUTO button — capture confirmation modal (do NOT actually launch)
    console.log('--- 02 Muse AUTO modal ---');
    const museAutoClicked = await clickByText(page, 'button', 'AUTO');
    if (museAutoClicked) {
      await sleep(1500);
      await snap(page, '02_muse_auto_modal_step1', { fullPage: false });
      const next1 = await clickByText(page, 'button', '下一步');
      if (next1) { await sleep(1000); await snap(page, '02_muse_auto_modal_step2', { fullPage: false }); }
      const next2 = await clickByText(page, 'button', '下一步');
      if (next2) { await sleep(1000); await snap(page, '02_muse_auto_modal_step3', { fullPage: false }); }
      await clickByText(page, 'button', '取消');
      await sleep(800);
    }

    // ==========================================
    // 03. Suno AI page
    // ==========================================
    console.log('--- 03 Suno AI ---');
    await page.goto(`${BASE_URL}/suno`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(4000);
    await snap(page, '03_suno_full');
    await snap(page, '03_suno_viewport', { fullPage: false });

    console.log('--- 03 Suno AUTO modal ---');
    const sunoAutoClicked = await clickByText(page, 'button', 'AUTO');
    if (sunoAutoClicked) {
      await sleep(1500);
      await snap(page, '03_suno_auto_modal_step1', { fullPage: false });
      const next1 = await clickByText(page, 'button', '下一步');
      if (next1) { await sleep(1000); await snap(page, '03_suno_auto_modal_step2', { fullPage: false }); }
      const next2 = await clickByText(page, 'button', '下一步');
      if (next2) { await sleep(1000); await snap(page, '03_suno_auto_modal_step3', { fullPage: false }); }
      await clickByText(page, 'button', '取消');
      await sleep(800);
    }

    // ==========================================
    // 04. Melo AI page
    // ==========================================
    console.log('--- 04 Melo AI ---');
    await page.goto(`${BASE_URL}/melo`, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(4000);
    await snap(page, '04_melo_full');
    await snap(page, '04_melo_viewport', { fullPage: false });

    console.log('--- 04 Melo AUTO modal ---');
    const meloAutoClicked = await clickByText(page, 'button', 'AUTO');
    if (meloAutoClicked) {
      await sleep(1500);
      await snap(page, '04_melo_auto_modal_step1', { fullPage: false });
      const next1 = await clickByText(page, 'button', '下一步');
      if (next1) { await sleep(1000); await snap(page, '04_melo_auto_modal_step2', { fullPage: false }); }
      const next2 = await clickByText(page, 'button', '下一步');
      if (next2) { await sleep(1000); await snap(page, '04_melo_auto_modal_step3', { fullPage: false }); }
      await clickByText(page, 'button', '取消');
      await sleep(800);
    }

    // ==========================================
    // 05-09. Other pages
    // ==========================================
    const otherPages = [
      { num: '05', path: '/lyrics', name: 'lyrics' },
      { num: '06', path: '/image-lyrics', name: 'image_lyrics' },
      { num: '07', path: '/mv', name: 'mv' },
      { num: '08', path: '/settings', name: 'settings' },
      { num: '09', path: '/generations', name: 'generations' },
    ];
    for (const p of otherPages) {
      console.log(`--- ${p.num} ${p.name} ---`);
      try {
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch {
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      }
      await sleep(3000);
      await snap(page, `${p.num}_${p.name}_full`);
      await snap(page, `${p.num}_${p.name}_viewport`, { fullPage: false });
    }

    // ==========================================
    // Mobile responsive view (bonus)
    // ==========================================
    console.log('--- 10 Mobile responsive view ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await sleep(2000);
    await snap(page, '10_mobile_dashboard');
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    console.log('\n=== All screenshots captured! ===\n');
    const files = fs.readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith('.png'));
    console.log(`Total: ${files.length} files in ${SCREENSHOT_DIR}`);
  } catch (err) {
    console.error('Screenshot capture error:', err.message);
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
