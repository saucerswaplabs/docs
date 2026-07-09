# SaucerSwap documentation

Source for the SaucerSwap docs at [docs.saucerswap.finance](https://docs.saucerswap.finance), built with [Mintlify](https://mintlify.com/docs).

## Repository layout

- `docs.json` — site configuration: navigation tabs, theme, redirects.
- `index.mdx`, `get-started/`, `tutorials/` — the Learn tab (user onboarding and tutorials).
- `protocol/`, `tokenomics/`, `governance/` — the Protocol tab (concepts and economics).
- `developers/` — the Developers tab (contract guides, security, AI integration).
- `api-reference/` — the API Reference tab; REST pages are generated from `openapi.yml`.
- `resources/`, `contact/`, `contributors/`, `legal/`, `changelog.mdx`, `roadmap.mdx` — the Resources tab.
- `images/` — all assets: app screenshots (`images/app/`), diagrams (`images/diagrams/`), brand files (`images/brand/`).
- `snippets/` — reusable MDX snippets (base URLs, callouts).
- `fonts/` — vendored Euclid Triangle woff2 files.

## Local development

Install the Mintlify CLI and run the dev server from the repo root (where `docs.json` lives):

```bash
npm i -g mint
mint dev
```

The site serves at `http://localhost:3000` with hot reload.

## Contributing

1. Read `STYLE.md` first — it is binding for every page: voice, heading case, frontmatter requirements, terminology, and truth rules (no undated volatile numbers, no unlaunched products).
2. Every page needs frontmatter with a unique `title` and a 140–160 character `description`.
3. Internal links are root-relative (never absolute `docs.saucerswap.finance` URLs). URL changes require a matching redirect in `docs.json`.
4. Every `/images/...` reference must resolve to a file in this repo — no external image hosting.
5. Check rendering locally with `mint dev` before opening a pull request; `mint broken-links` catches dead internal links.

## Publishing

Changes merged to the default branch deploy automatically through the Mintlify GitHub app.
