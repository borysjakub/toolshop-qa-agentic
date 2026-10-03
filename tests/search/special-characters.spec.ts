// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import { openHomepage, searchFor } from '../helpers/search';

// All terms below pass the form validation (3-40 characters), so each one sends a request
// and searchFor() can wait for its response instead of reading a possibly stale page.
async function submit(page: Page, term: string) {
  await searchFor(page, term);
}

async function expectZeroResults(page: Page, term: string) {
  await expect(page.getByTestId('search-result-count')).toHaveText(`0 products found for '${term}'`);
  await expect(page.getByTestId('product-name')).toHaveCount(0);
}

// Split into separate tests so one failing character does not hide the others.
test.describe('Product search', () => {
  test.describe('Special characters are handled safely', () => {
    test('script tag is shown as text, not executed', async ({ page }) => {
      const dialogs: string[] = [];
      page.on('dialog', async (dialog) => {
        dialogs.push(dialog.message());
        await dialog.dismiss();
      });

      await openHomepage(page);

      // 1. Search the string <script>alert(1)</script> % _ ' "
      const nasty = `<script>alert(1)</script> % _ ' "`;
      await submit(page, nasty);

      // Escaped and shown literally, 0 results, app still usable.
      await expectZeroResults(page, nasty);
      await expect(page.getByTestId('search-query')).toBeEditable();
      await expect(page.getByTestId('search-submit')).toBeEnabled();

      // No JavaScript dialog appeared.
      expect(dialogs).toEqual([]);
    });

    // The search form accepts 3-40 characters, so a single '%' or '_' never reaches the API.
    // Three of them are a valid term that still consists only of wildcard characters.
    // Known app bug BUG-010: '%' and '_' act as SQL wildcards. Remove test.fail() once fixed.
    test.fail("'%%%' is treated literally, not as a wildcard", knownBug('bugs/bug-010-search-sql-wildcards-not-escaped.md', 'Expected: "0 products found for \'%%%\'"', ' products found for \'%%%\' "'), async ({ page }) => {
      await openHomepage(page);

      // 2a. Search '%%%': 0 products, not the whole catalogue; heading/count reflect the query.
      await submit(page, '%%%');
      await expectZeroResults(page, '%%%');
    });

    // Known app bug BUG-010: '%' and '_' act as SQL wildcards. Remove test.fail() once fixed.
    test.fail("'___' is treated literally, not as a wildcard", knownBug('bugs/bug-010-search-sql-wildcards-not-escaped.md', 'Expected: "0 products found for \'___\'"', ' products found for \'___\' "'), async ({ page }) => {
      await openHomepage(page);

      // 2b. Search '___': 0 products, not the whole catalogue; heading/count reflect the query.
      await submit(page, '___');
      await expectZeroResults(page, '___');
    });

    test('long and unicode terms do not break the search', async ({ page }) => {
      await openHomepage(page);

      // 3. Search the longest accepted term (40 characters) and a term with unicode, e.g. 'młotek'.
      const long = 'a'.repeat(40);
      await submit(page, long);
      await expectZeroResults(page, long);

      await submit(page, 'młotek');
      await expectZeroResults(page, 'młotek');
    });
  });
});
