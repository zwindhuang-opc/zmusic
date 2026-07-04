/**
 * Screenshot Automation Script for ZMusic
 *
 * This script uses Puppeteer to automatically capture screenshots of every page,
 * tab, and interactive button in the ZMusic application. Screenshots are saved
 * in a version-specific subfolder under /screenshots/.
 *
 * Usage:
 *   node scripts/take-screenshots.mjs
 *
 * Prerequisites:
 *   - Vite dev server running on http://localhost:5500
 *   - Backend API server running on http://localhost:5501
 *   - Puppeteer installed (npm install --save-dev puppeteer)
 *
 * @module scripts/take-screenshots
 * @version 1.0.0
 * @author ZMusic Team
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5500';
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots/v5.1.0');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Take a screenshot and save it to the output directory
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string} name - Screenshot file name (without extension)
 * @param {boolean} fullPage - Whether to capture full page
 */
async function takeScreenshot(page, name, fullPage = true) {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage });
  console.log(`  Screenshot saved: ${name}.png`);
}

/**
 * Click a navigation item by text content
 * @param {import('puppeteer').Page} page - Puppeteer page instance
 * @param {string[]} keywords - Keywords to match in nav item text
 */
async function clickNavByKeywords(page, keywords) {
  const navItems = await page.$$('nav button, nav a, aside button, aside a');
  for (const item of navItems) {
    const text = await page.evaluate(el => el.textContent, item);
    if (text && keywords.some(k => text.includes(k))) {
      await item.click();
      return true;
    }
  }
  return false;
}

/**
 * Main screenshot capture function
 * Captures all pages, tabs, and interactive elements
 */
async function captureScreenshots() {
  console.log('\n=== ZMusic Screenshot Automation ===\n');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Output: ${SCREENSHOT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

  try {
    // ==========================================
    // 1. Dashboard Page
    // ==========================================
    console.log('--- Capturing Dashboard Page ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(5000);
    await takeScreenshot(page, '01-dashboard-main');

    // Hover over stat cards to show hover effects
    const statCards = await page.$$('button[class*="cursor-pointer"]');
    if (statCards.length > 0) {
      await statCards[0].hover();
      await sleep(500);
      await takeScreenshot(page, '02-dashboard-card-hover');
    }

    // Click on "Songs Generated" card to navigate to Music page
    console.log('--- Capturing Music Page ---');
    if (statCards.length > 0) {
      await statCards[0].click();
      await sleep(3000);
    }
    await takeScreenshot(page, '03-music-page-main');

    // Capture music page - style selection
    const styleButtons = await page.$$('[class*="rounded-lg"][class*="border"]');
    if (styleButtons.length > 0) {
      await styleButtons[0].click();
      await sleep(500);
      await takeScreenshot(page, '04-music-style-selected');
    }

    // Capture music page - method selection tabs
    const tabButtons = await page.$$('[class*="px-3"][class*="py-1.5"][class*="rounded-lg"]');
    if (tabButtons.length > 1) {
      await tabButtons[1].click();
      await sleep(500);
      await takeScreenshot(page, '05-music-method-tab');
    }

    // ==========================================
    // 2. Lyrics Page
    // ==========================================
    console.log('--- Capturing Lyrics Page ---');
    await clickNavByKeywords(page, ['Lyrics', '歌词']);
    await sleep(3000);
    await takeScreenshot(page, '06-lyrics-page-main');

    // Capture lyrics page - genre/theme selection
    const genreButtons = await page.$$('[class*="rounded-lg"][class*="border"][class*="cursor-pointer"]');
    if (genreButtons.length > 0) {
      await genreButtons[0].click();
      await sleep(500);
      await takeScreenshot(page, '07-lyrics-genre-selected');
    }

    if (genreButtons.length > 1) {
      await genreButtons[1].click();
      await sleep(500);
      await takeScreenshot(page, '08-lyrics-theme-selected');
    }

    // ==========================================
    // 3. MV Page
    // ==========================================
    console.log('--- Capturing MV Page ---');
    await clickNavByKeywords(page, ['MV', '视频', 'Video']);
    await sleep(3000);
    await takeScreenshot(page, '09-mv-page-main');

    // Capture MV page - style selection
    const mvStyleButtons = await page.$$('[class*="rounded-lg"][class*="border"]');
    if (mvStyleButtons.length > 0) {
      await mvStyleButtons[0].click();
      await sleep(500);
      await takeScreenshot(page, '10-mv-style-selected');
    }

    // ==========================================
    // 4. Settings Page
    // ==========================================
    console.log('--- Capturing Settings Page ---');
    await clickNavByKeywords(page, ['Settings', '设置']);
    await sleep(3000);
    await takeScreenshot(page, '11-settings-page-main');

    // ==========================================
    // 5. Floating Chat Ball
    // ==========================================
    console.log('--- Capturing Floating Chat Ball ---');
    const chatBallButton = await page.$('button[title*="AI"], button[title*="助手"], button.fixed[class*="rounded-full"]');
    if (chatBallButton) {
      await chatBallButton.click();
      await sleep(1000);
      await takeScreenshot(page, '12-floating-chat-ball-open');

      // Try to select different AI agents
      const agentButtons = await page.$$('[class*="rounded-lg"][class*="cursor-pointer"]');
      if (agentButtons.length > 1) {
        await agentButtons[1].click();
        await sleep(500);
        await takeScreenshot(page, '13-chat-agent-selected');
      }
    } else {
      console.log('  Chat ball button not found, skipping...');
    }

    // ==========================================
    // 6. History Panel
    // ==========================================
    console.log('--- Capturing History Panel ---');
    await clickNavByKeywords(page, ['Music', '音乐']);
    await sleep(2000);

    const historyButton = await page.$('button[title*="History"], button[title*="历史"]');
    if (historyButton) {
      await historyButton.click();
      await sleep(1000);
      await takeScreenshot(page, '14-history-panel-open');
    } else {
      // Try clicking any button with History icon
      const histBtn = await page.$('button svg + *');
      console.log('  History button not found by title, trying alternative...');
    }

    // ==========================================
    // 7. Responsive Views
    // ==========================================
    console.log('--- Capturing Responsive Views ---');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await sleep(5000);

    // Mobile view
    await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
    await sleep(1000);
    await takeScreenshot(page, '15-mobile-dashboard');

    // Tablet view
    await page.setViewport({ width: 768, height: 1024, deviceScaleFactor: 1 });
    await sleep(1000);
    await takeScreenshot(page, '16-tablet-dashboard');

    // Reset to desktop
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    console.log('\n=== All screenshots captured successfully! ===\n');
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);

    // List all screenshots
    const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'));
    console.log(`\nTotal screenshots: ${files.length}`);
    files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));

  } catch (error) {
    console.error('Error during screenshot capture:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the screenshot capture
captureScreenshots().catch(console.error);
