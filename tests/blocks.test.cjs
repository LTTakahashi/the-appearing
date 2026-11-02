const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const texts = (page, sel) => page.$$eval(sel, (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));

test('ARTS steps, timeline and stats', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/arts/`);
  assert.deepEqual(await texts(page, '.block-steps .step-label'), ['1 · Top guess', '2 · Alternatives', '3 · Decision']);
  assert.deepEqual(await page.$$eval('.block-steps li', (ls) => ls.map((l) => l.classList.contains('is-emphasis'))), [false, false, true]);
  assert.deepEqual(await texts(page, '.block-timeline .stage-label'), ['Development', 'Then', 'Held-out test']);
  assert.equal(await page.$eval('.block-timeline li.is-emphasis .stage-text', (e) => e.textContent.trim()), 'Rules frozen');
  assert.deepEqual(await texts(page, '.block-stats .stat-value'), ['.971', '.968', '.987', '0.21']);
  assert.deepEqual(await page.$$eval('.block-stats li', (ls) => ls.map((l) => l.classList.contains('is-muted'))), [false, false, true, false]);
  // Order on the page: steps after "The approach", timeline after "Rules frozen first", stats after "Results".
  const order = await page.$$eval('.blocks > *', (els) => els.map((e) => e.className.match(/block-[a-z]+/)?.[0]));
  assert.deepEqual(order, ['block-text', 'block-text', 'block-steps', 'block-text', 'block-timeline', 'block-text', 'block-stats', 'block-text']);
  await context.close();
});

test('smart-homes stats and timeline', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/smart-homes/`);
  assert.deepEqual(await texts(page, '.block-stats .stat-value'), ['18%', '92%', '.78', '−.43']);
  assert.deepEqual(await texts(page, '.block-timeline .stage-label'), ['Source data', 'Simulated residents', 'Real homes']);
  await context.close();
});

test('practice-as-signal stats', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/practice-as-signal/`);
  assert.deepEqual(await texts(page, '.block-stats .stat-value'), ['93–97%', '42.7%', '+4.28']);
  await context.close();
});

test('multi-view hero uses the multiview illustration', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/multi-view/`);
  const label = await page.getAttribute('.project-hero svg[role="img"]', 'aria-label');
  assert.match(label, /^Illustration: an apparent trend across pooled data disappears within each cohort/);
  const html = await page.$eval('.project-hero svg', (s) => s.outerHTML);
  assert.doesNotMatch(html, /#[0-9a-fA-F]{6}/, 'figures use theme classes, not hex colors');
  assert.doesNotMatch(html, /<text/, 'no text inside the illustration');
  await context.close();
});

test('stats never overflow at 320px', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/smart-homes/`, { width: 320, height: 700 });
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `scrollWidth ${sw} > innerWidth ${iw}`);
  await context.close();
});
