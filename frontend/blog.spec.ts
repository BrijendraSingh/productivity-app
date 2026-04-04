import { test, expect } from '@playwright/test';
import { BASE_URL, ensureAuthenticated } from './e2e/helpers';

const TEST_USER = 'blogtest';

test.describe('Blog System', () => {
  test.beforeEach(async ({ page }) => {
    await ensureAuthenticated(page, TEST_USER);
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');
  });

  test('blog page loads with stat chips', async ({ page }) => {
    await expect(page.getByText(/Total/)).toBeVisible();
    await expect(page.getByText(/Published/)).toBeVisible();
    await expect(page.getByText(/Drafts/)).toBeVisible();

    // Search bar should be visible
    await expect(page.getByPlaceholder('Search posts...')).toBeVisible();
  });

  test('create new blog post', async ({ page }) => {
    const postTitle = `Test Blog Post ${Date.now()}`;

    // Click "New Post" button in the toolbar
    const newPostButton = page.getByRole('button', { name: /new post/i });
    if (await newPostButton.isVisible()) {
      await newPostButton.click();
    } else {
      // Use the FAB
      const fab = page.locator('button[aria-label="New Post"]');
      await fab.click();
    }

    await page.waitForLoadState('networkidle');

    // Should be in editor view
    await expect(page.getByText(/new post/i)).toBeVisible();

    // Fill in the title
    const titleInput = page.getByPlaceholder('Post title...');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(postTitle);

    // The markdown editor should be present
    const editor = page.locator('.w-md-editor');
    await expect(editor).toBeVisible();

    // Save the post
    const saveButton = page.getByRole('button', { name: /save/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await page.waitForLoadState('networkidle');

    // Should navigate to the post view or stay with success
    await page.waitForTimeout(1000);
  });

  test('edit existing blog post', async ({ page }) => {
    // Create a post first
    const postTitle = `Edit Blog ${Date.now()}`;

    const newPostButton = page.getByRole('button', { name: /new post/i });
    if (await newPostButton.isVisible()) {
      await newPostButton.click();
    } else {
      const fab = page.locator('button[aria-label="New Post"]');
      await fab.click();
    }

    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('Post title...').fill(postTitle);
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Go back to list
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    // Find the post and click edit
    const postCard = page.getByText(postTitle).first();
    await expect(postCard).toBeVisible({ timeout: 5000 });

    // Click edit button on the card (Edit icon in the card action row)
    const card = postCard.locator('xpath=ancestor::div[contains(@class, "MuiCard-root")]');
    const editButton = card.locator('button', { has: page.locator('svg[data-testid="EditIcon"]') });
    await editButton.click();

    await page.waitForLoadState('networkidle');

    // Should be in editor with "Edit Post" heading
    await expect(page.getByText(/edit post/i)).toBeVisible({ timeout: 5000 });

    // Modify the title
    const titleInput = page.getByPlaceholder('Post title...');
    await titleInput.fill(`${postTitle} (edited)`);
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForLoadState('networkidle');
  });

  test('publish a draft post', async ({ page }) => {
    // Create a draft post
    const postTitle = `Publish Blog ${Date.now()}`;

    const newPostButton = page.getByRole('button', { name: /new post/i });
    if (await newPostButton.isVisible()) {
      await newPostButton.click();
    } else {
      const fab = page.locator('button[aria-label="New Post"]');
      await fab.click();
    }

    await page.getByPlaceholder('Post title...').fill(postTitle);
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // The "Publish" button should be visible for draft posts
    const publishButton = page.getByRole('button', { name: /publish/i });
    if (await publishButton.isVisible()) {
      await publishButton.click();
      await page.waitForLoadState('networkidle');

      // Status should change to "Published"
      await expect(page.getByText('Published')).toBeVisible({ timeout: 5000 });
    }
  });

  test('delete a blog post', async ({ page }) => {
    // Create a post to delete
    const postTitle = `Delete Blog ${Date.now()}`;

    const newPostButton = page.getByRole('button', { name: /new post/i });
    if (await newPostButton.isVisible()) {
      await newPostButton.click();
    } else {
      const fab = page.locator('button[aria-label="New Post"]');
      await fab.click();
    }

    await page.getByPlaceholder('Post title...').fill(postTitle);
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Go back to list
    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    // Find the post
    const postText = page.getByText(postTitle).first();
    await expect(postText).toBeVisible({ timeout: 5000 });

    // Click delete on the card
    const card = postText.locator('xpath=ancestor::div[contains(@class, "MuiCard-root")]');
    const deleteButton = card.locator('button', {
      has: page.locator('svg[data-testid="DeleteIcon"]'),
    });
    await deleteButton.click();

    // Confirm deletion dialog
    const confirmDialog = page.locator('[role="dialog"]').filter({ hasText: 'Delete Post' });
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole('button', { name: 'Delete' }).click();
    await page.waitForLoadState('networkidle');

    // Post should be gone
    await expect(page.getByText(postTitle)).not.toBeVisible({ timeout: 5000 });
  });

  test('blog list displays posts with status chips', async ({ page }) => {
    // Create a post so the list isn't empty
    const postTitle = `Status Blog ${Date.now()}`;
    const newPostButton = page.getByRole('button', { name: /new post/i });
    if (await newPostButton.isVisible()) {
      await newPostButton.click();
    } else {
      const fab = page.locator('button[aria-label="New Post"]');
      await fab.click();
    }

    await page.getByPlaceholder('Post title...').fill(postTitle);
    await page.getByRole('button', { name: /save/i }).click();
    await page.waitForLoadState('networkidle');

    await page.goto(`${BASE_URL}/blog`);
    await page.waitForLoadState('networkidle');

    // Each card should have a status chip (Draft, Published, or Archived)
    const draftChips = page.getByText('Draft');
    const publishedChips = page.getByText('Published');
    const archivedChips = page.getByText('Archived');

    const totalStatusChips =
      (await draftChips.count()) + (await publishedChips.count()) + (await archivedChips.count());
    expect(totalStatusChips).toBeGreaterThan(0);
  });
});
