# Project pages, visual editor and content foundation (phase 2a)

- **Date:** 2026-11-02
- **Status:** design approved in conversation; written spec awaiting review
- **Branch:** `claude/beautiful-fermat-yuufzk`, restarted from `main` after PR #1 merged
- **Builds on:** `docs/superpowers/specs/2026-11-02-phd-site-redesign-design.md` (phase 1). Its design system, tokens, accessibility rules and verification gate still apply.
- **Mockups:** canvas https://claude.ai/artifact/9sRXdBpUxGaq3R1joXiKAE, row "Phase 2": "Project page · ARTS" and "Interactive figure · Practice as signal" (private to the owner)

## 1. Goal

Give faculty a place to go deeper after the homepage. Each main project gets its own page, and the owner can add or edit everything from a visual editor in the browser without touching code. This phase also lays the shared foundation that Writing (phase 2b) and the Gallery (phase 2c) will reuse:

- the editor;
- one-file-per-entry content;
- block-based long-form pages;
- page transitions;
- the image-privacy check.

**Success criteria**

1. From any homepage research card, a visitor reaches a project page that reads like a short Quanta article. They get the question, approach, validation, results, limits and links, and a one-minute summary at the top.
2. The owner can sign in at `/admin` and change any homepage text, project, news item or publication, then publish by saving. No local tools are needed.
3. No content mistake ships silently. A malformed file, a missing required field, a broken image path, or an image carrying GPS location fails the build with a message that names the file.
4. Unpublished work (Practice as Signal, Multi-view) is described only at the level of detail already public in the CV.
5. Everything from phase 1 still holds:
   - WCAG 2.1 AA in both themes;
   - no horizontal scroll at 320 px;
   - works without JavaScript;
   - reduced motion respected.

## 2. Scope

**In scope**

- Project pages at `/research/<slug>/` for ARTS, smart homes, Practice as Signal and Multi-view.
- Homepage research cards become whole-card links. The Multi-view row links to its page.
- Interactive figure "practice-band" on the Practice as Signal page.
- New two-ink illustration for Multi-view.
- Sveltia CMS at `/admin` with token sign-in.
- Content migration to one file per entry: projects, news, publications, and the profile (hero text and contact links).
- Image GPS check in the build.
- `public/_redirects` narrowed so it no longer blocks `/research/<slug>/`.
- README updated with editor sign-in and editing guide.

**Out of scope:** Writing (2b), Gallery (2c), site search, per-page generated share images, a `/research/` index page. The breadcrumb links to `/#research`.

**Deferred items from the phase-1 review fixed here:**

- the `/research/*` redirect that would block these pages;
- hero links that duplicated `site.email`, `github` and `orcid` (they are now derived from profile fields).

The rest stay deferred.

## 3. Decisions

| Decision | Choice |
|---|---|
| Editing | Visual editor: Sveltia CMS at `/admin`, GitHub backend, token sign-in |
| Page depth | Deep pages for public work (ARTS, smart homes); CV-level pages for in-preparation work (Practice as Signal, Multi-view); no page for Medication adherence or SQL Component Match |
| Page structure | Typed blocks chosen in the editor (text, steps, timeline, stats, figure, interactive), not free Markdown with custom syntax |
| Content storage | One file per entry; project = folder with `index.md` plus its images |
| Transitions | Browser-native cross-document view transitions (no client-side router) |
| Interactive figure | Plain SVG and a small TypeScript module (no framework), simulated data clearly labeled |

## 4. Information architecture

**Routes added:** `/research/arts/`, `/research/smart-homes/`, `/research/practice-as-signal/`, `/research/multi-view/` and `/admin/`.

`/research/<slug>/` is generated for every project with `page: true` and `draft: false`. The slug is the project's folder name.

**Redirects.** `public/_redirects` replaces the `/research/*` wildcard with the four old addresses only:

- `/research/nullstate.html / 301`
- `/research/multiview.html / 301`
- `/research/behavior.html / 301`
- `/research/program.html / 301`

The `/index.html`, `/papers/*`, `/assets/figures/*` and `/Takahashi_Research_Statement.pdf` rules stay.

**Navigation** is unchanged: Research → `/#research`, Publications → `/#publications`, CV. Gallery and Writing stay disabled.

**`/admin/`** gets `<meta name="robots" content="noindex">` and is not linked from the site.

## 5. Project page

Layout as in the ARTS mockup. The content column is at most 700 px. On wide screens a 200 px "On this page" rail sits on the left.

