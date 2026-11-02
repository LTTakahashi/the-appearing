# luiztakahashi.com redesign: design system and homepage (phase 1)

- **Date:** 2026-11-02
- **Status:** approved in conversation; written spec awaiting review
- **Branch:** `claude/beautiful-fermat-yuufzk`
- **Visual reference:** canvas mockup "A · Plate (editorial print)", https://claude.ai/artifact/9sRXdBpUxGaq3R1joXiKAE (private to the owner)

## 1. Goal

Rebuild the personal website from zero as a PhD-applicant site for Fall 2027
admissions. It must follow the conventions of PhD-student sites in top labs
(bio and photo, research, news, publications, CV) so faculty can scan it in
seconds. Its look should be its own: an ultra-minimal "lithograph" print
sensibility with Quanta-Magazine-style editorial UI.

**Audience.** Faculty and admissions committees in ubiquitous computing,
mobile health, HCI and digital-biomarker labs. They arrive from a statement
of purpose or from the URL on the CV and spend about a minute.

**Success criteria**

1. Within ~10 seconds a visitor knows who Luiz is, the research question,
   the evidence (first-author JINS submission, two ISG 2026 abstracts,
   open-source ARTS), the supervisors, that he is applying for Fall 2027,
   and where the CV and email are.
2. Every claim on the page matches the November 2026 CV. Nothing from the
   old computational-biology site remains.
3. Light and dark themes both pass WCAG 2.1 AA for text contrast. The page
   works at 390 px wide with no horizontal scroll.
4. The structure supports a gallery, a blog ("Writing"), project pages and a
   publications page later without redesign.

## 2. Scope

**In scope (this phase)**

- New Astro project replacing the hand-written `site/` folder.
- Design tokens, typography, base layout (header, footer, theme toggle).
- Homepage with all sections in §5.
- Styled 404 page.
- New CV PDF (Nov 2026), favicon, Open Graph image, JSON-LD `Person` data.
- Redirects from old URLs to `/`.
- Cloudflare deploy configuration for the build step.
- Rewritten `README.md`.

**Out of scope (later phases):** gallery, writing/blog, per-project pages,
standalone publications page, an HTML CV page.

**Removed entirely (decision: "start from zero")**

- `site/` (all pages, figures, `papers/*.pdf`, the old research statement
  PDF, the old CV PDF).
- `Takahashi_CV.tex` (describes the old research; the new CV source is not
  in the repo).

## 3. Decisions

| Decision | Choice |
|---|---|
| Old comp-bio content (NullState, research program, framing) | Delete; redirect old URLs to `/` |
| Photo | User-supplied portrait, cropped 4:5, muted treatment |
| Visual direction | A · Plate (editorial print) |
| Accent ink | Red-orange `#B23A22` |
| Build tool | Astro (latest stable, 7.x), static output |
| Navigation | Only sections that exist (Research, Publications, CV) |
| Research cards | Not whole-card links yet; each shows its real links |

## 4. Information architecture

**Eventual site map:** `/`, `/research/` (+ `/research/<slug>/`),
`/publications/`, `/gallery/`, `/writing/`, CV as PDF.

**Phase 1 routes**

- `/`: homepage.
- `/404`: not-found page, served for unknown paths.
- `/Takahashi_CV.pdf`: the November 2026 CV, unchanged.

**Navigation** is driven by a config list in `src/data/site.ts`. Each item
has `label`, `href` and `enabled`. Phase 1 enables:

- Research → `/#research`
- Publications → `/#publications`
- CV → `/Takahashi_CV.pdf`

Gallery and Writing exist in the list with `enabled: false`.

**Redirects** (`public/_redirects`, 301 to `/`):

- `/index.html`
- `/research/*`
- `/papers/*`
- `/assets/figures/*`
- `/Takahashi_Research_Statement.pdf`

`/Takahashi_CV.pdf` keeps its URL with new content.

## 5. Homepage layout

Max content width 1200 px. Side gutters are 40 px on desktop and 20 px
under 720 px. Sections are separated by a 1 px ink rule.

1. **Header.** Wordmark "Luiz Takahashi" in Newsreader 600 on the left. On
   the right: nav links (Inter 500, 14 px) and an icon-only theme toggle
   (`aria-label`, ≥44 px target). A 1 px ink rule sits below. A "Skip to
   content" link appears on focus.
