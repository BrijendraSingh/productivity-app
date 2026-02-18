/**
 * Bullet Journal Symbol Toolbar and Keyboard Shortcuts E2E Test
 * Run: npx playwright test bullet-journal.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_USER = { username: 'bulletjournaltest', email: 'test@test.com', password: 'Test1234!' };

async function ensureAuthenticated(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('networkidle');

  // If we're on welcome, need to auth
  if (page.url().includes('/welcome')) {
    // Click Sign In in the top bar (banner) to open the dialog
    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });

    // Try login first (user may already exist)
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByRole('tab', { name: 'Sign In' }).click();
    await dialog.getByLabel('Username').fill(TEST_USER.username);
    await dialog.getByLabel('Password').first().fill(TEST_USER.password);
    await dialog.getByRole('button', { name: 'Sign In' }).click();

    // Wait for dialog to close - if error appears, try signup
    await page.waitForTimeout(1500);
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible()) {
      await dialog.getByRole('tab', { name: 'Sign Up' }).click();
      await dialog.getByLabel('Username').fill(TEST_USER.username);
      await dialog.getByLabel('Email').fill(TEST_USER.email);
      await dialog.getByLabel('Password').first().fill(TEST_USER.password);
      await dialog.getByLabel('Confirm Password').fill(TEST_USER.password);
      await dialog.getByRole('button', { name: 'Sign Up' }).click();
      await page.waitForTimeout(2000);
    }

    // After auth, dialog closes. Navigate to dashboard to ensure we're in the app
    await page.goto(BASE_URL + '/');
    await page.waitForLoadState('networkidle');
    // Should now be on dashboard (or welcome if auth failed - then we can't proceed)
  }
}

test.describe('Bullet Journal - Symbol Toolbar and Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page);
    // Navigate to Journal
    await page.goto(BASE_URL + '/journal');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/journal/);
  });

  test('Insert Symbol toolbar is visible with clickable chips', async ({ page }) => {
    await page.screenshot({ path: 'test-results/01-toolbar-visible.png' });
    const insertSection = page.getByText('Insert Symbol');
    await expect(insertSection).toBeVisible();

    const taskChip = page.getByText('• Task').first();
    await expect(taskChip).toBeVisible();
    await expect(taskChip).toHaveCSS('cursor', 'pointer');
  });

  test('Tip text about shortcuts is visible', async ({ page }) => {
    const tipText = page.locator('text=/Tip:.*\\/t.*\\/d.*\\/m.*\\/e.*\\/n.*\\/p/');
    await expect(tipText).toBeVisible();
  });

  test('Clicking symbol chips inserts symbols into text field', async ({ page }) => {
    const textField = page.locator('textarea').first();
    await textField.click();
    await textField.fill('');

    // Click • Task
    await page.getByText('• Task').first().click();
    await expect(textField).toHaveValue(/•\s/);

    // Click × Completed (chip label is "Completed" in BULLET_SYMBOLS)
    await page.getByText('× Completed').first().click();
    await expect(textField).toHaveValue(/•\s\n×\s/);

    // Click ○ Event
    await page.getByText('○ Event').first().click();
    await expect(textField).toHaveValue(/•\s\n×\s\n○\s/);

    await page.screenshot({ path: 'test-results/02-symbols-inserted.png' });
  });

  test('Keyboard shortcuts expand correctly at line start', async ({ page }) => {
    const textField = page.locator('textarea').first();
    await textField.click();
    await textField.fill('');

    const shortcuts: [string, string][] = [
      ['/t', '• '],
      ['/d', '× '],
      ['/m', '→ '],
      ['/e', '○ '],
      ['/n', '– '],
      ['/p', '! '],
    ];

    for (const [shortcut, expected] of shortcuts) {
      await textField.press('Enter');
      await textField.type(shortcut, { delay: 50 });
      const value = await textField.inputValue();
      expect(value.endsWith(expected), `Shortcut ${shortcut} should expand to "${expected}", got: "${value.slice(-10)}"`).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/03-shortcuts-expanded.png' });
  });

  test('Cursor positioning after click insertion', async ({ page }) => {
    const textField = page.locator('textarea').first();
    await textField.click();
    await textField.fill('');

    await page.getByText('• Task').first().click();
    await page.keyboard.type('my task');
    await expect(textField).toHaveValue(/•\s+my task/);
  });

  test('Cursor positioning after shortcut expansion', async ({ page }) => {
    const textField = page.locator('textarea').first();
    await textField.click();
    await textField.fill('');

    await textField.type('/t', { delay: 50 });
    await page.keyboard.type('quick task');
    await expect(textField).toHaveValue(/•\s+quick task/);
  });
});
