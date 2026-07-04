# Luiz Takahashi — research site

Personal research website for PhD applications. Single-page, dependency-free,
theme-aware (light/dark), responsive. The design language is drawn straight from
the research: **blue = signal, red = confound** — the identifiability through-line
that runs across all three manuscripts.

## Structure

```
site/                         ← the ONLY folder that gets deployed (see wrangler.jsonc)
  index.html                  main page
  assets/
    style.css                 design system
    app.js                    theme toggle, scrollspy, reveal, hero scatter
    og.png                    social/share preview image
  papers/
    nullstate.pdf             (public) NullState manuscript
    multiview-interaction-detection.pdf   (public) with J. Wen
```

Private source documents (application plan, full research proposal, source
manuscripts) live in the repo **root** and are deliberately **not** served —
`wrangler.jsonc` points `assets.directory` at `./site` only, so nothing outside
`site/` is ever published.

## Preview locally

```bash
cd site && python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy (Cloudflare)

```bash
npx wrangler deploy        # or: npx wrangler pages deploy site
```

## Things to personalize

- **Behavioral paper PDF** — drop a PDF export of *Coupled to Time, Stuck in
  Space* into `site/papers/` and wire the link in `index.html` (currently
  "PDF available on request").
- **Full research proposal** — intentionally *not* linked publicly (it contains
  the novel Aim 2 you may not want to broadcast pre-application). To add it, copy
  the PDF into `site/papers/` and add a link.
- **Extra links** — ORCID / Google Scholar / LinkedIn: a commented placeholder is
  in the contact card in `index.html`.
- **Photo / CV** — none included yet; easy to add.
- **og:image absolute URL** — once the final domain is known, set
  `og:image` to the absolute URL for best link previews.