2. **Hero** (two columns ≥ 900 px):
   - Left column: label, `h1` name, italic research line, bio (two
     paragraphs), link row.
   - Right column: a framed portrait, max 380 px. The frame is a 1 px ink
     border with a 10 px paper inset. A caption row sits under it in mono
     12 px.
   - Under 900 px the order is label, name, research line, portrait (max
     300 px, left-aligned), bio, links. This uses CSS grid areas.
3. **Research** (`id="research"`):
   - Heading row: "Research" (Newsreader 40 px).
   - Three feature cards in a responsive grid (3 / 2 / 1 columns). Each card
     has:
     - an illustration panel (4:3, `paper-2` background);
     - a kicker (mono 12 px, uppercase, accent);
     - a title (Newsreader 26 px);
     - a dek (Inter 15.5 px, `ink-2`);
     - a meta line (mono 12 px, muted);
     - a link row (e.g. "Code ↗", "DOI ↗").
   - Below the cards, three compact rows separated by hairlines: title
     (Newsreader 21 px), one-line summary, meta and optional link.
4. **News | Selected publications.** Two columns ≥ 900 px (1 : 2), stacked
   below.
   - News: date (mono) plus text, separated by hairlines.
   - Publications (`id="publications"`), each with:
     - a kicker (type · status, in accent);
     - a title (Newsreader 20 px);
     - authors, with Luiz's name in bold;
     - the venue in italics;
     - link chips (1 px ink outline, mono 12 px).
5. **Footer.**
   - Name, links (Email, GitHub, ORCID, CV), "Updated November 2026".
   - A line: "Also published as L. Takahashi Dos Reis."

## 6. Visual system

### 6.1 Color tokens (CSS custom properties on `:root`)

| Token | Light | Dark ("night print") |
|---|---|---|
| `--paper` | `#F4F1EA` | `#141311` |
| `--paper-2` | `#EAE5D9` | `#1D1B18` |
| `--ink` | `#1B1A17` | `#EEE9DE` |
| `--ink-2` | `#4A4740` | `#C4BDAF` |
| `--muted` | `#645F57` | `#9C9587` |
| `--rule` | `#D8D2C4` | `#34312B` |
| `--accent` | `#B23A22` | `#E57A5C` |

Measured contrast (WCAG):

- Light: ink 15.4, ink-2 8.2, muted 5.6, accent 5.3 on `paper`. On
  `paper-2` all are ≥ 4.7.
- Dark: all text tokens are ≥ 5.7 on both papers.

Theme selection works like this:

- `prefers-color-scheme` sets the default.
- A manual choice is stored in `localStorage` (`theme`), wrapped in
  try/catch.
- The choice is applied before first paint by an inline script that sets
  `data-theme` on `<html>`.
- Tokens are defined for `:root`, for `:root[data-theme="dark"]`, and under
  `@media (prefers-color-scheme: dark)` for
  `:root:not([data-theme="light"])`.

### 6.2 Typography

Self-hosted via Fontsource packages. There are no requests to Google.

| Role | Family | Use |
|---|---|---|
| Display / headings | Newsreader (variable, opsz) | name, headings, card and publication titles, italic research line |
| Text / UI | Inter (variable) | body, nav, deks |
| Data | IBM Plex Mono 400/500 | kickers, dates, meta, chips, captions |

Type scale:

- `h1`: `clamp(48px, 7vw, 84px)`, line-height 1.0, tracking −0.025em.
- Research line: `clamp(22px, 2.6vw, 30px)`, italic.
- Body: 17 px at 1.66, max 62ch.
- Use `font-display: swap`. Preload Newsreader and Inter.

### 6.3 Lithograph touches (deliberately restrained)

Only three, and nothing else gets texture or effects:

1. The plate frame around the portrait.
2. Two-ink research illustrations (ink + accent on `paper-2`), each with a
   faint grain overlay: SVG `feTurbulence`, alpha ≤ 0.10.
3. Hairline rules: ink rules between sections, `--rule` hairlines inside
   sections.

### 6.4 Portrait

- Source: the user-supplied photo, leveled about 6°, cropped 4:5, stored
  at 800×1000 in `src/assets/portrait.jpg`.
- Rendered with Astro `<Picture>` (AVIF and WebP, widths 380/760),
  `loading="eager"`, with explicit `width` and `height`.
