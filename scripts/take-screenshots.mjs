/**
 * take-screenshots.mjs — 版本感知的全量 UI 截图脚本
 *
 * 目标：为当前版本生成一套可交付的 UI 功能证据图，存放在
 *   screenshots/v<当前版本号>/
 * 覆盖范围：
 *   1. 登录页
 *   2. 侧边栏全部导航页面（18 个）——整页截图
 *   3. 每个页面的交互控件清单截图（所有按钮/链接描边高亮，非破坏性）
 *   4. 页面内标签页（Song Library / Lyrics 的 tab 切换）
 *   5. 关键页面的移动端响应式截图
 *   6. INDEX.md 索引（含每页按钮文字清单，便于对照功能）
 *
 * 安全说明：本脚本绝不点击"生成/删除/发布"这类会消耗积分或修改数据的
 * 按钮，只做导航、切换纯前端 tab、以及给控件加描边后截图，因此可以反复
 * 运行而不产生副作用。
 *
 * 用法：
 *   node scripts/take-screenshots.mjs                # 截取当前版本
 *   node scripts/take-screenshots.mjs --mobile-only  # 只截移动端
 *   FRONTEND_URL=http://localhost:4720 node scripts/take-screenshots.mjs
 *
 * 前置条件：前端 (4720) 与后端 (4721) 已启动。
 *
 * @module scripts/take-screenshots
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

/** 前端地址（可用环境变量覆盖）。 */
const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:4720/';

/** 读取当前版本号，用于决定截图子目录名。 */
function getAppVersion() {
  try {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'VERSION.json'), 'utf-8'));
    return v.version || 'dev';
  } catch {
    return 'dev';
  }
}

const VERSION = getAppVersion();
/** 截图输出目录：screenshots/v<version>/ */
const OUT_DIR = path.join(ROOT, 'screenshots', `v${VERSION}`);

/** 侧边栏导航：顺序、id、中文标签、所属分组（分组展开后才可见）。 */
const NAV_PAGES = [
  ['dashboard', '仪表盘', null],
  ['music-create', '音乐创作', null],
  ['muse', 'Muse AI', null],
  ['suno', 'Suno AI', null],
  ['melo', 'Melo AI', null],
  ['mv-muse', 'Muse MV', 'MV视频'],
  ['mv-suno', 'Suno MV', 'MV视频'],
  ['mv-melo', 'Melo MV', 'MV视频'],
  ['lyrics', '歌词生成', null],
  ['notebook', '创作构思记录簿', null],
  ['image-lyrics', '图片作词', null],
  ['remix', 'Remix 工作室', '工作室'],
  ['publish', '发布工坊', '工作室'],
  ['library', '歌曲库', null],
  ['quality', '质量分析器', '工作台'],
  ['batch', '批量生成', '工作台'],
  ['analytics', '数据分析', '工作台'],
  ['settings', '设置', null],
];

/**
 * 页面内安全的标签页（纯前端筛选，不触发生成/删除）。
 * key = 页面 id，value = 依次点击的 tab 文字。
 */
const PAGE_TABS = {
  library: ['全部', '收藏', '专辑', 'Muse', 'Suno', 'Melo'],
};

/** 移动端截图的页面（验证响应式布局）。 */
const MOBILE_PAGES = ['dashboard', 'music-create', 'muse', 'mv-muse', 'settings'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 按可见文字精确点击按钮/链接。
 * @param {import('puppeteer').Page} page
 * @param {string} text 目标文字（精确匹配 trim 后的 innerText）
 * @returns {Promise<boolean>} 是否点击成功
 */
async function clickByText(page, text) {
  const ok = await page.evaluate((label) => {
    const nodes = Array.from(document.querySelectorAll('button, a, [role="button"]'));
    const target = nodes.find((n) => (n.innerText || '').trim() === label);
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, text);
  if (ok) await sleep(1200);
  return ok;
}

/**
 * 截整页图（保留滚动全部内容）。
 * @param {import('puppeteer').Page} page
 * @param {string} fileName 输出文件名（不含扩展名）
 */
async function shot(page, fileName) {
  await page.screenshot({ path: path.join(OUT_DIR, `${fileName}.png`), fullPage: true });
  console.log(`  saved ${fileName}.png`);
}

/**
 * 收集当前页面可见的交互控件文字（用于 INDEX.md 的功能对照表）。
 * @param {import('puppeteer').Page} page
 * @returns {Promise<string[]>}
 */
async function collectControls(page) {
  return page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('button, a, [role="button"], [role="tab"]'));
    const out = [];
    for (const n of nodes) {
      // 跳过侧边栏导航，只保留页面自身功能区控件
      if (n.closest('nav, aside, [data-sidebar]')) continue;
      const text = (n.innerText || '').trim().replace(/\s+/g, ' ');
      const label = text || n.getAttribute('aria-label') || n.getAttribute('title') || '';
      if (!label || label.length > 40) continue;
      if (!out.includes(label)) out.push(label);
    }
    return out.slice(0, 60);
  });
}

