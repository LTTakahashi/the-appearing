// Content mistakes must fail the production build, not ship silently missing
// content (Cloudflare runs only `npm run build`, never the browser tests).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('./helpers.cjs');

const load = () => import(path.join(ROOT, 'src/lib/strict-yaml.ts'));

test('parseYamlList returns entries with string ids', async () => {
  const { parseYamlList } = await load();
  const items = parseYamlList('- id: a\n  text: one\n- id: 2026-09-b\n  text: two\n', 'news.yaml');
  assert.deepEqual(items.map((i) => i.id), ['a', '2026-09-b']);
  assert.equal(items[1].text, 'two');
});

test('parseYamlList rejects an entry without an id', async () => {
  const { parseYamlList } = await load();
  assert.throws(() => parseYamlList('- id: a\n  text: one\n- text: two\n', 'news.yaml'), /news\.yaml: entry 2 has no id/);
});

test('parseYamlList rejects duplicate ids', async () => {
  const { parseYamlList } = await load();
  assert.throws(() => parseYamlList('- id: a\n  t: 1\n- id: a\n  t: 2\n', 'projects.yaml'), /projects\.yaml: duplicate id "a"/);
});

test('parseYamlList rejects YAML syntax errors', async () => {
  const { parseYamlList } = await load();
  assert.throws(
    () => parseYamlList('- id: a\n  text: Poster at ISG 2026: Vancouver\n', 'news.yaml'),
    /news\.yaml: invalid YAML/,
  );
});

test('parseYamlList rejects a file that is not a list', async () => {
  const { parseYamlList } = await load();
  assert.throws(() => parseYamlList('id: a\n', 'news.yaml'), /news\.yaml: expected a list/);
});

test('production build fails when a news entry has no id', () => {
  const tmpRoot = path.join(ROOT, '.test-tmp');
  const dir = fs.mkdtempSync(path.join(tmpRoot + (fs.mkdirSync(tmpRoot, { recursive: true }), ''), 'build-'));
  try {
    for (const entry of ['src', 'public', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
    }
    const newsFile = path.join(dir, 'src/data/news.yaml');
    fs.writeFileSync(newsFile, fs.readFileSync(newsFile, 'utf8').replace('- id: 2026-08-peer-mentor\n  date:', '- date:'));
    const res = spawnSync(path.join(ROOT, 'node_modules/.bin/astro'), ['build', '--root', dir], {
      cwd: ROOT, encoding: 'utf8', timeout: 180_000,
    });
    const out = `${res.stdout}\n${res.stderr}`;
    assert.notEqual(res.status, 0, `build should fail; output tail:\n${out.slice(-800)}`);
    assert.match(out, /news\.yaml: entry 2 has no id/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
