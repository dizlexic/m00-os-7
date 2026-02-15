import { test, expect } from '@playwright/test'

/**
 * Basic application E2E tests
 *
 * These tests verify the core application loads and functions correctly.
 */

test.describe('Application', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')

    // Verify the page loads successfully
    await expect(page).toHaveTitle(/m00-os-7/)
  })

  test('should display the desktop environment', async ({ page }) => {
    await page.goto('/')

    // Wait for the application to be ready
    // This will be updated once the desktop component is implemented
    await expect(page.locator('body')).toBeVisible()
  })
})
