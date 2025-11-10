const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://1kaiser.github.io/experiments.html');
  const screenshotPath = path.resolve(__dirname, 'live_timeline.png');
  await page.screenshot({ path: screenshotPath });
  await browser.close();
})();