1. **Breadcrumb:** "Research / <short name>", where "Research" links to `/#research`. Mono 12.5 px, muted.
2. **Header:**
   - kicker;
   - `h1` title in Newsreader (`clamp(40px, 5.4vw, 64px)`);
   - `question` as an italic serif dek;
   - author list with `self` in `<strong>`;
   - a meta line "`role` · `status`";
   - link chips (`LinkChips` chip variant).
3. **Hero figure:** the project's illustration in a `--paper-2` panel at 16:7, with the caption below it (mono 12 px, muted). Its `view-transition-name` is `fig-<slug>`.
4. **Body:** a flex row.
   - **"On this page":**
     - Lists "In one minute", every text block's heading, and "Paper and code" when `citation` or `links` exist.
     - The current section is highlighted while scrolling: an accent 2 px left marker and `aria-current="true"`.
     - It is sticky at ≥ 1024 px and hidden below 900 px.
   - **Main column:**
     - **"In one minute":** a `--paper-2` box with exactly three items. Inline `**bold**` is allowed.
     - **Blocks**, in order (§7.2).
     - **"Paper and code":** a section with the citation and links, when present.
5. **"Next project" link:** goes to the next page project by `order`, wrapping around. An "← All research" link points to `/#research`.

Every section heading has an `id`, so the rail's links and deep links work.

Without JavaScript the rail still links correctly; only the highlight is missing. The `<title>` is "<title> · Luiz Takahashi"; the meta description is `question`. The `og:image` stays the site's share image.

## 6. Motion and interactivity

### 6.1 Card-to-page transition

- **Names:**
  - On the homepage, a card's figure panel gets `view-transition-name: fig-<slug>` and its title gets `title-<slug>`.
  - On the project page, the hero figure gets `fig-<slug>` and the `h1` gets `title-<slug>`.
- **Mechanism:** the existing global `@view-transition { navigation: auto; }` (under `prefers-reduced-motion: no-preference`) animates the shared elements and cross-fades the rest. The back button reverses it.
- **Unsupported browsers** navigate normally.
- **Uniqueness:** names must be unique within a page; a test enforces this.

### 6.2 Homepage cards as links

- The card title becomes `<a href="/research/<slug>/">`.
- Its `::after` stretches over the whole card, so the card is clickable.
- Inner links (Code, DOI) sit above the overlay (`position: relative; z-index: 1`) and stay independently clickable.
- Focus outline goes on the card (`:focus-within`), and the existing hover styles stay.
- Cards for projects without a page keep phase-1 behavior: no stretched link.

### 6.3 Interactive figure "practice-band"

As in the "Interactive figure · Practice as signal" mockup.

- **Header:**
  - kicker "Interactive figure · simulated data" (accent);
  - title "Is this score a real drop, or just a slow day?";
  - one-line instructions.
- **Chart:**
  - inline SVG, 14 days on x, "words correct" on y;
  - a flat dashed fixed day-one range (7.6–12.4, `--ink` at 7% opacity);
  - a practice-aware expected band (`--accent` at 16%) with its mean line (`--accent`, 2 px);
  - daily points (`--ink`, r = 4.5; points outside the band in `--accent`), with a 2 px `--paper-2` ring.
  - The selected day gets r = 7, an outer ring and a dotted vertical guide.
  - Direct labels read "Fixed day-one range" and "Practice-aware expected band (95%)".
- **Simulated data (fixed, deterministic):**
  - mean(d) = 10 + 6.5·(1 − e^(−(d−1)/3.5));
  - half-width 2.4;
  - observations `[10.2, 11.6, 12.9, 13.1, 14.6, 15.0, 15.4, 16.6, 11.3, 16.9, 16.4, 17.3, 16.8, 17.6]`;
  - default selected day 9.
- **Controls:**
  - a labeled `<input type="range" min=1 max=14>` (min-height 44 px), which also takes arrow keys;
  - each point is a button-like hit target of r = 16 that selects its day.
- **Readout (`aria-live="polite"`):**
  - the day and the score;
  - the band's expected range and verdict ("Within what practice predicts: no flag." / "Below what practice predicts: flagged as a possible real drop." / "Above what practice predicts.");
  - the fixed range's verdict ("Looks normal." / "Looks normal, so this drop would be missed." / "Out of range: would raise a false alarm for what is only practice." / "Below range: flagged.").
  - Verdicts that point to an error use `--accent`; others use `--ink`.
