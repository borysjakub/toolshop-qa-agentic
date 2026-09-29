// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  test('Search with no results', async ({ page }) => {
    await openHomepage(page);

    // 1. Search 'zzzxqy'.
    await searchFor(page, 'zzzxqy');

    await expect(page.getByTestId('search-result-count')).toHaveText("0 products found for 'zzzxqy'");
    await expect(page.getByTestId('product-name')).toHaveCount(0);
    await expect(
      page.getByRole('navigation', { name: 'Pagination' }).getByRole('listitem'),
    ).toHaveCount(0);
    // Search controls stay usable
    await expect(page.getByTestId('search-query')).toBeEditable();
    await expect(page.getByTestId('search-submit')).toBeEnabled();

    // 2. Search 'Hammer' right after the no-results search.
    await searchFor(page, 'Hammer');

    // A non-zero count ([1-9] rules out '0 products'; \b stops '10' matching as '0').
    await expect(page.getByTestId('search-result-count')).toHaveText(
      /\b[1-9]\d* products? found for 'Hammer'/,
    );
    await expect(page.getByTestId('product-name').first()).toBeVisible();
  });
});
