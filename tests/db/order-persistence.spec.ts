import { test, expect, type APIRequestContext } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import type { Connection, RowDataPacket } from 'mysql2/promise';
import { connectToDb, execute, select } from '../helpers/db';
import { apiToken, registerUser, type TestUser } from '../helpers/users';

// Runs against the LOCAL Toolshop only (local-toolshop/start.ps1, project "local-db").
// The order is created through the API, then the database is checked with SQL:
// the API response alone does not prove what was stored.
//
// Every run consumes stock, so beforeAll tops it up (test data setup via SQL).
// The first test is not test.fail(): if the environment is broken (no database, no stock),
// it fails loudly instead of the known-bug tests "passing" for the wrong reason.
const API = process.env.LOCAL_TOOLSHOP_API_URL ?? 'http://localhost:8091';

type Product = RowDataPacket & { id: number; name: string; price: number; stock: number };
type Invoice = RowDataPacket & { id: number; user_id: number; total: number; billing_city: string };
type InvoiceItem = RowDataPacket & { product_id: number; unit_price: number; quantity: number };

let db: Connection;

test.beforeAll(async () => {
  db = await connectToDb();
  // Test data setup: enough stock for the orders below, however many runs came before.
  await execute(db, 'UPDATE products SET stock = 50 WHERE stock < 50 AND is_rental = 0');
});

test.afterAll(async () => {
  await db?.end();
});

// A purchasable product with enough stock; `skip` picks a different one per test.
// Thor Hammer is excluded: the API allows only one per order (business rule).
// OFFSET is inlined (forced to a number) because MariaDB prepared statements
// do not accept a placeholder there.
async function productInStock(skip: number): Promise<Product> {
  const [product] = await select<Product>(
    db,
    `SELECT id, name, price, stock FROM products
     WHERE stock >= 10 AND is_rental = 0 AND name <> 'Thor Hammer'
     ORDER BY id LIMIT 1 OFFSET ${Math.trunc(Number(skip))}`,
  );
  expect(product, 'seed data has a product in stock').toBeDefined();
  return product;
}

async function placeOrder(
  request: APIRequestContext,
  token: string,
  order: { userId: number; total: number; items: { productId: number; unitPrice: number; quantity: number }[] },
) {
  return request.post(`${API}/invoices`, {
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

async function customer(request: APIRequestContext): Promise<{ user: TestUser; token: string }> {
  const user = await registerUser(request, API);
  return { user, token: await apiToken(request, user, API) };
}

test.describe('order persistence (database)', () => {
  test('order is stored with its items and the stock is decremented', async ({ request }) => {
    const { user, token } = await customer(request);
    const product = await productInStock(0);
    const quantity = 2;
    const total = Math.round(product.price * quantity * 100) / 100;

    const response = await placeOrder(request, token, {
      userId: user.id,
      total,
      items: [{ productId: product.id, unitPrice: product.price, quantity }],
    });
    expect(response.status(), await response.text()).toBe(201);
    const invoiceId = (await response.json()).id;

    const [invoice] = await select<Invoice>(
      db,
      'SELECT id, user_id, total, billing_city FROM invoices WHERE id = ?',
      [invoiceId],
    );
    expect(invoice).toMatchObject({ user_id: user.id, total, billing_city: 'Testville' });

    const items = await select<InvoiceItem>(
      db,
      'SELECT product_id, unit_price, quantity FROM invoice_items WHERE invoice_id = ?',
      [invoiceId],
    );
    expect(items).toEqual([
      expect.objectContaining({ product_id: product.id, unit_price: product.price, quantity }),
    ]);

    const [after] = await select<Product>(db, 'SELECT stock FROM products WHERE id = ?', [product.id]);
    expect(after.stock).toBe(product.stock - quantity);
  });

  // Known app bug BUG-012: the API stores the price sent by the client. Remove test.fail() once fixed.
  test.fail('stored prices come from the catalogue, not from the client', knownBug('bugs/bug-012-order-price-from-client.md', 'stored items with a price different from the catalogue'), async ({ request }) => {
    const { user, token } = await customer(request);
    const product = await productInStock(1);
    const quantity = 2;

    // The client claims a price of 0.01 per item.
    const response = await placeOrder(request, token, {
      userId: user.id,
      total: 0.01,
      items: [{ productId: product.id, unitPrice: 0.01, quantity }],
    });
    expect(response.status(), 'no server error').toBeLessThan(500);

    // The API may reject the order (nothing stored) or store it with real prices.
    // Accepted means exactly the returned invoice is stored, so an empty result below
    // cannot hide a "201 but nothing saved" case.
    const createdId: number | null = response.ok() ? (await response.json()).id : null;
    const invoices = await select<Invoice>(db, 'SELECT id FROM invoices WHERE user_id = ?', [user.id]);
    expect(invoices.map((row) => row.id), 'stored invoices of this customer').toEqual(
      createdId === null ? [] : [createdId],
    );

    // Every stored item of this customer must match the catalogue price
    // and every stored total must match its items.
    const stored = await select<
      RowDataPacket & { invoice_id: number; total: number; unit_price: number; catalogue_price: number; quantity: number }
    >(
      db,
      `SELECT i.id AS invoice_id, i.total, ii.unit_price, ii.quantity, p.price AS catalogue_price
       FROM invoices i
       JOIN invoice_items ii ON ii.invoice_id = i.id
       JOIN products p ON p.id = ii.product_id
       WHERE i.user_id = ?`,
      [user.id],
    );
    expect(
      stored.filter((row) => row.unit_price !== row.catalogue_price),
      'stored items with a price different from the catalogue',
    ).toEqual([]);
    expect(
      stored.filter((row) => row.total !== Math.round(row.unit_price * row.quantity * 100) / 100),
      'stored totals that do not match their items',
    ).toEqual([]);
  });

  // Known app bug BUG-013: any logged-in customer can order on another account. Remove test.fail() once fixed.
  test.fail('a customer cannot place an order for another customer', knownBug('bugs/bug-013-order-for-another-customer.md', 'no order was stored on the victim\'s account'), async ({ request }) => {
    const victim = await customer(request);
    const attacker = await customer(request);
    const product = await productInStock(2);

    const response = await placeOrder(request, attacker.token, {
      userId: victim.user.id,
      total: product.price,
      items: [{ productId: product.id, unitPrice: product.price, quantity: 1 }],
    });

    // The database is the real check: nothing may be stored on the victim's account.
    // Checked first, so a fix that rejects with a different status is still noticed.
    const victimOrders = await select<Invoice>(
      db,
      'SELECT id FROM invoices WHERE user_id = ?',
      [victim.user.id],
    );
    expect(victimOrders, "no order was stored on the victim's account").toEqual([]);
    // Any client error is a valid rejection (403, 422, ...), never success or a server error.
    expect(response.status(), 'order for another customer is rejected').toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });
});
