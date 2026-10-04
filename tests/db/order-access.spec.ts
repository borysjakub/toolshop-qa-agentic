import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { Connection } from 'mysql2/promise';
import { connectToDb, execute } from '../helpers/db';
import { knownBug } from '../helpers/known-bug';
import { customer, LOCAL_API, placeOrder, productInStock } from '../helpers/orders';

// Runs against the LOCAL Toolshop only (local-toolshop/start.ps1, project "local-db"):
// it creates orders, which must not happen on the shared public demo.
//
// Specification (reference version sprint5/, InvoiceService::getInvoice): a customer
// who is not an admin gets only their own invoices; any other id is "not found" (404).
//
// The first test is not a known-bug test: it proves the setup works (order created,
// owner can read it), so a broken environment cannot hide behind the access check.

let db: Connection;

test.beforeAll(async () => {
  db = await connectToDb();
  // Test data setup: enough stock for the orders below, however many runs came before.
  await execute(db, 'UPDATE products SET stock = 50 WHERE stock < 50 AND is_rental = 0');
});

test.afterAll(async () => {
  await db?.end();
});

// A fresh customer with one order; returns the customer and the new invoice id.
async function customerWithOrder(request: APIRequestContext, productSkip: number) {
  const owner = await customer(request);
  const product = await productInStock(db, productSkip);
  const response = await placeOrder(request, owner.token, {
    userId: owner.user.id,
    total: product.price,
    items: [{ productId: product.id, unitPrice: product.price, quantity: 1 }],
  });
  expect(response.status(), await response.text()).toBe(201);
  return { owner, invoiceId: (await response.json()).id as number };
}

function getInvoice(request: APIRequestContext, token: string, invoiceId: number) {
  return request.get(`${LOCAL_API}/invoices/${invoiceId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// The response body as JSON, or null when it is not JSON (e.g. an HTML error page).
async function jsonOrNull(response: APIResponse): Promise<Record<string, unknown> | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

test.describe('order access (API)', () => {
  test('a customer can read their own invoice', async ({ request }) => {
    const { owner, invoiceId } = await customerWithOrder(request, 3);

    const response = await getInvoice(request, owner.token, invoiceId);

    expect(response.status(), await response.text()).toBe(200);
    expect(await response.json()).toMatchObject({ id: invoiceId, user_id: owner.user.id });
  });

  // Known app bug BUG-018: any customer can read other customers' invoices. Remove test.fail() once fixed.
  test.fail("a customer cannot read another customer's invoice", knownBug('bugs/bug-018-customer-sees-other-invoices.md', "another customer's invoice is not returned"), async ({ request }) => {
    const { invoiceId } = await customerWithOrder(request, 4);
    const other = await customer(request);

    const response = await getInvoice(request, other.token, invoiceId);

    // The data is the real check: the response must not contain the victim's invoice.
    // Checked first, so a fix that rejects with a different status is still noticed.
    const body = await jsonOrNull(response);
    expect(body?.id, "another customer's invoice is not returned").not.toBe(invoiceId);
    // Reference version: 404. Any client error (403, 404) is a valid rejection,
    // never success or a server error.
    expect(response.status(), 'request for another customer\'s invoice is rejected').toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  // Known app bug BUG-018: the invoice list shows the invoices of all customers. Remove test.fail() once fixed.
  test.fail('the invoice list contains only the customer\'s own invoices', knownBug('bugs/bug-018-customer-sees-other-invoices.md', 'invoices of other customers in the list'), async ({ request }) => {
    // Another customer's order exists, so a list without the per-customer filter shows it.
    await customerWithOrder(request, 5);
    const { owner, invoiceId } = await customerWithOrder(request, 6);

    const response = await request.get(`${LOCAL_API}/invoices`, {
      headers: { Authorization: `Bearer ${owner.token}` },
    });
    expect(response.status(), await response.text()).toBe(200);
    const invoices: { id: number; user_id: number }[] = (await response.json()).data;

    // Only ids are compared, so a failure message shows no other data of other customers.
    expect(
      invoices.filter((invoice) => invoice.user_id !== owner.user.id).map((invoice) => invoice.id),
      'invoices of other customers in the list',
    ).toEqual([]);
    // The filter must not hide everything: the customer's only order is listed.
    expect(invoices.map((invoice) => invoice.id), 'own invoices in the list').toEqual([invoiceId]);
  });
});
