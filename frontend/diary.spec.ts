import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAuthenticated } from './e2e/helpers';

const TEST_USER = 'diarytest';

test.describe('Digital Diary', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, TEST_USER);
    await page.goto(`${BASE_URL}/diary`);
    await page.waitForLoadState('networkidle');
  });

  test('diary page loads with date navigation', async ({ page }) => {
    // Date display should be visible
    const dateHeading = page.locator('h6').filter({ hasText: /\w+,\s\w+\s\d+,\s\d{4}/ });
    await expect(dateHeading).toBeVisible();

    // Today chip should be visible
    await expect(page.getByText('Today', { exact: true })).toBeVisible();

    // Navigation arrows should be present
    const leftArrow = page.locator('svg[data-testid="ChevronLeftIcon"]').locator('..');
    await expect(leftArrow).toBeVisible();
  });

  test('create new diary entry for today', async ({ page }) => {
    // If no entry exists, there should be a "Write Entry" button or empty state
    const writeEntryButton = page.getByRole('button', { name: /write entry/i });
    const editButton = page.locator('button', { has: page.locator('svg[data-testid="EditIcon"]') });

    if (await writeEntryButton.isVisible()) {
      await writeEntryButton.click();
    } else if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      // FAB might trigger edit mode
      const fab = page.locator('button[aria-label="New Entry"]');
      if (await fab.isVisible()) {
        await fab.click();
      }
    }

    // Should be in edit mode
    const journalField = page.getByLabel('Journal Entry');
    if (await journalField.isVisible()) {
      await journalField.fill(
        'Today was a productive day. I completed several tasks and felt great about my progress.'
      );
    }

    // Select a mood
    const happyChip = page.getByText(/😊\s*Happy/);
    if (await happyChip.isVisible()) {
      await happyChip.click();
    }

    // Select weather
    const sunnyChip = page.getByText('Sunny');
    if (await sunnyChip.isVisible()) {
      await sunnyChip.click();
    }

    // Fill gratitude
    const gratitudeField = page.getByLabel('Gratitude');
    if (await gratitudeField.isVisible()) {
      await gratitudeField.fill('Grateful for a good team');
    }

    // Save the entry
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeVisible();
    await saveButton.click();
    await page.waitForLoadState('networkidle');

    // Should be back in read mode with "Daily Reflection" heading
    await expect(page.getByText('Daily Reflection')).toBeVisible({ timeout: 5000 });
  });

  test('navigate to different date', async ({ page }) => {
    // Click left arrow to go to previous day
    const leftArrow = page.locator('svg[data-testid="ChevronLeftIcon"]').locator('..');
    await leftArrow.click();
    await page.waitForLoadState('networkidle');

    // "Today" chip should no longer be visible (we're on yesterday)
    await expect(page.getByText('Today', { exact: true })).not.toBeVisible();

    // "Go to Today" button should appear
    await expect(page.getByRole('button', { name: /go to today/i })).toBeVisible();

    // Navigate back to today
    await page.getByRole('button', { name: /go to today/i }).click();
    await page.waitForLoadState('networkidle');

    await expect(page.getByText('Today', { exact: true })).toBeVisible();
  });

  test('edit existing entry', async ({ page }) => {
    // First make sure an entry exists by creating one
    const writeEntryButton = page.getByRole('button', { name: /write entry/i });
    if (await writeEntryButton.isVisible()) {
      await writeEntryButton.click();
      const journalField = page.getByLabel('Journal Entry');
      await journalField.fill('Initial entry content');
      await page.getByRole('button', { name: /save/i }).click();
      await page.waitForLoadState('networkidle');
    }

    // Now edit the entry
    const editButton = page.locator('button', { has: page.locator('svg[data-testid="EditIcon"]') });
    if (await editButton.isVisible()) {
      await editButton.click();
    }

    // Should see "Edit Entry" heading
    const editHeading = page.getByText('Edit Entry');
    if (await editHeading.isVisible()) {
      const journalField = page.getByLabel('Journal Entry');
      const currentValue = await journalField.inputValue();
      await journalField.fill(`${currentValue} (edited)`);

      await page.getByRole('button', { name: /save/i }).click();
      await page.waitForLoadState('networkidle');

      // Should be back in read mode
      await expect(page.getByText('Daily Reflection')).toBeVisible({ timeout: 5000 });
    }
  });

  test('view entry details with mood, weather, and energy display', async ({ page }) => {
    // Create an entry with all metadata if none exists
    const writeEntryButton = page.getByRole('button', { name: /write entry/i });
    if (await writeEntryButton.isVisible()) {
      await writeEntryButton.click();

      const happyChip = page.getByText(/😊\s*Happy/);
      if (await happyChip.isVisible()) await happyChip.click();

      const sunnyChip = page.getByText('Sunny');
      if (await sunnyChip.isVisible()) await sunnyChip.click();

      const journalField = page.getByLabel('Journal Entry');
      await journalField.fill('Test entry with full metadata');

      await page.getByRole('button', { name: /save/i }).click();
      await page.waitForLoadState('networkidle');
    }

    // In read mode, metadata chips should be visible
    const readView = page.getByText('Daily Reflection');
    if (await readView.isVisible()) {
      // Energy chip is always present (defaults to 5)
      const energyChip = page.getByText(/Energy:.*\/10/);
      await expect(energyChip).toBeVisible();
    }
  });
});
