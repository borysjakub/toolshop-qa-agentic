// Jira TQA-5: Otestovat nákupní košík (tasks/tqa-5-cart.md)
// Spec for unclear points: the bug-free reference version (sprint5) and its texts.

import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import { addToCart, cartRow, money, openCart, productsInStock, removeButton, type CartProduct } from '../helpers/cart';

test.describe('shopping cart', () => {
  // Two different products in stock, picked fresh for every test (shared public demo).
  let first: CartProduct;
  let second: CartProduct;

  test.beforeEach(async ({ request }) => {
    [first, second] = await productsInStock(request);
  });

  // AC1
  test('TC-01 adding a product updates the cart counter in the header', async ({ page }) => {
    await addToCart(page, first, 1, 1);
  });

  // AC1, quantity chosen on the detail page
  test('TC-02 the counter shows the added quantity, not the number of products', async ({ page }) => {
    await addToCart(page, first, 3, 3);
  });

  // AC2. Known app bug BUG-014: the line total is always $00.00. Remove test.fail() once fixed.
  test.fail('TC-03 a cart line shows name, unit price, quantity and line total', knownBug('bugs/bug-014-cart-line-total-zero.md', 'Received: "$00.00"'), async ({ page }) => {
    await addToCart(page, first, 2, 2);
    await openCart(page);

    const row = cartRow(page, first);
    await expect(row.getByTestId('product-title')).toHaveText(first.name);
    await expect(row.getByTestId('product-price')).toHaveText(money(first.price));
    await expect(row.getByTestId('product-quantity')).toHaveValue('2');
    await expect(row.getByTestId('line-price')).toHaveText(money(2 * first.price));
  });

  // AC2
  test('TC-04 the cart total is the sum of all lines', async ({ page }) => {
    await addToCart(page, first, 2, 2);
    await addToCart(page, second, 1, 3);
    await openCart(page);

    await expect(page.getByTestId('product-title')).toHaveCount(2);
    await expect(page.getByTestId('cart-total')).toHaveText(
      money(2 * first.price + second.price),
    );
  });

  // AC3 (the line total itself is covered by TC-03)
  test('TC-05 changing the quantity recalculates the total and the counter', async ({ page }) => {
    await addToCart(page, first, 1, 1);
    await openCart(page);

    const quantity = cartRow(page, first).getByTestId('product-quantity');
    await quantity.fill('5');
    await quantity.press('Tab');

    await expect(page.getByTestId('cart-total')).toHaveText(money(5 * first.price));
    await expect(page.getByTestId('cart-quantity')).toHaveText('5');
  });

  // AC4. Known app bug BUG-015: the remove button does nothing. Remove test.fail() once fixed.
  test.fail('TC-06 removing the only product empties the cart', knownBug('bugs/bug-015-cart-remove-does-nothing.md', 'Locator: getByTestId(\'product-title\')', 'Expected: 0', 'Received: 1'), async ({ page }) => {
    await addToCart(page, first, 1, 1);
    await openCart(page);

    await removeButton(page, first).click();

    await expect(page.getByTestId('product-title')).toHaveCount(0);
    await expect(page.getByText('The cart is empty. Nothing to display.')).toBeVisible();
    await expect(page.getByTestId('cart-quantity')).toHaveCount(0);
  });

  // AC4, the other product stays. Known app bug BUG-015. Remove test.fail() once fixed.
  test.fail('TC-07 removing one of two products keeps the other one', knownBug('bugs/bug-015-cart-remove-does-nothing.md', 'Locator: getByTestId(\'product-title\')', 'Expected - 0', 'Received + 1'), async ({ page }) => {
    await addToCart(page, first, 1, 1);
    await addToCart(page, second, 1, 2);
    await openCart(page);

    await removeButton(page, first).click();

    await expect(page.getByTestId('product-title')).toHaveText([second.name]);
    await expect(page.getByTestId('cart-total')).toHaveText(money(second.price));
    await expect(page.getByTestId('cart-quantity')).toHaveText('1');
  });

  // AC5 (assumption: within the same browser tab, like the reference version)
  test('TC-08 the cart survives a page reload', async ({ page }) => {
    await addToCart(page, first, 2, 2);
    await openCart(page);
    await page.reload();

    await expect(cartRow(page, first).getByTestId('product-quantity')).toHaveValue('2');
    await expect(page.getByTestId('cart-quantity')).toHaveText('2');
  });

  // AC5
  test('TC-09 the cart survives browsing other pages', async ({ page }) => {
    await addToCart(page, first, 2, 2);
    // Via the logo: the "Home" menu link leads to the contact page (BUG-020).
    await page.getByRole('link', { name: 'Practice Software Testing - Toolshop' }).click();
    await expect(page.getByTestId('product-name').first()).toBeVisible();
    await openCart(page);

    await expect(cartRow(page, first).getByTestId('product-quantity')).toHaveValue('2');
  });
});
