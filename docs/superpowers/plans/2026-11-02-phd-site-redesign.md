# luiztakahashi.com Redesign (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-written `site/` with an Astro static site whose homepage presents Luiz Takahashi as a Fall 2027 PhD applicant, in the "A · Plate" design with the Limestone + Slate color scheme.

**Architecture:**
- Astro 7, static output to `dist/`, deployed by Cloudflare Workers static assets (`wrangler.jsonc`).
- Projects, news and publications are YAML files loaded by content collections with zod schemas. Hero copy and nav live in `src/data/site.ts`.
- Components are presentational and receive data as props.
- Tests are Node's built-in test runner driving Playwright (CommonJS, loaded via `require`) against a tiny static server over `dist/`.

**Tech Stack:**
- Astro 7.4.x
- `@fontsource-variable/newsreader`, `@fontsource-variable/inter`, `@fontsource/ibm-plex-mono`
- `@astrojs/check` + `typescript`
- `wrangler` 4
- `node:test`
- Playwright 1.63 (preinstalled globally; `require('playwright')` only, ESM import fails here)
- `axe-core`, `yaml` (dev)

**Spec:** `docs/superpowers/specs/2026-11-02-phd-site-redesign-design.md`. All copy, colors, sizes and data values come from it verbatim. Section numbers below (§) refer to it.

## Global Constraints

- **Node:** `>=22.23.4`. Write `.node-version` with `22.23.4`.
- **Output:** static only. Deploy directory `./dist`. Nothing outside `dist/` is published.
- **Colors:** exactly the §6.1 token table (Limestone light / Slate dark, including `--rule-strong`). No other colors in CSS except `transparent` and `currentColor`.
- **Fonts:**
  - Family names `'Newsreader Variable'`, `'Inter Variable'`, `'IBM Plex Mono'`, all self-hosted.
  - Zero requests to `fonts.googleapis.com` / `fonts.gstatic.com`.
- **Copy:** verbatim from §7.2–§7.5. Curly apostrophes (’) in rendered prose.
- **Legal-name line:** "Also published as L. Takahashi Dos Reis." appears in the footer.
- **Navigation:** shows only enabled items: Research → `/#research`, Publications → `/#publications`, CV → `/Takahashi_CV.pdf`.
- **External links:** carry `rel="noopener"`. The ↗ glyph sits in `<span aria-hidden="true">`.
- **Motion:** all motion is off under `prefers-reduced-motion: reduce`. All content is visible with JavaScript disabled.
- **Theme storage:** `localStorage` key `theme`, values `"light"` / `"dark"`. Every access is wrapped in try/catch.
- **Breakpoints:** gutters 40px desktop and 20px under 720px. Two-column layouts collapse under 900px.
- **Attribution:** commit messages end with the two attribution lines in use on this branch (`Co-Authored-By: …`, `Claude-Session: …`).

## Review Focus

1. **A YAML entry missing `id` is silently dropped.** Astro's `file()` loader logs and skips it, so a project or news item just vanishes. Tests assert rendered counts equal YAML counts (Tasks 4, 5).
2. **`localStorage` throws** (blocked storage, some private modes). The page must still render, apply the OS theme, and let the toggle switch theme for the session with no console error (Task 2).
3. **Dark OS preference with a stored `"light"` choice.** The stored choice wins before first paint: `data-theme="light"`, light background (Task 2).
4. **Long unbreakable strings at 320px** (the email address, a DOI, the JINS title). They must wrap, never cause horizontal scroll (Task 3 for the hero, Task 7 for the whole page).
5. **JavaScript disabled, or the reveal script fails.** Every card, row and news item is visible at full opacity (Task 6).

---

## File Structure

```
.node-version  .gitignore  package.json  package-lock.json
astro.config.mjs  tsconfig.json  wrangler.jsonc  README.md
public/   Takahashi_CV.pdf  _redirects  robots.txt  favicon.svg  favicon-32.png  og.png
scripts/  make-og.cjs                     one-off: renders og.png + favicon-32.png with Playwright
src/
  content.config.ts                       collections: projects, news, publications
  data/   site.ts  projects.yaml  news.yaml  publications.yaml
  lib/    format.ts                       formatMonth, renderInline
  assets/ portrait.jpg
  styles/ tokens.css  global.css
  layouts/BaseLayout.astro
  components/ SkipLink.astro Header.astro ThemeToggle.astro Footer.astro Hero.astro
              ProjectCard.astro ProjectRow.astro LinkChips.astro NewsList.astro PublicationList.astro
              figures/ Grain.astro ArtsFigure.astro PraxisFigure.astro HomesFigure.astro
  scripts/reveal.ts
  pages/  index.astro  404.astro
tests/   helpers.cjs  scaffold.test.cjs  layout.test.cjs  hero.test.cjs  research.test.cjs
         news-pubs.test.cjs  meta-motion.test.cjs  quality.test.cjs
```

