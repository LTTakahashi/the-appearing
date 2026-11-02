const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ROOT, startServer, launch, openPage } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const URL_PATH = '/research/practice-as-signal/';
const model = () => import(path.join(ROOT, 'src/lib/practice-band.ts'));
const text = async (page, sel) => (await page.textContent(sel)).replace(/\s+/g, ' ').trim();

test('model verdicts match the spec', async () => {
  const m = await model();
  const d9 = m.state(9);
  assert.equal(d9.score, 11.3);
  assert.ok(d9.bandFlag);
  assert.equal(d9.bandVerdict, 'Below what practice predicts: flagged as a possible real drop.');
  assert.equal(d9.fixedVerdict, 'Looks normal, so this drop would be missed.');
  assert.ok(d9.fixedFlag);
  const d12 = m.state(12);
  assert.equal(d12.bandVerdict, 'Within what practice predicts: no flag.');
  assert.equal(d12.fixedVerdict, 'Out of range: would raise a false alarm for what is only practice.');
  assert.equal(m.state(1).fixedVerdict, 'Looks normal.');
  assert.equal(m.DEFAULT_DAY, 9);
  assert.deepEqual(m.FIXED, { lo: 7.6, hi: 12.4 });
  assert.equal(m.geometry().points.length, 14);
  assert.ok(m.geometry().points.find((p) => p.day === 9).outside);
});

test('slider and arrow keys update the readout', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + URL_PATH);
  await page.locator('.pb-slider').fill('12');
  assert.equal(await text(page, '.pb-score'), '17.3');
  assert.equal(await text(page, '.pb-fixed-verdict'), 'Out of range: would raise a false alarm for what is only practice.');
  await page.focus('.pb-slider');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.$eval('.pb-slider', (s) => s.value), '11');
  assert.equal(await text(page, '.pb-day'), 'Day 11');
  assert.deepEqual(errors, []);
  await context.close();
});

test('clicking a point selects its day', async () => {
  const { page, context } = await openPage(browser, srv.url + URL_PATH);
  await page.locator('.pb-slider').fill('3');
  await page.click('.pb-point[data-day="9"]', { force: true });
  assert.equal(await text(page, '.pb-band-verdict'), 'Below what practice predicts: flagged as a possible real drop.');
  assert.equal(await page.$eval('.pb-slider', (s) => s.value), '9');
  assert.equal(await page.$$eval('.pb-dot.is-selected', (e) => e.map((d) => d.getAttribute('data-day'))).then((d) => d.join()), '9');
  await context.close();
});

test('labels are honest about simulated data', async () => {
  const { page, context } = await openPage(browser, srv.url + URL_PATH);
  assert.equal(await text(page, '.pb-kicker'), 'Interactive figure · simulated data');
  const caption = await text(page, '.pb-caption');
  assert.match(caption, /^Simulated scores for illustration only, not study data\./);
  assert.match(caption, /42\.7%/);
  assert.match(caption, /93–97%/);
  await context.close();
});

test('without JavaScript the figure shows day 9 and hides the slider', async () => {
  const { page, context } = await openPage(browser, srv.url + URL_PATH, { javaScriptEnabled: false });
  assert.ok(await page.isVisible('[data-practice-band] svg'));
  assert.equal(await text(page, '.pb-score'), '11.3');
  assert.equal(await page.isVisible('.pb-slider'), false);
  await context.close();
});

test('readout is announced to screen readers', async () => {
  const { page, context } = await openPage(browser, srv.url + URL_PATH);
  assert.equal(await page.getAttribute('.pb-readout', 'aria-live'), 'polite');
  assert.equal(await page.$$eval('label[for]', (ls) => ls.some((l) => document.getElementById(l.htmlFor)?.classList.contains('pb-slider'))), true);
  await context.close();
});

test('figure sits after "The problem" on the page', async () => {
  const { page, context } = await openPage(browser, srv.url + URL_PATH);
  const order = await page.$$eval('.blocks > *', (els) => els.map((e) => e.className.match(/block-[a-z]+/)?.[0]));
  assert.deepEqual(order, ['block-text', 'block-interactive', 'block-text', 'block-stats', 'block-text']);
  await context.close();
});

test('chart labels stay readable on phones', async () => {
  const { page, context } = await openPage(browser, srv.url + URL_PATH, { width: 390, height: 844 });
  const heights = await page.$$eval('.pb-chart text', (ts) => ts.map((t) => t.getBoundingClientRect().height));
  assert.ok(Math.min(...heights) >= 10, `smallest chart label is ${Math.min(...heights).toFixed(1)}px tall`);
  const clipped = await page.$eval('.pb-chart', (svg) => {
    const box = svg.getBoundingClientRect();
    return [...svg.querySelectorAll('text')].filter((t) => {
      const r = t.getBoundingClientRect();
      return r.left < box.left - 0.5 || r.right > box.right + 0.5;
    }).map((t) => t.textContent);
  });
  assert.deepEqual(clipped, [], 'labels cut off at the chart edge');
  await context.close();
});
