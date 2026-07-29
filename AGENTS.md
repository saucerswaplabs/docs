## UI Visual QC

For any change that affects rendered UI, layout, navigation, browser behavior, copy wrapping, responsive behavior, design tokens, CSS, components, pages, or app routes, Codex must verify the live rendered surface before claiming the task is done.

Required workflow:

1. Identify the changed routes, states, and relevant viewport widths. Include desktop 1440px and mobile around 390px unless the repository has stricter breakpoints.
2. Start or reuse the local Mintlify server. Prefer the repository's Playwright `webServer` configuration.
3. Inspect the rendered page in a real browser. Static review alone is not enough.
4. Run `npm run test:ui`, or set `PLAYWRIGHT_BASE_URL` to test an already-running preview.
5. Check spacing, hierarchy, wrapping, overflow, clipping, focus states, and mobile layout.
6. Run accessibility checks with `@axe-core/playwright`; fix serious violations before handoff.
7. Inspect generated screenshots and reports. Never approve visual evidence blindly.
8. Include routes, viewport sizes, commands, evidence paths, and known limitations in the handoff.
