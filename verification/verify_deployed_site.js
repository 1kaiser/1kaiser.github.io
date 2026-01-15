const { chromium } = require('playwright');

(async () => {
  console.log('Starting verification of 1kaiser.github.io...');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log(`PAGE ERROR: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
        console.log(`PAGE WARN: ${msg.text()}`);
    }
  });

  page.on('requestfailed', request => {
    const failure = request.failure();
    const errorText = failure ? failure.errorText : 'Unknown error';
    networkFailures.push(`${request.url()} - ${errorText}`);
    console.log(`NETWORK FAILED: ${request.url()} - ${errorText}`);
  });

  page.on('response', response => {
      if (response.status() >= 400) {
          console.log(`HTTP ERROR ${response.status()}: ${response.url()}`);
      }
  });

  try {
    await page.goto('https://1kaiser.github.io/', { waitUntil: 'networkidle', timeout: 30000 });

    // Check if gallery is rendered
    const modelViewers = await page.$$('model-viewer');
    console.log(`Found ${modelViewers.length} model-viewer elements.`);

    if (modelViewers.length === 0) {
        console.error('No model-viewer elements found! Gallery might not be rendering.');
    } else {
        // Check src attributes
        for (let i = 0; i < modelViewers.length; i++) {
            const src = await modelViewers[i].getAttribute('src');
            console.log(`Model ${i} src: ${src}`);
        }
    }

    // Take a screenshot
    await page.screenshot({ path: 'verification/deployed_site.png' });
    console.log('Screenshot saved to verification/deployed_site.png');

  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await browser.close();
  }
})();
