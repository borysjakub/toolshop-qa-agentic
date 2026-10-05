import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { API_URL } from './users';

export type CartProduct = { id: number; name: string; price: number };

// Products for the cart tests: the first purchasable ones that are in stock right now.
// Not fixed ids: the public demo is shared, other people buy products out of stock
// (Combination Pliers was at stock 0 on 5. 10. 2026) and an out-of-stock product
// cannot be added to the cart at all. Name and price come from the API too.
export async function productsInStock(request: APIRequestContext, count = 2): Promise<CartProduct[]> {
  const response = await request.get(`${API_URL}/products`, { params: { page: 1 } });
  expect(response.status(), 'product list for the cart tests').toBe(200);
  const products: (CartProduct & { stock: number; is_rental: boolean | number })[] = (await response.json()).data;

  // Stock of at least 10: the tests put up to 5 pieces of one product in the cart.
  const usable = products
    .filter((product) => product.stock >= 10 && !product.is_rental)
    .slice(0, count)
    .map(({ id, name, price }) => ({ id, name, price }));
  expect(usable, 'products in stock on the first page').toHaveLength(count);
  return usable;
}

// "$14.15" style, as the cart shows prices.
export function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

// Opens the product detail, sets the quantity and clicks "Add to cart".
// Waits until the header cart counter shows `expectedCartCount`, so the cart is updated
// before the test continues.
export async function addToCart(
  page: Page,
  product: CartProduct,
  quantity: number,
  expectedCartCount: number,
) {
  await page.goto(`/#/product/${product.id}`);
  await expect(page.getByTestId('product-name')).toHaveText(product.name);
  await page.getByTestId('quantity').fill(String(quantity));
  await page.getByTestId('add-to-cart').click();
  await expect(page.getByTestId('cart-quantity')).toHaveText(String(expectedCartCount));
}

// Opens the cart (header cart icon) and waits for the cart table.
export async function openCart(page: Page) {
  await page.getByTestId('nav-cart').click();
  await expect(page).toHaveURL(/#\/checkout/);
}

// The cart row of one product.
export function cartRow(page: Page, product: CartProduct) {
  // Exact name: "Pliers" must not match the "Combination Pliers" row.
  const name = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const title = page.getByTestId('product-title').filter({ hasText: new RegExp(`^\\s*${name}\\s*$`) });
  return page.getByRole('row').filter({ has: title });
}

// The remove button of a cart row. It is an <a> without href, accessible name or test id
// (same in the reference version), so it has no role to find it by; it is the only <a> in the row.
export function removeButton(page: Page, product: CartProduct) {
  return cartRow(page, product).locator('a');
}
