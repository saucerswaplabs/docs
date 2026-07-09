# SaucerSwap documentation style guide

This guide governs every page in this repo. The reference voice is the Orderbook API documentation: direct, second-person, imperative, tables over prose, concrete warnings.

## Voice and register

1. **Register** — plain professional-technical. Active voice, present tense. No marketing superlatives ("premier", "revolutionary", "cutting-edge"). Achievements appear only as dated metrics ("$6B+ all-time volume as of June 2026").
2. **Person** — "you" for the reader. "SaucerSwap" or "the protocol" in third person. "We" only for SaucerSwap Labs operational actions (key provisioning, support responses).
3. **Sell nothing** — no sentence in docs that persuades rather than instructs. Marketing tone belongs on saucerswap.finance.

## Structure

4. **Headings** — sentence case everywhere. Exactly one H1, sourced from frontmatter `title`. Never bold, underline, or emoji in headings. No skipped levels.
5. **Frontmatter** — every page ships a unique, qualified `title` (never a bare "Overview") and a 140–160-character `description`. The description renders under the title, feeds search, SEO, and llms.txt.
6. **Paragraphs** — four sentences maximum. Prefer tables and lists for enumerable facts. Fold long worked examples into `<Accordion>`.
7. **Hub pages** — one framing paragraph plus a `<CardGroup>` of titled cards with one-line verb-led descriptions. Never empty-title cards or headings inside cards.
8. **No dead ends** — every substantive page closes with 2–4 next-step `<Card>` links chosen for the reader's journey.
9. **Prerequisites** — every procedural page opens with a short prerequisites list, each item linked.

## Components

10. **Callouts** — `<Info>` = context, `<Note>` = caveat, `<Warning>` = risk of fund loss or breaking failure only, `<Tip>` = optimization. No bold pseudo-labels ("**Note:**") inside callouts. Maximum two consecutive.
11. **Steps** — every tutorial and multi-step procedure uses `<Steps>`.
12. **Code** — a language tag on every fence. Identifiers, contract IDs, endpoint paths, and parameter names in backticks. Multi-language samples use `<CodeGroup>` with fixed tab order and canonical labels: `cURL`, `JavaScript`, `TypeScript`, `Python`. Expected responses are labeled `Output`.
13. **Images** — kebab-case filenames, mandatory alt text, wrapped in `<Frame>` with a sentence-case caption ending in a period. Screenshots show the current app only.
14. **Math** — LaTeX or fenced code blocks. Never HTML sub/sup with escaped underscores.

## Language mechanics

15. **Emphasis** — bold for UI element names only ("select **Approve & Swap**"). Italics for variables. Never `<u>`.
16. **Dates and numbers** — "Month D, YYYY" (no ordinals). Every volatile figure carries "as of \<date\>" or links to a live source. Use ≈ instead of ~ on money lines. Exact numbers over hedges.
17. **Links** — descriptive anchor text, never bare URLs, no spaces inside anchor text. Internal links are root-relative (never absolute `docs.saucerswap.finance` URLs).
18. **Emoji** — none, anywhere: not in titles, nav, headings, or body. Icons come from Mintlify `icon` fields.
19. **Language** — American English, Oxford comma, acronyms expanded on first use per page.

## Terminology (canonical forms)

| Use | Not |
|---|---|
| SAUCE, xSAUCE, WHBAR, HBAR, HTS | $SAUCE, xSauce, wHBAR |
| LARI (expand on first use: Liquidity-Aligned Reward Initiative) | Lari |
| order book (prose) / Orderbook API (product name) | orderbook (prose) |
| Token classes: default, extended, untracked | "all" |
| web app | Web App, web-app |
| V1, V2, V3 | v1, V.1 |
| HashScan, HashPack, Mirror Node | Hashscan, Hashpack |
| X (formerly Twitter) | Twitter |
| dashboard (app nav), pool (app nav) | Portfolio page, Liquidity page |
| TypeScript, JavaScript | Typescript, Javascript |

## Truth rules

20. **UI nouns** match the live app's exact labels (the app nav is: trade, swap, explore, pool, stake, govern, dashboard, bridge).
21. **One concept, one home** — impermanent loss, slippage, token association, HBAR gas each have one canonical page; every other mention is one line plus a link.
22. **Version steering is opinionated** — V2 is recommended for new liquidity integrations; V1 is legacy. Say so.
23. **Never document unlaunched products.** Volatile facts that cannot be verified are removed, not guessed.
