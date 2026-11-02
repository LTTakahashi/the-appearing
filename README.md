# luiztakahashi.com

Personal research site of Luiz Takahashi, built for Fall 2027 PhD applications.

- Static site built with [Astro](https://astro.build), deployed on Cloudflare (Workers static assets).
- Design: "Plate" (editorial print), with the Limestone (light) and Slate (dark) color scheme.
- Design spec: `docs/superpowers/specs/2026-11-02-phd-site-redesign-design.md`.
- Implementation plan: `docs/superpowers/plans/2026-11-02-phd-site-redesign.md`.

## Run it locally

Requires Node 22.23.4 or newer (see `.node-version`).

```bash
npm install
npm run dev      # http://localhost:4321
```

## Edit content

All content lives in `src/content/`, one file per entry. Components hold no copy of their own. The visual editor at `/admin` edits these same files (see "Visual editor" below); you can also edit them directly.

| What | File |
|---|---|
| Hero label, research line, bio, photo caption, contact links, "Updated" date | `src/content/site/profile.yaml` |
| Research cards and rows | `src/content/projects/<slug>/index.md` (one folder per project) |
| News | `src/content/news/<YYYY-MM>-<slug>.md` |
| Publications | `src/content/publications/<slug>.md` |
| Navigation | `src/data/site.ts` |
| CV | replace `public/Takahashi_CV.pdf` (keep the file name) |
| Portrait | replace `src/assets/portrait.jpg` (4:5, at least 760 px wide) |

**Add a news item.** Create a file such as `src/content/news/2026-12-jins-accepted.md`. The file name is its id. Give it a `date` in `YYYY-MM` form and `text`, which may use `*emphasis*` and `[links](https://…)`.

```markdown
---
date: "2026-12"
text: Our *JINS* paper on smartwatch verbal-recall scoring was accepted.
---
```

**Add a publication.** Copy a file in `src/content/publications/` under a new name and give it the next `order`. `self` must match one of the `authors` exactly; that name is shown in bold.

**Drafts.** Add `draft: true` to keep any project, news item or publication off the site. If the GitHub repository is public, drafts are still readable there.

**Show Gallery or Writing in the navigation.** Once those pages exist, set `enabled: true` on their items in `src/data/site.ts`.

The build (including Cloudflare's) fails with a message naming the file if any of these is true:

- the frontmatter or YAML is invalid (for example, an unquoted `: ` inside a sentence; wrap such text in quotes);
- a required field is missing;
- a date is malformed;
- a link isn't `https://`, `/…` or `mailto:`.

Nothing is ever silently dropped.

## Visual editor

The editor at **luiztakahashi.com/admin** edits the files in `src/content/` from any browser, including your phone. Every save is a commit on `main`, and Cloudflare publishes it a minute or two later.

**Sign in once per browser:**

1. On GitHub, open Settings → Developer settings → Personal access tokens → **Fine-grained tokens** → Generate new token.
2. Under Repository access, choose **Only select repositories** and pick `LTTakahashi/the-appearing`.
3. Under Permissions → Repository permissions, set **Contents** to **Read and write**. Leave everything else at No access.
4. Pick an expiry (for example 90 days), create the token and copy it.
5. Open `/admin`, choose **Sign in with token**, and paste it. The token stays in that browser only. Never put it in the repository.

**What each section edits:**

| Editor section | Files |
|---|---|
| Profile | `src/content/site/profile.yaml` (hero, bio, contact links, "Updated" date) |
| Research projects | `src/content/projects/<slug>/index.md` and images in the same folder |
| News | `src/content/news/*.md` |
| Publications | `src/content/publications/*.md` |

**Project pages.** A project with "Has its own page" switched on also needs:

- a short name;
- a topic label;
- an illustration and its caption;
- a question line;
- authors that include your name;
- exactly three "In one minute" items.

If any of these is missing, the build stops and Cloudflare keeps the previous version online. Page sections can be text, steps, a timeline, number tiles, an image, or an interactive figure. The "On this page" list is built from the text sections' headings.

**Photos.** Images uploaded in the editor are converted to WebP, which removes GPS location. The build also refuses any image that still carries location data.

## Check before publishing

```bash
npm run verify
```

This runs `astro check`, a production build, the browser tests in `tests/`, and a Cloudflare dry run (`wrangler deploy --dry-run`). The browser tests check layout, theme, accessibility (axe), links and phone widths.

The browser tests use Playwright, which `npm install` adds as a dev dependency. On a fresh machine, download its browser once:

```bash
npx playwright install chromium
```

To regenerate the share image and PNG favicon after changing the name, research line or colors:

```bash
node scripts/make-og.cjs
```

## Deploy (Cloudflare)

`wrangler.jsonc` serves only `dist/`, so nothing else in the repository is ever published. It also runs `npm run build` automatically before every `npx wrangler deploy`.

In the Cloudflare dashboard (Workers & Pages → this project → Settings → Build):

- **Build command:** empty, or `npm run build`.
- **Deploy command:** `npx wrangler deploy`.
- **Node version:** 22.23.4 or newer. It's read from `.node-version`; if the build image ignores that, add the environment variable `NODE_VERSION=22.23.4`.

Merging into `main` publishes the site.

Old URLs from the previous site (`/research/*`, `/papers/*`, `/assets/figures/*`, `/Takahashi_Research_Statement.pdf`, `/index.html`) redirect to `/` through `public/_redirects`.
