const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, DIST, startServer } = require('./helpers.cjs');

test('old site removed', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'site')), 'site/ still exists');
  assert.ok(!fs.existsSync(path.join(ROOT, 'Takahashi_CV.tex')), 'Takahashi_CV.tex still exists');
});

test('build emits index and 404', () => {
  assert.ok(fs.existsSync(path.join(DIST, 'index.html')), 'dist/index.html missing');
  assert.ok(fs.existsSync(path.join(DIST, '404.html')), 'dist/404.html missing');
});

test('CV PDF is the Nov 2026 CV', () => {
  const buf = fs.readFileSync(path.join(DIST, 'Takahashi_CV.pdf'));
  assert.equal(buf.subarray(0, 4).toString(), '%PDF');
  assert.ok(buf.length > 50_000, `CV too small: ${buf.length}`);
});

test('redirects cover old URLs', () => {
  const r = fs.readFileSync(path.join(DIST, '_redirects'), 'utf8');
  for (const from of ['/index.html', '/research/nullstate.html', '/research/multiview.html', '/research/behavior.html', '/research/program.html', '/papers/*', '/assets/figures/*', '/Takahashi_Research_Statement.pdf']) {
    const escaped = from.replace(/[.*]/g, '\\$&');
    assert.match(r, new RegExp(`^${escaped}\\s+/\\s+301$`, 'm'), `missing redirect for ${from}`);
  }
});

test('wrangler serves dist with build step and 404 page', () => {
  const cfg = fs.readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8');
  assert.match(cfg, /"directory":\s*"\.\/dist"/);
  assert.match(cfg, /"not_found_handling":\s*"404-page"/);
  assert.match(cfg, /"command":\s*"npm run build"/);
});

test('browser tests run on a fresh machine: playwright is a project dependency', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.ok(pkg.devDependencies && pkg.devDependencies.playwright, 'playwright missing from devDependencies');
  const resolved = require.resolve('playwright', { paths: [ROOT] });
  assert.ok(resolved.startsWith(path.join(ROOT, 'node_modules')), `playwright resolved outside the project: ${resolved}`);
});

test('unknown path returns 404 status', async () => {
  const srv = await startServer();
  try {
    const res = await fetch(srv.url + '/definitely-not-a-page');
    assert.equal(res.status, 404);
    const body = await res.text();
    assert.match(body, /<html/i, '404 should serve the built 404 page');
  } finally {
    await srv.close();
  }
});
