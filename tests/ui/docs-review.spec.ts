import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync } from 'node:fs';
import { uiRoutes } from './routes';

for (const route of uiRoutes) {
  test.describe(`docs review: ${route.name}`, () => {
    test('renders without root overflow or serious accessibility violations', async ({ page }, testInfo) => {
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeVisible();
      // The Mintlify dev runtime keeps background requests open and can leave
      // document.readyState at "interactive". Give client-rendered MDX and
      // KaTeX two settled frames before measuring the final layout instead.
      await page.waitForTimeout(1_500);
      await page.evaluate(() => new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }));

      if (route.name === 'tokenomics') {
        await expect(page.getByText('September 2027')).toBeVisible();
        await expect(page.getByText('139.522944 SAUCE/min', { exact: false })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Community pools' })).toHaveCount(0);
      }
      if (route.name === 'lari-weights') {
        await expect(page.getByText('241,111.33', { exact: true })).toBeVisible();
        await expect(page.getByText('9,154.00', { exact: true })).toBeVisible();
        await expect(page.getByText('8,938.32', { exact: true })).toHaveCount(0);
      }
      if (route.name === 'wallet') {
        await expect(page.getByRole('heading', { name: 'Kabila Wallet' })).toBeVisible();
      }
      if (route.name === 'for-projects') {
        await expect(page.getByText('SaucerSwap checks token information frequently')).toBeVisible();
      }
      if (route.name === 'routing') {
        await expect(page.getByText('Split route.', { exact: true })).toBeVisible();
        await expect(page.getByText('final election 6296', { exact: false })).toBeVisible();
        const v3Link = page.locator('main a[href="/protocol/saucerswap-v3"]').first();
        await expect(v3Link).toBeVisible();
        await expect(v3Link).toHaveAttribute('href', '/protocol/saucerswap-v3');
      }
      if (route.name === 'v3') {
        await expect(page.getByText('isMarketHalted', { exact: false }).first()).toBeVisible();
        await expect(page.getByText('halt: 0', { exact: false })).toHaveCount(0);
      }
      if (route.name === 'v3-fees') {
        await expect(page.getByText('This page shows fee rates as percentages', { exact: false })).toBeVisible();
        await expect(page.getByText('0.12% (12 bps)', { exact: true })).toBeVisible();
        await expect(page.getByText('0.002% (0.20 bps) rebate', { exact: true })).toBeVisible();
        await expect(page.getByText('1,200 pips', { exact: false })).toHaveCount(0);
      }
      if (route.name === 'contracts') {
        await expect(page.getByText('Topics 330–385', { exact: false })).toBeVisible();
      }
      if (route.name.startsWith('v2-')) {
        await expect(page.getByText('Fee tier in hundredths of a basis point.', { exact: false }).first()).toBeVisible();
      }
      if (route.name === 'v2-positions') {
        const openApiSpec = readFileSync('openapi.yml', 'utf8');
        expect(openApiSpec).toContain("id: '0.0.1456986'");
        expect(openApiSpec).toContain("id: '0.0.731861'");
        expect(openApiSpec).not.toContain("id: '0.0.59042'");
        expect(openApiSpec).not.toContain("id: '0.0.61266'");
      }
      if (route.name === 'orderbook-market-data') {
        await expect(page.getByText('isAMMEnabled: 0 | 1', { exact: false }).first()).toBeVisible();
        await expect(page.getByText('isMarketHalted: 0 | 1', { exact: false }).first()).toBeVisible();
      }
      if (route.name === 'changelog') {
        await expect(page.getByText('stale instructions and active-route references', { exact: false })).toBeVisible();
      }
      if (route.name === 'orderbook-orders') {
        await expect(page.getByText('Never use "1"', { exact: false })).toBeVisible();
        await expect(page.getByText('fillable === true', { exact: false })).toBeVisible();
        await expect(page.getByText('snappedInputAmount', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('suggestedOutputAmount', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('suggestedInputAmount', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('snappedOutputAmount', { exact: true }).first()).toBeVisible();
      }

      const horizontalOverflow = await page.evaluate(() => {
        const root = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0);
        return scrollWidth > window.innerWidth + 1;
      });
      expect(
        horizontalOverflow,
        `${route.path} should not create root overflow in ${testInfo.project.name}`,
      ).toBe(false);

      const floatingAssistant = page.locator(
        'chat-assistant-floating-input, .chat-assistant-floating-input',
      );
      if (await floatingAssistant.count()) {
        await expect(floatingAssistant).toBeHidden();
      }

      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Mintlify's local preview reports the dark content surface against a
        // white page background. Keep its generated contrast false positives
        // isolated while testing the repository-configured CTA below.
        .disableRules(['color-contrast'])
        .analyze();
      const serious: typeof axe.violations = [];
      for (const violation of axe.violations.filter(
        ({ impact }) => impact === 'serious' || impact === 'critical',
      )) {
        if (violation.id !== 'scrollable-region-focusable') {
          serious.push(violation);
          continue;
        }

        // Mintlify gives KaTeX wrappers overflow:auto even when their formula
        // fits horizontally; glyph ink creates a few non-interactive vertical
        // pixels. Retain the keyboard-access violation whenever a reported
        // node has meaningful horizontal scrolling in the tested viewport.
        const actuallyScrollableNodes = [];
        for (const node of violation.nodes) {
          const selector = node.target[0];
          const actuallyScrolls = typeof selector === 'string' && await page.locator(selector).evaluateAll(
            (elements) => elements.some(
              (element) => element.scrollWidth > element.clientWidth + 1,
            ),
          );
          if (actuallyScrolls) actuallyScrollableNodes.push(node);
        }
        if (actuallyScrollableNodes.length) {
          serious.push({ ...violation, nodes: actuallyScrollableNodes });
        }
      }
      expect(serious).toEqual([]);

      await page.screenshot({
        path: testInfo.outputPath(`${route.name}-${testInfo.project.name}.png`),
        fullPage: true,
      });
    });
  });
}

test.describe('navigation regressions', () => {
  test('routes from the swap-routing guide to the V3 overview', async ({ page }) => {
    await page.goto('/protocol/routing', { waitUntil: 'domcontentloaded' });
    const v3Link = page.locator('main a[href="/protocol/saucerswap-v3"]').first();
    await expect(v3Link).toBeVisible();
    await v3Link.click();

    await expect(page).toHaveURL(/\/protocol\/saucerswap-v3$/);
    await expect(page.getByRole('heading', { level: 1, name: 'SaucerSwap V3' })).toBeVisible();
  });

  test('redirects the retired Community Pools route', async ({ page }) => {
    await page.goto('/protocol/community-pools', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/protocol\/overview$/);
    await expect(page.getByRole('heading', { level: 1, name: 'How SaucerSwap works' })).toBeVisible();
  });

  test('keeps the primary navigation CTA readable in its hover state', async ({ page }, testInfo) => {
    await page.goto('/tokenomics/overview', { waitUntil: 'domcontentloaded' });
    const launchApp = page.getByRole('link', { name: 'Launch app' }).first();
    if (testInfo.project.name === 'chromium-mobile') {
      await expect(launchApp).toHaveCount(0);
      return;
    }
    await expect(launchApp).toBeVisible();
    await launchApp.hover();

    const contrast = await launchApp.evaluate((link) => {
      const text = link.querySelector<HTMLElement>('.text-white');
      const background = link.querySelector<HTMLElement>('.bg-primary-dark');
      if (!text || !background) return 0;

      const parseRgb = (value: string) =>
        value.match(/\d+(?:\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
      const foreground = parseRgb(getComputedStyle(text).color);
      const baseBackground = parseRgb(getComputedStyle(background).backgroundColor);
      const opacity = Number(getComputedStyle(background).opacity);
      const worstCaseBackground = baseBackground.map(
        (channel) => channel * opacity + 255 * (1 - opacity),
      );
      const luminance = ([red, green, blue]: number[]) => {
        const [r, g, b] = [red, green, blue].map((channel) => {
          const normalized = channel / 255;
          return normalized <= 0.04045
            ? normalized / 12.92
            : ((normalized + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const lighter = Math.max(luminance(foreground), luminance(worstCaseBackground));
      const darker = Math.min(luminance(foreground), luminance(worstCaseBackground));
      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });
});
