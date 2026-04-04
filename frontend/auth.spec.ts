import { test, expect } from '@playwright/test';
import { BASE_URL } from './e2e/helpers';

const TEST_USER = 'authtest';
const TEST_PASSWORD = 'Test1234!';

test.describe('Auth Flows', () => {
  test('landing page renders with Sign In button', async ({ page }) => {
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: /productivity hub/i })).toBeVisible();

    const signInButton = page.getByRole('banner').getByRole('button', { name: 'Sign In' });
    await expect(signInButton).toBeVisible();

    const getStartedButton = page.getByRole('button', { name: /get started free/i }).first();
    await expect(getStartedButton).toBeVisible();
  });

  test('login dialog opens on Sign In click', async ({ page }) => {
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Welcome')).toBeVisible();
    await expect(dialog.getByLabel('Username')).toBeVisible();
    await expect(dialog.getByLabel('Password')).toBeVisible();
  });

  test('can switch between Sign In and Sign Up tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Start on Sign In tab
    await expect(dialog.getByRole('tab', { name: 'Sign In' })).toBeVisible();
    await expect(dialog.getByRole('tab', { name: 'Sign Up' })).toBeVisible();

    // Switch to Sign Up
    await dialog.getByRole('tab', { name: 'Sign Up' }).click();
    await expect(dialog.getByLabel('Email')).toBeVisible();
    await expect(dialog.getByLabel('Confirm Password')).toBeVisible();

    // Switch back to Sign In
    await dialog.getByRole('tab', { name: 'Sign In' }).click();
    await expect(dialog.getByLabel('Email')).not.toBeVisible();
  });

  test('registration with new user succeeds and redirects to dashboard', async ({ page }) => {
    const uniqueUser = `authregtest${Date.now()}`;

    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('tab', { name: 'Sign Up' }).click();
    await dialog.getByLabel('Username').fill(uniqueUser);
    await dialog.getByLabel('Email').fill(`${uniqueUser}@test.com`);
    await dialog.getByLabel('Password').first().fill(TEST_PASSWORD);
    await dialog.getByLabel('Confirm Password').fill(TEST_PASSWORD);
    await dialog.getByRole('button', { name: 'Sign Up' }).click();

    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Should be on the dashboard (not welcome)
    expect(page.url()).not.toContain('/welcome');
  });

  test('login with existing credentials succeeds', async ({ page }) => {
    // First register the user
    const uniqueUser = `authlogintest${Date.now()}`;
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('tab', { name: 'Sign Up' }).click();
    await dialog.getByLabel('Username').fill(uniqueUser);
    await dialog.getByLabel('Email').fill(`${uniqueUser}@test.com`);
    await dialog.getByLabel('Password').first().fill(TEST_PASSWORD);
    await dialog.getByLabel('Confirm Password').fill(TEST_PASSWORD);
    await dialog.getByRole('button', { name: 'Sign Up' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Logout
    await page.getByText(uniqueUser).click();
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await page.waitForLoadState('networkidle');

    // Now login
    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();
    const loginDialog = page.locator('[role="dialog"]');
    await expect(loginDialog).toBeVisible();

    await loginDialog.getByRole('tab', { name: 'Sign In' }).click();
    await loginDialog.getByLabel('Username').fill(uniqueUser);
    await loginDialog.getByLabel('Password').first().fill(TEST_PASSWORD);
    await loginDialog.getByRole('button', { name: 'Sign In' }).click();

    await expect(loginDialog).not.toBeVisible({ timeout: 5000 });
    expect(page.url()).not.toContain('/welcome');
  });

  test('logout works via user chip menu', async ({ page }) => {
    const uniqueUser = `authlogouttest${Date.now()}`;
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    // Register
    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByRole('tab', { name: 'Sign Up' }).click();
    await dialog.getByLabel('Username').fill(uniqueUser);
    await dialog.getByLabel('Email').fill(`${uniqueUser}@test.com`);
    await dialog.getByLabel('Password').first().fill(TEST_PASSWORD);
    await dialog.getByLabel('Confirm Password').fill(TEST_PASSWORD);
    await dialog.getByRole('button', { name: 'Sign Up' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Click user chip to open menu
    const userChip = page.getByText(uniqueUser);
    await expect(userChip).toBeVisible();
    await userChip.click();

    // Click logout
    await page.getByRole('menuitem', { name: 'Logout' }).click();
    await page.waitForLoadState('networkidle');

    // Should be back on welcome
    expect(page.url()).toContain('/welcome');
  });

  test('invalid credentials show error alert', async ({ page }) => {
    await page.goto(`${BASE_URL}/welcome`);
    await page.waitForLoadState('networkidle');

    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    await dialog.getByRole('tab', { name: 'Sign In' }).click();
    await dialog.getByLabel('Username').fill('nonexistentuser999');
    await dialog.getByLabel('Password').first().fill('wrongpassword');
    await dialog.getByRole('button', { name: 'Sign In' }).click();

    const alert = dialog.locator('[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 5000 });
  });

  test('protected routes redirect to landing when not authenticated', async ({ page }) => {
    // Clear any existing auth state
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());

    await page.goto(`${BASE_URL}/todos`);
    await page.waitForLoadState('networkidle');

    // Should redirect to welcome page
    expect(page.url()).toContain('/welcome');
  });
});
