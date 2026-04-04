import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAuthenticated } from './e2e/helpers';

const TEST_USER = 'analyticstest';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, TEST_USER);
    await page.goto(`${BASE_URL}/analytics`);
    await page.waitForLoadState('networkidle');
  });

  test('analytics page loads with header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText(/insights across your productivity/i)).toBeVisible();
  });

  test('time range selector buttons are visible and clickable', async ({ page }) => {
    // Time range toggle buttons should be visible
    await expect(page.getByRole('button', { name: '7 days' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30 days' })).toBeVisible();

    // Click a different time range
    await page.getByRole('button', { name: '14 days' }).click();
    await page.waitForLoadState('networkidle');

    // The button should be selected (no crash)
    await page.waitForTimeout(500);

    // Switch to 90 days
    await page.getByRole('button', { name: '90 days' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  });

  test('productivity score gauge renders', async ({ page }) => {
    // The "Productivity Score" heading should be visible
    await expect(page.getByText('Productivity Score')).toBeVisible();

    // The gauge is rendered with a CircularProgress + score text
    const scoreText = page.getByText('/ 100');
    await expect(scoreText).toBeVisible();
  });

  test('dashboard stat cards render', async ({ page }) => {
    // Stat cards should display key metrics
    await expect(page.getByText('Completion Rate')).toBeVisible();
    await expect(page.getByText('Overdue')).toBeVisible();
    await expect(page.getByText('On Track')).toBeVisible();
    await expect(page.getByText('Avg. Completion')).toBeVisible();
  });

  test('eisenhower matrix section renders', async ({ page }) => {
    await expect(page.getByText('Eisenhower Matrix').first()).toBeVisible();
    await expect(page.getByText('Quadrant Distribution')).toBeVisible();
    await expect(page.getByText('Quadrant Breakdown')).toBeVisible();
  });

  test('task trends section renders', async ({ page }) => {
    await expect(page.getByText('Task Trends')).toBeVisible();
    await expect(page.getByText('Completion Trends')).toBeVisible();
    await expect(page.getByText('Status Breakdown')).toBeVisible();
    await expect(page.getByText('Priority Distribution')).toBeVisible();
  });

  test('writing and blog section renders', async ({ page }) => {
    await expect(page.getByText('Writing & Blog')).toBeVisible();
    await expect(page.getByText('Total Posts')).toBeVisible();
    await expect(page.getByText('Total Words')).toBeVisible();
    await expect(page.getByText('Reading Time')).toBeVisible();
    await expect(page.getByText('Total Views')).toBeVisible();
  });

  test('wellness and diary section renders', async ({ page }) => {
    await expect(page.getByText('Wellness & Diary')).toBeVisible();
    await expect(page.getByText('Journal Entries')).toBeVisible();
    await expect(page.getByText('Avg Energy')).toBeVisible();
    await expect(page.getByText('Common Mood')).toBeVisible();
  });

  test('charts render container elements', async ({ page }) => {
    // Recharts renders SVG elements inside ResponsiveContainer divs
    // Check that chart card containers are present
    const chartCards = page
      .locator('.MuiCard-root')
      .filter({ hasText: /distribution|trends|breakdown/i });
    const count = await chartCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('refresh button triggers data reload', async ({ page }) => {
    const refreshButton = page.locator('button', {
      has: page.locator('svg[data-testid="RefreshIcon"]'),
    });
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    // Should trigger a loading state or re-fetch
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Page should still be intact
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
  });
});
