const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, DIST, startServer, launch, openPage } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const PAGES = {
  arts: 'Scoring spoken word recall on a smartwatch',
  'smart-homes': 'Room-aware tracking in smart homes',
  'practice-as-signal': 'Practice as signal',
  'multi-view': 'Multi-view interaction detection',
};

test('every page project builds with its title', async () => {
  for (const [slug, title] of Object.entries(PAGES)) {
    const res = await fetch(`${srv.url}/research/${slug}/`);
    assert.equal(res.status, 200, slug);
    const { page, context } = await openPage(browser, `${srv.url}/research/${slug}/`);
    assert.equal((await page.textContent('.project-header h1')).trim(), title);
    assert.equal(await page.title(), `${title} · Luiz Takahashi`);
    await context.close();
  }
});

test('non-page and unknown projects get 404', async () => {
  for (const p of ['medication-adherence', 'sql-component-match', 'nope']) {
    assert.equal((await fetch(`${srv.url}/research/${p}/`)).status, 404, p);
  }
});

const rail = (page) => page.$$eval('nav.on-this-page a', (as) => as.map((a) => [a.textContent.trim(), a.getAttribute('href')]));

test('rail lists minute, text headings and paper-and-code, and every link resolves', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/arts/`);
  const items = await rail(page);
  assert.deepEqual(items.map((i) => i[0]),
    ['In one minute', 'The question', 'The approach', 'Rules frozen first', 'Results', 'Limits', 'Paper and code']);
  for (const [, href] of items) {
    assert.match(href, /^#[a-z0-9-]+$/);
    assert.equal(await page.$$eval(href, (e) => e.length), 1, `missing ${href}`);
  }
  await context.close();
  const mv = await openPage(browser, `${srv.url}/research/multi-view/`);
  assert.deepEqual((await rail(mv.page)).map((i) => i[0]), ['In one minute', 'Status', 'Paper and code']);
  await mv.context.close();
});

test('one-minute box has exactly three items with bold numbers', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/arts/`);
  assert.equal(await page.$$eval('#in-one-minute li', (e) => e.length), 3);
  assert.equal(await page.$eval('#in-one-minute li strong', (s) => s.textContent), '3,443');
  await context.close();
});

test('next project cycles by order', async () => {
  const order = ['arts', 'practice-as-signal', 'smart-homes', 'multi-view'];
  for (let i = 0; i < order.length; i++) {
    const { page, context } = await openPage(browser, `${srv.url}/research/${order[i]}/`);
    assert.equal(await page.getAttribute('a.next-project', 'href'), `/research/${order[(i + 1) % order.length]}/`);
    assert.equal(await page.getAttribute('a.all-research', 'href'), '/#research');
    await context.close();
  }
});

test('header facts', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/arts/`);
  assert.equal((await page.textContent('nav.breadcrumb')).replace(/\s+/g, ' ').trim(), 'Research / ARTS');
  assert.equal(await page.getAttribute('nav.breadcrumb a', 'href'), '/#research');
  assert.equal((await page.textContent('.project-authors strong')).trim(), 'L. Takahashi');
  assert.equal((await page.textContent('.project-meta')).trim(), 'First author · Submitted to JINS · Open source');
  assert.match(await page.textContent('.project-question'), /^Older adults said the words they remembered/);
  const chips = await page.$$eval('.project-header a[href^="https://"]', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(chips, ['https://github.com/WSU-CASAS/ARTS']);
  assert.equal(await page.$$eval('.project-hero svg[role="img"]', (e) => e.length), 1);
  assert.match(await page.textContent('.project-hero figcaption'), /Fig\. 1/);
  await context.close();
});

test('hero panel has no partial grain box', async () => {
  const { page, context } = await openPage(browser, `${srv.url}/research/arts/`);
  const shown = await page.$$eval('.project-hero svg > rect[filter]', (rs) => rs.filter((r) => getComputedStyle(r).display !== 'none').length);
  assert.equal(shown, 0, 'grain rect only covers the drawing, leaving a visible box in the wide panel');
  await context.close();
});

test('redirects no longer swallow /research/<slug>/', () => {
  const r = fs.readFileSync(path.join(DIST, '_redirects'), 'utf8');
  assert.doesNotMatch(r, /^\/research\/\*/m);
  for (const f of ['nullstate', 'multiview', 'behavior', 'program']) {
    assert.match(r, new RegExp(`^/research/${f}\\.html\\s+/\\s+301$`, 'm'));
  }
});

test('renderBlockMarkdown escapes HTML, demotes headings, marks external links', async () => {
  const { renderBlockMarkdown, headingId } = await import(path.join(ROOT, 'src/lib/markdown.ts'));
  assert.doesNotMatch(renderBlockMarkdown('<script>alert(1)</script>'), /<script>/);
  assert.match(renderBlockMarkdown('Hello <b>x</b>'), /&lt;b&gt;/);
  assert.match(renderBlockMarkdown('# Big\n\n## Mid'), /<h3[^>]*>Big<\/h3>[\s\S]*<h3[^>]*>Mid<\/h3>/);
  assert.match(renderBlockMarkdown('[a](https://x.org)'), /<a href="https:\/\/x\.org" rel="noopener">a<\/a>/);
  assert.match(renderBlockMarkdown('Some *candidate rescue* text.'), /<em>candidate rescue<\/em>/);
  assert.equal(headingId('Rules frozen first'), 'rules-frozen-first');
  assert.equal(headingId('The question?'), 'the-question');
});