- Muted treatment: `filter: saturate(.82) contrast(1.03) sepia(.06)`. Dark
  theme adds `brightness(.92)`.
- Alt text: "Portrait of Luiz Takahashi".

### 6.5 Illustrations

Three inline-SVG components with a 400×300 viewBox. Colors come from
`currentColor` and CSS variables, so both themes work. Each has
`role="img"` and an `aria-label`. None contains text or numbers.

- **ArtsFigure:** a watch with a speech waveform, a dashed arrow, six word
  tokens with confidence bars; one dashed "rescued" token and one flagged
  low-confidence token.
- **PraxisFigure:** a rising practice curve inside an accent band, a flat
  dashed day-one range, daily dots, and one dot below the band ringed.
- **HomesFigure:** a floor plan with sensor squares, a resident path in
  accent, and uncertainty ellipses.

Geometry follows the canvas mockup A.

### 6.6 Motion

All motion is disabled under `prefers-reduced-motion: reduce`.

- Hero: fade plus 8 px rise on load, staggered 60 ms. Pure CSS.
- Cards and rows: fade-in on scroll via `IntersectionObserver` (one small
  script). Content is visible without JS: the `.js` class gates the hidden
  initial state.
- Card hover or focus-within: the illustration scales to 1.02 over 300 ms,
  and the title gets an accent underline.
- Links: underline color transitions to accent.
- `@view-transition { navigation: auto; }` is enabled for future
  multi-page navigation.

### 6.7 Accessibility

- Semantic landmarks: `header`, `nav`, `main`, `footer`; one `h1`; an
  ordered heading hierarchy.
- Visible `:focus-visible` outline: 2 px accent, 3 px offset.
- Touch targets ≥ 44 px for nav, toggle and link chips on mobile.
- External links carry `rel="noopener"`. A ↗ marker is decorative
  (`aria-hidden`).

## 7. Content

### 7.1 Data model (`src/content.config.ts`, validated with zod)

**`projects`** (`src/data/projects.yaml`):

| Field | Type |
|---|---|
| `id` | string |
| `title` | string |
| `kicker` | string |
| `summary` | string |
| `role` | string |
| `status` | string |
| `feature` | boolean (true = card, false = compact row) |
| `figure` | `'arts' \| 'praxis' \| 'homes'`, optional |
| `links` | list of `{label, href}` |
| `order` | number |

**`news`** (`src/data/news.yaml`):

| Field | Type |
|---|---|
| `date` | `YYYY-MM` |
| `text` | string, inline Markdown links allowed |

**`publications`** (`src/data/publications.yaml`):

| Field | Type |
|---|---|
| `id` | string |
| `type` | `journal \| abstract \| software` |
| `status` | string |
| `title` | string |
| `authors` | string[] |
| `self` | name string to bold |
| `venue` | string |
| `year` | number |
| `links` | list of `{label, href}` |
| `selected` | boolean |

**`site.ts`:**

- name and legal name;
- email, GitHub, ORCID;
- the nav list;
- CV path;
- "updated" date;
- meta description.

### 7.2 Hero copy

- Label: `PhD applicant · Fall 2027`
- Name: `Luiz Takahashi`
- Research line: "I measure cognition and behavior in daily life, and ask
  when a recorded change is real rather than practice, context or noise."
- Bio ¶1: "I'm a computer science undergraduate at Washington State
  University (B.S. expected May 2027), working in the Neuropsychology and
  Aging Lab with Maureen Schmitter-Edgecombe and the CASAS Smart Home Lab
  with Diane J. Cook on NIH/NIA-funded studies of older adults. I work with
  smartwatch speech, repeated cognitive tests and in-home sensors, using
  uncertainty-aware machine learning, hierarchical models and calibrated
  prediction intervals, always tested on people held out of development."
- Bio ¶2: "I also work with Junhao Wen at Columbia on detecting
  interactions between biomarker views. Before that, I built an evaluation
  metric for text-to-SQL with Fabio Cozman at the University of São Paulo's
  Center for Artificial Intelligence (C4AI)."
- Links:
  - CV (PDF) → `/Takahashi_CV.pdf`
  - `l.takahashidosreis@wsu.edu` → `mailto:`
  - GitHub → `https://github.com/LTTakahashi`
  - ORCID → `https://orcid.org/0009-0006-3548-1256`
