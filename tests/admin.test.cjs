// The Sveltia CMS editor at /admin: pinned, hidden from search, signed in with a
// token, and kept in step with the site's content schemas.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, startServer } = require('./helpers.cjs');

let srv;
before(async () => { srv = await startServer(); });
after(async () => { await srv.close(); });

const config = () => require('yaml').parse(fs.readFileSync(path.join(ROOT, 'public/admin/config.yml'), 'utf8'));
const collection = (name) => config().collections.find((c) => c.name === name);

test('admin page is served, pinned and hidden from search', async () => {
  const res = await fetch(srv.url + '/admin/');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<meta name="robots" content="noindex"/);
  assert.match(html, /<script src="https:\/\/unpkg\.com\/@sveltia\/cms@0\.256\.1\/dist\/sveltia-cms\.js"/);
  assert.equal((await fetch(srv.url + '/admin/config.yml')).status, 200);
});

test('config signs in with a GitHub token on this repository', () => {
  const { backend } = config();
  assert.equal(backend.name, 'github');
  assert.equal(backend.repo, 'LTTakahashi/the-appearing');
  assert.equal(backend.branch, 'main');
  assert.deepEqual(backend.auth_methods, ['token']);
});

test('collections point at real content', () => {
  assert.equal(collection('projects').folder, 'src/content/projects');
  assert.equal(collection('projects').path, '{{slug}}/index');
  assert.equal(collection('news').folder, 'src/content/news');
  assert.equal(collection('publications').folder, 'src/content/publications');
  const profile = collection('profile').files.find((f) => f.name === 'profile');
  assert.equal(profile.file, 'src/content/site/profile.yaml');
  for (const c of ['projects', 'news', 'publications']) {
    assert.ok(fs.existsSync(path.join(ROOT, collection(c).folder)), c);
  }
  assert.ok(fs.existsSync(path.join(ROOT, profile.file)));
});

test('every required schema field is required in the editor', async () => {
  const { REQUIRED_FIELDS } = await import(path.join(ROOT, 'src/lib/required-fields.ts'));
  const fieldsOf = (name) => (name === 'profile' ? collection('profile').files[0].fields : collection(name).fields);
  for (const [name, required] of Object.entries(REQUIRED_FIELDS)) {
    const fields = Object.fromEntries(fieldsOf(name).map((f) => [f.name, f]));
    for (const key of required) {
      assert.ok(fields[key], `${name}.${key} missing from the editor config`);
      assert.notEqual(fields[key].required, false, `${name}.${key} must be required in the editor`);
    }
  }
});

test('block types match the schema union', () => {
  const blocks = collection('projects').fields.find((f) => f.name === 'blocks');
  assert.equal(blocks.widget, 'list');
  assert.deepEqual(blocks.types.map((t) => t.name), ['text', 'steps', 'timeline', 'stats', 'figure', 'interactive']);
  const interactive = blocks.types.find((t) => t.name === 'interactive').fields.find((f) => f.name === 'name');
  assert.equal(interactive.widget, 'select');
  assert.deepEqual(interactive.options, ['practice-band']);
  const figure = collection('projects').fields.find((f) => f.name === 'figure');
  assert.equal(figure.widget, 'select');
  assert.deepEqual(figure.options, ['arts', 'praxis', 'homes', 'multiview']);
});

test('uploads are converted to WebP and stored beside the entry', () => {
  const t = config().media_libraries.default.config.transformations.raster_image;
  assert.equal(t.format, 'webp');
  assert.equal(t.width, 2400);
  assert.equal(collection('projects').media_folder, '');
  assert.equal(collection('projects').public_folder, '');
});

test('README explains token sign-in', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.match(readme, /## Visual editor/);
  assert.match(readme, /fine-grained/i);
  assert.match(readme, /\/admin/);
});

test('the editor omits empty optional fields when saving', () => {
  assert.equal(config().output?.omit_empty_optional_fields, true);
});

test('text sections cannot embed images in the editor', () => {
  const blocks = collection('projects').fields.find((f) => f.name === 'blocks');
  const body = blocks.types.find((t) => t.name === 'text').fields.find((f) => f.name === 'body');
  assert.deepEqual(body.editor_components, []);
});

test('the editor script is integrity-pinned', () => {
  const html = fs.readFileSync(path.join(ROOT, 'public/admin/index.html'), 'utf8');
  assert.match(html, /integrity="sha384-LPT86oZkLhmoF84O1jKZBSaFJOVvKv8sjXDKap1SOaSwzbC8F6HH7rTJWekmAzG9"/);
  assert.match(html, /crossorigin="anonymous"/);
});
