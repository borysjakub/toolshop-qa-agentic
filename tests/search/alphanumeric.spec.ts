// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, productNames, searchFor } from '../helpers/search';

const DRILLS = [
  'Cordless Drill 12V',
  'Cordless Drill 18V',
  'Cordless Drill 20V',
  'Cordless Drill 24V',
].sort();

test.describe('Product search', () => {
  test('Search by alphanumeric term', async ({ page }) => {
    await openHomepage(page);

    // 1. Search '12V'.
    await searchFor(page, '12V');

    // Singular 'product' for exactly one result
    await expect(page.getByTestId('search-result-count')).toHaveText("1 product found for '12V'");
    await expect.poll(() => productNames(page), { message: "products found for '12V'" }).toEqual([
      'Cordless Drill 12V',
    ]);

    // 2. Search 'Drill'.
    await searchFor(page, 'Drill');

    await expect(page.getByTestId('search-result-count')).toHaveText("4 products found for 'Drill'");
    await expect.poll(() => productNames(page), { message: "products found for 'Drill'" }).toEqual(DRILLS);
  });
});