- Portrait caption: "B.S. Computer Science, WSU '27" · "Pullman, WA"

### 7.3 Projects

**Feature cards**

1. **Scoring spoken word recall on a smartwatch**
   - Kicker: *Speech · Wearables*
   - Summary: "Older adults said the words they remembered into an Apple
     Watch, unsupervised, in daily life. ARTS scores the recall from
     Whisper's word probabilities, not only its top guess, and matched two
     human scorers on held-out participants (ICC .97)."
   - Meta: First author · Submitted to JINS · Open source
   - Links: Code → `https://github.com/WSU-CASAS/ARTS`
   - Figure: arts
2. **Practice as signal**
   - Kicker: *Repeated testing · Hierarchical models*
   - Summary: "A test repeated on a watch is also a learning task. Praxis
     gives each prompt a calibrated expected-score band. On people left out
     of the fit its 95% bands held 93–97% coverage, while a fixed day-one
     range fell to 43%."
   - Meta: Lead · Manuscript in preparation
   - Links: none
   - Figure: praxis
3. **Room-aware tracking in smart homes**
   - Kicker: *Ambient sensing · State-space models*
   - Summary: "A Kalman filter adapted to event-driven home sensors cut
     localization error by 18% with uncertainty that stayed calibrated (92%
     consistency vs. 65%). In 35 older adults' homes, more varied days went
     with better working memory."
   - Meta: First author · ISG 2026 poster
   - Links: DOI → `https://doi.org/10.4017/gt.2026.25.2.1421.3`
   - Figure: homes

**Compact rows**

4. **Medication adherence from in-home sensors**
   - Summary: "A classifier for motion sensors on pill bottles and
     organizers matched clinician records about 93% of the time across 25
     older adults' homes."
   - Meta: Second author · ISG 2026
   - Links: DOI → `https://doi.org/10.4017/gt.2026.25.2.1527.3`
5. **Multi-view interaction detection**
   - Summary: "With Junhao Wen (Columbia): proofs and analysis code for
     detecting interactions between biomarker views. In multi-cohort
     proteomics, an apparent cross-organ interaction vanished under cohort
     adjustment, as the theory predicted."
   - Meta: First author · In preparation
6. **SQL Component Match**
   - Summary: "An AST-based metric that judges whether generated SQL means
     the same as the reference: 95% semantic accuracy vs. 70% for the
     Spider metric. C4AI, University of São Paulo."
   - Meta: Technical report · 2025

### 7.4 News

