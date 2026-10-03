// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { PLIERS, openHomepage, productNames, searchFor } from '../helpers/search';

const HAMS = [
  'Claw Hammer',
  'Claw Hammer with Fiberglass Handle',
  'Claw Hammer with Shock Reduction Grip',
  'Court Hammer',
  'Hammer',
  'Sledgehammer',
  'Thor Hammer',
].sort();

test.describe('Product search', () => {
  test('Search by partial name returns all matches', async ({ page }) => {
    await openHomepage(page);

    // 1. Type 'ham' and click search-submit.
    await searchFor(page, 'ham');

    await expect(page.getByTestId('search-result-count')).toHaveText("7 products found for 'ham'");
    await expect.poll(() => productNames(page), { message: "products found for 'ham'" }).toEqual(HAMS);
    await expect(page.getByTestId('product-name')).toHaveCount(7);

    // 2. Search for 'Pliers'.
    await searchFor(page, 'Pliers');

    await expect(page.getByTestId('search-result-count')).toHaveText("4 products found for 'Pliers'");
    await expect.poll(() => productNames(page), { message: "products found for 'Pliers'" }).toEqual(PLIERS);
  });
});
