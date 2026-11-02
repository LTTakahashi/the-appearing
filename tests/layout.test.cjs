const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const bg = (page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const theme = (page) => page.getAttribute('html', 'data-theme');

test('light theme tokens by default', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { colorScheme: 'light' });
  assert.equal(await theme(page), 'light');
  assert.equal(await bg(page), 'rgb(237, 238, 234)');
  await context.close();
});

test('dark OS preference uses slate', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { colorScheme: 'dark' });
  assert.equal(await theme(page), 'dark');
  assert.equal(await bg(page), 'rgb(18, 20, 22)');
  await context.close();
});

test('stored light beats dark OS before paint', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', {
    colorScheme: 'dark',
    initScript: () => { try { localStorage.setItem('theme', 'light'); } catch (e) {} },
  });
  assert.equal(await theme(page), 'light');
  assert.equal(await bg(page), 'rgb(237, 238, 234)');
  await context.close();
});

test('toggle flips and persists', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + '/');
  await page.click('button[aria-label="Switch color theme"]');
  assert.equal(await theme(page), 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
  assert.equal(await bg(page), 'rgb(18, 20, 22)');
  assert.deepEqual(errors, []);
  await context.close();
});

test('toggle works when localStorage throws', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + '/', {
    initScript: () => {
      Storage.prototype.getItem = () => { throw new Error('storage blocked'); };
      Storage.prototype.setItem = () => { throw new Error('storage blocked'); };
    },
  });
  assert.equal(await theme(page), 'light');
  await page.click('button[aria-label="Switch color theme"]');
  assert.equal(await theme(page), 'dark');
  assert.deepEqual(errors, []);
  await context.close();
});

test('nav shows only enabled items', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const links = await page.$$eval('header nav a', (as) => as.map((a) => [a.textContent.trim(), a.getAttribute('href')]));
  assert.deepEqual(links, [['Research', '/#research'], ['Publications', '/#publications'], ['CV', '/Takahashi_CV.pdf']]);
  await context.close();
});

test('skip link targets main', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.equal(await page.$$eval('a.skip-link[href="#main"]', (e) => e.length), 1);
  assert.equal(await page.$$eval('main#main', (e) => e.length), 1);
  await context.close();
});

test('footer carries legal-name line and updated date', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const t = await page.textContent('footer');
  assert.match(t, /Also published as L\. Takahashi Dos Reis\./);
  assert.match(t, /Updated November 2026/);
  await context.close();
});

test('fonts are self-hosted', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  await page.evaluate(() => document.fonts.ready);
  const urls = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name));
  assert.ok(!urls.some((u) => /fonts\.(googleapis|gstatic)\.com/.test(u)), 'requests to Google Fonts');
  assert.ok(urls.some((u) => u.startsWith(srv.url) && u.endsWith('.woff2')), 'no same-origin woff2 loaded');
  const loaded = await page.evaluate(() => ['Newsreader Variable', 'Inter Variable', 'IBM Plex Mono']
    .map((f) => [...document.fonts].some((ff) => ff.family.replace(/"/g, '') === f && ff.status === 'loaded')));
  assert.deepEqual(loaded, [true, true, true]);
  await context.close();
});

test('404 page uses layout', async () => {
  const res = await fetch(srv.url + '/nope');
  assert.equal(res.status, 404);
  const { page, context } = await openPage(browser, srv.url + '/nope');
  assert.equal((await page.textContent('h1')).trim(), 'Page not found');
  assert.equal(await page.$$eval('main a[href="/"]', (e) => e.length), 1);
  assert.equal(await page.$$eval('header nav a', (e) => e.length), 3);
  await context.close();
});
