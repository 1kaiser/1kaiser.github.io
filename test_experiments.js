const { chromium } = require('playwright');
const path = require('path');
const { exec } = require('child_process');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console logs
  page.on('console', msg => console.log(`PAGE LOG: ${msg.text()}`));
  page.on('pageerror', exception => console.log(`PAGE ERROR: "${exception}"`));

  console.log('Starting test...');

  try {
    // Connect to the local server
    await page.goto('http://localhost:8080/experiments.html');

    // Wait for the timeline to render data (checking for .milestones__group which represents a data point)
    // The .milestones container might be created early, but groups are added during render()
    await page.waitForSelector('.milestones__group', { state: 'attached', timeout: 20000 });
    console.log('Timeline data elements found (attached).');

    // Check visibility of the content
    const isVisible = await page.isVisible('.milestones__horizontal_line');
    console.log('Is timeline content visible?', isVisible);

    if (!isVisible) {
        console.error('Timeline content is not visible!');
        process.exit(1);
    }

    // Wait a bit for potential layout stability (images/text) after rendering
    await page.waitForTimeout(1000);

    // Take screenshot regardless
    await page.screenshot({ path: 'experiments_screenshot.png', fullPage: true });
    console.log('Screenshot taken: experiments_screenshot.png');

  } catch (e) {
    console.error('Error during test:', e);
    await page.screenshot({ path: 'experiments_error.png', fullPage: true });
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
