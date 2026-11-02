const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage, readYaml } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const cardLinks = (page, i) => page.$$eval('#research article.project-card', (cards, idx) =>
  [...cards[idx].querySelectorAll('a')].map((a) => [a.textContent.replace('↗', '').trim(), a.getAttribute('href')]), i);

test('every YAML project renders (no silent drops)', async () => {
  const y = readYaml('src/data/projects.yaml');
  assert.equal(y.length, 6);
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.equal(await page.$$eval('#research article.project-card', (e) => e.length), y.filter((p) => p.feature).length);
  assert.equal(await page.$$eval('#research .project-row', (e) => e.length), y.filter((p) => !p.feature).length);
  await context.close();
});

test('cards in spec order with figures', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const titles = await page.$$eval('#research article.project-card h3', (hs) => hs.map((h) => h.textContent.trim()));
  assert.deepEqual(titles, ['Scoring spoken word recall on a smartwatch', 'Practice as signal', 'Room-aware tracking in smart homes']);
  assert.equal(await page.$$eval('#research article.project-card .figure svg[role="img"][aria-label]', (s) => s.length), 3);
  await context.close();
});

test('cards are not whole-card links; real links only', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.equal(await page.$$eval('#research article.project-card', (as) => as.filter((a) => a.closest('a')).length), 0);
  assert.deepEqual(await cardLinks(page, 0), [['Code', 'https://github.com/WSU-CASAS/ARTS']]);
  assert.deepEqual(await cardLinks(page, 1), []);
  assert.deepEqual(await cardLinks(page, 2), [['DOI', 'https://doi.org/10.4017/gt.2026.25.2.1421.3']]);
  const rels = await page.$$eval('#research a[href^="https://"]', (as) => as.map((a) => a.getAttribute('rel')));
  assert.ok(rels.length > 0 && rels.every((r) => r && r.includes('noopener')));
  await context.close();
});

test('rows in spec order', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const titles = await page.$$eval('#research .project-row h3', (hs) => hs.map((h) => h.textContent.trim()));
  assert.deepEqual(titles, ['Medication adherence from in-home sensors', 'Multi-view interaction detection', 'SQL Component Match']);
  const medLinks = await page.$$eval('#research .project-row', (rows) =>
    [...rows[0].querySelectorAll('a')].map((a) => a.getAttribute('href')));
  assert.deepEqual(medLinks, ['https://doi.org/10.4017/gt.2026.25.2.1527.3']);
  await context.close();
});

test('kicker, summary and meta text', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const first = await page.$eval('#research article.project-card', (c) => ({
    kicker: c.querySelector('.kicker').textContent.trim(),
    meta: c.querySelector('.meta').textContent.trim(),
    summary: c.querySelector('.summary').textContent.trim(),
  }));
  assert.equal(first.kicker, 'Speech · Wearables');
  assert.equal(first.meta, 'First author · Submitted to JINS · Open source');
  assert.match(first.summary, /matched two human scorers on held-out participants \(ICC \.97\)\.$/);
  await context.close();
});

test('grid collapses from 3 columns to 1', async () => {
  for (const [width, distinct] of [[1440, 1], [390, 3]]) {
    const { page, context } = await openPage(browser, srv.url + '/', { width });
    const tops = await page.$$eval('#research article.project-card', (cs) => cs.map((c) => Math.round(c.getBoundingClientRect().top)));
    assert.equal(new Set(tops).size, distinct, `width ${width}: tops ${tops}`);
    await context.close();
  }
});

test('cards never extend past the content column on narrow phones', async () => {
  for (const width of [320, 300]) {
    const { page, context } = await openPage(browser, srv.url + '/', { width, height: 700 });
    const r = await page.evaluate(() => {
      const grid = document.querySelector('#research .cards');
      const gridRight = grid.getBoundingClientRect().right;
      const maxRight = Math.max(...[...grid.children].map((c) => c.getBoundingClientRect().right));
      return { gridRight, maxRight, sw: document.documentElement.scrollWidth, iw: window.innerWidth };
    });
    assert.ok(r.maxRight <= r.gridRight + 0.5, `width ${width}: card right ${r.maxRight} > column right ${r.gridRight}`);
    assert.ok(r.sw <= r.iw, `width ${width}: scrollWidth ${r.sw} > innerWidth ${r.iw}`);
    await context.close();
  }
});

test('figures use theme tokens', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { colorScheme: 'dark' });
  const html = await page.$eval('#research article.project-card .figure', (f) => f.innerHTML);
  assert.doesNotMatch(html, /#[0-9a-fA-F]{6}/, 'figures must not hard-code hex colors');
  await context.close();
});
