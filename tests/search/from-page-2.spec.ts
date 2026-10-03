// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import { PLIERS, openHomepage, productNames, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  // Known app bug BUG-007: searching from page 2 shows the count but no products. Remove test.fail() once fixed.
  test.fail('Search from a paginated listing', knownBug('bugs/bug-007-search-from-page-2-shows-no-products.md', 'products found for \'Pliers\'', '+ Array []'), async ({ page }) => {
    await openHomepage(page);
    const pagination = page.getByRole('navigation', { name: 'Pagination' });

    // 1. On the homepage go to page 2 in pagination, then search 'Hammer'.
    // The page links have no href, so they are not exposed with the link role; click the page number.
    await pagination.getByText('2', { exact: true }).click();
    await expect(pagination.getByText("You're on page 2")).toBeVisible();
    await expect(page.getByTestId('product-name')).toHaveCount(9);

    // 'Pliers' instead of 'Hammer' on purpose: 'Hammer' is affected by BUG-006
    // (Sledgehammer missing), and this test should stay independent of it.
    await searchFor(page, 'Pliers');

    // Results come from the full catalogue, not only from page 2.
    await expect(page.getByTestId('search-result-count')).toHaveText("4 products found for 'Pliers'");
    await expect.poll(() => productNames(page), { message: "products found for 'Pliers'" }).toEqual(PLIERS);

    // Fewer than 10 results: pagination hidden.
    await expect(pagination.getByRole('listitem')).toHaveCount(0);
  });
});
