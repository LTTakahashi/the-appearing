// Content mistakes must fail the production build (Cloudflare runs only the
// build), and drafts must never reach the built site.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { ROOT } = require('./helpers.cjs');

// Build a throwaway copy of the site after `mutate(dir)`, let `inspect(dist)` read
// the output, then delete the copy. Returns { status, out, ...inspect result }.
function buildCopy(mutate, inspect = () => ({})) {
  const tmpRoot = path.join(ROOT, '.test-tmp');
  fs.mkdirSync(tmpRoot, { recursive: true });
  const dir = fs.mkdtempSync(path.join(tmpRoot, 'build-'));
  try {
    for (const entry of ['src', 'public', 'scripts', 'astro.config.mjs', 'tsconfig.json', 'package.json']) {
      if (fs.existsSync(path.join(ROOT, entry))) fs.cpSync(path.join(ROOT, entry), path.join(dir, entry), { recursive: true });
    }
    mutate(dir);
    const res = spawnSync(path.join(ROOT, 'node_modules/.bin/astro'), ['build', '--root', dir], {
      cwd: ROOT, encoding: 'utf8', timeout: 240_000,
    });
    const dist = path.join(dir, 'dist');
    return { status: res.status, out: `${res.stdout}\n${res.stderr}`, ...(res.status === 0 ? inspect(dist) : {}) };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

const newsFile = (dir) => {
  const d = path.join(dir, 'src/content/news');
  return path.join(d, fs.readdirSync(d).filter((f) => f.endsWith('.md')).sort()[0]);
};

test('malformed frontmatter fails the build and names the file', () => {
  let target;
  const r = buildCopy((dir) => {
    target = newsFile(dir);
    fs.writeFileSync(target, '---\ndate: "2026-01"\ntext: Poster at ISG 2026: Vancouver\n---\n');
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
  assert.match(r.out, new RegExp(path.basename(target).replace('.', '\\.')));
});

test('a missing required field fails the build', () => {
  const r = buildCopy((dir) => {
    const d = path.join(dir, 'src/content/publications');
    const f = path.join(d, fs.readdirSync(d).filter((x) => x.endsWith('.md')).sort()[0]);
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^title:.*\n/m, ''));
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
});

test('a draft news item never reaches the built site', () => {
  const r = buildCopy((dir) => {
    fs.writeFileSync(path.join(dir, 'src/content/news/2026-10-draft-probe.md'),
      '---\ndate: "2026-10"\ntext: DRAFT-PROBE news item\ndraft: true\n---\n');
  }, (dist) => ({ home: fs.readFileSync(path.join(dist, 'index.html'), 'utf8') }));
  assert.equal(r.status, 0, r.out.slice(-600));
  assert.doesNotMatch(r.home, /DRAFT-PROBE/);
});

const projectFile = (dir, slug) => path.join(dir, 'src/content/projects', slug, 'index.md');

test('a page project without its one-minute summary fails the build', () => {
  const r = buildCopy((dir) => {
    const f = projectFile(dir, 'arts');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^minute:\n(  - .*\n)+/m, ''));
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
  assert.match(r.out, /minute|one-minute/i);
});

test('two text blocks with the same heading fail the build', () => {
  const r = buildCopy((dir) => {
    const f = projectFile(dir, 'arts');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('heading: Limits', 'heading: Results'));
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
});

test('a draft page project gets no route and is skipped by next-project links', () => {
  const r = buildCopy((dir) => {
    const f = projectFile(dir, 'smart-homes');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^---\n/, '---\ndraft: true\n'));
  }, (dist) => ({
    hasPage: fs.existsSync(path.join(dist, 'research/smart-homes/index.html')),
    practice: fs.readFileSync(path.join(dist, 'research/practice-as-signal/index.html'), 'utf8'),
    home: fs.readFileSync(path.join(dist, 'index.html'), 'utf8'),
  }));
  assert.equal(r.status, 0, r.out.slice(-600));
  assert.equal(r.hasPage, false);
  assert.match(r.practice, /class="next-project"[^>]*href="\/research\/multi-view\/"|href="\/research\/multi-view\/"[^>]*class="next-project"/);
  assert.doesNotMatch(r.home, /Room-aware tracking in smart homes/);
});
