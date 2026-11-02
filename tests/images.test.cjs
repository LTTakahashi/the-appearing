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

test('a WebP with GPS location fails and is named', () => {
  const dir = tempSite({ 'public/photos/trip.webp': path.join(ROOT, 'tests/fixtures/gps.webp') });
  try {
    const r = run(dir);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /GPS location found: public\/photos\/trip\.webp/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('an image whose metadata cannot be read fails closed', () => {
  const dir = tempSite({ 'src/a/broken.jpg': Buffer.from('this is not a jpeg') });
  try {
    const r = run(dir);
    assert.equal(r.status, 1, r.stdout);
    assert.match(r.stdout, /Could not read metadata: src\/a\/broken\.jpg/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('a WebP without metadata (what the editor uploads) passes', () => {
  // The GPS fixture with its EXIF chunk dropped and the RIFF size fixed up.
  const src = fs.readFileSync(path.join(ROOT, 'tests/fixtures/gps.webp'));
  const chunks = [];
  for (let at = 12; at + 8 <= src.length; ) {
    const size = src.readUInt32LE(at + 4);
    const end = at + 8 + size + (size & 1);
    if (src.toString('latin1', at, at + 4) !== 'EXIF') chunks.push(src.subarray(at, end));
    at = end;
  }
  const body = Buffer.concat([Buffer.from('WEBP'), ...chunks]);
  const head = Buffer.alloc(8);
  head.write('RIFF');
  head.writeUInt32LE(body.length, 4);
  const dir = tempSite({ 'public/photos/clean.webp': Buffer.concat([head, body]) });
  try {
    const r = run(dir);
    assert.equal(r.status, 0, r.stdout);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
