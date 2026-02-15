import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for boot screen to finish - it might take a few seconds
    await page.waitForSelector('.login-screen', { timeout: 20000 });
  });

  test('should show user list and allow guest login', async ({ page }) => {
    await expect(page.locator('.user-list')).toBeVisible();
    await expect(page.locator('.user-item', { hasText: 'Admin' })).toBeVisible();
    await expect(page.locator('.user-item', { hasText: 'Guest' })).toBeVisible();

    await page.click('.user-item:has-text("Guest")');
    // Button text changes to Login for Guest
    await page.click('button:has-text("Login")');

    await expect(page.locator('.menu-bar')).toBeVisible();
  });

  test('should allow registration and login', async ({ page }) => {
    const newUsername = `user_${Date.now()}`;
    
    await page.click('.user-item:has-text("+ New User...")');
    await page.fill('#username', newUsername);
    await page.fill('#password', 'password123');
    await page.click('button:has-text("Register")');

    // After registration it should login
    await expect(page.locator('.menu-bar')).toBeVisible();
  });

  test('should allow login with existing user', async ({ page }) => {
    await page.click('.user-item:has-text("Admin")');
    await page.fill('#password', 'password');
    await page.click('button:has-text("Login")');

    await expect(page.locator('.menu-bar')).toBeVisible();
  });
});
