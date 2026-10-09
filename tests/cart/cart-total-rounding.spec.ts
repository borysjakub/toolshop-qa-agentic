import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import {
  addToCart,
  allProductsInStock,
  money,
  openCart,
  totalCents,
  totalShowsTruncation,
  type CartLine,
} from '../helpers/cart';

// Specification: the reference version shows the cart total with Angular's number pipe '1.2-2',
// which rounds to cents. Some sums are not exact in floating point (2 × 12.01 + 48.41 =
// 72.42999…), so a total that is cut off instead of rounded is one cent short.
// The test picks products in stock where that happens, so it does not depend on fixed products.
// Known app bug BUG-027: the total is cut off ($62.55 instead of $62.56). Remove test.fail() once fixed.
test.fail('the cart total is rounded to cents, not cut off', knownBug('bugs/bug-027-cart-total-cut-off.md', 'cart total rounded to cents', 'Received: "$'), async ({ page, request }) => {
  const products = await allProductsInStock(request);
  const combinations: CartLine[][] = products.flatMap((a) =>
    products
      .filter((b) => b.id !== a.id)
      .flatMap((b) => [1, 2, 3].map((quantity) => [{ product: a, quantity }, { product: b, quantity: 1 }])),
  );
  const lines = combinations.find(totalShowsTruncation);
  expect(lines, 'products in stock whose sum is not exact in floating point').toBeDefined();

  let count = 0;
  for (const line of lines!) {
    count += line.quantity;
    await addToCart(page, line.product, line.quantity, count);
  }
  await openCart(page);

  await expect(page.getByTestId('cart-total'), 'cart total rounded to cents').toHaveText(
    money(totalCents(lines!) / 100),
  );
});
