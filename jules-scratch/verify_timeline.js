const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:8080/experiments.html');
  const screenshotPath = path.resolve(__dirname, 'timeline.png');
  await page.screenshot({ path: screenshotPath });
  await browser.close();
})();
