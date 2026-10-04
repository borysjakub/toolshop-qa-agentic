import { expect, type APIRequestContext } from '@playwright/test';
import type { Connection, RowDataPacket } from 'mysql2/promise';
import { select } from './db';
import { apiToken, registerUser, type TestUser } from './users';

// Order helpers for the LOCAL Toolshop only (local-toolshop/start.ps1, project "local-db"):
// orders on the shared public demo would get in the way of other people.
export const LOCAL_API = process.env.LOCAL_TOOLSHOP_API_URL ?? 'http://localhost:8091';

export type Product = RowDataPacket & { id: number; name: string; price: number; stock: number };

// A purchasable product with enough stock; `skip` picks a different one per test.
// Thor Hammer is excluded: the API allows only one per order (business rule).
// OFFSET is inlined (forced to a number) because MariaDB prepared statements
// do not accept a placeholder there.
export async function productInStock(db: Connection, skip: number): Promise<Product> {
  const [product] = await select<Product>(
    db,
    `SELECT id, name, price, stock FROM products
     WHERE stock >= 10 AND is_rental = 0 AND name <> 'Thor Hammer'
     ORDER BY id LIMIT 1 OFFSET ${Math.trunc(Number(skip))}`,
  );
  expect(product, 'seed data has a product in stock').toBeDefined();
  return product;
}

export async function placeOrder(
  request: APIRequestContext,
  token: string,
  order: { userId: number; total: number; items: { productId: number; unitPrice: number; quantity: number }[] },
) {
  return request.post(`${LOCAL_API}/invoices`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      user_id: order.userId,
      billing_address: 'Test street 1',
      billing_city: 'Testville',
      billing_state: 'Test',
      billing_country: 'CZ',
      billing_postcode: '12345',
      payment_method: 'cash-on-delivery',
      total: order.total,
      invoice_items: order.items.map((item) => ({
        product_id: item.productId,
        unit_price: item.unitPrice,
        quantity: item.quantity,
      })),
    },
  });
}

// A fresh customer on the local Toolshop with a bearer token for API calls.
export async function customer(request: APIRequestContext): Promise<{ user: TestUser; token: string }> {
  const user = await registerUser(request, LOCAL_API);
  return { user, token: await apiToken(request, user, LOCAL_API) };
}
