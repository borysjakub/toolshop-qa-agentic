import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';

// Specification: the reference version labels the button with pages.overview.search = "Search".
// Known app bug BUG-021: the button says "Serch". Remove test.fail() once fixed.
test.fail('the search button says "Search"', knownBug('bugs/bug-021-typos-contakt-serch.md', 'Received: " Serch"'), async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('search-submit')).toHaveText('Search');
});
