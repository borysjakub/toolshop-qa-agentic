// spec: specs/search.md
// seed: tests/seed/seed.spec.ts

import { test, expect } from '@playwright/test';
import { openHomepage, searchFor } from '../helpers/search';

test.describe('Product search', () => {
  test('Search heading and count reflect the query', async ({ page }) => {
    await openHomepage(page);

    // 1. Search 'Hammer', then 'Saw', then 'zzzxqy' in sequence.
    for (const term of ['Hammer', 'Saw', 'zzzxqy']) {
      await searchFor(page, term);

      // Caption term equals the latest query (no lingering previous query).
      await expect(page.getByTestId('search-caption')).toHaveText(`Searched for: ${term}`);
      await expect(page.getByTestId('search-term')).toHaveText(term);

      // Count text matches the number of cards, singular only for exactly 1 result.
      // Polled together because the list updates after the caption.
      await expect
        .poll(
          async () => {
            const cards = await page.getByTestId('product-name').count();
            const text = ((await page.getByTestId('search-result-count').textContent()) ?? '').trim();
            return text === `${cards} ${cards === 1 ? 'product' : 'products'} found for '${term}'`;
          },
          { message: `count line consistent with cards for '${term}'` },
        )
        .toBe(true);
    }
  });
});