- **Caption (mono 11.5 px, muted):** "Simulated scores for illustration only, not study data. In the study, on people left out of the fit, a fixed day-one normal range covered 42.7% of later scores, while practice-aware 95% bands covered 93–97%."
- **No-JS fallback:** the server-rendered SVG and readout show day 9. The slider is hidden (`.js` gate), so nothing looks interactive.
- **Palette:** neutral ink plus one accent (emphasis encoding). The validator's CVD separation (ΔE ≥ 24) and contrast (≥ 3:1) pass in both themes. The lightness and chroma checks do not apply to the neutral. Direct labels give secondary encoding.

## 7. Content model

### 7.1 Storage

```
src/content/
  site/profile.yaml                      hero + contact (one entry, id "profile")
  projects/<slug>/index.md               frontmatter only (fields + blocks); images beside it
  news/<YYYY-MM>-<slug>.md               frontmatter only
  publications/<slug>.md                 frontmatter only
```

The id is the folder or file name, so ids cannot be missing or duplicated. The YAML files from phase 1 (`src/data/projects.yaml`, `news.yaml`, `publications.yaml`) and the hero copy in `site.ts` move here with their text unchanged. `site.ts` keeps only code-level constants (`url`, `nav`, `legalName`, `altName`, `affiliation`).

### 7.2 Schemas (zod, validated at build)

**`profile`:**

| Field | Type |
|---|---|
| `label` | string |
| `researchLine` | string (also the meta description) |
| `bio` | 2 strings |
| `caption` | 2 strings |
| `email` | email |
| `github` | `https://` URL |
| `orcid` | `https://` URL |
| `cvPath` | string starting with `/` |
| `updated` | string |

Hero links are derived from these fields: CV (PDF) → `cvPath`, the email as `mailto:`, GitHub, ORCID.

**`projects`:**

| Field | Type |
|---|---|
| `title` | string |
| `shortName` | string (breadcrumb) |
| `kicker` | string, optional |
| `summary` | string (card and row text) |
| `question` | string, optional |
| `role` | string |
| `status` | string |
| `order` | int |
| `feature` | boolean |
| `page` | boolean |
| `draft` | boolean, default false |
| `figure` | `arts \| praxis \| homes \| multiview`, optional |
| `authors` | string[], optional |
| `self` | string, optional |
| `minute` | string[], optional |
| `links` | `{label, href}`[], default [] |
| `citation` | string, optional |
| `blocks` | Block[], default [] |

Refinements:

- `feature` requires `figure` and `kicker`.
- `page` requires `figure`, `kicker`, `question`, `authors` (containing `self`) and `minute` of exactly 3.
- Block headings are unique within a project.

**Block** is a discriminated union on `type`:

- `text`: `heading` (string), `body` (Markdown string).
- `steps`: `items` [2–4] of `{label, text, emphasis?: boolean}`.
- `timeline`: `stages` [2–4] of `{label, text, emphasis?: boolean}`.
- `stats`: `items` [2–4] of `{value, label, muted?: boolean}`.
- `figure`: `image` (Astro `image()`, path relative to the entry), `alt` (non-empty), `caption` (non-empty).
- `interactive`: `name` (`practice-band`).

**`news`:** `date` (`YYYY-MM`), `text` (inline Markdown: `*em*` and `[text](https://…)` only), `draft` (default false).

**`publications`:** the phase-1 fields, plus `draft` (default false). `order` stays.

Drafts are excluded from every page. Text-block `body` is rendered by Astro's own Markdown processor. Inline fields (`minute`, `news.text`) use the existing escaping `renderInline`, extended to `**bold**`.

### 7.3 Copy

Facts are verbatim from the November 2026 CV. The owner reviews the prose in the pull request. Homepage `summary` values are unchanged from phase 1.

**ARTS** (`arts`, order 1, feature, page)

- **Short name:** ARTS.
- **Question:** "Older adults said the words they remembered into an Apple Watch, unsupervised, in daily life. Can a speech recognizer's own uncertainty make the scoring trustworthy?"
- **Authors and status:** authors as in the JINS entry. Role "First author"; status "Submitted to JINS · Open source" (unchanged from phase 1, since card meta = role · status). Links: Code.
- **Minute:**
  1. "**3,443** spoken recalls from **111** adults aged 50 and older, recorded on an Apple Watch across 14 days of daily life."
  2. "ARTS scores them from Whisper's word probabilities, not only its top guess, and flags low-confidence words for a person instead of guessing."
  3. "Rules were frozen before testing on 20 people they had never seen: agreement with two human scorings was **ICC .971** and **.968**."
