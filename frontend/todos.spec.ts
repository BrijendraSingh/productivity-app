import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAuthenticated } from './e2e/helpers';

const TEST_USER = 'todostest';

test.describe('Todo Management', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, TEST_USER);
    await page.goto(`${BASE_URL}/todos`);
    await page.waitForLoadState('networkidle');
  });

  test('todo list page loads with stat chips', async ({ page }) => {
    await expect(page.getByText(/Total/)).toBeVisible();
    await expect(page.getByText(/Pending/)).toBeVisible();

    // Search field is visible
    await expect(page.getByPlaceholder('Search todos...')).toBeVisible();
  });

  test('create new todo via FAB and dialog', async ({ page }) => {
    const todoTitle = `Test Todo ${Date.now()}`;

    // Click the FAB (floating action button)
    const fab = page.locator('button[aria-label="New Todo"]');
    await expect(fab).toBeVisible();
    await fab.click();

    // Dialog should appear
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('New Todo')).toBeVisible();

    // Fill in the title
    await dialog.getByLabel('Title').fill(todoTitle);

    // Set urgency slider (defaults to 5, drag to high ~8 for Q1)
    const urgencySlider = dialog.locator('text=Urgency').locator('..').locator('[role="slider"]');
    if (await urgencySlider.isVisible()) {
      await urgencySlider.fill('8');
    }

    // Set importance slider
    const importanceSlider = dialog
      .locator('text=Importance')
      .locator('..')
      .locator('[role="slider"]');
    if (await importanceSlider.isVisible()) {
      await importanceSlider.fill('8');
    }

    // Click Create Todo
    await dialog.getByRole('button', { name: 'Create Todo' }).click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // The new todo should appear in the list
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });
  });

  test('toggle todo completion status', async ({ page }) => {
    // Create a todo first
    const todoTitle = `Toggle Test ${Date.now()}`;
    const fab = page.locator('button[aria-label="New Todo"]');
    await fab.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Title').fill(todoTitle);
    await dialog.getByRole('button', { name: 'Create Todo' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Find the todo card and its checkbox
    const todoCard = page.locator(`text=${todoTitle}`).locator('..').locator('..');
    const checkbox = todoCard.locator('[role="checkbox"]').first();
    await expect(checkbox).toBeVisible();

    // Toggle completion
    await checkbox.click();
    await page.waitForTimeout(500);

    // The checkbox should now be checked (completed)
    await expect(checkbox).toBeChecked();
  });

  test('delete todo', async ({ page }) => {
    const todoTitle = `Delete Test ${Date.now()}`;

    // Create a todo
    const fab = page.locator('button[aria-label="New Todo"]');
    await fab.click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel('Title').fill(todoTitle);
    await dialog.getByRole('button', { name: 'Create Todo' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Find the delete button on the todo card
    const todoText = page.getByText(todoTitle);
    await expect(todoText).toBeVisible();

    const todoCard = todoText.locator('xpath=ancestor::div[contains(@class, "MuiCard-root")]');
    const deleteButton = todoCard.locator('button[aria-label="Delete"]');

    if (await deleteButton.isVisible()) {
      await deleteButton.click();
    } else {
      // Fallback: find the delete icon button near the todo
      const deleteBtn = todoCard.locator('svg[data-testid="DeleteIcon"]').locator('..');
      await deleteBtn.click();
    }

    await page.waitForTimeout(1000);

    // The todo should no longer be visible
    await expect(page.getByText(todoTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test('search todos by title', async ({ page }) => {
    const uniqueToken = `Searchable${Date.now()}`;
    const todoTitle = `${uniqueToken} Todo`;

    // Create a todo with a unique name
    const fab = page.locator('button[aria-label="New Todo"]');
    await fab.click();
    const dialog = page.locator('[role="dialog"]');
    await dialog.getByLabel('Title').fill(todoTitle);
    await dialog.getByRole('button', { name: 'Create Todo' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Type in search box
    const searchField = page.getByPlaceholder('Search todos...');
    await searchField.fill(uniqueToken);

    // Wait for debounced search
    await page.waitForTimeout(500);
    await page.waitForLoadState('networkidle');

    // The todo should still be visible
    await expect(page.getByText(todoTitle)).toBeVisible();
  });

  test('filter by status chips', async ({ page }) => {
    // Open filters panel
    const filterButton = page.locator('button', {
      has: page.locator('svg[data-testid="FilterListIcon"]'),
    });
    await filterButton.click();

    // Verify status filter chips appear
    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('In Progress', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Completed', { exact: true }).first()).toBeVisible();

    // Click "Completed" filter
    await page.getByText('Completed', { exact: true }).first().click();
    await page.waitForLoadState('networkidle');

    // Page should respond (either show completed todos or empty state)
    // The key assertion is that the filter is applied without errors
    await page.waitForTimeout(500);
  });

  test('filter by priority chips', async ({ page }) => {
    // Open filters panel
    const filterButton = page.locator('button', {
      has: page.locator('svg[data-testid="FilterListIcon"]'),
    });
    await filterButton.click();

    // Verify priority filter chips appear
    await expect(page.getByText('High', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Medium', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Low', { exact: true }).first()).toBeVisible();

    // Click "High" filter
    await page.getByText('High', { exact: true }).first().click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });
});
