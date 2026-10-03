// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { PLIERS, openHomepage, productNames, waitForSearchResponse } from '../helpers/search';

test.describe('Product search', () => {
  // Known app bug BUG-009: three spaces pass validation and show '0 products found'. Remove test.fail() once fixed.
  test.fail('Whitespace handling', {
    annotation: { type: 'issue', description: 'bugs/bug-009-search-whitespace-only-term.md' },
  }, async ({ page }) => {
    await openHomepage(page);

    // 1. Type '   ' (3 spaces) and click search-submit.
    await page.getByTestId('search-query').fill('   ');
    await page.getByTestId('search-submit').click();

    // Treated like an empty search: full listing, no '0 products found'.
    // Starts from the homepage on purpose: what an empty search does after a previous
    // search is an open question (see specs/search.md). The app renders the caption and
    // count right on submit, before the API responds, so these checks do see a wrong state.
    await expect(page.getByTestId('search-result-count')).toHaveCount(0);
    await expect(page.getByTestId('search-caption')).toHaveCount(0);
    await expect(page.getByTestId('product-name')).toHaveCount(9);

    // 2. Type '  Pliers  ' (leading/trailing spaces) and click search-submit.
    // Heading/count showing the trimmed term is only "ideally", so it is not asserted.
    const response = waitForSearchResponse(page, (q) => q?.trim() === 'Pliers');
    await page.getByTestId('search-query').fill('  Pliers  ');
    await page.getByTestId('search-submit').click();
    expect((await response).ok()).toBe(true);

    // No ^ anchor: the element text has surrounding whitespace, and a RegExp is not trimmed.
    await expect(page.getByTestId('search-result-count')).toHaveText(/\b4 products found for /);
    await expect.poll(() => productNames(page), { message: "products found for '  Pliers  '" }).toEqual(PLIERS);
  });
});
