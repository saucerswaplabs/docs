import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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

      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        // Mintlify's local preview reports the dark content surface against a
        // white page background. Keep its generated contrast false positives
        // isolated while testing the repository-configured CTA below.
        .disableRules(['color-contrast'])
        .analyze();
      const serious = axe.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
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
