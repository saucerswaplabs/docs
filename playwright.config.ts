import { defineConfig, devices } from '@playwright/test';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3333';
const hasExternalBaseURL = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const artifactRoot =
  process.env.PLAYWRIGHT_ARTIFACT_DIR || join(tmpdir(), 'saucerswap-docs-ui-qc');
const devServerCommand =
  process.env.PLAYWRIGHT_DEV_SERVER_COMMAND ||
  'PATH=/opt/homebrew/opt/node@24/bin:$PATH npm run dev';

export default defineConfig({
  testDir: './tests',
  outputDir: join(artifactRoot, 'test-results'),
  reporter: [
    ['list'],
    ['html', { outputFolder: join(artifactRoot, 'report'), open: 'never' }],
  ],
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium-desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 1000 },
      },
    },
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: hasExternalBaseURL
    ? undefined
    : {
        command: devServerCommand,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180 * 1000,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