**Deleted:** `site/` (entire folder), `Takahashi_CV.tex`.

---

### Task 1: Scaffold Astro, remove the old site, deploy config, test harness

**Files:**
- Delete: `site/`, `Takahashi_CV.tex`
- Create:
  - config: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.node-version`
  - pages: `src/pages/index.astro` (placeholder `<h1>Luiz Takahashi</h1>`)
  - public: `public/Takahashi_CV.pdf`, `public/_redirects`, `public/robots.txt`
  - tests: `tests/helpers.cjs`, `tests/scaffold.test.cjs`
- Modify: `wrangler.jsonc`, `.gitignore`

**Interfaces:**
- Produces (`tests/helpers.cjs`, used by every later test file):
  - `startServer(): Promise<{ url: string, close(): Promise<void> }>`
    - Serves `dist/` on `127.0.0.1` at a random port.
    - `/` serves `index.html`; `/x/` serves `x/index.html`.
    - A missing path returns `dist/404.html` with status 404 (mirrors `not_found_handling: "404-page"`).
    - Content-Type comes from the extension (html, css, js, svg, png, jpg, avif, webp, woff2, pdf, txt, json).
  - `launch(): Promise<Browser>`: `require('playwright').chromium.launch()`.
  - `openPage(browser, url, opts?): Promise<{ page, errors: string[] }>`
    - `opts`: `{ width=1440, height=900, colorScheme='light', reducedMotion='no-preference', javaScriptEnabled=true, initScript? }`.
    - `errors` collects `console.error` and `pageerror` messages.
  - `readYaml(relPath): any`: parses with the `yaml` package, relative to repo root.
  - `ROOT`, `DIST`: absolute paths.
- `package.json` scripts:
  - `dev`: `astro dev`
  - `build`: `astro build`
  - `preview`: `astro preview`
  - `check`: `astro check`
  - `test`: `astro build && node --test "tests/*.test.cjs"`
  - `verify`: `astro check && npm test && wrangler deploy --dry-run`

- [ ] **Step 1: Write the failing tests** in `tests/scaffold.test.cjs`:

```js
test('old site removed', () => {
  assert.ok(!fs.existsSync(path.join(ROOT, 'site')));
  assert.ok(!fs.existsSync(path.join(ROOT, 'Takahashi_CV.tex')));
});
test('build emits index and 404', () => {
  assert.ok(fs.existsSync(path.join(DIST, 'index.html')));
  assert.ok(fs.existsSync(path.join(DIST, '404.html')));
});
test('CV PDF is the Nov 2026 CV', () => {
  const buf = fs.readFileSync(path.join(DIST, 'Takahashi_CV.pdf'));
  assert.equal(buf.subarray(0, 4).toString(), '%PDF');
  assert.ok(buf.length > 50_000);
});
test('redirects cover old URLs', () => {
  const r = fs.readFileSync(path.join(DIST, '_redirects'), 'utf8');
  for (const from of ['/index.html', '/research/*', '/papers/*', '/assets/figures/*', '/Takahashi_Research_Statement.pdf'])
    assert.match(r, new RegExp(`^${from.replace(/[.*]/g, '\\$&')}\\s+/\\s+301$`, 'm'));
});
test('wrangler serves dist with build step and 404 page', () => {
  const cfg = fs.readFileSync(path.join(ROOT, 'wrangler.jsonc'), 'utf8');
  assert.match(cfg, /"directory":\s*"\.\/dist"/);
  assert.match(cfg, /"not_found_handling":\s*"404-page"/);
  assert.match(cfg, /"command":\s*"npm run build"/);
});
test('unknown path returns 404 status', async () => { /* startServer → fetch(url + '/nope') → status 404 */ });
```

- [ ] **Step 2: Run to verify failure.** `node --test tests/scaffold.test.cjs`. Expected: FAIL (`site` exists, no `dist`).

- [ ] **Step 3: Implement.**
  - `git rm -r site Takahashi_CV.tex`.
  - `npm i astro@^7.4.5 @fontsource-variable/newsreader @fontsource-variable/inter @fontsource/ibm-plex-mono`.
  - `npm i -D @astrojs/check typescript wrangler@^4 axe-core yaml`.
  - `astro.config.mjs`: `site: 'https://luiztakahashi.com'`, `output: 'static'`, `trailingSlash: 'ignore'`.
  - `tsconfig.json` extends `astro/tsconfigs/strict`.
  - `src/pages/404.astro`: placeholder `<h1>Page not found</h1>`. Task 2 restyles it.
  - Copy the CV from `/root/.claude/uploads/0b9c9a87-1ea4-5b4a-8520-eeacf2bfce5f/cac5ff8b-Takahashi_CV_Nov2026.pdf` to `public/Takahashi_CV.pdf`.
  - `public/_redirects`: one line per old path in the form `<from> / 301`.
  - `public/robots.txt`: two lines, `User-agent: *` and `Allow: /`. There is no sitemap this phase.
  - `wrangler.jsonc`: keep `name` and `compatibility_date`, and add:

    ```jsonc
    "build": { "command": "npm run build" },
    "assets": { "directory": "./dist", "not_found_handling": "404-page" }
    ```

  - `.gitignore`: append `node_modules/`, `dist/`, `.astro/`, `.wrangler/`.

- [ ] **Step 4: Run to verify pass.** `npm test`. Expected: all scaffold tests PASS.
- [ ] **Step 5: Verify deploy config.** `npx wrangler deploy --dry-run`. Expected: the output contains `[custom build] Running: npm run build` and `Read N files from the assets directory …/dist`, then `--dry-run: exiting now.`
- [ ] **Step 6: Commit.** `git add -A && git commit -m "Replace hand-written site with Astro scaffold and Cloudflare build config"`

---

### Task 2: Design tokens, fonts, base layout, header, footer, theme toggle, 404

**Files:**
- Create:
  - styles: `src/styles/tokens.css`, `src/styles/global.css`
  - data: `src/data/site.ts`
  - layout: `src/layouts/BaseLayout.astro`
  - components: `src/components/{SkipLink,Header,ThemeToggle,Footer}.astro`
  - tests: `tests/layout.test.cjs`
- Modify: `src/pages/index.astro`, `src/pages/404.astro` (both use `BaseLayout`)

**Interfaces:**
- Produces (`src/data/site.ts`):

```ts
export interface NavItem { label: string; href: string; enabled: boolean }
export interface LinkItem { label: string; href: string }
export const site: {
  name: 'Luiz Takahashi'; legalName: 'Luiz Takeshi Takahashi Dos Reis'; altName: 'L. Takahashi Dos Reis';
  url: 'https://luiztakahashi.com'; email: 'l.takahashidosreis@wsu.edu';
  github: 'https://github.com/LTTakahashi'; orcid: 'https://orcid.org/0009-0006-3548-1256';
  cvPath: '/Takahashi_CV.pdf'; updated: 'November 2026'; affiliation: 'Washington State University';
  description: string;   // = hero.researchLine
  hero: { label: string; researchLine: string; bio: [string, string]; caption: [string, string]; links: LinkItem[] };
};
export const nav: NavItem[]; // Research, Publications, CV (enabled) + Gallery '/gallery/', Writing '/writing/' (enabled: false)
```

- Produces: `BaseLayout.astro` props `{ title?: string; description?: string; path?: string }`. Defaults: `site.name`, `site.description`, `'/'`. It renders `SkipLink`, `Header`, `<main id="main">`, `<slot/>`, and `Footer`.
- Produces: CSS custom properties from §6.1 and the utility classes later tasks use:
  - `.wrap`: max 1200px, gutters 40px, 20px under 720px
  - `.section`: top border `1px solid var(--rule-strong)`
  - `.kicker`: mono 12px, uppercase, 0.12em tracking, `--accent`
  - `.meta`: mono 12px, `--muted`
  - `.serif`
  - `.visually-hidden`

- [ ] **Step 1: Write the failing tests** in `tests/layout.test.cjs`. Each runs against `startServer()`.

```js
test('light theme tokens by default', async () => {
  // colorScheme 'light'
  assert.equal(await page.getAttribute('html', 'data-theme'), 'light');
  assert.equal(await bg(page), 'rgb(237, 238, 234)');
});
test('dark OS preference → slate', async () => {
  // colorScheme 'dark'
  assert.equal(await bg(page), 'rgb(18, 20, 22)');
});
test('stored light beats dark OS before paint', async () => {
  // colorScheme 'dark', initScript: localStorage.setItem('theme', 'light')
  assert.equal(await page.getAttribute('html', 'data-theme'), 'light');
});
test('toggle flips and persists', async () => {
  await page.click('button[aria-label="Switch color theme"]');
  assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
  assert.equal(await page.evaluate(() => localStorage.getItem('theme')), 'dark');
});
test('toggle works when localStorage throws', async () => {
  // initScript makes Storage.prototype.getItem/setItem throw
  // click toggle → data-theme flips; errors.length === 0
});
test('nav shows only enabled items', async () => {
  const links = await page.$$eval('header nav a', as => as.map(a => [a.textContent.trim(), a.getAttribute('href')]));
  assert.deepEqual(links, [['Research', '/#research'], ['Publications', '/#publications'], ['CV', '/Takahashi_CV.pdf']]);
});
test('skip link targets main', async () => {
  // a.skip-link[href="#main"] exists; #main exists
});
test('footer carries legal-name line and updated date', async () => {
  const t = await page.textContent('footer');
  assert.match(t, /Also published as L\. Takahashi Dos Reis\./);
  assert.match(t, /Updated November 2026/);
});
test('fonts are self-hosted', async () => {
  // record requests; none to fonts.googleapis.com or fonts.gstatic.com;
  // document.fonts.check('16px "Newsreader Variable"') resolves true after document.fonts.ready
});
test('404 page uses layout', async () => {
  // GET /nope → status 404, h1 "Page not found", link back to "/"
});
```

- [ ] **Step 2: Run to verify failure.** `npm run build && node --test tests/layout.test.cjs`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **`tokens.css`:** the §6.1 table, for `:root` (light), `:root[data-theme="dark"]` (dark), and `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { …dark } }`. Also `color-scheme` per theme.
  - **`global.css`:**
    - type scale per §6.2
    - `body` background `var(--paper)`, color `var(--ink)`, Inter 17px/1.66
    - `:focus-visible` outline `2px solid var(--accent)`, offset 3px
    - link underline transitions to accent
    - `@view-transition { navigation: auto; }`
    - the reduced-motion block disabling all animation and transition
  - **Fonts:** import in `BaseLayout` frontmatter:
    - `@fontsource-variable/newsreader/opsz.css`
    - `@fontsource-variable/newsreader/opsz-italic.css`
    - `@fontsource-variable/inter/index.css`
    - `@fontsource/ibm-plex-mono/400.css`
    - `@fontsource/ibm-plex-mono/500.css`

    Preload `…/newsreader/files/newsreader-latin-opsz-normal.woff2?url` and `…/inter/files/inter-latin-wght-normal.woff2?url` (`<link rel="preload" as="font" type="font/woff2" crossorigin>`).
  - **Theme script:** inline `is:inline` script in `<head>`, before CSS paints. It reads `localStorage.theme` in try/catch, else `matchMedia('(prefers-color-scheme: dark)')`, sets `data-theme`, and adds class `js` to `<html>`.
  - **`ThemeToggle.astro`:**
    - `<button type="button" aria-label="Switch color theme">` with sun and moon stroke icons (`aria-hidden`), min 44×44px.
    - Its script flips `data-theme` and persists in try/catch.
  - **`Header.astro`:**
    - wordmark `<a href="/">` in Newsreader 600, 23px
    - `nav[aria-label="Primary"]` rendering `nav.filter(n => n.enabled)`
    - bottom border `1px solid var(--rule-strong)`
  - **`Footer.astro`:** per §5.5, using `site.updated` and `site.altName`.
  - **`SkipLink.astro`:** `<a class="skip-link" href="#main">Skip to content</a>`, visually hidden until focused.
  - **`404.astro`:** h1 "Page not found", one line, link "Back to the homepage" to `/`.

- [ ] **Step 4: Run to verify pass.** `npm run build && node --test tests/layout.test.cjs`. Expected: PASS.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add design tokens, fonts, base layout, header, footer and theme toggle"`

