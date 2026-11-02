const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ROOT, startServer, launch, openPage, readEntries } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

test('formatMonth and renderInline', async () => {
  const { formatMonth, renderInline } = await import(path.join(ROOT, 'src/lib/format.ts'));
  assert.equal(formatMonth('2026-09'), 'Sep 2026');
  assert.equal(formatMonth('2025-05'), 'May 2025');
  assert.equal(
    renderInline('Sent to *JINS*; see [ARTS](https://github.com/WSU-CASAS/ARTS).'),
    'Sent to <em>JINS</em>; see <a href="https://github.com/WSU-CASAS/ARTS" rel="noopener">ARTS</a>.',
  );
  assert.equal(renderInline('<script>x</script> & "q"'), '&lt;script&gt;x&lt;/script&gt; &amp; &quot;q&quot;');
  assert.equal(renderInline('[bad](javascript:alert(1))'), '[bad](javascript:alert(1))');
  assert.equal(renderInline('a **b** and *c*'), 'a <strong>b</strong> and <em>c</em>');
});

test('all news render, newest first, formatted', async () => {
  const y = readEntries('src/content/news');
  const { page, context } = await openPage(browser, srv.url + '/');
  const dates = await page.$$eval('.news time', (ts) => ts.map((t) => t.textContent.trim()));
  assert.equal(dates.length, y.length);
  assert.deepEqual(dates, ['Sep 2026', 'Aug 2026', 'Mar 2026', 'Aug 2025', 'May 2025']);
  const iso = await page.$$eval('.news time', (ts) => ts.map((t) => t.getAttribute('datetime')));
  assert.deepEqual(iso, ['2026-09', '2026-08', '2026-03', '2025-08', '2025-05']);
  await context.close();
});

test('news inline markdown becomes links and emphasis', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const first = await page.$eval('.news li', (li) => ({
    em: [...li.querySelectorAll('em')].map((e) => e.textContent),
    links: [...li.querySelectorAll('a')].map((a) => [a.textContent, a.getAttribute('href'), a.getAttribute('rel')]),
  }));
  assert.deepEqual(first.em, ['JINS']);
  assert.deepEqual(first.links, [['ARTS', 'https://github.com/WSU-CASAS/ARTS', 'noopener']]);
  await context.close();
});

test('all selected publications render in order', async () => {
  const y = readEntries('src/content/publications').filter((p) => p.selected);
  const { page, context } = await openPage(browser, srv.url + '/');
  const titles = await page.$$eval('#publications .pubs h3', (hs) => hs.map((h) => h.textContent.trim()));
  assert.equal(titles.length, y.length);
  assert.equal(titles.length, 4);
  assert.equal(titles[0], 'Automated scoring of verbal recall in smartwatch-based ecological momentary assessment: development and independent validation');
  await context.close();
});

test('kickers, self-name bold, links', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const kickers = await page.$$eval('#publications .pubs .kicker', (ks) => ks.map((k) => k.textContent.trim()));
  assert.deepEqual(kickers, ['Journal · Under review', 'Conference abstract · Poster', 'Conference abstract', 'Software']);
  const strong = await page.$$eval('#publications .pubs .authors strong', (ss) => ss.map((s) => s.textContent.trim()));
  // Software entries carry no author line (spec §7.5), so three bolded names.
  assert.deepEqual(strong, ['L. Takahashi', 'L. Takahashi', 'L. Takahashi Dos Reis']);
  const hrefs = await page.$$eval('#publications .pubs a', (as) => as.map((a) => a.getAttribute('href')));
  for (const h of ['https://doi.org/10.4017/gt.2026.25.2.1421.3', 'https://doi.org/10.4017/gt.2026.25.2.1527.3', 'https://github.com/WSU-CASAS/ARTS']) {
    assert.ok(hrefs.includes(h), `missing ${h}`);
  }
  const venue = await page.$eval('#publications .pubs li .venue', (v) => v.textContent.trim());
  assert.match(venue, /Journal of the International Neuropsychological Society/);
  await context.close();
});

test('two columns on desktop, stacked on phone', async () => {
  for (const [width, same] of [[1440, true], [390, false]]) {
    const { page, context } = await openPage(browser, srv.url + '/', { width });
    const t = await page.evaluate(() => [
      Math.round(document.querySelector('#news-title').getBoundingClientRect().top),
      Math.round(document.querySelector('#publications-title').getBoundingClientRect().top),
    ]);
    assert.equal(t[0] === t[1], same, `width ${width}: tops ${t}`);
    await context.close();
  }
});
