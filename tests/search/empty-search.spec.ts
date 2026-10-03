// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  test.describe('Empty search', () => {
    test('on the homepage keeps the full listing', async ({ page }) => {
      await openHomepage(page);
      const pagination = page.getByRole('navigation', { name: 'Pagination' });

      // 1. With empty input click search-submit.
      await page.getByTestId('search-query').fill('');
      await page.getByTestId('search-submit').click();

      // The state before and after the click is the same, so this only checks
      // that an empty submit does not break the listing; it cannot catch a late change.
      await expect(page.getByTestId('search-caption')).toHaveCount(0);
      await expect(page.getByTestId('product-name')).toHaveCount(9);
      await expect(pagination).toBeVisible();
    });

    // Decided by the QA lead in Jira TQA-12 (answer A): an empty submit is ignored and the
    // previous results stay; the reset button (X) is the way back to the full listing.
    test('after a previous search keeps the previous results', {
      annotation: { type: 'decision', description: 'Jira TQA-12: empty submit is ignored' },
    }, async ({ page }) => {
      await openHomepage(page);

      // 2. Search 'Saw' and then, with empty input, click search-submit again.
      await searchFor(page, 'Saw');

      await page.getByTestId('search-query').fill('');
      await page.getByTestId('search-submit').click();

      // Same state as before the click, so this cannot catch a late change; it documents the decision.
      await expect(page.getByTestId('search-caption')).toHaveText('Searched for: Saw');
      await expect(page.getByTestId('search-result-count')).toHaveText("2 products found for 'Saw'");
      await expect(page.getByTestId('product-name')).toHaveCount(2);
    });
  });
});
