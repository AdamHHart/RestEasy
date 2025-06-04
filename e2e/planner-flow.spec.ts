import { test, expect } from '@playwright/test';

test.describe('Planner Journey', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
    await page.fill('[placeholder="Email"]', 'planner@example.com');
    await page.fill('[placeholder="Password"]', 'password123');
    await page.click('text=Sign in');
  });

  test('planner can add and manage assets', async ({ page }) => {
    await page.goto('/assets');
    
    // Add new asset
    await page.click('text=Add Asset');
    await page.fill('[placeholder="Asset Name"]', 'Test Bank Account');
    await page.fill('[placeholder="Description"]', 'Primary checking account');
    await page.click('text=Add Asset');
    
    // Verify asset was added
    await expect(page.locator('text=Test Bank Account')).toBeVisible();
  });

  test('planner can assign executor', async ({ page }) => {
    await page.goto('/executors');
    
    // Add new executor
    await page.click('text=Add Executor');
    await page.fill('[placeholder="Full Name"]', 'John Doe');
    await page.fill('[placeholder="Email"]', 'john@example.com');
    await page.click('text=Send Invitation');
    
    // Verify executor was added
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
  });
});