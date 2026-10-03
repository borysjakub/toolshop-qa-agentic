// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, productNames, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  // Known app bug BUG-008: the input is cleared after submit. Remove test.fail() once fixed.
  test.fail('Search input behaviour after submit', {
    annotation: { type: 'issue', description: 'bugs/bug-008-search-input-cleared-after-submit.md' },
  }, async ({ page }) => {
    await openHomepage(page);

    // 1. Search 'Drill' and check the input value afterwards.
    await searchFor(page, 'Drill');

    // Wait for the results to be fully rendered before reading the input.
    await expect(page.getByTestId('search-result-count')).toHaveText("4 products found for 'Drill'");
    await expect.poll(() => productNames(page)).toHaveLength(4);

    // Input keeps the submitted term so the user can refine it.
    // Checked only after the results rendered; a clear that happens even later would be missed.
    await expect(page.getByTestId('search-query')).toHaveValue('Drill');
  });
});
