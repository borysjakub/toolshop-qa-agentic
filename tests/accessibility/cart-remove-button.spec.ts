import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import { addToCart, openCart, productsInStock, removeButton, type CartProduct } from '../helpers/cart';

// The remove button of a cart row (red button with a cross).
// WCAG 2.2: 4.1.2 Name, Role, Value (a control needs a name and a role) and
// 2.1.1 Keyboard (every function works from the keyboard).
// The reference version has the same markup (<a> without href and text): the requirement
// comes from WCAG, not from the reference version.
test.describe('cart remove button', () => {
  let product: CartProduct;

  test.beforeEach(async ({ page, request }) => {
    [product] = await productsInStock(request, 1);
    await addToCart(page, product, 1, 1);
    await openCart(page);
    // The button exists, so a failure below is about its accessibility, not a missing element.
    await expect(removeButton(page, product)).toHaveCount(1);
  });

  // Known app bug BUG-024: <a> without href, text or name. Remove test.fail() once fixed.
  test.fail('has an accessible name that says what it does', knownBug('bugs/bug-024-cart-remove-button-not-accessible.md', 'Expected pattern: /remove/i', 'Received string:  ""'), async ({ page }) => {
    await expect(removeButton(page, product)).toHaveAccessibleName(/remove/i);
  });

  // Known app bug BUG-024: an <a> without href has no role. Remove test.fail() once fixed.
  test.fail('is a button for assistive technology', knownBug('bugs/bug-024-cart-remove-button-not-accessible.md', 'Expected: "button"', 'Received: ""'), async ({ page }) => {
    await expect(removeButton(page, product)).toHaveRole('button');
  });

  // Known app bug BUG-024: an <a> without href is not focusable. Remove test.fail() once fixed.
  test.fail('can be reached with the Tab key', knownBug('bugs/bug-024-cart-remove-button-not-accessible.md', 'Received: inactive'), async ({ page }) => {
    // The quantity field is the last focusable control before the remove button in the row.
    await page.getByTestId('product-quantity').focus();
    await page.keyboard.press('Tab');

    await expect(removeButton(page, product)).toBeFocused();
  });
});
