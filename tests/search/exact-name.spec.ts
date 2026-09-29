// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  test('Search by exact product name', async ({ page }) => {
    await openHomepage(page);

    // 1. Type 'Sledgehammer' into search-query and click search-submit.
    await searchFor(page, 'Sledgehammer');

    await expect(page.getByTestId('search-result-count')).toHaveText("1 product found for 'Sledgehammer'");
    await expect(page.getByTestId('product-name')).toHaveCount(1);
    await expect(page.getByTestId('product-name')).toHaveText('Sledgehammer');
    // The pagination element stays in the DOM but has no page items
    await expect(
      page.getByRole('navigation', { name: 'Pagination' }).getByRole('listitem'),
    ).toHaveCount(0);
  });
});