- **Blocks:**
  1. Text "The question":
     - "In the Cognition, Aging and Temperature (CAT) study, adults 50 and older recalled a 12-word list into an Apple Watch, on their own, during 14 days of ordinary life. That produced 3,443 recordings from 111 people, far more than a lab can score by hand."
     - "Speech recognition can transcribe them, but a misheard word looks exactly like a forgotten one. So the real question is not only how to score automatically, but when an automatic score can be trusted, and what should happen when it can't."
  2. Text "The approach": "ARTS works on Whisper transcripts with no fine-tuning, but it reads more than the transcript. Whisper reports how probable each word is and which alternatives it considered. When the word it wrote is off the list and uncertain, ARTS looks at those alternatives; if a list word is among them, it is credited. This is *candidate rescue*."
  3. Steps:
     - "1 · Top guess": "The written word is off the list and low-confidence".
     - "2 · Alternatives": "A list word appears among the recognizer's ranked alternatives".
     - "3 · Decision" (emphasis): "Credited, or flagged for a person if it stays uncertain".
  4. Text "Rules frozen first": "I developed the scoring rules on 91 participants and then froze them. For a separate group of 20 people the rules had never seen, research assistants followed a blind double-transcription protocol I wrote and coordinated."
  5. Timeline:
     - "Development": "91 participants; 602 hand-scored recordings from 14 of them".
     - "Then" (emphasis): "Rules frozen".
     - "Held-out test": "20 new participants; 585 recordings, each transcribed blind by two people".
  6. Text "Results": "On the 585 held-out recordings, the frozen pipeline agreed with each human scoring of correct recall almost as closely as the two humans agreed with each other."
  7. Stats:
     - ".971": "ARTS vs. first human scoring (ICC)".
     - ".968": "ARTS vs. second human scoring (ICC)".
     - ".987" (muted): "The two human scorings vs. each other".
     - "0.21": "words mean absolute difference (0.21–0.22)".
  8. Text "Limits": "Correct recall is reliable. Repetitions and intrusions are not yet: their agreement stays below ICC .20, so ARTS leaves them to human review rather than reporting a number it can't stand behind."
- **Citation:** the JINS entry text with "submitted September 2026; decision pending."

**Room-aware tracking in smart homes** (`smart-homes`, order 3, feature, page)

- **Short name:** Smart homes.
- **Question:** "Motion sensors in a home fire only when someone passes. Can a model track where a person is, and how sure it is, from such sparse events?"
- **Authors and status:** L. Takahashi, D. J. Cook, M. Schmitter-Edgecombe. Role "First author"; status "ISG 2026 poster" (unchanged from phase 1). Links: DOI.
- **Minute:**
  1. "A Kalman filter, adapted with a room-aware mechanism, updates only when an ambient sensor fires."
  2. "On synthetic residents built from real data, it cut localization error by **18%** against baselines, with uncertainty that was statistically consistent **92%** of the time (65% for baselines)."
  3. "In 35 older adults' homes (2M+ sensor events), higher 1-back accuracy went with more varied days (**r = −.43**, n = 32, p = .015)."
- **Blocks:**
  1. Text "The question": "Ambient sensors are cheap and passive, which makes them attractive for monitoring cognitive health at home. But they report only when something happens, so a model has to estimate where a person is between events, and say how uncertain that estimate is."
  2. Text "The approach": "I adapted a Kalman filter to event-driven sensor updates, with a room-aware mechanism, so it reports both an estimated position and its uncertainty. LASSO then ranked behavioral features for separating healthy from impaired residents."
  3. Timeline:
     - "Source data": "WSU Functional Assessment Study, 41 participants".
     - "Simulated residents" (emphasis): "30 healthy and 30 impaired, generated from that data".
     - "Real homes": "35 older adults, 2M+ sensor events".
  4. Text "Results": "Against baseline models on the synthetic benchmarks, the filter was more accurate and better calibrated. LASSO-ranked behavioral features separated healthy from impaired simulated residents. In real homes, the variety of a person's days tracked working memory."
  5. Stats:
     - "18%": "lower localization error than baselines".
     - "92%": "statistically consistent uncertainty (65% for baselines)".
     - ".78": "AUC, healthy vs. impaired residents".
     - "−.43": "r, 1-back accuracy vs. day-to-day similarity".
  6. Text "Limits": "The healthy-versus-impaired comparison uses simulated residents generated from real data, not a clinical sample, and the real-home association is correlational in 32 people."