| Date | Text |
|---|---|
| 2026-09 | Submitted our paper on automated scoring of smartwatch verbal recall to *JINS*, and released [ARTS](https://github.com/WSU-CASAS/ARTS) as open source. |
| 2026-08 | Started as an Undergraduate Research Peer Mentor at WSU's Office of Undergraduate Research. |
| 2026-03 | Poster on room-aware behavioral profiling at ISG 2026, Vancouver. |
| 2025-08 | Joined the Neuropsychology and Aging Lab and the CASAS Smart Home Lab at WSU. |
| 2025-05 | Research assistant at the Center for Artificial Intelligence (C4AI), University of São Paulo. |

### 7.5 Selected publications

Author lists are verbatim from the CV.

1. **Journal · Under review.** L. Takahashi, A. Adam, H. McDougle, M.
   Jaworski III, B. Minor, M. Calamia, D. J. Cook, M. Schmitter-Edgecombe.
   "Automated scoring of verbal recall in smartwatch-based ecological
   momentary assessment: development and independent validation."
   *Journal of the International Neuropsychological Society*, submitted
   2026. [Code]
2. **Conference abstract · Poster.** L. Takahashi, D. J. Cook, M.
   Schmitter-Edgecombe. "Room-aware behavioral profiling for cognitive
   health monitoring in smart homes." *Gerontechnology* 25(Suppl.), 2026.
   ISG 2026, Vancouver. [DOI]
3. **Conference abstract.** R. Jenkins, L. Takahashi Dos Reis, D. J. Cook,
   M. Schmitter-Edgecombe. "Remote technological assessment of medication
   adherence in older adults." *Gerontechnology* 25(Suppl.), 2026. ISG
   2026, Vancouver. [DOI]
4. **Software.** ARTS: scoring pipeline for spoken word-list recall on
   smartwatches. github.com/WSU-CASAS/ARTS, 2026. [Code]

### 7.6 Kept off the site

- The JINS manuscript PDF, until the co-authors approve a preprint.
- Anything from the private application plan.
- GPA, awards, teaching and work history (they are in the CV PDF).
- The phone number in page text (it remains in the CV PDF, as before).

### 7.7 Metadata

- `<title>`: "Luiz Takahashi". `meta description` = the research line.
- Open Graph and Twitter: a 1200×630 `og.png` in the new style (paper,
  name in Newsreader, research line, accent rule), with an absolute URL
  `https://luiztakahashi.com/og.png`.
- Canonical `https://luiztakahashi.com/`.
- Favicon: an SVG mark (a short accent band-and-curve on paper) plus a
  32 px PNG fallback.
- JSON-LD `Person`:
  - `name`: Luiz Takahashi
  - `alternateName`: Luiz Takeshi Takahashi Dos Reis
  - `affiliation`: Washington State University
  - `sameAs`: ORCID, GitHub
  - `email`
- `robots.txt` allowing all.

## 8. Architecture

```
astro.config.mjs        site URL, static output
package.json            scripts: dev, build, preview, check, verify
.node-version           22.23.4 (Astro 7 requires >= 22.23.4)
wrangler.jsonc          assets.directory ./dist, build.command, 404 handling
public/
  Takahashi_CV.pdf  favicon.svg  favicon-32.png  og.png  _redirects  robots.txt
src/
  content.config.ts     collections: projects, news, publications (file loaders)
  data/                 projects.yaml  news.yaml  publications.yaml  site.ts
  assets/portrait.jpg
  styles/               tokens.css  global.css
  layouts/BaseLayout.astro   head, meta, JSON-LD, fonts, theme script, header/footer
  components/
    Header.astro  Footer.astro  ThemeToggle.astro  SkipLink.astro
    Hero.astro  ProjectCard.astro  ProjectRow.astro
    NewsList.astro  PublicationList.astro  LinkChips.astro
    figures/ArtsFigure.astro  PraxisFigure.astro  HomesFigure.astro  Grain.astro
  scripts/reveal.ts     IntersectionObserver reveal (progressive enhancement)
  pages/index.astro  404.astro
scripts/verify.mjs      Playwright + axe checks against `astro preview`
```

**Data flow.** YAML files go through `content.config.ts` (zod validation at
build). `index.astro` queries the collections, sorts them, and passes props
to components. Components hold no copy of their own. Hero and bio text live
in `site.ts`.

**Deploy (Cloudflare Workers static assets).** `wrangler.jsonc` contains:

- `assets.directory: "./dist"`;
- `assets.not_found_handling: "404-page"`;
- `build.command: "npm run build"`, so `npx wrangler deploy` builds first.

Cloudflare's build must install dependencies and use Node 22.23.4+. This is
pinned by `.node-version`; if Workers Builds ignores it, set a
`NODE_VERSION` variable. Merging to `main` is what publishes.

## 9. Verification

`npm run verify` must pass before completion. It runs:

1. `astro check`: types and content schemas, 0 errors.
2. `astro build`: clean.
3. `wrangler deploy --dry-run`: config valid and build runs.
4. Playwright against `astro preview`:
   - at 1440 px and 390 px, in light and dark:
     - no horizontal overflow at 390 px;
     - no console errors;
     - every internal link and asset returns 200;
   - axe-core reports 0 serious or critical violations in both themes.
5. Screenshots (desktop and phone, light and dark) saved for review. They
   are not committed.

## 10. Risks and open items

- **Cloudflare build settings.** If the project's dashboard has a custom
  build or deploy command, it may need `npm run build` / `npx wrangler
  deploy`. The owner checks once after the first merge. Steps go in the
  README.
- **ARTS repository visibility.** Assumed public (the CV says it was
  released with the JINS submission). If it is private, remove the Code
  links.
- **CV PDF.** Published as-is (it includes a phone number, as the previous
  public CV did).

## 11. Later phases (not designed here)

- Gallery: card grid, photo above and caption below, Markdown entries,
  optimized images.
- Writing: blog with Markdown posts, Quanta-style article layout, RSS.
- Project pages: `/research/<slug>/`. Cards become whole-card links.
- Publications page: the full list, including manuscripts in preparation.