---

### Task 3: Hero with portrait

**Files:**
- Create: `src/components/Hero.astro`, `src/assets/portrait.jpg`, `tests/hero.test.cjs`
- Modify: `src/pages/index.astro`, `src/data/site.ts` (fill in `hero` copy from §7.2)

**Interfaces:**
- Consumes: `site.hero`, `site.cvPath`, `.wrap`, `.kicker`, `.meta`.
- Produces: `<Hero />`, which takes no props. Class hooks used by tests: `.hero-label`, `h1`, `.hero-line`, `.hero-portrait` (frame wrapper), `.hero-bio` (wraps both `<p>`), `.hero-links`.

- [ ] **Step 1: Write the failing tests** in `tests/hero.test.cjs`:

```js
test('hero text matches spec', async () => {
  assert.equal(await page.textContent('h1'), 'Luiz Takahashi');
  assert.equal((await page.textContent('.hero-label')).trim(), 'PhD applicant · Fall 2027');
  assert.match(await page.textContent('.hero-line'), /^I measure cognition and behavior in daily life, and ask when a recorded change is real rather than practice, context or noise\.$/);
  assert.equal(await page.$$eval('.hero-bio p', ps => ps.length), 2);
  assert.match(await page.textContent('.hero-bio'), /Neuropsychology and Aging Lab with Maureen Schmitter-Edgecombe/);
});
test('hero links', async () => {
  const hrefs = await page.$$eval('.hero-links a', as => as.map(a => a.getAttribute('href')));
  assert.deepEqual(hrefs, ['/Takahashi_CV.pdf', 'mailto:l.takahashidosreis@wsu.edu', 'https://github.com/LTTakahashi', 'https://orcid.org/0009-0006-3548-1256']);
});
test('portrait is optimized, framed and muted', async () => {
  // picture > source[type="image/avif"] and source[type="image/webp"] exist
  // img alt === 'Portrait of Luiz Takahashi'; has width and height attrs
  // getComputedStyle(img).filter includes 'saturate(0.82)' and not 'sepia'
  // dark theme: filter includes 'brightness(0.92)'
});
test('phone order: line → portrait → bio', async () => {
  // width 390: top(.hero-line) < top(.hero-portrait) < top(.hero-bio)
});
test('no horizontal scroll at 320px', async () => {
  // width 320: document.documentElement.scrollWidth <= window.innerWidth
});
```

