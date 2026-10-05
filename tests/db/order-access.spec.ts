import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import type { Connection, RowDataPacket } from 'mysql2/promise';
import { connectToDb, execute, select } from '../helpers/db';
import { knownBug } from '../helpers/known-bug';
import { customer, LOCAL_API, placeOrder, productInStock } from '../helpers/orders';

// Runs against the LOCAL Toolshop only (local-toolshop/start.ps1, project "local-db"):
// it creates orders, which must not happen on the shared public demo.
//
// Specification (reference version sprint5/, InvoiceService): a customer who is not an admin
// reads, searches and changes only their own invoices; any other id is "not found" (404).
// PATCH /invoices/{id} lets the owner change the billing address.
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
  const invoice = await response.json();
  return { owner, invoiceId: invoice.id as number, invoiceNumber: invoice.invoice_number as string, total: product.price };
}

// Billing city stored in the database: the real check whether a change happened.
async function storedBillingCity(invoiceId: number): Promise<string> {
  const [row] = await select<RowDataPacket & { billing_city: string }>(
    db,
    'SELECT billing_city FROM invoices WHERE id = ?',
    [invoiceId],
  );
  return row.billing_city;
}

// Body of PUT /invoices/{id}: the stored fields of an order placed by placeOrder(),
// with a different billing city. Invoice items are not part of an update; total is required,
// without it the API answers 422 before any access check.
function invoiceUpdate(userId: number, total: number, billingCity: string) {
  return {
    user_id: userId,
    total,
    billing_address: 'Test street 1',
    billing_city: billingCity,
    billing_state: 'Test',
    billing_country: 'CZ',
    billing_postcode: '12345',
    payment_method: 'cash-on-delivery',
  };
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

test.describe('invoice search and changes (API)', () => {
  // Known app bug BUG-018: search finds other customers' invoices. Remove test.fail() once fixed.
  test.fail("search does not find another customer's invoice", knownBug('bugs/bug-018-customer-sees-other-invoices.md', "another customer's invoices found by search"), async ({ request }) => {
    const { owner, invoiceId, invoiceNumber } = await customerWithOrder(request, 7);
    const other = await customer(request);
    const search = (token: string) =>
      request.get(`${LOCAL_API}/invoices/search`, {
        params: { q: invoiceNumber },
        headers: { Authorization: `Bearer ${token}` },
      });

    // Control: the owner finds the invoice by its number, so the search itself works.
    const ownerResponse = await search(owner.token);
    expect(ownerResponse.status(), await ownerResponse.text()).toBe(200);
    expect((await ownerResponse.json()).data.map((invoice: { id: number }) => invoice.id)).toEqual([invoiceId]);

    const response = await search(other.token);
    expect(response.status(), await response.text()).toBe(200);
    // Only ids are compared, so a failure message shows no other data of the owner.
    expect(
      (await response.json()).data.map((invoice: { id: number }) => invoice.id),
      "another customer's invoices found by search",
    ).toEqual([]);
  });

  test('the owner can change the billing city with PUT', async ({ request }) => {
    const { owner, invoiceId, total } = await customerWithOrder(request, 8);

    const response = await request.put(`${LOCAL_API}/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: invoiceUpdate(owner.user.id, total, 'Changed by owner'),
    });

    expect(response.status(), await response.text()).toBe(200);
    expect(await storedBillingCity(invoiceId)).toBe('Changed by owner');
  });

  test("PUT does not change another customer's invoice", async ({ request }) => {
    const { owner, invoiceId, total } = await customerWithOrder(request, 9);
    const other = await customer(request);
    const cityBefore = await storedBillingCity(invoiceId);

    // Even with the attacker's own user_id in the body (taking the invoice over).
    for (const userId of [owner.user.id, other.user.id]) {
      const response = await request.put(`${LOCAL_API}/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${other.token}` },
        data: invoiceUpdate(userId, total, 'Changed by attacker'),
      });
      expect(response.status(), 'no server error').toBeLessThan(500);
    }

    const [stored] = await select<RowDataPacket & { user_id: number; billing_city: string }>(
      db,
      'SELECT user_id, billing_city FROM invoices WHERE id = ?',
      [invoiceId],
    );
    expect(stored).toEqual(expect.objectContaining({ user_id: owner.user.id, billing_city: cityBefore }));
  });

  // Known app bug BUG-025: the refusal comes with HTTP 200. Remove test.fail() once fixed.
  test.fail("PUT on another customer's invoice is rejected", knownBug('bugs/bug-025-put-foreign-invoice-returns-200.md', 'status of a rejected change', 'Received:    200'), async ({ request }) => {
    const { owner, invoiceId, total } = await customerWithOrder(request, 10);
    const other = await customer(request);

    const response = await request.put(`${LOCAL_API}/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${other.token}` },
      data: invoiceUpdate(owner.user.id, total, 'Changed by attacker'),
    });

    // Reference version: 404. Any client error is a valid rejection; a 200 hides the refusal
    // in the body, so a client cannot tell success from failure by the status.
    expect(response.status(), 'status of a rejected change').toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  // Known app bug BUG-026: PATCH answers 405 even to the owner. Remove test.fail() once fixed.
  test.fail('the owner can change the billing city with PATCH', knownBug('bugs/bug-026-patch-invoice-not-allowed.md', 'PATCH status', 'Received: 405'), async ({ request }) => {
    const { owner, invoiceId } = await customerWithOrder(request, 11);

    const response = await request.patch(`${LOCAL_API}/invoices/${invoiceId}`, {
      headers: { Authorization: `Bearer ${owner.token}` },
      data: { billing_city: 'Patched by owner' },
    });

    expect(response.status(), 'PATCH status').toBe(200);
    expect(await storedBillingCity(invoiceId)).toBe('Patched by owner');
  });
});
