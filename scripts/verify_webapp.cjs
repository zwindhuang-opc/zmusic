const puppeteer = require('puppeteer');
const path = require('path');

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
    const screenshotPath = path.join(__dirname, '..', 'screenshots', 'verify-localhost-4720.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to: ${screenshotPath}`);
  } catch (err) {
    console.error('Error:', err.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
  }
})();
