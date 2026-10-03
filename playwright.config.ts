import { defineConfig, devices, type Project } from '@playwright/test';

// Load .env if present (Node's built-in loader, no dotenv dependency). See .env.example.
try {
  process.loadEnvFile();
} catch (error) {
  // No .env file is fine (CI, public tests only); any other problem must be visible.
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}

// Database tests need the local Toolshop from local-toolshop/start.ps1, so they run
// only when LOCAL_TOOLSHOP is set (locally via .env, in CI by the workflow).
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
  // list: result of every test in the console; html: report (npm run report, never auto-opened);
  // known-bug-guard: a test.fail() test must fail because of its known bug, not anything else.
  // CI adds 'github' annotations in the run summary.
  reporter: [
    ...(process.env.CI ? [['github'] as const] : []),
    ['list'],
    ['html', { open: 'never' }],
    ['./reporters/known-bug-guard.ts'],
  ],
  use: {
    // BASE_URL / API_URL point the UI tests to the local Toolshop (CI does this to avoid
    // the bot protection of the public demo). Default: the public app.
    baseURL: process.env.BASE_URL ?? 'https://with-bugs.practicesoftwaretesting.com',
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