- [ ] **Step 2: Run to verify failure.** `npm run build && node --test tests/hero.test.cjs`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - Copy `/tmp/claude-0/-home-user-the-appearing/0b9c9a87-1ea4-5b4a-8520-eeacf2bfce5f/scratchpad/canvas/assets/portrait.jpg` (800×1000, already leveled and cropped) to `src/assets/portrait.jpg`.
  - **Layout:** `Hero.astro` uses a CSS grid with areas.
    - ≥900px: `"text photo"`, columns `minmax(0,1fr) minmax(260px,380px)`, gap 56px.
    - Under 900px: one column with areas `label / name / line / photo / bio / links`. Use `display: contents` on the text column so its children join the grid.
  - **Portrait:** `<Picture src={portrait} formats={['avif','webp']} widths={[380, 760]} sizes="(min-width: 900px) 380px, 300px" alt="Portrait of Luiz Takahashi" loading="eager" />`.
    - Frame wrapper: `border: 1px solid var(--rule-strong); padding: 10px`.
    - Filter per §6.4.
    - Caption: `.meta`, flex, space-between, using `site.hero.caption`.
  - **Link row:** `.hero-links a { overflow-wrap: anywhere; }`, mono 13.5px.
  - **Entrance:** `.hero-enter` fades in with an 8px rise, staggered 60ms via `--i`, CSS only.

