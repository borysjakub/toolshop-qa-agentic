import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';

// Known app bug BUG-001: test.fail() makes Playwright expect this test to fail.
// When the bug gets fixed, the test starts passing, Playwright reports that as an error, and test.fail() should be removed.
test.fail('every product image on the homepage has an alt attribute', knownBug('bugs/bug-001-product-images-missing-alt.md', 'assets/img/products/'), async ({ page }) => {
  const productList = page.waitForResponse((res) => new URL(res.url()).pathname.endsWith('/products'));
  await page.goto('/');
  const response = await productList;
  expect(response.ok(), 'product list API response').toBe(true);
  const products: unknown[] = (await response.json()).data;
  expect(products.length, 'products returned by the API').toBeGreaterThan(0);

  // Product cards are the links that contain a product name.
  const productCards = page.getByRole('link').filter({ has: page.getByTestId('product-name') });
  // Not getByRole('img'): an image with alt="" has no "img" role, but we need every image regardless of its alt.
  const productImages = productCards.locator('img');

  // Wait until every product from the API response is rendered. Checking a half-rendered list
  // could pass, and test.fail() would then falsely report the bug as fixed.
  await expect(productImages).toHaveCount(products.length);

  const imagesWithoutAlt = await productImages.evaluateAll((images) =>
    images.filter((image) => !image.hasAttribute('alt')).map((image) => image.getAttribute('src')),
  );
  expect(imagesWithoutAlt).toEqual([]);
});
