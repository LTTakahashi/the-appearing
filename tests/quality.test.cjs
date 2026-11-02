const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startServer, launch, openPage } = require('./helpers.cjs');

const SHOTS = process.env.SHOTS_DIR
  || '/tmp/claude-0/-home-user-the-appearing/0b9c9a87-1ea4-5b4a-8520-eeacf2bfce5f/scratchpad/shots';

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

// Wait out the hero entrance and the reveal safety timeout so axe sees final styles.
const settle = async (page) => {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2700);
};

async function runAxe(page) {
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  return page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] }));
}

const PAGES = ['/', '/research/arts/', '/research/smart-homes/', '/research/practice-as-signal/', '/research/multi-view/'];

for (const pagePath of PAGES) {
  for (const width of [1440, 390]) {
    for (const colorScheme of ['light', 'dark']) {
      test(`${pagePath} @${width} ${colorScheme}: axe clean, no overflow, no console errors`, async () => {
        const { page, context, errors } = await openPage(browser, srv.url + pagePath, { width, colorScheme });
        await settle(page);
        const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
        assert.ok(sw <= iw, `scrollWidth ${sw} > innerWidth ${iw}`);
        const { violations } = await runAxe(page);
        const bad = violations
          .filter((v) => ['serious', 'critical'].includes(v.impact))
          .map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
        assert.deepEqual(bad, []);
        assert.deepEqual(errors, []);
        await context.close();
      });
    }
  }
}

test('no horizontal overflow at 320px', async () => {
  for (const pagePath of PAGES) {
    const { page, context } = await openPage(browser, srv.url + pagePath, { width: 320, height: 700 });
    await settle(page);
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
    assert.ok(sw <= iw, `${pagePath}: scrollWidth ${sw} > innerWidth ${iw}`);
    await context.close();
  }
});

test('long unbroken strings wrap on project pages at 320px', async () => {
  const { page, context } = await openPage(browser, srv.url + '/research/arts/', { width: 320, height: 700 });
  await settle(page);
  await page.evaluate(() => {
    const long = 'https://doi.org/10.1017/S1355617726101234_supplementary_materials_and_code_archive_v2_final';
    for (const sel of ['.project-header h1', '.project-question', '.block-text .prose p', '.stat-label', '.step-text', '.stage-text', '.citation']) {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`missing ${sel}`);
      el.append(` ${long}`);
    }
  });
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `scrollWidth ${sw} > innerWidth ${iw}`);
  await context.close();
});

test('long unbroken strings in content wrap instead of scrolling sideways at 320px', async () => {
  const { page, context } = await openPage(browser, srv.url + '/', { width: 320, height: 700 });
  await settle(page);
  await page.evaluate(() => {
    // No hyphens or spaces: a pasted URL or identifier gives the browser no break opportunity.
    const long = 'https://doi.org/10.1017/S1355617726101234_supplementary_materials_and_code_archive_v2_final';
    for (const sel of ['.news li .text', '.project-card .summary', '.project-row .summary', '.project-row h3', '.pubs .venue', '.pubs h3', '.pubs .authors']) {
      const el = document.querySelector(sel);
      if (!el) throw new Error(`missing ${sel}`);
      el.append(` ${long}`);
    }
  });
  const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  assert.ok(sw <= iw, `scrollWidth ${sw} > innerWidth ${iw}`);
  await context.close();
});

test('every internal link and asset resolves', async () => {
  for (const pagePath of [...PAGES, '/404']) {
    const { page, context } = await openPage(browser, srv.url + pagePath);
    const refs = await page.evaluate(() => {
      const out = new Set();
      const add = (v) => { if (v && v.startsWith('/') && !v.startsWith('//')) out.add(v); };
      document.querySelectorAll('a[href]').forEach((a) => add(a.getAttribute('href')));
      document.querySelectorAll('img[src], script[src]').forEach((e) => add(e.getAttribute('src')));
      document.querySelectorAll('link[href]').forEach((l) => add(l.getAttribute('href')));
      document.querySelectorAll('img[srcset], source[srcset]').forEach((e) =>
        e.getAttribute('srcset').split(',').forEach((s) => add(s.trim().split(/\s+/)[0])));
      return [...out];
    });
    assert.ok(refs.length > 5, `too few internal refs on ${pagePath}: ${refs.length}`);
    for (const ref of refs) {
      const [p, hash] = ref.split('#');
      const res = await fetch(srv.url + (p || '/'));
      assert.equal(res.status, 200, `${ref} on ${pagePath} → ${res.status}`);
      if (hash) {
        const target = await openPage(browser, srv.url + (p || '/'));
        assert.equal(await target.page.$$eval(`#${hash}`, (e) => e.length), 1, `missing #${hash}`);
        await target.context.close();
      }
    }
    await context.close();
  }
});

test('screenshots for review', async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const [pagePath, name] of [['/', 'home'], ['/research/arts/', 'arts'], ['/research/practice-as-signal/', 'practice']]) for (const width of [1440, 390]) {
    for (const colorScheme of ['light', 'dark']) {
      const { page, context } = await openPage(browser, srv.url + pagePath, { width, colorScheme, reducedMotion: 'reduce' });
      await page.evaluate(() => document.fonts.ready);
      const file = path.join(SHOTS, `${name}-${width}-${colorScheme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      assert.ok(fs.statSync(file).size > 10_000);
      await context.close();
    }
  }
});