- [ ] **Step 4: Run to verify pass.** Same command. Expected: PASS.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add hero with framed, optimized portrait"`

---

### Task 4: Content collections, research cards, rows and illustrations

**Files:**
- Create:
  - `src/content.config.ts`
  - data and lib: `src/data/projects.yaml`, `src/lib/format.ts`
  - components: `src/components/{ProjectCard,ProjectRow,LinkChips}.astro`, `src/components/figures/{Grain,ArtsFigure,PraxisFigure,HomesFigure}.astro`
  - tests: `tests/research.test.cjs`
- Modify: `src/pages/index.astro` (add `<section id="research">`)

**Interfaces:**
- Produces (`content.config.ts`). Import `defineCollection` from `astro:content`, `file` from `astro/loaders`, `z` from `astro/zod`.
  - `link = z.object({ label: z.string(), href: z.string().regex(/^(https:\/\/|\/|mailto:)/) })`
  - `projects = defineCollection({ loader: file('src/data/projects.yaml'), schema })`. Schema: `{ title, kicker, summary, role, status: string; feature: boolean; figure?: 'arts'|'praxis'|'homes'; links: link[] (default []); order: int }`, refined so `feature === true` requires `figure`.
  - `news` and `publications`: declared here too, but their YAML is added in Task 5. Until then, create both YAML files with `[]`.
- Produces (`src/lib/format.ts`):
  - `formatMonth(ym: string): string`: `'2026-09'` → `'Sep 2026'` (en-US short month).
  - `renderInline(md: string): string`: HTML-escapes the input, then converts `[text](https://…)` to `<a href="…" rel="noopener">text</a>` and `*text*` to `<em>text</em>`. Nothing else.
