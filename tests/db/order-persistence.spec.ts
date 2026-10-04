import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import type { Connection, RowDataPacket } from 'mysql2/promise';
import { connectToDb, execute, select } from '../helpers/db';
import { customer, placeOrder, productInStock, type Product } from '../helpers/orders';

// Runs against the LOCAL Toolshop only (local-toolshop/start.ps1, project "local-db").
// The order is created through the API, then the database is checked with SQL:
// the API response alone does not prove what was stored.
//
// Every run consumes stock, so beforeAll tops it up (test data setup via SQL).
// The first test is not test.fail(): if the environment is broken (no database, no stock),
// it fails loudly instead of the known-bug tests "passing" for the wrong reason.
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

test.describe('order persistence (database)', () => {
  test('order is stored with its items and the stock is decremented', async ({ request }) => {
    const { user, token } = await customer(request);
    const product = await productInStock(db, 0);
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
    const product = await productInStock(db, 1);
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
    const product = await productInStock(db, 2);

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
