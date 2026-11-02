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

All homepage content lives in `src/data/`. Components hold no copy of their own.

| What | File |
|---|---|
| Name, bio, hero text, contact links, navigation, "Updated" date | `src/data/site.ts` |
| Research cards and rows | `src/data/projects.yaml` |
| News | `src/data/news.yaml` |
| Publications | `src/data/publications.yaml` |
| CV | replace `public/Takahashi_CV.pdf` (keep the file name) |
| Portrait | replace `src/assets/portrait.jpg` (4:5, at least 760 px wide) |

**Add a news item.** Add an entry to the top of `src/data/news.yaml` with a unique `id`, a `date` in `YYYY-MM` form, and `text`. The text may use `*emphasis*` and `[links](https://…)`.

```yaml
- id: 2026-12-jins-accepted
  date: "2026-12"
  text: Our *JINS* paper on smartwatch verbal-recall scoring was accepted.
```

**Add a publication.** Copy an entry in `src/data/publications.yaml` and give it a unique `id` and the next `order`. `self` must match one of the `authors` exactly; that name is shown in bold.

**Every YAML entry needs a unique `id`.** If you copy an entry, change its `id`.

**Show Gallery or Writing in the navigation.** Once those pages exist, set `enabled: true` on their items in `src/data/site.ts`.

The build (including Cloudflare's) fails with a message naming the file and entry if any of these is true:

- the YAML is invalid (for example, an unquoted `: ` inside a sentence; wrap such text in quotes);
- an entry has no `id`, or two entries share one;
- a required field is missing;
- a date is malformed;
- a link isn't `https://`, `/…` or `mailto:`.

Nothing is ever silently dropped.

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