- Produces types: `type ProjectData = CollectionEntry<'projects'>['data']`. Task 5 adds `type NewsEntry = CollectionEntry<'news'>` and `type PubEntry = CollectionEntry<'publications'>`, each declared in the component that consumes it.
- Produces components:
  - `<LinkChips links={LinkItem[]} variant="inline" | "chip" />`
    - `inline`: mono links with ↗.
    - `chip`: `1px solid var(--rule-strong)` outline, min-height 44px on touch (`@media (pointer: coarse)`).
  - `<ProjectCard project={ProjectData} />`
    - An `<article class="project-card">`, **not** wrapped in `<a>`; the figure panel is `div.figure`.
    - Contains: figure panel (4:3, `--paper-2`), `.kicker`, `h3.serif` 26px, summary, `.meta` `"{role} · {status}"`, and LinkChips inline when links exist.
  - `<ProjectRow project={ProjectData} />`: `div.project-row` with title, summary, meta, optional links, separated by `--rule` hairlines.
  - `<Grain id={string} />`: emits `<filter>` with `feTurbulence` (`baseFrequency 0.85`, `numOctaves 2`, `stitchTiles stitch`), grayscale `feColorMatrix`, alpha table `0 0.10`.
  - Figures:
    - Each is `<svg viewBox="0 0 400 300" role="img" aria-label=…>`, using `var(--ink)`, `var(--accent)`, `var(--paper)`.
    - Geometry is copied from canvas mockup A (`project/Main.dc.html` in the scratchpad canvas folder `…/scratchpad/canvas/project/Main.dc.html`). Replace hex colors with the CSS vars.
    - Each ends with `<rect width="400" height="300" filter="url(#grain-<name>)"/>`.
    - The aria-labels are those in the mockup.

- [ ] **Step 1: Write the failing tests** in `tests/research.test.cjs`:

```js
test('every YAML project renders (no silent drops)', async () => {
  const y = readYaml('src/data/projects.yaml');
  assert.equal(y.length, 6);
  assert.equal(await page.$$eval('#research article.project-card', e => e.length), y.filter(p => p.feature).length);
  assert.equal(await page.$$eval('#research .project-row', e => e.length), y.filter(p => !p.feature).length);
});
test('cards in spec order with figures', async () => {
  const titles = await page.$$eval('#research article.project-card h3', hs => hs.map(h => h.textContent.trim()));
  assert.deepEqual(titles, ['Scoring spoken word recall on a smartwatch', 'Practice as signal', 'Room-aware tracking in smart homes']);
  assert.equal(await page.$$eval('#research article.project-card svg[role="img"][aria-label]', s => s.length), 3);
});
test('cards are not whole-card links; real links only', async () => {
  assert.equal(await page.$$eval('#research article.project-card', as => as.filter(a => a.closest('a')).length), 0);
  // ARTS card links: [['Code', 'https://github.com/WSU-CASAS/ARTS']]; Praxis card: no <a>;
  // Homes card: [['DOI', 'https://doi.org/10.4017/gt.2026.25.2.1421.3']]
});
test('rows in spec order', async () => {
  // ['Medication adherence from in-home sensors', 'Multi-view interaction detection', 'SQL Component Match'];
  // medication row has DOI link to https://doi.org/10.4017/gt.2026.25.2.1527.3
});
test('kicker and meta text', async () => {
  // first card kicker 'Speech · Wearables'; meta 'First author · Submitted to JINS · Open source'
});
test('grid collapses 3 → 1 column', async () => {
  // width 1440: three cards share one offsetTop; width 390: three distinct offsetTops
});
```

- [ ] **Step 2: Run to verify failure.** `npm run build && node --test tests/research.test.cjs`. Expected: FAIL.

- [ ] **Step 3: Implement.**
  - `projects.yaml`: six entries with `id`s `arts`, `praxis`, `homes`, `adherence`, `multiview`, `sql`. Copy is verbatim from §7.3. `role`/`status` are split from each Meta line, e.g. role `First author`, status `Submitted to JINS · Open source`. `order` is 1–6.
  - In `index.astro`:
    - `getCollection('projects')` sorted by `order`.
    - The heading row has "Research" (Newsreader 40px).
    - The card grid is `repeat(auto-fit, minmax(300px, 1fr))` with gap `40px 32px`.
    - Rows follow under a top `--rule` border.
  - **Hover:** `article.project-card:hover .figure svg, :focus-within …` → `transform: scale(1.02)` over 300ms. The `h3` gets an accent underline.

- [ ] **Step 4: Run to verify pass.** Same command, then `npx astro check`. Expected: PASS; `0 errors`.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add research section: content collection, cards, rows and figures"`

---

### Task 5: News and selected publications

**Files:**
- Create:
  - data: `src/data/news.yaml`, `src/data/publications.yaml`
  - components: `src/components/NewsList.astro`, `src/components/PublicationList.astro`
  - tests: `tests/news-pubs.test.cjs`
- Modify:
  - `src/content.config.ts` (news and publications schemas)
  - `src/pages/index.astro` (two-column section)

**Interfaces:**
- Consumes: `formatMonth`, `renderInline`, `LinkChips`.
- Produces schemas:
  - `news`: `{ date: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/), text: string }`. Ids are `YYYY-MM-slug`.
  - `publications`: `{ type: 'journal'|'abstract'|'software'; status?: string; title; authors: string[] (min 1); self: string; venue: string; year: int; links: link[]; selected: boolean; order: int }`, refined so `authors.includes(self)`.
