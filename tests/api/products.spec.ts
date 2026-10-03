// API tests of the product catalogue (REST, no browser).
// Spec: Swagger of the API (/api/documentation) and the bug-free reference version (sprint5).

import { test, expect } from '@playwright/test';
import { API_URL } from '../helpers/users';

type Product = { id: number | string; name: string; price: number };
type Page<T> = { current_page: number; data: T[]; last_page: number; per_page: number; total: number };

test.describe('products API', () => {
  test('API-01 the product list is paginated consistently', async ({ request }) => {
    const response = await request.get(`${API_URL}/products?page=1`);
    expect(response.status()).toBe(200);
    const body: Page<Product> = await response.json();

    expect(body.current_page).toBe(1);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.length).toBeLessThanOrEqual(body.per_page);
    expect(body.last_page).toBe(Math.ceil(body.total / body.per_page));
    for (const product of body.data) {
      expect(product.name, `name of product ${product.id}`).toMatch(/\S/);
      expect(product.price, `price of ${product.name}`).toBeGreaterThan(0);
    }
  });

  test('API-02 a page after the last one is empty, not an error', async ({ request }) => {
    const firstResponse = await request.get(`${API_URL}/products?page=1`);
    expect(firstResponse.status()).toBe(200);
    const first: Page<Product> = await firstResponse.json();

    const response = await request.get(`${API_URL}/products?page=${first.last_page + 1}`);

    expect(response.status()).toBe(200);
    expect((await response.json()).data).toEqual([]);
  });

  test('API-03 the product detail matches the list', async ({ request }) => {
    const listResponse = await request.get(`${API_URL}/products?page=1`);
    expect(listResponse.status()).toBe(200);
    const list: Page<Product> = await listResponse.json();
    const fromList = list.data[0];

    const response = await request.get(`${API_URL}/products/${fromList.id}`);

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ id: fromList.id, name: fromList.name, price: fromList.price });
  });

  test('API-04 an unknown product returns 404', async ({ request }) => {
    const response = await request.get(`${API_URL}/products/999999`);

    expect(response.status()).toBe(404);
    expect(await response.json()).toEqual({ message: 'Requested item not found' });
  });

  test('API-05 search returns only matching products', async ({ request }) => {
    const response = await request.get(`${API_URL}/products/search?q=pliers`);
    expect(response.status()).toBe(200);
    const body: Page<Product> = await response.json();

    expect(body.total).toBe(4);
    for (const product of body.data) {
      expect(product.name.toLowerCase()).toContain('pliers');
    }
  });
});
