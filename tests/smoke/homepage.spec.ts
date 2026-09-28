import { test, expect } from '@playwright/test';

test('homepage loads and shows at least one product', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/Toolshop/);

  // .first() + toBeVisible() fails when no product is rendered, so this checks "at least one".
  const productNames = page.getByTestId('product-name');
  await expect(productNames.first()).toBeVisible();
});
