// Fixes from the phase-2a whole-branch review: unit checks on the Markdown helpers
// and the rail highlight at the bottom of a page.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { ROOT, startServer, launch, openPage } = require('./helpers.cjs');

const md = () => import(path.join(ROOT, 'src/lib/markdown.ts'));

test('headingProblem catches ids that collide, reserved ids and empty ids', async () => {
  const { headingProblem } = await md();
  assert.equal(headingProblem(['The question', 'Results', 'Limits']), null);
  assert.match(headingProblem(['Results', 'Results.']), /"Results\." .*same section id "results"/);
  assert.match(headingProblem(['In one minute']), /reserved/);
  assert.match(headingProblem(['Paper and code']), /reserved/);
  assert.match(headingProblem(['結果']), /no letters or numbers/);
});

test('text sections only link to safe destinations', async () => {
  const { renderBlockMarkdown } = await md();
  for (const bad of ['[x](javascript:alert(1))', '<javascript:alert(1)>', '[x](data:text/html,hi)', '[x][r]\n\n[r]: javascript:alert(1)', '[x](JaVaScRiPt:alert(1))']) {
    assert.doesNotMatch(renderBlockMarkdown(bad), /href="(javascript|data)/i, bad);
  }
  assert.match(renderBlockMarkdown('[a](https://x.org)'), /href="https:\/\/x\.org"/);
  assert.match(renderBlockMarkdown('[a](mailto:me@x.org)'), /href="mailto:me@x\.org"/);
  assert.match(renderBlockMarkdown('[a](/research/arts/)'), /href="\/research\/arts\/"/);
  assert.match(renderBlockMarkdown('[a](#results)'), /href="#results"/);
});

test('markdownImages finds images in text-section Markdown', async () => {
  const { markdownImages } = await md();
  assert.deepEqual(markdownImages('Plain *text* and a [link](https://x.org).'), []);
  assert.deepEqual(markdownImages('Before ![A plot](plot.webp) after'), ['plot.webp']);
  assert.deepEqual(markdownImages('![a](x.png)\n\n![b](y.jpg)'), ['x.png', 'y.jpg']);
});

let srv;
let browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); await srv.close(); });

for (const [slug, width, height] of [['arts', 1440, 900], ['multi-view', 1920, 1080]]) {
  test(`rail highlights "Paper and code" after clicking it on ${slug} @${width}x${height}`, async () => {
    const { page, context } = await openPage(browser, `${srv.url}/research/${slug}/`, { width, height, reducedMotion: 'reduce' });
    await page.click('nav.on-this-page a[href="#paper-and-code"]');
    await page.waitForTimeout(300);
    assert.equal(await page.getAttribute('nav.on-this-page a[href="#paper-and-code"]', 'aria-current'), 'true');
    assert.equal(await page.$$eval('nav.on-this-page a[aria-current="true"]', (e) => e.length), 1);
    await context.close();
  });
}
