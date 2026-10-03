import { defineConfig, devices, type Project } from '@playwright/test';

// Load .env if present (Node's built-in loader, no dotenv dependency). See .env.example.
try {
  process.loadEnvFile();
} catch (error) {
  // No .env file is fine (CI, public tests only); any other problem must be visible.
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

// Database tests need the local Toolshop from local-toolshop/start.ps1, so they run
// only when LOCAL_TOOLSHOP is set (never in CI, which tests the public app).
const localDbProject: Project = {
  name: 'local-db',
  testMatch: 'db/**/*.spec.ts',
  // Tests change shared data (stock levels), so they run one after another,
  // also across files and --repeat-each copies.
  fullyParallel: false,
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.LOCAL_TOOLSHOP_UI_URL ?? 'http://localhost:4200',
  },
};

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  // Fail the CI build if test.only is left in the source code.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  // CI: 'github' annotates failures in the run summary, html is uploaded as an artifact.
  // Locally: html report, opened only on demand (npm run report).
  reporter: process.env.CI
    ? [['github'], ['list'], ['html', { open: 'never' }]]
    : [['html', { open: 'never' }]],
  use: {
    baseURL: 'https://with-bugs.practicesoftwaretesting.com',
    // The app marks elements with `data-test`, so point getByTestId() at it.
    testIdAttribute: 'data-test',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: 'db/**',
      use: { ...devices['Desktop Chrome'] },
    },
    ...(process.env.LOCAL_TOOLSHOP ? [localDbProject] : []),
  ],
});
