// The build refuses photos that carry GPS location or formats browsers can't show.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('./helpers.cjs');

const SCRIPT = path.join(ROOT, 'scripts/check-images.mjs');
const run = (root) => spawnSync('node', [SCRIPT, root], { cwd: ROOT, encoding: 'utf8' });

function tempSite(files) {
  fs.mkdirSync(path.join(ROOT, '.test-tmp'), { recursive: true });
  const dir = fs.mkdtempSync(path.join(ROOT, '.test-tmp', 'img-'));
  for (const [rel, src] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    if (Buffer.isBuffer(src)) fs.writeFileSync(path.join(dir, rel), src);
    else fs.copyFileSync(src, path.join(dir, rel));
  }
  return dir;
}

test('the repository itself passes', () => {
  const r = run(ROOT);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('a photo with GPS location fails and is named', () => {
  const dir = tempSite({ 'src/a/photo.jpg': path.join(ROOT, 'tests/fixtures/gps.jpg') });
  try {
    const r = run(dir);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /GPS location found: src\/a\/photo\.jpg/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a clean photo next to it passes', () => {
  const dir = tempSite({ 'src/a/clean.jpg': path.join(ROOT, 'src/assets/portrait.jpg') });
  try { assert.equal(run(dir).status, 0); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('HEIC and TIFF files fail as unsupported', () => {
  const dir = tempSite({ 'public/x.heic': Buffer.from('not really heic'), 'src/y.tiff': Buffer.from('tiff') });
  try {
    const r = run(dir);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /Unsupported format \(use JPEG\/PNG\/WebP\): public\/x\.heic/);
    assert.match(r.stdout, /Unsupported format \(use JPEG\/PNG\/WebP\): src\/y\.tiff/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('the build script runs the check first', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.equal(pkg.scripts.build, 'node scripts/check-images.mjs && astro build');
});
