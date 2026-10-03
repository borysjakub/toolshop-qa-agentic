// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import { openHomepage, productNames, searchFor } from '../helpers/search';

// Every product whose name contains 'hammer' (same set the API returns for 'ham').
const HAMMERS = [
  'Claw Hammer',
  'Claw Hammer with Fiberglass Handle',
  'Claw Hammer with Shock Reduction Grip',
  'Court Hammer',
  'Hammer',
  'Sledgehammer',
  'Thor Hammer',
].sort();

test.describe('Product search', () => {
  // Known app bug BUG-006: 'hammer' does not find Sledgehammer. Remove test.fail() once fixed.
  test.fail('Search is case-insensitive', knownBug('bugs/bug-006-search-hammer-misses-sledgehammer.md', 'products found for \'Hammer\'', '- "Sledgehammer"', '+ Received + 0'), async ({ page }) => {
    await openHomepage(page);

    // 1. Search 'Hammer', then 'hammer', then 'HAMMER'.
    for (const term of ['Hammer', 'hammer', 'HAMMER']) {
      await searchFor(page, term);

      // Each spelling returns the same full set, including Sledgehammer.
      await expect
        .poll(() => productNames(page), { message: `products found for '${term}'` })
        .toEqual(HAMMERS);
      await expect(page.getByTestId('search-result-count')).toHaveText(
        `${HAMMERS.length} products found for '${term}'`,
      );
    }
  });
});