- **Citation:** the ISG room-aware entry. Also a line "Related manuscript in preparation: *Coupled to time, stuck in space: dissociable behavioral dimensions in MCI and dementia*."

**Practice as signal** (`practice-as-signal`, order 2, feature, page)

- **Short name:** Practice as signal.
- **Question:** "A test repeated on a watch is also a learning task. How do you tell a real change from practice?"
- **Authors and status:** L. Takahashi, D. J. Cook, M. Schmitter-Edgecombe. Role "Lead"; status "Manuscript in preparation". No links.
- **Minute:**
  1. "In a CAT pilot (113 adults 50 and older), 1-back scores rose **23%** in two weeks."
  2. "Praxis, a hierarchical practice-curve model, gives each 1-back prompt a calibrated expected-score band."
  3. "On people left out of the fit, its 95% bands held **93–97%** coverage, while a fixed day-one range fell from 93.9% to **42.7%**."
- **Blocks:**
  1. Text "The problem": "If scores rise with practice, a range set on day one soon flags ordinary improvement as change, and can miss a real drop that still looks normal by day-one standards."
  2. Interactive `practice-band`.
  3. Text "How it was tested": "Leave-one-person-out tests in two WSU studies: 180 adults 50 and older over two weeks, and 39 adults in up to five week-long bursts over about 16 months."
  4. Stats:
     - "93–97%": "Praxis 95% band coverage".
     - "42.7%": "fixed day-one range coverage (from 93.9%)".
     - "+4.28": "predicted first-to-last-burst rise (observed +4.55)".
  5. Text "Status": "This work is in preparation, so this page stays at the summary level in my CV. The interactive figure uses simulated data."
- **Citation:** "L. Takahashi, D. J. Cook, M. Schmitter-Edgecombe. *Practice as Signal: practice-aware expected-score bands for repeated smartwatch cognitive tests* (working title). In preparation."

**Multi-view interaction detection** (`multi-view`, order 5, not feature, page, figure `multiview`)

- **Short name:** Multi-view.
- **Kicker:** "Statistical theory · Multi-cohort data".
- **Question:** "When two biomarker views seem to interact, is it biology, or how the cohorts were assembled?"
- **Authors and status:** L. Takahashi, J. Wen. Role "First author"; status "In preparation".
- **Minute:**
  1. "Proofs and analysis code for detecting interactions between biomarker views, with Junhao Wen (Columbia)."
  2. "In multi-cohort proteomic data, an apparent cross-organ interaction vanished under cohort adjustment."
  3. "The theory predicted it: an assay-batch Simpson's paradox."
- **Blocks:** Text "Status": "This work is in preparation, so this page stays at the summary level in my CV."
- **Citation:** "L. Takahashi, J. Wen. *A completeness hierarchy for multi-view interaction detection, and why naive multi-cohort application fails* (working title). In preparation."

**Medication adherence** (`medication-adherence`, order 4) and **SQL Component Match** (`sql-component-match`, order 6) are rows with `page: false`, unchanged from phase 1. The phase-1 ids `praxis`, `homes` and `multiview` become the folder slugs `practice-as-signal`, `smart-homes` and `multi-view`; the figure names (`praxis`, `homes`) are unchanged.

### 7.4 Multi-view illustration

`MultiviewFigure`: 400×300, two inks, same classes as the other figures, grain `grain-multiview`.

- **Left panel:** pooled points with one steep accent trend line (the apparent interaction).
- **Right panel:** the same points split into two cohort clusters: ink filled and ink outlined. Each cluster has a flat ink trend line.
- **Panels:** separated by a thin rule.
- **aria-label:** "Illustration: an apparent trend across pooled data disappears within each cohort, a Simpson's paradox."

No text in the SVG.

## 8. Visual editor (Sveltia CMS)

- **Files:**
  - `public/admin/index.html` loads `@sveltia/cms` from a CDN at a pinned exact version, with `noindex`.
  - `public/admin/config.yml` holds the configuration.
