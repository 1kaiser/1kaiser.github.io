const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    console.log('Navigating to http://localhost:8080');
    await page.goto('http://localhost:8080');

    console.log('Waiting for .model-card');
    await page.waitForSelector('.model-card', { timeout: 60000 });

    // Wait a bit for images/models to render
    await page.waitForTimeout(5000);

    console.log('Taking screenshot');
    await page.screenshot({ path: 'verification/gallery_real.png' });
    console.log('Screenshot saved to verification/gallery_real.png');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
