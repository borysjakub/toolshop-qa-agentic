import { randomUUID } from 'crypto';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

// The API behind baseURL (see playwright.config.ts): public by default, local in CI.
export const API_URL = process.env.API_URL ?? 'https://api-with-bugs.practicesoftwaretesting.com';

export type TestUser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// Registers a fresh throwaway customer via the API, so tests never share state
// and never lock the public demo accounts that other people use.
// apiUrl: the public API by default, the local Toolshop API for database tests.
export async function registerUser(
  request: APIRequestContext,
  apiUrl: string = API_URL,
): Promise<TestUser> {
  const user: Omit<TestUser, 'id'> = {
    firstName: 'Tess',
    lastName: 'Tester',
    email: `qa-${randomUUID()}@example.com`,
    password: 'TestPass-2026!x',
  };

  const response = await request.post(`${apiUrl}/users/register`, {
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

  return { ...user, id: (await response.json()).id };
}

// Logs in via the API and returns the bearer token for authorized API calls.
export async function apiToken(
  request: APIRequestContext,
  user: Pick<TestUser, 'email' | 'password'>,
  apiUrl: string = API_URL,
): Promise<string> {
  const response = await request.post(`${apiUrl}/users/login`, {
    data: { email: user.email, password: user.password },
  });
  expect(response.status(), 'API login').toBe(200);
  return (await response.json()).access_token;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto('/#/auth/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('login-submit').click();
}
