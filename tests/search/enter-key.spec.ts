// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, productNames, waitForSearchResponse } from '../helpers/search';

test.describe('Product search', () => {
  test('Submit search with the Enter key', async ({ page }) => {
    await openHomepage(page);

    // 1. Type 'Saw' in search-query and press Enter (without clicking the button).
    const response = waitForSearchResponse(page, (q) => q === 'Saw');
    await page.getByTestId('search-query').fill('Saw');
    await page.getByTestId('search-query').press('Enter');

    expect((await response).ok(), "search API response for 'Saw'").toBe(true);
    await expect(page.getByTestId('search-caption')).toHaveText('Searched for: Saw');
    await expect(page.getByTestId('search-result-count')).toHaveText("2 products found for 'Saw'");
    await expect
      .poll(() => productNames(page), { message: "products found for 'Saw'" })
      .toEqual(['Circular Saw', 'Wood Saw']);
  });
});
