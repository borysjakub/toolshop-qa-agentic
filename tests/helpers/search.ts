import { expect, type Page } from '@playwright/test';

// Same starting state as tests/seed/seed.spec.ts: homepage with products rendered.
export async function openHomepage(page: Page) {
  await page.goto('/');
  await expect(page.getByTestId('product-name').first()).toBeVisible();
}

// Submits a search and waits for the API response for exactly this term.
// Waiting for the caption alone is not enough: it updates before the product list,
// and a repeated search with the same results would look identical to a stale list.
export async function searchFor(page: Page, term: string) {
  const response = page.waitForResponse((res) => {
    const url = new URL(res.url());
    return url.pathname.endsWith('/products/search') && url.searchParams.get('q') === term;
  });

  await page.getByTestId('search-query').fill(term);
  await page.getByTestId('search-submit').click();

  expect((await response).ok(), `search API response for '${term}'`).toBe(true);
  await expect(page.getByTestId('search-caption')).toHaveText(`Searched for: ${term}`);
}

// Product names on the page, trimmed and sorted, for order-independent comparison.
export async function productNames(page: Page): Promise<string[]> {
  const names = await page.getByTestId('product-name').allTextContents();
  return names.map((name) => name.trim()).sort();
}
