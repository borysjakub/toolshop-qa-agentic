import { test, expect } from '@playwright/test';
import { openHomepage } from '../helpers/search';

// WCAG 3.3.1 Error Identification: when the app detects an input error itself,
// the field is identified and the error is described to the user in text.
// The search form accepts 3-40 characters and silently ignores anything else.
test.describe('search input validation', () => {
  for (const { name, term } of [
    { name: 'too short (2 characters)', term: 'ab' },
    { name: 'too long (41 characters)', term: 'a'.repeat(41) },
  ]) {
    // Known app bug BUG-011: a rejected term gets no message. Remove test.fail() once fixed.
    test.fail(`rejected term is announced: ${name}`, {
      annotation: { type: 'issue', description: 'bugs/bug-011-search-validation-not-announced.md' },
    }, async ({ page }) => {
      await openHomepage(page);
      const input = page.getByTestId('search-query');

      await input.fill(term);
      await page.getByTestId('search-submit').click();

      await expect(input).toHaveAttribute('aria-invalid', 'true');
      // The error text is tied to the field, so screen readers read it with the input.
      await expect(input).toHaveAccessibleDescription(/\S/);
    });
  }
});
