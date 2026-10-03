// Jira TQA-5: Otestovat nákupní košík (tasks/tqa-5-cart.md)
// Spec for unclear points: the bug-free reference version (sprint5) and its texts.

import { test, expect } from '@playwright/test';
import { PRODUCTS, addToCart, cartRow, money, openCart, removeButton } from '../helpers/cart';

const { combinationPliers, pliers } = PRODUCTS;

test.describe('shopping cart', () => {
  // AC1
  test('TC-01 adding a product updates the cart counter in the header', async ({ page }) => {
    await addToCart(page, combinationPliers, 1, 1);
  });

  // AC1, quantity chosen on the detail page
  test('TC-02 the counter shows the added quantity, not the number of products', async ({ page }) => {
    await addToCart(page, combinationPliers, 3, 3);
  });

  // AC2. Known app bug BUG-014: the line total is always $00.00. Remove test.fail() once fixed.
  test.fail('TC-03 a cart line shows name, unit price, quantity and line total', {
    annotation: { type: 'issue', description: 'bugs/bug-014-cart-line-total-zero.md' },
  }, async ({ page }) => {
    await addToCart(page, combinationPliers, 2, 2);
    await openCart(page);

    const row = cartRow(page, combinationPliers);
    await expect(row.getByTestId('product-title')).toHaveText(combinationPliers.name);
    await expect(row.getByTestId('product-price')).toHaveText(money(combinationPliers.price));
    await expect(row.getByTestId('product-quantity')).toHaveValue('2');
    await expect(row.getByTestId('line-price')).toHaveText(money(2 * combinationPliers.price));
  });

  // AC2
  test('TC-04 the cart total is the sum of all lines', async ({ page }) => {
    await addToCart(page, combinationPliers, 2, 2);
    await addToCart(page, pliers, 1, 3);
    await openCart(page);

    await expect(page.getByTestId('product-title')).toHaveCount(2);
    await expect(page.getByTestId('cart-total')).toHaveText(
      money(2 * combinationPliers.price + pliers.price),
    );
  });

  // AC3 (the line total itself is covered by TC-03)
  test('TC-05 changing the quantity recalculates the total and the counter', async ({ page }) => {
    await addToCart(page, combinationPliers, 1, 1);
    await openCart(page);

    const quantity = cartRow(page, combinationPliers).getByTestId('product-quantity');
    await quantity.fill('5');
    await quantity.press('Tab');

    await expect(page.getByTestId('cart-total')).toHaveText(money(5 * combinationPliers.price));
    await expect(page.getByTestId('cart-quantity')).toHaveText('5');
  });

  // AC4. Known app bug BUG-015: the remove button does nothing. Remove test.fail() once fixed.
  test.fail('TC-06 removing the only product empties the cart', {
    annotation: { type: 'issue', description: 'bugs/bug-015-cart-remove-does-nothing.md' },
  }, async ({ page }) => {
    await addToCart(page, combinationPliers, 1, 1);
    await openCart(page);

    await removeButton(page, combinationPliers).click();

    await expect(page.getByTestId('product-title')).toHaveCount(0);
    await expect(page.getByText('The cart is empty. Nothing to display.')).toBeVisible();
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);
  });

  // AC4, the other product stays. Known app bug BUG-015. Remove test.fail() once fixed.
  test.fail('TC-07 removing one of two products keeps the other one', {
    annotation: { type: 'issue', description: 'bugs/bug-015-cart-remove-does-nothing.md' },
  }, async ({ page }) => {
    await addToCart(page, combinationPliers, 1, 1);
    await addToCart(page, pliers, 1, 2);
    await openCart(page);

    await removeButton(page, combinationPliers).click();

    await expect(page.getByTestId('product-title')).toHaveText([pliers.name]);
    await expect(page.getByTestId('cart-total')).toHaveText(money(pliers.price));
    await expect(page.getByTestId('cart-quantity')).toHaveText('1');
  });

  // AC5 (assumption: within the same browser tab, like the reference version)
  test('TC-08 the cart survives a page reload', async ({ page }) => {
    await addToCart(page, combinationPliers, 2, 2);
    await openCart(page);
    await page.reload();

    await expect(cartRow(page, combinationPliers).getByTestId('product-quantity')).toHaveValue('2');
    await expect(page.getByTestId('cart-quantity')).toHaveText('2');
  });

  // AC5
  test('TC-09 the cart survives browsing other pages', async ({ page }) => {
    await addToCart(page, combinationPliers, 2, 2);
    // Via the logo: the "Home" menu link leads to the contact page (known issue, ROADMAP).
    await page.getByRole('link', { name: 'Practice Software Testing - Toolshop' }).click();
    await expect(page.getByTestId('product-name').first()).toBeVisible();
    await openCart(page);

    await expect(cartRow(page, combinationPliers).getByTestId('product-quantity')).toHaveValue('2');
  });
});
