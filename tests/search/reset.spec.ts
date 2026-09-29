// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  test('Reset button clears search and restores listing', async ({ page }) => {
    await openHomepage(page);

    const searchInput = page.getByTestId('search-query');
    const pagination = page.getByRole('navigation', { name: 'Pagination' });

    const expectRestoredListing = async () => {
      await expect(searchInput).toHaveValue('');
      await expect(page.getByTestId('search-caption')).toHaveCount(0);
      await expect(page.getByTestId('search-result-count')).toHaveCount(0);
      await expect(page.getByTestId('product-name')).toHaveCount(9);
      // Pagination shows pages 1-3
      await expect(pagination).toContainText("You're on page 1");
      await expect(pagination).toContainText('page 2');
      await expect(pagination).toContainText('page 3');
    };

    // 1. Search 'zzzxqy' (0 results), then click search-reset (X).
    await searchFor(page, 'zzzxqy');
    await expect(page.getByTestId('search-result-count')).toHaveText("0 products found for 'zzzxqy'");

    await page.getByTestId('search-reset').click();
    await expectRestoredListing();

    // 2. Search 'Hammer', then click search-reset.
    await searchInput.fill('Hammer');
    await expect(searchInput).toHaveValue('Hammer');
    await searchFor(page, 'Hammer');

    await page.getByTestId('search-reset').click();
    await expectRestoredListing();
  });
});