- Produces:
  - `<NewsList items={NewsEntry[]} />`: sorts by `date` descending; renders `<ol class="news">` with `<time datetime="YYYY-MM">`.
  - `<PublicationList items={PubEntry[]} />`: renders `<ol class="pubs">` of selected items sorted by `order`.
  - Publication kicker = `[typeLabel, status].filter(Boolean).join(' · ')`, where typeLabel is journal→`Journal`, abstract→`Conference abstract`, software→`Software`.
  - Luiz's name renders as `<strong>`.

- [ ] **Step 1: Write the failing tests** in `tests/news-pubs.test.cjs`:

```js
test('all news render, newest first, formatted', async () => {
  const y = readYaml('src/data/news.yaml');
  const dates = await page.$$eval('.news time', ts => ts.map(t => t.textContent.trim()));
  assert.equal(dates.length, y.length);
  assert.deepEqual(dates, ['Sep 2026', 'Aug 2026', 'Mar 2026', 'Aug 2025', 'May 2025']);
});
test('news inline markdown becomes links and emphasis', async () => {
  // first item contains <em>JINS</em> and <a href="https://github.com/WSU-CASAS/ARTS" rel="noopener">ARTS</a>
});
test('all selected publications render in order', async () => {
  const y = readYaml('src/data/publications.yaml').filter(p => p.selected);
  const titles = await page.$$eval('#publications .pubs h3', hs => hs.map(h => h.textContent.trim()));
  assert.equal(titles.length, y.length);
  assert.equal(titles[0], 'Automated scoring of verbal recall in smartwatch-based ecological momentary assessment: development and independent validation');
});
test('kickers, self-name bold, DOI chips', async () => {
  // kickers: ['Journal · Under review', 'Conference abstract · Poster', 'Conference abstract', 'Software']
  // strong texts: ['L. Takahashi', 'L. Takahashi', 'L. Takahashi Dos Reis', …]
  // chip hrefs include both Gerontechnology DOIs and the ARTS repo
});
test('two columns on desktop, stacked on phone', async () => {
  // 1440: news and publications share offsetTop; 390: publications below news
});
```

- [ ] **Step 2: Run to verify failure.** Expected: FAIL.
- [ ] **Step 3: Implement.**
  - Data is verbatim from §7.4 and §7.5. The software entry's authors are `['L. Takahashi']`, venue `github.com/WSU-CASAS/ARTS`, year 2026.
  - Section layout: grid `minmax(0,1fr) minmax(0,2fr)` at ≥900px with gap 56px; one column below.
- [ ] **Step 4: Run to verify pass.** Tests plus `npx astro check`. Expected: PASS, `0 errors`.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add news and selected publications"`

---

### Task 6: Motion, metadata, favicon, OG image, README

**Files:**
- Create: `src/scripts/reveal.ts`, `scripts/make-og.cjs`, `public/favicon.svg`, `public/favicon-32.png`, `public/og.png`, `tests/meta-motion.test.cjs`
- Modify: `src/layouts/BaseLayout.astro`, `README.md` (rewrite)

**Interfaces:**
- Consumes: `.project-card`, `.project-row`, `.news li`, `.pubs li` (Tasks 4–5).
- Produces: `reveal.ts`.
  - Adds `.reveal` to those elements only when `<html>` has class `js` and reduced motion is off.
  - `IntersectionObserver` (threshold 0.15) adds `.is-visible`.
  - CSS: `.js .reveal:not(.is-visible) { opacity: 0; transform: translateY(8px) }`, with a transition of 400ms.
  - Safety timeout: after 2500ms, every `.reveal` gets `.is-visible`.

- [ ] **Step 1: Write the failing tests** in `tests/meta-motion.test.cjs`:

```js
test('JSON-LD Person', async () => {
  const ld = JSON.parse(await page.textContent('script[type="application/ld+json"]'));
  assert.equal(ld['@type'], 'Person');
  assert.equal(ld.name, 'Luiz Takahashi');
  assert.equal(ld.alternateName, 'Luiz Takeshi Takahashi Dos Reis');
  assert.deepEqual(ld.sameAs.sort(), ['https://github.com/LTTakahashi', 'https://orcid.org/0009-0006-3548-1256']);
});
test('meta, canonical, OG', async () => {
  // title 'Luiz Takahashi'; meta description = research line;
  // link[rel=canonical] href 'https://luiztakahashi.com/'; og:image 'https://luiztakahashi.com/og.png';
  // twitter:card 'summary_large_image'
});
test('favicons and og.png are served', async () => {
  // GET /favicon.svg, /favicon-32.png, /og.png → 200; og.png is 1200×630 (read the PNG IHDR bytes 16–23)
});
test('no-JS: everything visible', async () => {
  // javaScriptEnabled false: every .project-card, .project-row, .news li, .pubs li has computed opacity '1'
});
test('reduced motion: everything visible immediately', async () => {
  // reducedMotion 'reduce': same assertion, with no scrolling
});
test('scrolling reveals cards', async () => {
  // default: scroll to the bottom, wait 600ms, all .reveal elements have class is-visible
});
```

