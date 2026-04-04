import { Page, expect } from '@playwright/test';

export const BASE_URL = 'http://localhost:3000';

/**
 * Ensures the browser session is authenticated. If already logged in, this is a no-op.
 * If on the welcome page, it tries Sign In first; on failure (user doesn't exist yet),
 * it switches to Sign Up and creates the account.
 *
 * Each spec must pass a unique username so test data doesn't collide.
 */
export async function ensureAuthenticated(page: Page, username: string) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  if (page.url().includes('/welcome')) {
    const signInBanner = page.getByRole('banner').getByRole('button', { name: 'Sign In' });
    await signInBanner.click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    const dialog = page.locator('[role="dialog"]');

    await dialog.getByRole('tab', { name: 'Sign In' }).click();
    await dialog.getByLabel('Username').fill(username);
    await dialog.getByLabel('Password').first().fill('Test1234!');
    await dialog.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForTimeout(1500);

    const alert = dialog.locator('[role="alert"]');
    if (await alert.isVisible()) {
      await dialog.getByRole('tab', { name: 'Sign Up' }).click();
      await page.waitForTimeout(300);

      await dialog.getByLabel('Username').fill(username);
      await dialog.getByLabel('Email').fill(`${username}@test.com`);
      await dialog.getByLabel('Password').first().fill('Test1234!');
      await dialog.getByLabel('Confirm Password').fill('Test1234!');
      await dialog.getByRole('button', { name: 'Sign Up' }).click();
      await page.waitForTimeout(2000);
    }

    await page.goto(BASE_URL + '/');
    await page.waitForLoadState('networkidle');
  }
}
