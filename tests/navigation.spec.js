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
  const potreeErrors = [];

  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    if (status === 404) {
      if (url.includes('/downloads/')) downloads404s.push(url);
      if (url.startsWith(BASE_URL)) sameOrigin404s.push(url);
    }
    if (status >= 400 && url.includes('/pointclouds/')) {
      potreeErrors.push(`${status} ${url}`);
    }
  });

  return { pageErrors, sameOrigin404s, downloads404s, potreeErrors };
}

test('homepage navigation, CSP/Piping fixes, and References footer', async ({ page }) => {
  await stubHeavyWeights(page);
  const { pageErrors, sameOrigin404s, downloads404s } = attachTrackers(page);

  const resp = await page.goto(BASE_URL + '/', { waitUntil: 'domcontentloaded' });
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
    '/wordy/',
    '/proccessing_sketches/'
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

  await expect(page.locator('#bg-scan-desktop')).toHaveAttribute('href', /desktop\/desktop\.html\?scan=/);
  await expect(page.locator('#bg-scan-potree')).toHaveAttribute('href', /desktop\/potree\/index\.html\?scan=/);

  await page.locator('.model-card').first().hover();
  await page.locator('.model-card-expand').first().click();
  await expect(page.locator('#modelOverlay')).toBeVisible();
  await expect(page.locator('#modalDesktopBtn')).toHaveAttribute('href', /desktop\/desktop\.html\?model=my-model/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#modelOverlay')).toBeHidden();

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
  const resp = await page.goto(BASE_URL + '/cv/googlephotos.html', { waitUntil: 'domcontentloaded' });
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
  test.setTimeout(IS_LIVE ? 240000 : 120000);
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
    const { pageErrors, sameOrigin404s, downloads404s, potreeErrors } = attachTrackers(page);
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
      await expect(page.locator('#references-modal')).toContainText('Spencer');
      await expect(page.locator('#references-modal')).toContainText('Gielis');
      await page.locator('#btn-references-close').click();
      await expect(page.locator('#references-modal')).toBeHidden();

      // Verify Models & Scans drawer and dark navbar styling + white #tool-frame
      const refBg = await page.locator('#btn-references').evaluate(el => getComputedStyle(el).backgroundColor);
      expect(refBg).not.toBe('rgb(239, 239, 239)');
      const frameBg = await page.locator('#tool-frame').evaluate(el => getComputedStyle(el).backgroundColor);
      expect(frameBg).toBe('rgb(255, 255, 255)');
      await page.locator('#btn-models').click();
      await expect(page.locator('#models-drawer')).toBeVisible();
      expect(await page.locator('#models-drawer .drawer-item').count()).toBe(18);
      await page.keyboard.press('Escape');
      await expect(page.locator('#models-drawer')).toBeHidden();

      // Verify deep-linked Gallery model + 3D Sun-Path + Supershapes Star preset
      await page.goto(BASE_URL + '/desktop/desktop.html?model=momos&tool=sunpath', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('#stage-hud-meta')).toContainText('Draco/GLB', { timeout: IS_LIVE ? 95000 : 30000 });
      await page.locator('#sp-preset-delhi').click();
      const spTxt = await page.locator('#sp-info').innerText();
      const altMatch = spTxt.match(/Alt:\s*([\d.]+)/);
      expect(altMatch && parseFloat(altMatch[1])).toBeGreaterThan(75);

      await page.locator('.cat-toggle', { hasText: '3D Geometry' }).click();
      await page.locator('.tool-btn', { hasText: 'Supershapes' }).click();
      await page.locator('.np-preset-btn', { hasText: 'Star' }).click();
      expect(await page.locator('#ss-n1').inputValue()).toBe('0.3');
      expect(await page.locator('#ss-n2').inputValue()).toBe('1.7');
      expect(await page.locator('#ss-n3').inputValue()).toBe('1.7');
    }

    if (item.path.startsWith('/desktop/potree/')) {
      await page.waitForTimeout(1500);
      expect(potreeErrors, 'Potree HTTP >=400 responses').toEqual([]);
      const noOverlap = await page.evaluate(() => {
        const picker = document.getElementById('scan-picker')?.getBoundingClientRect();
        const desc = document.getElementById('potree_description')?.getBoundingClientRect();
        if (!picker || !desc) return true;
        return picker.bottom <= desc.top || picker.right <= desc.left || desc.right <= picker.left;
      });
      expect(noOverlap).toBe(true);
    }

    if (item.path === '/experiments.html') {
      await expect(page.locator('#featured-experiments')).toHaveCount(0);
      await page.locator('#timeline svg circle.repo-node').first().waitFor({ state: 'visible', timeout: 15000 });
      await expect(page.locator('#timeline svg text.milestone-date').first()).toBeVisible();
      await expect(page.locator('#timeline svg a.repo-link').first()).toBeVisible();

      const getFitMetrics = () => page.evaluate(() => {
        const wrap = document.getElementById('timeline-wrapper');
        const svg = document.querySelector('#timeline svg');
        const svgW = parseFloat(svg.getAttribute('width') || '0');
        const rects = Array.from(document.querySelectorAll('#timeline svg rect.milestone-block-bg')).map(r => ({
          x0: parseFloat(r.getAttribute('x') || '0'),
          y0: parseFloat(r.getAttribute('y') || '0'),
          w: parseFloat(r.getAttribute('width') || '0'),
          h: parseFloat(r.getAttribute('height') || '0')
        }));
        let overlaps = 0;
        let clipped = 0;
        for (let i = 0; i < rects.length; i++) {
          const a = rects[i];
          if (a.x0 < -0.5 || a.x0 + a.w > svgW + 0.5) clipped++;
          for (let j = i + 1; j < rects.length; j++) {
            const b = rects[j];
            if (a.x0 + 1 < b.x0 + b.w && a.x0 + a.w - 1 > b.x0 && a.y0 + 1 < b.y0 + b.h && a.y0 + a.h - 1 > b.y0) {
              overlaps++;
            }
          }
        }
        return {
          wrapClientW: wrap.clientWidth,
          wrapScrollW: wrap.scrollWidth,
          svgW,
          overlaps,
          clipped,
          dotCount: document.querySelectorAll('#timeline svg circle.repo-node').length
        };
      });

      const fitM = await getFitMetrics();
      expect(fitM.svgW).toBeLessThanOrEqual(fitM.wrapClientW + 2);
      expect(fitM.wrapScrollW).toBeLessThanOrEqual(fitM.wrapClientW + 2);
      expect(fitM.overlaps).toBe(0);
      expect(fitM.clipped).toBe(0);

      await page.locator('[data-width-mode="wide"]').click();
      const wideM = await getFitMetrics();
      expect(wideM.svgW).toBeGreaterThanOrEqual(2400);
      expect(wideM.svgW).toBeGreaterThan(fitM.svgW);

      await page.locator('[data-width-mode="fit"]').click();
      const backM = await getFitMetrics();
      expect(backM.svgW).toBeLessThanOrEqual(backM.wrapClientW + 2);

      await page.locator('[data-group-mode="month"]').click();
      const monthM = await getFitMetrics();
      expect(monthM.dotCount).toBeLessThan(fitM.dotCount);
      await page.locator('[data-group-mode="day"]').click();

      const getSecondDotCx = () => page.locator('#timeline svg circle.repo-node').nth(1).getAttribute('cx').then(Number);
      const cxBalanced = await getSecondDotCx();
      await page.locator('[data-scale-mode="linear"]').click();
      const cxLinear = await getSecondDotCx();
      expect(Math.abs(cxLinear - cxBalanced)).toBeGreaterThan(5);
      await page.locator('[data-scale-mode="balanced"]').click();
    }

    expect(downloads404s, `downloads 404s on ${item.path}`).toEqual([]);
    expect(sameOrigin404s, `same-origin 404s on ${item.path}`).toEqual([]);
    expect(pageErrors, `pageerrors on ${item.path}`).toEqual([]);
  }
});

test('all 7 linked sub-repository GitHub Pages deployments (live)', async ({ page }) => {
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
    { path: '/wordy/rag-demo.html', checkRef: async () => { await expect(page.locator('footer')).toContainText('WordNet 3.1'); } },
    { path: '/proccessing_sketches/', checkRef: async () => {
      await page.locator('#stage-img').waitFor({ state: 'visible', timeout: 15000 });
      await expect(page.locator('#slide-counter')).toContainText('/ 148');
      await page.locator('#btn-next').click();
      await expect(page.locator('#slide-counter')).toContainText('2 / 148');
      await page.locator('#refs-btn').click();
      await expect(page.locator('#refs-modal')).toBeVisible();
      await expect(page.locator('#refs-modal')).toContainText('Processing');
      await page.keyboard.press('Escape');
    }}
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
