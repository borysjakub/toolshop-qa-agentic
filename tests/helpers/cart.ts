import { expect, type Page } from '@playwright/test';

// Products used by the cart tests (public app, prices verified on the product detail page).
export const PRODUCTS = {
  combinationPliers: { id: 1, name: 'Combination Pliers', price: 14.15 },
  pliers: { id: 2, name: 'Pliers', price: 12.01 },
} as const;

export type CartProduct = (typeof PRODUCTS)[keyof typeof PRODUCTS];

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
  return page.getByRole('row').filter({ has: page.getByTestId('product-title').filter({ hasText: product.name }) });
}

// The remove button of a cart row. It is an <a> without href, accessible name or test id
// (same in the reference version), so it has no role to find it by; it is the only <a> in the row.
export function removeButton(page: Page, product: CartProduct) {
  return cartRow(page, product).locator('a');
}