- [ ] **Step 2: Run to verify failure.** Expected: FAIL.

- [ ] **Step 3: Implement.**
  - **`BaseLayout`:**
    - `<title>`, `meta description`, canonical `new URL(path, site.url)`
    - `og:*` and `twitter:*` with absolute `og.png`
    - JSON-LD (`affiliation: { '@type': 'CollegeOrUniversity', name: site.affiliation }`, `email: 'mailto:' + site.email`, `url: site.url`)
    - `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` and the 32px PNG fallback
    - `<script>` importing `../scripts/reveal.ts`
  - **`favicon.svg`:** 32×32. Rect fill `#EDEEEA` with rx 6, a band path in `#B3361F` at opacity 0.2, and a curve stroke `#B3361F` 2.4px. The shape is the Praxis curve scaled to 32px.
  - **`scripts/make-og.cjs`:**
    - Uses `require('playwright')`.
    - Renders an inline HTML page at 1200×630, Limestone background: name in Newsreader 500 at 96px, research line in italic 34px, a 6px accent rule, and `luiztakahashi.com` in mono. Fonts are loaded from `node_modules` `@fontsource` files via `file://` URLs.
    - Writes `public/og.png`, then renders `favicon.svg` at 32×32 to `public/favicon-32.png`.
    - Run it once (`node scripts/make-og.cjs`) and commit the PNGs.
  - **`README.md`:**
    - purpose
    - `npm install`, `npm run dev`, `npm run verify`
    - where to edit content (`src/data/*`)
    - how to add a news item or publication
    - the Cloudflare settings: build command `npm run build` (or empty: wrangler runs it), deploy command `npx wrangler deploy`, Node 22.23.4+ via `.node-version` or `NODE_VERSION`
    - that `npm test` needs Playwright available to `require` (run `npx playwright install chromium` on a fresh machine)

- [ ] **Step 4: Run to verify pass.** Expected: PASS.
- [ ] **Step 5: Commit.** `git add -A && git commit -m "Add reveal motion, metadata, favicon, OG image and README"`

---

### Task 7: Whole-page quality gate and delivery

**Files:**
- Create: `tests/quality.test.cjs`
- Modify: whatever the gate exposes (contrast, overflow, link fixes)

**Interfaces:**
- Consumes: everything. Inject `axe-core` with `page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') })`, then call `page.evaluate(() => axe.run({ runOnly: ['wcag2a', 'wcag2aa'] }))`.

- [ ] **Step 1: Write the tests** in `tests/quality.test.cjs`, for each of `[1440, 390] × ['light', 'dark']`:

```js
test(`axe: no serious/critical violations @${w} ${theme}`, async () => {
  const { violations } = await runAxe(page);
  assert.deepEqual(violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => v.id), []);
});
test(`no horizontal overflow @${w} ${theme}`, async () => {
  // scrollWidth <= innerWidth (also at width 320, light only)
});
test(`no console errors @${w} ${theme}`, () => assert.deepEqual(errors, []));
test('every internal link and asset resolves', async () => {
  // collect a[href^="/"], img/srcset, source/srcset, link[href] → fetch each via the test server → status 200
  // (fragment-only hrefs: assert the target id exists)
});
test('screenshots for review', async () => {
  // save full-page PNGs for 1440/390 × light/dark to
  // /tmp/claude-0/-home-user-the-appearing/0b9c9a87-1ea4-5b4a-8520-eeacf2bfce5f/scratchpad/shots/ (not committed)
});
```

- [ ] **Step 2: Run.** `npm run build && node --test tests/quality.test.cjs`. Fix every failure at its root in the owning component or CSS. Never loosen a test. Re-run until PASS.
- [ ] **Step 3: Full gate.** `npm run verify`. Expected:
  - `astro check` reports `0 errors`;
  - all test files PASS;
  - the wrangler dry run ends with `--dry-run: exiting now.`
- [ ] **Step 4: Review the screenshots.** Read the four PNGs and compare them against mockup A and the Limestone + Slate scheme. Fix visual defects such as misalignment, wrong colors or clipped text, then re-run Step 3.
- [ ] **Step 5: Commit and push.**
  - `git add -A && git commit -m "Add quality gate: accessibility, overflow, links"`
  - `git push -u origin claude/beautiful-fermat-yuufzk`
  - Update the draft PR LTTakahashi/the-appearing#1 description: summary, test plan with results, and the Cloudflare dashboard check.
