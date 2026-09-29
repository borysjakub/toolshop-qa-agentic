import { test, expect } from '@playwright/test';

// Seed for Playwright Test Agents (planner, generator): they run this first
// and start exploring from the page state it leaves behind.
test.describe('Seed', () => {
  test('seed', async ({ page }) => {
    await page.goto('/');

    // Wait until products are rendered so agents start on a fully loaded page.
    await expect(page.getByTestId('product-name').first()).toBeVisible();
  });
});
