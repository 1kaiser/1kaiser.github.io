const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Ensure server is running (it should be from previous step)
  // If not, we might need to restart it, but assuming it's still up
  await page.goto('http://localhost:8080/');

  // Wait for the navigation to be visible
  await page.waitForSelector('a[href="cv/cv.html"]');

  // Take a screenshot of the top right corner specifically
  // or the whole page
  await page.screenshot({ path: '/home/jules/verification/index_nav.png' });

  await browser.close();
})();
