const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const REVEAL_SEL = '.project-card, .project-row, .news li, .pubs li';
const RESEARCH_LINE = 'I measure cognition and behavior in daily life, and ask when a recorded change is real rather than practice, context or noise.';

test('JSON-LD Person', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const ld = JSON.parse(await page.textContent('script[type="application/ld+json"]'));
  assert.equal(ld['@context'], 'https://schema.org');
  assert.equal(ld['@type'], 'Person');
  assert.equal(ld.name, 'Luiz Takahashi');
  assert.equal(ld.alternateName, 'Luiz Takeshi Takahashi Dos Reis');
  assert.equal(ld.url, 'https://luiztakahashi.com/');
  assert.equal(ld.affiliation.name, 'Washington State University');
  assert.deepEqual([...ld.sameAs].sort(), ['https://github.com/LTTakahashi', 'https://orcid.org/0009-0006-3548-1256']);
  await context.close();
});

test('meta, canonical, Open Graph', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const attr = (sel, a) => page.getAttribute(sel, a);
  assert.equal(await page.title(), 'Luiz Takahashi');
  assert.equal(await attr('meta[name="description"]', 'content'), RESEARCH_LINE);
  assert.equal(await attr('link[rel="canonical"]', 'href'), 'https://luiztakahashi.com/');
  assert.equal(await attr('meta[property="og:image"]', 'content'), 'https://luiztakahashi.com/og.png');
  assert.equal(await attr('meta[property="og:title"]', 'content'), 'Luiz Takahashi');
  assert.equal(await attr('meta[name="twitter:card"]', 'content'), 'summary_large_image');
  await context.close();
});

test('favicons and og.png are served', async () => {
  for (const p of ['/favicon.svg', '/favicon-32.png', '/og.png']) {
    const res = await fetch(srv.url + p);
    assert.equal(res.status, 200, p);
  }
  const buf = Buffer.from(await (await fetch(srv.url + '/og.png')).arrayBuffer());
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.equal(await page.getAttribute('link[rel="icon"][type="image/svg+xml"]', 'href'), '/favicon.svg');
  await context.close();
});

const opacities = (page) => page.$$eval(REVEAL_SEL, (els) => els.map((e) => getComputedStyle(e).opacity));

test('no JavaScript: everything visible', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { javaScriptEnabled: false });
  const o = await opacities(page);
  assert.ok(o.length >= 15, `expected cards, rows, news and pubs; got ${o.length}`);
  assert.ok(o.every((v) => v === '1'), `hidden elements without JS: ${o}`);
  await context.close();
});

test('reduced motion: everything visible immediately', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { reducedMotion: 'reduce' });
  const o = await opacities(page);
  assert.ok(o.every((v) => v === '1'), `hidden elements with reduced motion: ${o}`);
  assert.equal(await page.$$eval('.reveal', (e) => e.length), 0);
  await context.close();
});

test('scrolling reveals cards', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + '/', { width: 1440, height: 900 });
  const total = await page.$$eval('.reveal', (e) => e.length);
  assert.ok(total >= 15, `reveal not applied: ${total}`);
  const hiddenBefore = await page.$$eval('.reveal:not(.is-visible)', (e) => e.length);
  assert.ok(hiddenBefore > 0, 'below-the-fold items should start hidden');
  for (let y = 0; y <= 4000; y += 400) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(600);
  assert.equal(await page.$$eval('.reveal:not(.is-visible)', (e) => e.length), 0);
  assert.deepEqual(errors, []);
  await context.close();
});

test('reveal safety timeout shows everything without scrolling', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { width: 1440, height: 900 });
  assert.ok((await page.$$eval('.reveal', (e) => e.length)) >= 15, 'reveal not applied');
  await page.waitForTimeout(2800);
  assert.equal(await page.$$eval('.reveal:not(.is-visible)', (e) => e.length), 0);
  await context.close();
});
