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

test('a figure block whose image file is missing fails the build', () => {
  const r = buildCopy((dir) => {
    const f = projectFile(dir, 'arts');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('blocks:\n',
      'blocks:\n  - type: figure\n    image: ./missing.webp\n    alt: A missing figure\n    caption: This image does not exist\n'));
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
  assert.match(r.out, /missing\.webp/);
});

test('the editor\'s required-field list cannot drift from the schemas', () => {
  const r = buildCopy((dir) => {
    const f = path.join(dir, 'src/lib/required-fields.ts');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace("news: ['date', 'text'],", "news: ['date'],"));
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
  assert.match(r.out, /required-fields\.ts: news lists \[date\] but the schema requires \[date,text\]/);
});

// --- Phase-2a review fixes -------------------------------------------------

test('a project saved by the editor with empty optional fields still builds', () => {
  const r = buildCopy((dir) => {
    // What Sveltia writes for a row project: every optional field present but empty.
    fs.writeFileSync(projectFile(dir, 'medication-adherence'), `---
title: Medication adherence from in-home sensors
order: 4
feature: false
page: false
draft: false
shortName: ''
kicker: ''
figure: ''
figureCaption: ''
summary: A classifier for motion sensors on pill bottles and organizers matched clinician records about 93% of the time across 25 older adults’ homes.
question: ''
role: Second author
status: ISG 2026
authors: []
self: ''
minute: []
links:
  - label: DOI
    href: https://doi.org/10.4017/gt.2026.25.2.1527.3
citation: ''
blocks: []
---
`);
    const pub = path.join(dir, 'src/content/publications/isg-2026-adherence.md');
    fs.writeFileSync(pub, fs.readFileSync(pub, 'utf8').replace(/^---\n/, "---\nstatus: ''\n"));
  }, (dist) => ({ home: fs.readFileSync(path.join(dist, 'index.html'), 'utf8') }));
  assert.equal(r.status, 0, r.out.slice(-1200));
  assert.match(r.home, /Medication adherence from in-home sensors/);
});

test('text-section headings that collide as section ids fail the build', () => {
  const r = buildCopy((dir) => {
    const f = projectFile(dir, 'arts');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('heading: Limits', 'heading: Results.'));
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
  assert.match(r.out, /same section id/);
});

test('an image inside a text section fails the build', () => {
  const r = buildCopy((dir) => {
    const f = projectFile(dir, 'arts');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace('This is *candidate rescue*.', 'This is *candidate rescue*. ![A plot](plot.webp)'));
  });
  assert.notEqual(r.status, 0, `build should fail:\n${r.out.slice(-600)}`);
  assert.match(r.out, /Figure section/);
});

test('an unfinished draft page project does not block the build', () => {
  const r = buildCopy((dir) => {
    fs.mkdirSync(path.join(dir, 'src/content/projects/new-idea'));
    fs.writeFileSync(projectFile(dir, 'new-idea'),
      '---\ntitle: A new idea\norder: 7\nfeature: false\npage: true\ndraft: true\nsummary: Work in progress.\nrole: Lead\nstatus: Draft\n---\n');
  }, (dist) => ({ hasPage: fs.existsSync(path.join(dist, 'research/new-idea/index.html')) }));
  assert.equal(r.status, 0, r.out.slice(-1200));
  assert.equal(r.hasPage, false);
});

test('profile URLs cannot break out of the JSON-LD script', () => {
  const r = buildCopy((dir) => {
    const f = path.join(dir, 'src/content/site/profile.yaml');
    fs.writeFileSync(f, fs.readFileSync(f, 'utf8').replace(/^github: .*$/m,
      "github: 'https://github.com/x</script><script>alert(1)</script>'"));
  }, (dist) => ({ home: fs.readFileSync(path.join(dist, 'index.html'), 'utf8') }));
  assert.equal(r.status, 0, r.out.slice(-1200));
  // The JSON-LD block must run to its own end and round-trip the value. (In the
  // hero link the same text sits inside a quoted href, where `<` is inert.)
  const ld = r.home.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1];
  assert.ok(JSON.parse(ld).sameAs.includes('https://github.com/x</script><script>alert(1)</script>'), ld);
});
