const { test, expect } = require('@playwright/test');

test('verify model loading', async ({ page, request }) => {
  // Go to home page
  await page.goto('/');

  // Wait for the gallery to render
  // We use a shorter timeout first, but if network is slow (server startup), 10s is safer.
  await page.waitForSelector('.model-card', { timeout: 30000 });

  // Get the models config from the window object
  const modelsConfig = await page.evaluate(() => window.modelsConfig);
  expect(modelsConfig).toBeTruthy();
  expect(modelsConfig.length).toBeGreaterThan(0);

  console.log(`Found ${modelsConfig.length} models.`);

  for (const model of modelsConfig) {
    const url = model.url;
    console.log(`Checking model: ${model.title} at ${url}`);

    try {
        const response = await request.get(url);
        expect(response.status(), `Failed to load ${model.title} at ${url}`).toBe(200);
    } catch (e) {
        // If request fails entirely (e.g. network error), fail the test
        throw new Error(`Failed to fetch ${url}: ${e.message}`);
    }
  }
});
