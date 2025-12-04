const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Set a large viewport to capture the bento layout clearly
  await page.setViewportSize({ width: 1400, height: 1200 });

  // Navigate to local server
  await page.goto('http://localhost:8080');

  // Wait for the grid to render
  await page.waitForSelector('.bento-grid');
  await page.waitForTimeout(2000); // Wait for images to load

  // Take screenshot
  await page.screenshot({ path: 'verification/verification.png', fullPage: true });

  console.log('Screenshot saved to verification/verification.png');
  await browser.close();
})();
