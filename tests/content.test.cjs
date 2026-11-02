const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, startServer, launch, openPage, homeSnapshot } = require('./helpers.cjs');

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

const SLUGS = ['arts', 'practice-as-signal', 'smart-homes', 'medication-adherence', 'multi-view', 'sql-component-match'];

test('homepage text identical to phase 1', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  assert.deepEqual(await homeSnapshot(page), require('./fixtures/phase1-home.json'));
  await context.close();
});

test('content lives one file per entry', () => {
  for (const s of SLUGS) {
    assert.ok(fs.existsSync(path.join(ROOT, `src/content/projects/${s}/index.md`)), `missing project ${s}`);
  }
  const md = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.md'));
  assert.equal(md('src/content/news').length, 5);
  assert.equal(md('src/content/publications').length, 4);
  assert.ok(fs.existsSync(path.join(ROOT, 'src/content/site/profile.yaml')));
  for (const old of ['projects.yaml', 'news.yaml', 'publications.yaml']) {
    assert.ok(!fs.existsSync(path.join(ROOT, 'src/data', old)), `src/data/${old} should be gone`);
  }
});

test('hero links come from profile fields', async () => {
  const { page, context } = await openPage(browser, srv.url + '/');
  const hrefs = await page.$$eval('.hero-links a', (as) => as.map((a) => a.getAttribute('href')));
  assert.deepEqual(hrefs, [
    '/Takahashi_CV.pdf',
    'mailto:l.takahashidosreis@wsu.edu',
    'https://github.com/LTTakahashi',
    'https://orcid.org/0009-0006-3548-1256',
  ]);
  const hero = fs.readFileSync(path.join(ROOT, 'src/components/Hero.astro'), 'utf8');
  assert.doesNotMatch(hero, /l\.takahashidosreis@wsu\.edu/);
  const siteTs = fs.readFileSync(path.join(ROOT, 'src/data/site.ts'), 'utf8');
  assert.doesNotMatch(siteTs, /takahashidosreis@wsu\.edu/, 'email belongs in profile.yaml, not site.ts');
  await context.close();
});
