// API tests of registration, login and the user profile (REST, no browser).
// Spec: the bug-free reference version (sprint5): the User model hides password, role and
// other internal fields from every API response.

import { test, expect } from '@playwright/test';
import { knownBug } from '../helpers/known-bug';
import { API_URL, apiToken, newUserPayload, registerUser } from '../helpers/users';

// Fields that must never leave the backend.
const INTERNAL_FIELDS = ['password', 'role', 'enabled', 'failed_login_attempts', 'totp_secret'];

test.describe('users API', () => {
  test('API-06 registration creates the customer', async ({ request }) => {
    const payload = newUserPayload();

    const response = await request.post(`${API_URL}/users/register`, { data: payload });

    expect(response.status()).toBe(201);
    expect(await response.json()).toMatchObject({
      id: expect.anything(),
      email: payload.email,
      first_name: payload.first_name,
    });
  });

  test('API-07 registration without data lists every missing required field', async ({ request }) => {
    const response = await request.post(`${API_URL}/users/register`, { data: {} });

    expect(response.status()).toBe(422);
    expect(Object.keys(await response.json())).toEqual(
      expect.arrayContaining(['first_name', 'last_name', 'email', 'password']),
    );
  });

  test('API-08 registration rejects a short password', async ({ request }) => {
    const response = await request.post(`${API_URL}/users/register`, {
      data: { ...newUserPayload(), password: '123' },
    });

    expect(response.status()).toBe(422);
    expect((await response.json()).password).toEqual([expect.stringMatching(/at least \d+ characters/)]);
  });

  test('API-09 registration rejects an e-mail that is already registered', async ({ request }) => {
    const user = await registerUser(request);

    const response = await request.post(`${API_URL}/users/register`, {
      data: { ...newUserPayload(), email: user.email },
    });

    // 409 Conflict or 422 Unprocessable Entity are both valid rejections.
    expect([409, 422]).toContain(response.status());
  });

  // Known app bug BUG-017: the error claims to reveal a password hint. Remove test.fail() once fixed.
  // (Saying that the e-mail exists is accepted: the reference version does it too, with 409.)
  test.fail('API-10 a failed registration reveals no password hint', knownBug('bugs/bug-017-register-reveals-password-hint.md', 'Your password hint is'), async ({ request }) => {
    const user = await registerUser(request);

    const response = await request.post(`${API_URL}/users/register`, {
      data: { ...newUserPayload(), email: user.email },
    });

    expect(await response.text()).not.toMatch(/hint|password/i);
  });

  test('API-11 login returns a bearer token', async ({ request }) => {
    const user = await registerUser(request);

    const response = await request.post(`${API_URL}/users/login`, {
      data: { email: user.email, password: user.password },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({
      access_token: expect.stringMatching(/\S/),
      token_type: 'bearer',
      expires_in: expect.any(Number),
    });
  });

  test('API-12 login with a wrong password is rejected', async ({ request }) => {
    const user = await registerUser(request);

    const response = await request.post(`${API_URL}/users/login`, {
      data: { email: user.email, password: 'WrongPass-123' },
    });

    expect(response.status()).toBe(401);
  });

  test('API-13 the profile returns the logged-in customer', async ({ request }) => {
    const user = await registerUser(request);
    const token = await apiToken(request, user);

    const response = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status()).toBe(200);
    expect(await response.json()).toMatchObject({ id: user.id, email: user.email });
  });

  test('API-14 the profile requires a token', async ({ request }) => {
    const response = await request.get(`${API_URL}/users/me`);

    expect(response.status()).toBe(401);
  });

  // Known app bug BUG-016: register and profile return the password hash. Remove test.fail() once fixed.
  test.fail('API-15 responses never contain the password hash or internal fields', knownBug('bugs/bug-016-api-returns-password-hash.md', 'internal fields in POST /users/register', '"password"'), async ({ request }) => {
    const payload = newUserPayload();
    const registration = await request.post(`${API_URL}/users/register`, { data: payload });
    expect(registration.status()).toBe(201);
    const token = await apiToken(request, payload);
    const profile = await request.get(`${API_URL}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const leaked = (body: Record<string, unknown>) => INTERNAL_FIELDS.filter((field) => field in body);
    expect(leaked(await registration.json()), 'internal fields in POST /users/register').toEqual([]);
    expect(leaked(await profile.json()), 'internal fields in GET /users/me').toEqual([]);
  });
});
