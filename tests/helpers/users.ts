import { randomUUID } from 'crypto';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const API_URL = 'https://api-with-bugs.practicesoftwaretesting.com';

export type TestUser = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// Registers a fresh throwaway customer via the API, so tests never share state
// and never lock the public demo accounts that other people use.
export async function registerUser(request: APIRequestContext): Promise<TestUser> {
  const user: TestUser = {
    firstName: 'Tess',
    lastName: 'Tester',
    email: `qa-${randomUUID()}@example.com`,
    password: 'TestPass-2026!x',
  };

  const response = await request.post(`${API_URL}/users/register`, {
    data: {
      first_name: user.firstName,
      last_name: user.lastName,
      dob: '1990-01-01',
      address: 'Test street 1',
      city: 'Testville',
      state: 'Test',
      country: 'CZ',
      postal_code: '12345',
      phone: '123456789',
      email: user.email,
      password: user.password,
    },
  });
  expect(response.status(), 'test user registration').toBe(201);

  return user;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/#/auth/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('login-submit').click();
}
