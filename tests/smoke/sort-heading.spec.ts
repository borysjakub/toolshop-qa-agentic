import { test, expect } from '@playwright/test';

// Known app bug BUG-002: the heading says "Sorth". Remove test.fail() once the bug is fixed.
test.fail('sort heading on the homepage says "Sort"', {
  annotation: { type: 'issue', description: 'bugs/bug-002-sort-heading-typo.md' },
}, async ({ page }) => {
  await page.goto('/');

  // Regex matches both the correct and the misspelled heading, so the assertion shows the actual text.
  const sortHeading = page.getByRole('heading', { name: /sort/i });
  await expect(sortHeading).toHaveText('Sort');
});
