import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import { addToCart, openCart, productsInStock } from '../helpers/cart';

// Specification: the reference version (cart component, en.json) has the columns
// Item, Quantity, Price, Total and an unnamed last column for the remove button.
// Known app bug BUG-023: an extra empty column and "Total" twice. Remove test.fail() once fixed.
test.fail('cart table has one column header per column', knownBug('bugs/bug-023-cart-table-header-columns.md', '+   "Total"'), async ({ page, request }) => {
  const [product] = await productsInStock(request, 1);
  await addToCart(page, product, 1, 1);
  await openCart(page);

  await expect(page.getByRole('columnheader')).toHaveText(['Item', 'Quantity', 'Price', 'Total', '']);
});
