import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';

// Main menu in the header. Specification: the reference version (sprint5, header component
// and en.json): Home → homepage, Categories → Hand Tools, Power Tools, Other, Special Tools,
// Rentals, and Contact.
test.describe('main menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('product-name').first()).toBeVisible();
  });

  // Known app bug BUG-020: Home leads to the contact page. Remove test.fail() once fixed.
  test.fail('"Home" leads to the homepage', knownBug('bugs/bug-020-home-link-opens-contact.md', 'Received string:', '#/contact"'), async ({ page }) => {
    // Start away from both the homepage and the contact page, so ending up on the contact page
    // proves where "Home" leads (not that the click did nothing).
    await page.getByTestId('nav-sign-in').click();
    await expect(page).toHaveURL(/#\/auth\/login$/);

    await page.getByTestId('nav-home').click();

    // The homepage is the product overview at "/#/".
    await expect(page).toHaveURL(/\/#\/$/);
  });

  // Known app bug BUG-021: the menu says "Contakt". Remove test.fail() once fixed.
  test.fail('the contact menu item says "Contact"', knownBug('bugs/bug-021-typos-contakt-serch.md', 'Received: "Contakt"'), async ({ page }) => {
    await expect(page.getByTestId('nav-contact')).toHaveText('Contact');
  });

  // Known app bug BUG-019: UNDEFINED and Chainsaws instead of Other and Special Tools. Remove test.fail() once fixed.
  test.fail('"Categories" lists the categories of the shop', knownBug('bugs/bug-019-categories-menu-wrong-items.md', '"UNDEFINED"', '"Chainsaws"'), async ({ page }) => {
    await page.getByRole('button', { name: 'Categories' }).click();

    // The dropdown list is the one with the "Hand Tools" item.
    const categories = page.getByRole('list').filter({ has: page.getByTestId('nav-hand-tools') });
    await expect(categories.getByRole('link')).toHaveText([
      'Hand Tools',
      'Power Tools',
      'Other',
      'Special Tools',
      'Rentals',
    ]);
  });

  // Known app bug BUG-019: the Chainsaws item opens the 404 page. Remove test.fail() once fixed.
  test.fail('every category in the menu opens its category page', knownBug('bugs/bug-019-categories-menu-wrong-items.md', '404 page opened by "Chainsaws"'), async ({ page }) => {
    const categoryLinks = ['nav-hand-tools', 'nav-power-tools', 'nav-special-tools'];
    for (const testId of categoryLinks) {
      await page.getByRole('button', { name: 'Categories' }).click();
      const link = page.getByTestId(testId);
      const name = (await link.textContent())?.trim();
      const target = (await link.getAttribute('href')) ?? '';

      await link.click();

      // Wait for the navigation first, otherwise the checks below could see the previous page.
      await expect(page).toHaveURL((url) => url.href.endsWith(target));
      // Never the 404 page; a category page has the heading "Category: <name>".
      await expect(page.getByRole('heading', { name: '404 Error' }), `404 page opened by "${name}"`).toHaveCount(0);
      await expect(page.getByRole('heading', { level: 2 }), `page opened by "${name}"`).toHaveText(
        `Category: ${name}`,
      );
    }
  });
});
