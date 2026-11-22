const { test, expect } = require('@playwright/test');

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const IS_LIVE = BASE_URL.startsWith('https://');
const RUN_SUBREPOS = IS_LIVE || process.env.RUN_SUBREPOS === '1';

async function stubHeavyWeights(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (
      url.includes('huggingface.co') ||
      url.includes('.hf.co/') ||
      /\.(onnx|onnx_data)(\?|$)/i.test(url) ||
      url.includes('corpus-embeddings.bin') ||
      url.includes('releases/download/')
    ) {
      return route.abort('aborted');
    }
    return route.continue();
  });
}

function attachTrackers(page) {
  const pageErrors = [];
  const sameOrigin404s = [];
  const downloads404s = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    if (status === 404) {
      if (url.includes('/downloads/')) downloads404s.push(url);
      if (url.startsWith(BASE_URL)) sameOrigin404s.push(url);
    }
  });

  return { pageErrors, sameOrigin404s, downloads404s };
}

test('homepage navigation, CSP/Piping fixes, and References footer', async ({ page }) => {
  const { pageErrors, sameOrigin404s, downloads404s } = attachTrackers(page);

  const resp = await page.goto(BASE_URL + '/');
  expect(resp.status()).toBe(200);

  const expectedHrefs = [
    'cv/cv.html',
    'cv/googlephotos.html',
    'cv/dem-to-glb.html',
    'cv/WMO_2012.html',
    'cv/layerflow-BERT.html',
    'cv/Neuron_Factors.html',
    'desktop/desktop.html',
    'soundcloud/index.html',
    'experiments.html',
    '/gemma-chat-app/',
    '/graph-queen/',
    '/llm-consistency-vis/',
    '/llm-wordgraph-exact/',
    '/TextGraph/',
    '/wordy/'
  ];

  for (const href of expectedHrefs) {
    const link = page.locator(`nav a[href="${href}"]`);
    await expect(link).toBeVisible();
  }

  const pipingOk = await page.evaluate(() => typeof window.PipingServerUtils === 'object' && !!window.PipingServerUtils.CURRENT_DOMAIN);
  expect(pipingOk).toBe(true);

  const refsDetails = page.locator('#site-references details');
  await expect(refsDetails).toBeVisible();
  await refsDetails.locator('summary').click();
  await expect(refsDetails.locator('li')).toHaveCount(4);

  expect(downloads404s).toEqual([]);
  expect(sameOrigin404s).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('cv/cv.html loads cleanly with no runtime errors or 404s', async ({ page }) => {
  const { pageErrors, sameOrigin404s } = attachTrackers(page);
  const resp = await page.goto(BASE_URL + '/cv/cv.html');
  expect(resp.status()).toBe(200);

  const bodyText = (await page.locator('body').innerText()).trim();
  expect(bodyText.length).toBeGreaterThan(0);

  expect(sameOrigin404s).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('cv/googlephotos.html loads cv/images.json, searches, and closes lightbox with Escape', async ({ page }) => {
  const { pageErrors, sameOrigin404s } = attachTrackers(page);
  const resp = await page.goto(BASE_URL + '/cv/googlephotos.html');
  expect(resp.status()).toBe(200);

  await page.locator('.photo-item').first().waitFor({ state: 'visible', timeout: 15000 });
  const totalPhotos = await page.locator('.photo-item').count();
  expect(totalPhotos).toBe(18);
  await expect(page.locator('.profile-icon')).toHaveText('K');
  await expect(page.locator('a[href="../index.html"]').first()).toBeVisible();

  await page.locator('.photo-item').first().click();
  await expect(page.locator('#lightbox')).not.toHaveClass(/hidden/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toHaveClass(/hidden/);

  await page.locator('#search-input').fill('Temple');
  const filtered = await page.locator('.photo-item').count();
  expect(filtered).toBe(1);

  expect(sameOrigin404s).toEqual([]);
  expect(pageErrors).toEqual([]);
});

test('local cv/ desktop/ soundcloud/ and experiments.html pages mount cleanly', async ({ page }) => {
  await stubHeavyWeights(page);

  const localPages = [
    { path: '/cv/dem-to-glb.html', refText: 'References' },
    { path: '/cv/WMO_2012.html', refText: 'WMO' },
    { path: '/cv/layerflow-BERT.html', refText: 'EmbeddingGemma' },
    { path: '/cv/Neuron_Factors.html', refText: 'Alammar' },
    { path: '/cv/chat-app.html', refText: 'References' },
    { path: '/cv/TextGraph.html', refText: 'References' },
    { path: '/desktop/desktop.html', refText: 'References' },
    { path: '/desktop/potree/index.html?scan=VID20230408113045_1', refText: 'Potree' },
    { path: '/soundcloud/index.html', refText: 'Playback Rewind' },
    { path: '/experiments.html', refText: 'D3.js' }
  ];

  for (const item of localPages) {
    const { pageErrors, sameOrigin404s, downloads404s } = attachTrackers(page);
    const resp = await page.goto(BASE_URL + item.path);
    expect(resp.status(), `status for ${item.path}`).toBe(200);

    const html = await page.content();
    expect(html, `reference marker in ${item.path}`).toContain(item.refText);

    if (item.path === '/cv/Neuron_Factors.html') {
      const selectedModel = await page.locator('#model-select').inputValue();
      expect(selectedModel).toBe('Xenova/all-MiniLM-L6-v2');
      const colabInHead = await page.locator('head img').count();
      expect(colabInHead).toBe(0);
    }

    if (item.path === '/desktop/desktop.html') {
      await page.locator('#btn-references').click();
      await expect(page.locator('#references-modal')).toBeVisible();
      await page.locator('#btn-references-close').click();
      await expect(page.locator('#references-modal')).toBeHidden();
    }

    if (item.path === '/experiments.html') {
      await expect(page.locator('#featured-experiments')).toHaveCount(0);
      await page.locator('#timeline svg circle.repo-node').first().waitFor({ state: 'visible', timeout: 15000 });
      await expect(page.locator('#timeline svg g.gap-badge').first()).toBeVisible();

      const getSvgWidth = () => page.locator('#timeline svg').evaluate((el) => parseFloat(el.getAttribute('width') || '0'));
      const widthDefault = await getSvgWidth();

      await page.locator('#gap-compression').evaluate((el) => { el.value = '0'; el.dispatchEvent(new Event('input')); });
      const widthLinear = await getSvgWidth();
      expect(widthLinear).toBeGreaterThan(widthDefault);

      await page.locator('#gap-compression').evaluate((el) => { el.value = '100'; el.dispatchEvent(new Event('input')); });
      const widthUniform = await getSvgWidth();
      expect(widthDefault).toBeGreaterThan(widthUniform);

      await page.locator('[data-preset="adaptive"]').click();
      await page.waitForTimeout(400);
      const widthBeforeGapClick = await getSvgWidth();
      await page.locator('#timeline svg g.gap-badge').first().click();
      await page.waitForTimeout(400);
      const widthAfterGapExpand = await getSvgWidth();
      expect(widthAfterGapExpand).toBeGreaterThan(widthBeforeGapClick);

      await page.locator('#timeline svg g.gap-badge').first().click();
      await page.waitForTimeout(400);
      const widthAfterGapShrink = await getSvgWidth();
      expect(widthAfterGapShrink).toBeLessThan(widthAfterGapExpand);
    }

    expect(downloads404s, `downloads 404s on ${item.path}`).toEqual([]);
    expect(sameOrigin404s, `same-origin 404s on ${item.path}`).toEqual([]);
    expect(pageErrors, `pageerrors on ${item.path}`).toEqual([]);
  }
});

test('all 6 linked sub-repository GitHub Pages deployments (live)', async ({ page }) => {
  test.skip(!RUN_SUBREPOS, 'Skipped on local-only HTTP server unless BASE_URL=https://1kaiser.github.io');
  await stubHeavyWeights(page);

  const subRepos = [
    { path: '/TextGraph/', checkRef: async () => { await page.getByRole('button', { name: 'References' }).click(); await expect(page.getByText('Veličković, P.')).toBeVisible(); } },
    { path: '/gemma-chat-app/', checkRef: async () => {
      const opts = await page.locator('#model-select option').count();
      expect(opts).toBeGreaterThanOrEqual(8);
      await page.locator('#refs-btn').click();
      await expect(page.getByText('arXiv:2503.19786')).toBeVisible();
    }},
    { path: '/graph-queen/', checkRef: async () => { await page.getByRole('button', { name: /References/ }).click(); await expect(page.locator('#references-slide-panel')).toHaveClass(/visible/); } },
    { path: '/llm-consistency-vis/', checkRef: async () => { await expect(page.locator('footer')).toContainText('EmilyReif/llm-consistency-vis'); } },
    { path: '/llm-wordgraph-exact/', checkRef: async () => { await page.locator('#refsToggleBtn').click(); await expect(page.locator('#refsModal')).toBeVisible(); await expect(page.locator('#refsModal')).toContainText('EmilyReif/llm-consistency-vis'); } },
    { path: '/wordy/', checkRef: async () => { await page.locator('#wordy-refs-btn').click(); await expect(page.locator('#wordy-refs-modal')).toBeVisible(); await expect(page.locator('#wordy-refs-modal')).toContainText('arXiv:2405.19504'); } },
    { path: '/wordy/muvera.html', checkRef: async () => { await expect(page.locator('footer')).toContainText('arXiv:2405.19504'); } },
    { path: '/wordy/rag-demo.html', checkRef: async () => { await expect(page.locator('footer')).toContainText('WordNet 3.1'); } }
  ];

  for (const sub of subRepos) {
    const { pageErrors, sameOrigin404s } = attachTrackers(page);
    const resp = await page.goto(BASE_URL + sub.path);
    expect(resp.status(), `status for ${sub.path}`).toBe(200);
    await expect(page.locator('a[href*="1kaiser.github.io"]').first()).toBeVisible();
    await sub.checkRef();
    expect(sameOrigin404s, `same-origin 404s on ${sub.path}`).toEqual([]);
    expect(pageErrors, `pageerrors on ${sub.path}`).toEqual([]);
  }
});