- **Backend:** `github`, repo `LTTakahashi/the-appearing`, branch `main`, sign-in with a fine-grained personal access token (this repository only; Contents read and write). No OAuth app or Worker. Exact config keys are checked against the pinned version's docs during implementation.
- **Collections:**
  - **Profile:** a `files` collection editing `src/content/site/profile.yaml`.
  - **Projects:** a folder collection at `src/content/projects`, `path: "{{slug}}/index"`, media stored beside the entry.
    - Fields mirror §7.2.
    - `blocks` is a list widget with one type per Block variant.
    - `figure` and `interactive.name` are select widgets.
    - `image` uses the image widget.
  - **News:** a folder collection, file name `{{year}}-{{month}}-{{slug}}`.
  - **Publications:** a folder collection.
  - Every field marked required in the schema is `required: true` in the editor. A test checks this (§10).
- **Uploads:** raster uploads are converted to WebP with a width cap of 2400 px, which also strips metadata. The build check in §9 is authoritative either way.
- **Sign-in instructions** go in the README: create the token, then open `/admin`, choose token sign-in and paste it. The token is stored only in that browser.

## 9. Safety checks in the build

The `build` script becomes `node scripts/check-images.mjs && astro build`, so Cloudflare runs both.

- **`check-images.mjs`:**
  - scans `src/` and `public/` for `.jpg`, `.jpeg`, `.png`, `.webp`, `.tif`, `.tiff` and `.heic`;
  - reads metadata with `exifr`;
  - exits non-zero with a list of files when any image carries GPS fields, or when a `.heic` or `.tif` file is present (browsers can't show them).
- **Content errors fail the build:**
  - malformed frontmatter or YAML;
  - a schema violation;
  - an image path that doesn't resolve.
  
  Phase 1's guarantee carries over to the new loaders and is proven by tests (§10).
- **Drafts** are excluded at query time by one helper, `published(collection)`, used everywhere.

## 10. Verification

`npm run verify` gains these tests, written test-first:

1. **Project routes:**
   - every `page: true`, non-draft project builds at `/research/<slug>/` with `h1` = title;
   - the rail entries equal ["In one minute", ...text-block headings, "Paper and code" (when present)];
   - "Next project" cycles in `order`;
   - `page: false` and drafts produce no route (404).
2. **Homepage:**
   - each feature card with a page is a whole-card link to its page, while inner Code and DOI links keep their own hrefs;
   - the Multi-view row links to its page;
   - view-transition names are unique on every page;
   - the rendered titles, summaries, news and publications are identical to phase 1.
3. **Interactive figure:**
   - the slider and arrow keys change the readout;
   - clicking a point selects its day;
   - day 9 reports the band's "flagged" verdict and the fixed range's "missed" verdict; day 12 reports the false-alarm verdict;
   - the "simulated data" label and caption are present;
   - with JavaScript disabled the SVG and the day-9 readout render and the slider is hidden.
4. **Content safety** (each in a temporary copy built in a subfolder of the repo):
   - malformed frontmatter fails the build;
   - a missing required field (e.g. a figure block without `alt`) fails the build;
   - a JPEG with GPS EXIF fails the build, naming the file.
5. **Editor drift:** for each collection, every required schema field appears in `config.yml` with `required: true`, folders match the content paths, and the Sveltia version is pinned.
6. **Admin page:** `/admin/` returns 200, has `noindex`, and its `config.yml` parses.
7. **Redirects:** the old `/research/*.html` paths are listed individually and there is no `/research/*` wildcard.
8. **Quality on every project page and the homepage:**
   - axe shows 0 serious or critical issues at 1440 and 390 px in light and dark;
   - no horizontal overflow at 320 px;
   - no console errors;
   - every internal link and asset resolves.

## 11. Risks and open items

- **Sveltia specifics:** token sign-in key name, list-widget variable types and upload transformation keys are confirmed against the pinned version during implementation. If a feature is missing, the fallback is a simpler widget (for example separate optional block fields), recorded as a ruling.
- **Repository visibility:** if the repo is public, drafts and unused uploads are readable on GitHub even though the site hides them. That is the owner's call.
- **Real figures:** the pages launch with illustrations and CV numbers. The owner adds poster or paper figures later through a figure block.
- **Cloudflare build:** unchanged except that `npm run build` now also runs `check-images.mjs`.

## 12. Next phases (not designed here)

- **2b Writing:** posts reuse the text, figure and stats blocks, plus margin notes, math, RSS and per-post share images.
- **2c Gallery:** a photo-card grid with filters and a full-screen viewer, reusing the editor and the image check.
- **Later:** search across everything once there is enough content.
