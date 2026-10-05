import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';

// The logo link in the header ("Practice Software Testing - Toolshop", leads home).
// The reference version draws the logo as an inline SVG; any image in the link must load
// and have an alt text (WCAG 2.2, 1.1.1 Non-text Content).
test.describe('header logo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('product-name').first()).toBeVisible();
  });

  test('the logo link has an accessible name', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Practice Software Testing - Toolshop' })).toBeVisible();
  });

  // Known app bug BUG-022: the logo is broken.png without alt. Remove test.fail() once fixed.
  test.fail('every image in the logo link is loaded and has an alt text', knownBug('bugs/bug-022-logo-broken-image.md', '"broken.png"'), async ({ page }) => {
    const logoImages = page.getByRole('link', { name: 'Practice Software Testing - Toolshop' }).locator('img');

    // Polled: an image may still be loading right after the page renders.
    await expect
      .poll(
        () =>
          logoImages.evaluateAll((images) =>
            (images as HTMLImageElement[])
              .filter((image) => !image.complete || image.naturalWidth === 0 || !image.hasAttribute('alt'))
              .map((image) => image.getAttribute('src')),
          ),
        { message: 'logo images that are broken or have no alt' },
      )
      .toEqual([]);
  });
});
