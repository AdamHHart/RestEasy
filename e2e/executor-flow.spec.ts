import { test, expect } from '@playwright/test';

test.describe('Executor Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('[placeholder="Email"]', 'executor@example.com');
    await page.fill('[placeholder="Password"]', 'password123');
    await page.click('text=Sign in');
  });

  test('executor can view and update tasks', async ({ page }) => {
    await page.goto('/executor/dashboard');
    
    // Check task list is visible
    await expect(page.locator('text=Tasks Overview')).toBeVisible();
    
    // Update task status
    const firstTask = page.locator('.task-item').first();
    await firstTask.click();
    await page.click('text=Mark as In Progress');
    
    // Verify status update
    await expect(firstTask.locator('.status-badge'))
      .toHaveText('In Progress');
  });

  test('executor can access shared documents', async ({ page }) => {
    await page.goto('/executor/documents');
    
    // Check document list
    await expect(page.locator('text=Shared Documents')).toBeVisible();
    
    // Attempt to download document
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Download');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();
  });
});