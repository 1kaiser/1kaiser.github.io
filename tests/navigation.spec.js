
const { test, expect } = require('@playwright/test');

test('navigation links check', async ({ page }) => {
  // 1. Go to the homepage
  await page.goto('http://localhost:8080/');

  // 2. Verify Internal Links exist
  const cvLink = page.locator('a[href="cv/cv.html"]');
  await expect(cvLink).toBeVisible();

  const desktopLink = page.locator('a[href="desktop/desktop.html"]');
  await expect(desktopLink).toBeVisible();

  const demLink = page.locator('a[href="cv/dem-to-glb.html"]');
  await expect(demLink).toBeVisible();

  // 3. Verify External Project Links exist
  const wordyLink = page.locator('a[href="/wordy/index.html"]');
  await expect(wordyLink).toBeVisible();

  const graphQueenLink = page.locator('a[href="/graph-queen/index.html"]');
  await expect(graphQueenLink).toBeVisible();

  // 4. Interaction Check: Click an internal link and verify navigation
  // We'll check "CV" as it is a local file
  await cvLink.click();
  await expect(page).toHaveURL(/.*cv\/cv\.html/);

  // Go back
  await page.goBack();

  // 5. Verify we are back
  await expect(page).toHaveURL('http://localhost:8080/');
});
