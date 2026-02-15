import { test, expect } from '@playwright/test';

test.describe('Finder Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for boot screen
    await page.waitForSelector('.login-screen', { timeout: 20000 });
    // Login as Admin
    await page.click('.user-item:has-text("Admin")');
    await page.fill('#password', 'password');
    await page.click('button:has-text("Login")');
    // Wait for desktop
    await page.waitForSelector('.menu-bar');
  });

  test('should navigate to a folder using Go to Folder', async ({ page }) => {
    // Open Macintosh HD first
    await page.dblclick('.desktop-icon:has-text("Macintosh HD")');
    await expect(page.locator('.title-bar__title:has-text("Macintosh HD")')).toBeVisible();

    // Open File menu
    await page.click('.menu-bar__item:has-text("File")');

    // Click Go to Folder...
    await page.click('.menu-dropdown__item:has-text("Go to Folder...")');

    // Verify dialog is visible
    await expect(page.locator('.alert-dialog')).toBeVisible();
    await expect(page.locator('.alert-dialog__title')).toHaveText('Go to Folder');

    // Enter path
    await page.fill('.alert-dialog__input', 'Macintosh HD/System Folder');
    await page.click('.alert-dialog__button:has-text("Go")');

    // Verify navigation - The window title should now be "System Folder"
    await expect(page.locator('.title-bar__title:has-text("System Folder")')).toBeVisible();
  });

  test('should show error for invalid path', async ({ page }) => {
    // Open Macintosh HD first
    await page.dblclick('.desktop-icon:has-text("Macintosh HD")');
    await expect(page.locator('.title-bar__title:has-text("Macintosh HD")')).toBeVisible();

    // Open Go to Folder
    await page.click('.menu-bar__item:has-text("File")');
    await page.click('.menu-dropdown__item:has-text("Go to Folder...")');

    // Enter invalid path
    await page.fill('.alert-dialog__input', 'Macintosh HD/InvalidPath');
    await page.click('.alert-dialog__button:has-text("Go")');

    // Verify error alert
    await expect(page.locator('.alert-dialog__message')).toContainText('could not be found');
    await page.click('.alert-dialog__button:has-text("OK")');
  });
});
