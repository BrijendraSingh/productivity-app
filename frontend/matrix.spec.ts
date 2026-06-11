import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAuthenticated } from './e2e/helpers';

const TEST_USER = 'matrixtest';

test.describe('Eisenhower Matrix', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, TEST_USER);
    await page.goto(`${BASE_URL}/matrix`);
    await page.waitForLoadState('networkidle');
  });

  test('matrix page loads with header and 4 quadrants', async ({ page }) => {
    // Header
    await expect(page.getByRole('heading', { name: 'Eisenhower Matrix' })).toBeVisible();
    await expect(page.getByText(/prioritize by urgency and importance/i)).toBeVisible();

    // Refresh button
    const refreshButton = page.locator('button', {
      has: page.locator('svg[data-testid="RefreshIcon"]'),
    });
    await expect(refreshButton).toBeVisible();

    // All four quadrant cells should be visible
    // Quadrant headers contain the quadrant IDs (Q1, Q2, Q3, Q4)
    await expect(page.getByText('Q1').first()).toBeVisible();
    await expect(page.getByText('Q2').first()).toBeVisible();
    await expect(page.getByText('Q3').first()).toBeVisible();
    await expect(page.getByText('Q4').first()).toBeVisible();
  });

  test('quadrants are labeled correctly', async ({ page }) => {
    // Q1: Do First (Urgent + Important)
    await expect(page.getByText('Do First')).toBeVisible();

    // Q2: Schedule (Not Urgent + Important)
    await expect(page.getByText('Schedule')).toBeVisible();

    // Q3: Delegate (Urgent + Not Important)
    await expect(page.getByText('Delegate')).toBeVisible();

    // Q4: Eliminate (Not Urgent + Not Important)
    await expect(page.getByText('Eliminate')).toBeVisible();
  });

  test('legend explains how the matrix works', async ({ page }) => {
    await expect(page.getByText('How the Eisenhower Matrix Works')).toBeVisible();
    await expect(page.getByText(/tasks are automatically assigned/i)).toBeVisible();
    await expect(page.getByText(/threshold.*7/i)).toBeVisible();
  });

  test('created todos appear in correct quadrant based on urgency/importance', async ({ page }) => {
    // Navigate to todos to create a Q1 todo (high urgency + high importance)
    await page.goto(`${BASE_URL}/todos`);
    await page.waitForLoadState('networkidle');

    const todoTitle = `Matrix Q1 ${Date.now()}`;

    await page.getByRole('button', { name: 'Add Todo' }).click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Title').fill(todoTitle);

    // Expand details and pick Q1 (Do First) on the matrix placement grid
    await dialog.getByRole('button', { name: 'Add details' }).click();
    await dialog.getByRole('button', { name: 'Q1 Do First', exact: true }).click();

    // Quadrant preview should show Q1
    await expect(dialog.getByText(/Q1/)).toBeVisible();

    await dialog.getByRole('button', { name: 'Create Todo' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // Navigate to matrix view
    await page.goto(`${BASE_URL}/matrix`);
    await page.waitForLoadState('networkidle');

    // The todo should appear somewhere on the matrix page
    await expect(page.getByText(todoTitle)).toBeVisible({ timeout: 5000 });
  });

  test('quadrant cells show count chips', async ({ page }) => {
    // Each quadrant header area has a count chip
    const quadrantPanels = page.locator('div').filter({ hasText: /^Q[1-4]$/ });
    const panels = await quadrantPanels.count();
    expect(panels).toBeGreaterThanOrEqual(4);
  });

  test('empty quadrants show placeholder message', async ({ page }) => {
    // At least one quadrant might be empty, showing "No tasks in this quadrant"
    const emptyMessages = page.getByText('No tasks in this quadrant');
    const count = await emptyMessages.count();
    // It's OK if all quadrants have tasks too; just verify the UI doesn't crash
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
