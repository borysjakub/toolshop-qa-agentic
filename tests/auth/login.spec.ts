import { test, expect, type Page } from '@playwright/test';
import { login, registerUser } from '../helpers/users';

// Test cases for Jira TQA-1 (customer login), see tasks/tqa-1-login.md.

const INVALID_CREDENTIALS = 'Invalid email or password';

async function failedLogin(page: Page, email: string) {
  await login(page, email, 'WrongPass-123');
  await expect(page.getByTestId('login-error')).toBeVisible();
}

test.describe('customer login', () => {
  test('TC-01 valid credentials open the account page', async ({ page, request }) => {
    const user = await registerUser(request);

    await login(page, user.email, user.password);

    await expect(page).toHaveURL(/#\/account$/);
    await expect(page.getByTestId('page-title')).toHaveText('My account');
  });

  // Known app bug BUG-004: the menu says "User Data not found". Remove test.fail() once fixed.
  test.fail('TC-02 navigation shows the logged-in customer name', {
    annotation: { type: 'issue', description: 'bugs/bug-004-user-menu-data-not-found.md' },
  }, async ({ page, request }) => {
    const user = await registerUser(request);

    await login(page, user.email, user.password);

    await expect(page.getByTestId('nav-user-menu')).toContainText(`${user.firstName} ${user.lastName}`);
  });

  test('TC-03 wrong password shows an error and stays on the login page', async ({ page, request }) => {
    const user = await registerUser(request);

    await login(page, user.email, 'WrongPass-123');

    await expect(page.getByTestId('login-error')).toHaveText(INVALID_CREDENTIALS);
    await expect(page).toHaveURL(/#\/auth\/login$/);
  });

  test('TC-04 unknown email shows the same error as a wrong password', async ({ page }) => {
    // Same message for both cases, so an attacker cannot find out which emails are registered.
    await login(page, 'qa-unknown-user@example.com', 'WrongPass-123');

    await expect(page.getByTestId('login-error')).toHaveText(INVALID_CREDENTIALS);
  });

  // Known app bug BUG-005: the empty form is sent to the server without field validation. Remove test.fail() once fixed.
  test.fail('TC-05 empty form shows field validation errors', {
    annotation: { type: 'issue', description: 'bugs/bug-005-login-form-no-validation.md' },
  }, async ({ page }) => {
    await page.goto('/#/auth/login');
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('email-error')).toBeVisible();
    await expect(page.getByTestId('password-error')).toBeVisible();
  });

  test('TC-06 one wrong attempt does not lock the account', async ({ page, request }) => {
    const user = await registerUser(request);
    await failedLogin(page, user.email);

    await login(page, user.email, user.password);

    await expect(page).toHaveURL(/#\/account$/);
  });

  // Known app bug BUG-003: the account never gets locked. Remove test.fail() once fixed.
  test.fail('TC-07 account is locked after 3 wrong attempts', {
    annotation: { type: 'issue', description: 'bugs/bug-003-account-not-locked.md' },
  }, async ({ page, request }) => {
    // Limit of 3 attempts: answer from the team lead in TQA-1, see tasks/tqa-1-login.md.
    const user = await registerUser(request);
    for (let attempt = 1; attempt <= 3; attempt++) {
      await failedLogin(page, user.email);
    }

    await login(page, user.email, user.password);

    await expect(page.getByTestId('login-error')).toContainText(/locked/i);
  });

  test('TC-08 logout signs the customer out', async ({ page, request }) => {
    const user = await registerUser(request);
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/#\/account$/);

    await page.getByTestId('nav-user-menu').click();
    await page.getByTestId('nav-sign-out').click();

    await expect(page.getByTestId('nav-sign-in')).toBeVisible();
    await expect(page.getByTestId('nav-user-menu')).toBeHidden();
  });

  test('TC-09 account page is not accessible after logout', async ({ page, request }) => {
    const user = await registerUser(request);
    await login(page, user.email, user.password);
    await expect(page).toHaveURL(/#\/account$/);
    await page.getByTestId('nav-user-menu').click();
    await page.getByTestId('nav-sign-out').click();
    await expect(page.getByTestId('nav-sign-in')).toBeVisible();

    await page.goto('/#/account');

    await expect(page).toHaveURL(/#\/auth\/login$/);
  });
});
