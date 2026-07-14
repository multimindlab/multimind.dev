# multimind.dev

The marketing site and blog for [MultiMind SDK](https://github.com/multimindlab/multimind-sdk) — the compliance-first AI agent framework. Static site built with [Astro](https://astro.build), deployed to Netlify.

Live at [multimind.dev](https://multimind.dev).

## Tech stack

- **[Astro](https://astro.build)** — static site generation, no client-side framework. The homepage is server-rendered per locale; interactivity (nav menu, typewriter, tabs, scroll reveal) is a single vanilla JS file.
- **Astro Content Collections** — the blog (`src/content/blog/`) is Markdown with typed frontmatter, validated against `src/content/config.ts`.
- **Astro i18n routing** — English (default, unprefixed), French (`/fr/`), and Dutch (`/nl/`) homepage variants.
- **Netlify** — git-based continuous deployment; see `netlify.toml`.

## Local development

Requires Node 18.17+ (or 20+).

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs to dist/
npm run preview   # serve the production build locally
```

## Project structure

```
src/
  layouts/BaseLayout.astro   # <head>, nav, footer, favicon, meta tags, JSON-LD — shared by every page
  components/Home.astro      # homepage markup, driven by an i18n dictionary + features prop
  pages/
    index.astro               # English homepage (default locale, unprefixed)
    fr/index.astro             # French homepage
    nl/index.astro             # Dutch homepage
    blog/index.astro           # blog listing, grouped by tag (business/tech/other)
    blog/[slug].astro          # blog post detail page (renders a content collection entry)
  content/
    blog/*.md                  # blog posts — see "Adding a blog post" below
    config.ts                  # blog collection schema (title, description, pubDate, tags)
  i18n/{en,fr,nl}.ts           # homepage translation dictionaries — see "Translations" below
  data/features.ts             # the features-grid data, keyed by locale
public/
  styles.css, script.js        # global styles and vanilla JS (nav menu, typewriter, tabs, reveal-on-scroll)
  favicon*, apple-touch-icon.png, site.webmanifest
  robots.txt, llms.txt         # crawler and LLM-summary files (see below)
  assets/logo.png              # brand lockup (icon + wordmark); favicons were cropped from its icon half
```

## Adding a blog post

Blog posts are English-only for now (the homepage is the only translated content — see below). Add a new Markdown file to `src/content/blog/`:

```md
---
title: "Post Title"
description: "One-sentence summary, used for the listing page and meta description."
pubDate: 2026-07-14
tags: ["business"]   # or ["tech"] — controls which section it lands in on /blog. Omit for "Latest".
---

Post body in Markdown. Code fences render with syntax-appropriate monospace styling automatically.
```

The file name becomes the URL slug (`my-post.md` → `/blog/my-post`). New posts are picked up automatically by `src/pages/blog/index.astro` and `src/pages/blog/[slug].astro` — no other file needs to change.

## Translations

The homepage is translated into French and Dutch; the blog is not. Each locale is a plain object in `src/i18n/{en,fr,nl}.ts`, and all three files must stay structurally identical (same keys, same nesting) — `src/components/Home.astro` reads from whichever dictionary its page passes in. Code snippets, CLI commands, and Python examples are never translated; only prose fields are.

Fields containing inline HTML (`<code>`, `<strong>`, `<em>`, `<br>`) are rendered with Astro's `set:html` — write real Unicode punctuation (`'`, `"`, `—`) directly in the dictionary strings, not HTML entities, since plain fields are rendered as escaped text.

The French and Dutch copy was written by an LLM with working (not native-speaker-verified) fluency, particularly around EU regulatory terminology (RGPD/AVG, the AI Act). Have a native speaker review before treating it as final, especially the compliance/legal sections.

To add a fourth locale: add the locale to `astro.config.mjs`'s `i18n.locales` and the sitemap integration's `i18n.locales`, create `src/i18n/<locale>.ts` and a matching entry in `src/data/features.ts`, add `src/pages/<locale>/index.astro` (copy an existing one), and add the locale link to the switcher in `src/layouts/BaseLayout.astro`.

## AI GEO / SEO

- `public/robots.txt` explicitly allows AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, CCBot) in addition to general crawlers.
- `public/llms.txt` is a plain-text summary of the site for LLM consumption (the emerging `llms.txt` convention) — update it by hand when pages are added or renamed; nothing generates it automatically.
- `@astrojs/sitemap` generates `sitemap-index.xml` at build time, with `hreflang` alternates for the three homepage locales.
- JSON-LD (`SoftwareApplication` on homepages, `BlogPosting` on posts) is injected via `BaseLayout`'s `jsonLd` prop.
- The features grid is rendered server-side (`src/data/features.ts` → `Home.astro`) rather than injected by client JS after load, so it's present in the static HTML crawlers and AI agents actually see.

## Deployment

Netlify is connected via git — every push to `main` triggers a build (`npm run build`, publishing `dist/`, per `netlify.toml`). No manual deploy step. To connect a fresh Netlify site to this repo: Netlify dashboard → "Add new site" → "Import from Git" → select this repository; it reads `netlify.toml` automatically.

## License

Apache 2.0. Built by [AI2Innovate](https://ai2innovate.io).