/**
 * 给所有交互控件加描边高亮后截图 —— 直观显示"这一页有哪些可点功能"。
 * 只改样式，不触发点击，因此无副作用。
 * @param {import('puppeteer').Page} page
 * @param {string} fileName
 */
async function shotControls(page, fileName) {
  await page.evaluate(() => {
    if (document.getElementById('zm-shot-style')) return;
    const style = document.createElement('style');
    style.id = 'zm-shot-style';
    style.textContent = `
      button, a[href], [role="button"], [role="tab"] {
        outline: 2px dashed rgba(34, 211, 238, 0.85) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  });
  await sleep(400);
  await shot(page, fileName);
  await page.evaluate(() => document.getElementById('zm-shot-style')?.remove());
}

/**
 * 主流程：登录页 → 全页面 + 控件清单 + 标签页 → 移动端 → 索引。
 */
async function main() {
  const mobileOnly = process.argv.includes('--mobile-only');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`\n=== ZMusic 截图 ${VERSION} ===`);
  console.log(`来源: ${BASE_URL}`);
  console.log(`输出: ${OUT_DIR}\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    // 每次运行使用独立临时 profile，避免上一次异常退出残留的浏览器锁
    userDataDir: path.join(os.tmpdir(), `zm-shot-${Date.now()}`),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200));
  });

  /** INDEX.md 的行数据：页面 → 控件清单。 */
  const indexRows = [];

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(3000);

    // 1. 登录页（若未登录则记录）
    await shot(page, '00-login');
    console.log('--- 登录页 ---');

    const guest = await clickByText(page, '无需账号继续浏览')
      || await clickByText(page, 'Continue without account');
    console.log(`  guest 入口: ${guest ? 'OK' : '未找到(可能已登录)'}`);
    await sleep(2000);

    // 2. 桌面端：遍历全部导航页面
    if (!mobileOnly) {
      let i = 0;
      for (const [id, label, group] of NAV_PAGES) {
        i += 1;
        console.log(`--- ${id} (${label}) ---`);
        let clicked = await clickByText(page, label);
        if (!clicked && group) {
          await clickByText(page, group);
          clicked = await clickByText(page, label);
        }
        await sleep(2200);

        const order = String(i).padStart(2, '0');
        await shot(page, `${order}-page-${id}`);
        await shotControls(page, `${order}-controls-${id}`);

        const controls = await collectControls(page);
        indexRows.push({ id, label, controls });

        // 3. 页面内标签页（仅安全的前端筛选 tab）
        const tabs = PAGE_TABS[id];
        if (tabs) {
          for (const tab of tabs) {
            const tabOk = await clickByText(page, tab);
            if (!tabOk) continue;
            await sleep(900);
            await shot(page, `${order}-tab-${id}-${tab}`);
          }
        }
      }
    }

    // 4. 移动端响应式截图
    console.log('--- 移动端 ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    for (const [id, label, group] of NAV_PAGES) {
      if (!MOBILE_PAGES.includes(id)) continue;
      let clicked = await clickByText(page, label);
      if (!clicked && group) {
        await clickByText(page, group);
        clicked = await clickByText(page, label);
      }
      await sleep(1600);
      await shot(page, `mobile-${id}`);
    }

    // 5. 写索引
    const lines = [
      `# ZMusic v${VERSION} UI 截图索引`,
      '',
      `生成时间: ${new Date().toISOString()}`,
      `来源地址: ${BASE_URL}`,
      `视口: 桌面 1440x900 / 移动 390x844`,
      '',
      '## 文件命名规则',
      '',
      '- `00-login.png` — 登录页',
      '- `NN-page-<页面>.png` — 页面整页截图（NN 为侧边栏顺序）',
      '- `NN-controls-<页面>.png` — 同一页面所有可交互控件描边高亮（功能分布示意）',
      '- `NN-tab-<页面>-<标签>.png` — 页面内标签页',
      '- `mobile-<页面>.png` — 移动端响应式布局',
      '',
      '## 页面与功能控件对照',
      '',
      '| # | 页面 | 控件数 | 主要控件文字 |',
      '|---|------|--------|--------------|',
    ];
    indexRows.forEach((row, idx) => {
      const sample = row.controls.slice(0, 12).join(' / ').replace(/\|/g, '\\|');
      lines.push(`| ${idx + 1} | ${row.label} (${row.id}) | ${row.controls.length} | ${sample} |`);
    });
    lines.push('', '## 运行期错误', '', consoleErrors.length ? consoleErrors.slice(0, 20).map((e) => `- ${e}`).join('\n') : '无');
    fs.writeFileSync(path.join(OUT_DIR, 'INDEX.md'), `${lines.join('\n')}\n`);

    const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.png'));
    console.log(`\n完成：${files.length} 张截图 + INDEX.md`);
    console.log(`目录：${OUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('截图失败:', e.message);
  process.exit(1);
});
