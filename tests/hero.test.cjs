const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const top = (page, sel) => page.$eval(sel, (el) => el.getBoundingClientRect().top + window.scrollY);

test('hero text matches spec', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.equal((await page.textContent('h1')).trim(), 'Luiz Takahashi');
  assert.equal((await page.textContent('.hero-label')).trim(), 'PhD applicant · Fall 2027');
  assert.equal(
    (await page.textContent('.hero-line')).trim(),
    'I measure cognition and behavior in daily life, and ask when a recorded change is real rather than practice, context or noise.',
  );
  assert.equal(await page.$$eval('.hero-bio p', (ps) => ps.length), 2);
  const bio = await page.textContent('.hero-bio');
  assert.match(bio, /Neuropsychology and Aging Lab with Maureen Schmitter-Edgecombe/);
  assert.match(bio, /University of São Paulo’s Center for Artificial Intelligence \(C4AI\)\./);
  const caption = await page.textContent('.hero-portrait figcaption');
  assert.match(caption, /B\.S\. Computer Science, WSU ’27/);
  assert.match(caption, /Pullman, WA/);
  await context.close();
});

test('hero links', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const hrefs = await page.$$eval('.hero-links a', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(hrefs, [
    '/Takahashi_CV.pdf',
    'mailto:l.takahashidosreis@wsu.edu',
    'https://github.com/LTTakahashi',
    'https://orcid.org/0009-0006-3548-1256',
  ]);
  await context.close();
});

test('portrait is optimized, framed and muted', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.equal(await page.$$eval('.hero-portrait picture source[type="image/avif"]', (e) => e.length), 1);
  assert.equal(await page.$$eval('.hero-portrait picture source[type="image/webp"]', (e) => e.length), 1);
  const img = await page.$eval('.hero-portrait img', (i) => ({
    alt: i.getAttribute('alt'), w: i.getAttribute('width'), h: i.getAttribute('height'),
    filter: getComputedStyle(i).filter, loaded: i.complete && i.naturalWidth > 0,
  }));
  assert.equal(img.alt, 'Portrait of Luiz Takahashi');
  assert.ok(img.w && img.h, 'img needs width and height');
  assert.ok(img.loaded, 'portrait did not load');
  assert.match(img.filter, /saturate\(0\.82\)/);
  assert.doesNotMatch(img.filter, /sepia/);
  const border = await page.$eval('.hero-portrait .frame', (f) => getComputedStyle(f).borderTopWidth);
  assert.equal(border, '1px');
  await context.close();

  const dark = await openPage(browser, srv.url + '/', { colorScheme: 'dark' });
  const darkFilter = await dark.page.$eval('.hero-portrait img', (i) => getComputedStyle(i).filter);
  assert.match(darkFilter, /brightness\(0\.92\)/);
  await dark.context.close();
});

test('phone order: line, portrait, bio', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { width: 390, height: 844 });
  const line = await top(page, '.hero-line');
  const portrait = await top(page, '.hero-portrait');
  const bio = await top(page, '.hero-bio');
  assert.ok(line < portrait, `line ${line} should be above portrait ${portrait}`);
  assert.ok(portrait < bio, `portrait ${portrait} should be above bio ${bio}`);
  await context.close();
});

test('desktop: portrait beside the text', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { width: 1440 });
  const h1 = await page.$eval('h1', (e) => e.getBoundingClientRect());
  const fig = await page.$eval('.hero-portrait', (e) => e.getBoundingClientRect());
  assert.ok(fig.left > h1.left + 400, 'portrait should sit in the right column');
  assert.ok(fig.width <= 380.5, `portrait wider than 380px: ${fig.width}`);
  await context.close();
});

test('no horizontal scroll at 320px', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { width: 320, height: 700 });
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `scrollWidth ${sw} > innerWidth ${iw}`);
  await context.close();
});
