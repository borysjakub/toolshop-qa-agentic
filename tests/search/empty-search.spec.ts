// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  test.describe('Empty search restores the full listing', () => {
    test('on the homepage', async ({ page }) => {
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

    // Expected behaviour is an open question for the QA lead (Jira TQA-12):
    // the app keeps the previous results, the plan assumed the full listing comes back.
    // Fails until answered; not marked test.fail() because it is not a confirmed bug.
    test('after a previous search', {
      annotation: { type: 'question', description: 'Jira TQA-12: expected behaviour not decided yet' },
    }, async ({ page }) => {
      await openHomepage(page);
      const pagination = page.getByRole('navigation', { name: 'Pagination' });

      // 2. Search 'Saw' and then, with empty input, click search-submit again.
      await searchFor(page, 'Saw');

      await page.getByTestId('search-query').fill('');
      await page.getByTestId('search-submit').click();

      await expect(page.getByTestId('search-caption')).toHaveCount(0);
      await expect(page.getByTestId('search-result-count')).toHaveCount(0);
      await expect(page.getByTestId('product-name')).toHaveCount(9);
      await expect(pagination).toBeVisible();
    });
  });
});
