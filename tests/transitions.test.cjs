const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ROOT, startServer, launch, openPage, homeSnapshot } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const vtNames = (page) => page.evaluate(() =>
  [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).viewTransitionName).filter((n) => n && n !== 'none'));

test('vtName yields valid CSS identifiers', async () => {
  const { vtName } = await import(path.join(ROOT, 'src/lib/vt.ts'));
  assert.equal(vtName('fig', 'arts'), 'fig-arts');
  assert.equal(vtName('title', 'practice-as-signal'), 'title-practice-as-signal');
  assert.equal(vtName('title', '2026 Study!'), 'title-2026-study-');
  assert.equal(vtName('fig', 'Ünïcode'), 'fig--n-code');
});

test('feature cards are whole-card links; inner links stay independent', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const hrefs = await page.$$eval('#research article.project-card h3 a', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(hrefs, ['/research/arts/', '/research/practice-as-signal/', '/research/smart-homes/']);
  // The Code link sits above the card overlay.
  const onTop = await page.$eval('#research article.project-card a[href="https://github.com/WSU-CASAS/ARTS"]', (a) => {
    a.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = a.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)?.closest('a') === a;
  });
  assert.ok(onTop, 'Code link must stay clickable above the card link');
  // Clicking the illustration opens the project page.
  // A real click on the illustration lands on the card's link overlay.
  const box = await page.$eval('#research article.project-card .figure', (f) => {
    f.scrollIntoView({ block: 'center', behavior: 'instant' });
    const r = f.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  await Promise.all([page.waitForURL('**/research/arts/'), page.mouse.click(box.x, box.y)]);
  await context.close();
});

test('the multi-view row links to its page; rows without pages do not', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const rows = await page.$$eval('#research .project-row h3', (hs) => hs.map((h) => [h.textContent.trim(), h.querySelector('a')?.getAttribute('href') ?? null]));
  assert.deepEqual(rows, [
    ['Medication adherence from in-home sensors', null],
    ['Multi-view interaction detection', '/research/multi-view/'],
    ['SQL Component Match', null],
  ]);
  await context.close();
});

test('view-transition names pair card and page, and are unique', async () => {
  const home = await openPage(browser, srv.url + '/');
  const art = await home.page.$eval('#research article.project-card .figure', (e) => getComputedStyle(e).viewTransitionName);
  const title = await home.page.$eval('#research article.project-card h3', (e) => getComputedStyle(e).viewTransitionName);
  assert.equal(art, 'fig-arts');
  assert.equal(title, 'title-arts');
  const homeNames = await vtNames(home.page);
  assert.equal(new Set(homeNames).size, homeNames.length, `duplicate names on home: ${homeNames}`);
  await home.context.close();

  const proj = await openPage(browser, srv.url + '/research/arts/');
  assert.equal(await proj.page.$eval('.project-hero .panel', (e) => getComputedStyle(e).viewTransitionName), 'fig-arts');
  assert.equal(await proj.page.$eval('.project-header h1', (e) => getComputedStyle(e).viewTransitionName), 'title-arts');
  const names = await vtNames(proj.page);
  assert.equal(new Set(names).size, names.length, `duplicate names on page: ${names}`);
  await proj.context.close();
});

test('the rail highlights the section in view', async () => {
  const { page, context } = await openPage(browser, srv.url + '/research/arts/', { width: 1440, height: 900 });
  await page.$eval('#results', (e) => e.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForTimeout(400);
  assert.equal(await page.getAttribute('nav.on-this-page a[href="#results"]', 'aria-current'), 'true');
  assert.equal(await page.$$eval('nav.on-this-page a[aria-current="true"]', (e) => e.length), 1);
  await context.close();
});

test('homepage text is still identical to phase 1', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.deepEqual(await homeSnapshot(page), require('./fixtures/phase1-home.json'));
  await context.close();
});
